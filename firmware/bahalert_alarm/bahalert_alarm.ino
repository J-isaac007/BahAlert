// BahAlert prototype alarm unit: ESP32 + 16x2 I2C LCD + MAX98357A I2S amp + speaker.
// Follows one sensor by reading /devices/{WATCH_DEVICE_ID}.json from Firebase every 1.5 s
// (public data, no login), then shows and sounds the flood level:
//   below yellowCm -> NORMAL   "System armed"
//   yellowCm       -> LOW      LCD only
//   redCm          -> MEDIUM   LCD + two-tone beeps
//   dangerCm       -> HIGH     LCD + long beeps + spoken "flood level critical" clip
//   no new reading for 60 s -> SENSOR OFFLINE
// Thresholds come from the sensor's config in Firebase, so the alarm always matches the website.
//
// Libraries (Arduino Library Manager): LiquidCrystal I2C (Frank de Brabander), ArduinoJson (v7)
// Board: ESP32 Dev Module.
// Wiring: LCD SDA -> GPIO 32, SCL -> GPIO 33 (I2C address 0x27, or 0x3F).
//         MAX98357A LRC -> 25, BCLK -> 26, DIN -> 27, VIN 5V, GND.

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "driver/i2s.h"
#include "secrets.h"

// The team's recorded "flood level critical" clip (16-bit mono WAV as a C array).
// Optional: without the file, HIGH plays beeps only.
#if __has_include("flood_level_critical.h")
#include "flood_level_critical.h"
#define HAS_CRITICAL_CLIP 1
#else
#define HAS_CRITICAL_CLIP 0
#endif

// --- Pins ---
const int I2C_SDA = 32;
const int I2C_SCL = 33;
static const int PIN_LRC = 25;
static const int PIN_BCLK = 26;
static const int PIN_DIN = 27;
static const i2s_port_t PORT_I2S = I2S_NUM_0;
static const int SAMPLE_RATE = 16000;

LiquidCrystal_I2C lcd(0x27, 16, 2);  // change to 0x3F if the screen stays blank

const unsigned long POLL_EVERY_MS = 1500;
const unsigned long OFFLINE_AFTER_MS = 60000;  // same rule as the website

const String DEVICE_URL = String(FIREBASE_DATABASE_URL) + "/devices/" + WATCH_DEVICE_ID + ".json";

String lastState = "";
double lastTs = -1;               // live.ts last seen
unsigned long tsChangedAt = 0;    // millis() when live.ts last changed
bool everSeen = false;

// ---------- Audio (the team's I2S code) ----------

void setupI2S() {
  i2s_config_t cfg = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 256,
    .use_apll = false,
    .tx_desc_auto_clear = true
  };
  i2s_pin_config_t pins = {
    .bck_io_num = PIN_BCLK,
    .ws_io_num = PIN_LRC,
    .data_out_num = PIN_DIN,
    .data_in_num = I2S_PIN_NO_CHANGE
  };
  i2s_driver_install(PORT_I2S, &cfg, 0, NULL);
  i2s_set_pin(PORT_I2S, &pins);
}

void beepHz(int hz, int ms, int16_t amp = 18000) {
  i2s_set_sample_rates(PORT_I2S, SAMPLE_RATE);
  int totalSamples = (SAMPLE_RATE * ms) / 1000;
  int16_t buf[256];
  int halfPeriod = max(1, SAMPLE_RATE / (2 * hz));
  int step = 0;
  int16_t val = amp;
  int sent = 0;
  while (sent < totalSamples) {
    int n = min(128, totalSamples - sent);
    for (int i = 0; i < n; i++) {
      if (++step >= halfPeriod) {
        val = -val;
        step = 0;
      }
      buf[2 * i] = val;
      buf[2 * i + 1] = val;
    }
    size_t written = 0;
    i2s_write(PORT_I2S, buf, n * 2 * sizeof(int16_t), &written, portMAX_DELAY);
    sent += n;
  }
}

void playCriticalClip() {
#if HAS_CRITICAL_CLIP
  const size_t HEADER = 44;
  if (flood_level_critical_wav_len <= HEADER) return;
  const uint8_t *w = flood_level_critical_wav;
  uint32_t rate = w[24] | (w[25] << 8) | ((uint32_t)w[26] << 16) | ((uint32_t)w[27] << 24);
  if (rate < 8000 || rate > 96000) rate = 16000;
  i2s_set_sample_rates(PORT_I2S, rate);

  const int16_t *mono = reinterpret_cast<const int16_t *>(w + HEADER);
  size_t total = (flood_level_critical_wav_len - HEADER) / sizeof(int16_t);
  int16_t stereo[256];
  for (size_t idx = 0; idx < total;) {
    size_t frames = min((size_t)128, total - idx);
    for (size_t i = 0; i < frames; i++) {
      int32_t boosted = constrain((int32_t)mono[idx + i] * 3, -32768, 32767);
      stereo[2 * i] = stereo[2 * i + 1] = (int16_t)boosted;
    }
    size_t written = 0;
    i2s_write(PORT_I2S, stereo, frames * 2 * sizeof(int16_t), &written, portMAX_DELAY);
    idx += frames;
  }
  i2s_zero_dma_buffer(PORT_I2S);
#endif
}

// ---------- Display ----------

void showLCD(const String &top, const String &bottom) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(top.substring(0, 16));
  lcd.setCursor(0, 1);
  lcd.print(bottom.substring(0, 16));
}

void announce(const String &state, float levelCm) {
  String level = isnan(levelCm) ? String("") : String("Water ") + String(levelCm, 1) + "cm";
  if (state == "HIGH") {
    showLCD("FLOOD: HIGH", "CRITICAL ALERT!");
    for (int i = 0; i < 4; i++) {
      beepHz(2400, 250, 28000);
      delay(120);
      beepHz(1600, 250, 28000);
      delay(120);
    }
    playCriticalClip();
    showLCD("FLOOD: HIGH", level);
  } else if (state == "MEDIUM") {
    showLCD("FLOOD: MEDIUM", "Rising water");
    for (int i = 0; i < 2; i++) {
      beepHz(2400, 200, 24000);
      delay(120);
      beepHz(1600, 200, 24000);
      delay(120);
    }
    showLCD("FLOOD: MEDIUM", level);
  } else if (state == "LOW") {
    showLCD("FLOOD: LOW", level.length() ? level : "Monitor level");
  } else if (state == "OFFLINE") {
    showLCD("SENSOR OFFLINE", "Check sensor");
    beepHz(1000, 150, 12000);
  } else {
    showLCD("STATUS: NORMAL", "System armed");
  }
}

// ---------- Wi-Fi + Firebase ----------

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  showLCD("WiFi Connecting", WIFI_SSID);
  Serial.print("Connecting to Wi-Fi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (millis() - start > 15000) {
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      start = millis();
    }
  }
  Serial.printf("\nAlarm connected, IP %s\n", WiFi.localIP().toString().c_str());
  showLCD("WiFi Connected", WiFi.localIP().toString());
}

void poll() {
  if (WiFi.status() != WL_CONNECTED) {
    showLCD("WiFi Lost", "Reconnecting...");
    lastState = "";  // re-announce once it's back
    return;
  }

  WiFiClientSecure client;
  client.setInsecure();  // prototype: skip certificate pinning
  HTTPClient http;
  http.setTimeout(4000);
  http.begin(client, DEVICE_URL);
  int code = http.GET();
  if (code != 200) {
    Serial.printf("GET %s failed: %d\n", DEVICE_URL.c_str(), code);
    showLCD("Server Error", "HTTP " + String(code));
    lastState = "";
    http.end();
    return;
  }

  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, http.getStream());
  http.end();
  if (err || doc.isNull()) {
    Serial.printf("bad JSON (%s) - does %s exist?\n", err.c_str(), WATCH_DEVICE_ID);
    showLCD("No sensor data", WATCH_DEVICE_ID);
    lastState = "";
    return;
  }

  float yellow = doc["config"]["yellowCm"] | 10.0f;
  float red = doc["config"]["redCm"] | 20.0f;
  float danger = doc["config"]["dangerCm"] | 27.0f;
  JsonVariant live = doc["live"];
  double ts = live["ts"] | -1.0;
  float levelCm = live["levelCm"].isNull() ? NAN : live["levelCm"].as<float>();

  unsigned long now = millis();
  if (ts != lastTs) {
    lastTs = ts;
    tsChangedAt = now;
    if (ts > 0) everSeen = true;
  }
  // The sensor writes every 2 s; no change for 60 s means it stopped (power, Wi-Fi or no echo)
  bool offline = !everSeen || now - tsChangedAt > OFFLINE_AFTER_MS || isnan(levelCm);

  String state = offline            ? "OFFLINE"
                 : levelCm >= danger ? "HIGH"
                 : levelCm >= red    ? "MEDIUM"
                 : levelCm >= yellow ? "LOW"
                                     : "NORMAL";

  Serial.printf("level %.1f cm -> %s\n", levelCm, state.c_str());
  if (state != lastState) {
    lastState = state;
    announce(state, levelCm);
  }
}

void setup() {
  Serial.begin(115200);
  delay(300);
  Wire.begin(I2C_SDA, I2C_SCL);
  lcd.init();
  lcd.backlight();
  showLCD("BahAlert alarm", "Starting...");
  setupI2S();
  connectWiFi();
  tsChangedAt = millis();
}

void loop() {
  poll();
  delay(POLL_EVERY_MS);
}
