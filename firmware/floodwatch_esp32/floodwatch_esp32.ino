// FloodWatch Lite — ESP32 firmware (skeleton, untested until hardware arrives)
// Writes the shape in docs/data-contract.md. scripts/simulate.mjs is the reference behaviour.
// Hardware: ESP32, JSN-SR04T, DS18B20, 12V siren via relay/MOSFET, 3 LEDs, A7670/SIM7600 4G
// modem (SMS), solar-charged battery with a voltage divider.
//
// Libraries (Arduino Library Manager):
//   - Firebase Arduino Client Library for ESP8266 and ESP32 (Mobizt)  -> Firebase_ESP_Client.h
//   - OneWire, DallasTemperature
// Board: ESP32 Dev Module (Boards Manager: "esp32" by Espressif, 2.x or 3.x)
// USB: the CP2102 chip needs the Silicon Labs CP210x driver on Windows if no COM port appears.
//      If upload stalls at "Connecting...", hold the BOOT button until it starts.
//
// The LEDs, siren and SMS work without Wi-Fi; Firebase (the website) needs it.

#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "config.h"
#include "secrets.h"

OneWire oneWire(PIN_TEMP);
DallasTemperature tempSensor(&oneWire);

HardwareSerial &modem = Serial2;

FirebaseData fbdo;
FirebaseAuth fbAuth;
FirebaseConfig fbConfig;

float sensorHeightCm = DEFAULT_SENSOR_HEIGHT_CM;
float yellowCm = DEFAULT_YELLOW_CM;
float redCm = DEFAULT_RED_CM;
float dangerCm = DEFAULT_DANGER_CM;

String lastStatus = "";
unsigned long lastLive = 0, lastReading = 0, lastConfig = 0;
bool configLoaded = false;

const String DEVICE_PATH = String("/devices/") + DEVICE_ID;

// ---------- Sensors ----------

float readTempC() {
  tempSensor.requestTemperatures();
  float t = tempSensor.getTempCByIndex(0);
  return (t == DEVICE_DISCONNECTED_C) ? DEFAULT_TEMP_C : t;
}

// distance = (speed of sound x echo time) / 2, speed corrected for air temperature.
// Median of 5 pings drops stray echoes; pings inside the blind zone are noise, not water.
float readDistanceCm(float tempC) {
  const float speedMs = 331.3 + 0.606 * tempC;
  float samples[5];
  int n = 0;
  for (int i = 0; i < 5; i++) {
    digitalWrite(PIN_TRIG, LOW);
    delayMicroseconds(2);
    digitalWrite(PIN_TRIG, HIGH);
    delayMicroseconds(20);  // JSN-SR04T needs a longer trigger than the HC-SR04's 10 us
    digitalWrite(PIN_TRIG, LOW);
    unsigned long us = pulseIn(PIN_ECHO, HIGH, ECHO_TIMEOUT_US);
    float cm = (speedMs * (us / 1e6) / 2.0) * 100.0;
    if (us > 0 && cm >= MIN_DISTANCE_CM) samples[n++] = cm;
    delay(60);  // let echoes die out
  }
  if (n == 0) return NAN;
  for (int i = 1; i < n; i++)  // insertion sort
    for (int j = i; j > 0 && samples[j - 1] > samples[j]; j--) {
      float t = samples[j]; samples[j] = samples[j - 1]; samples[j - 1] = t;
    }
  return samples[n / 2];
}

// Average of 16 calibrated ADC reads, scaled back up through the divider.
float readBatteryV() {
  uint32_t mv = 0;
  for (int i = 0; i < 16; i++) mv += analogReadMilliVolts(PIN_BATTERY);
  return (mv / 16) / 1000.0 * BATTERY_DIVIDER;
}

String statusFor(float levelCm) {
  if (levelCm >= redCm) return "red";
  if (levelCm >= yellowCm) return "yellow";
  return "green";
}

int rank(const String &status) { return status == "red" ? 2 : status == "yellow" ? 1 : 0; }

// ---------- Local alarm ----------

void showStatus(const String &status) {
  digitalWrite(PIN_LED_G, status == "green");
  digitalWrite(PIN_LED_Y, status == "yellow");
  digitalWrite(PIN_LED_R, status == "red");
  digitalWrite(PIN_SIREN, status == "red" ? SIREN_ON : !SIREN_ON);
}

// ---------- SMS (A7670 / SIM7600) ----------

// Collects the modem's reply until `expect` or ERROR shows up, or the timeout passes.
String modemReply(const char *expect, unsigned long timeoutMs) {
  String reply;
  unsigned long start = millis();
  while (millis() - start < timeoutMs) {
    while (modem.available()) reply += (char)modem.read();
    if (reply.indexOf(expect) >= 0 || reply.indexOf("ERROR") >= 0) break;
    delay(10);
  }
  return reply;
}

String modemAsk(const String &cmd, const char *expect = "OK", unsigned long timeoutMs = 2000) {
  while (modem.available()) modem.read();  // drop unsolicited output
  modem.println(cmd);
  return modemReply(expect, timeoutMs);
}

bool modemCommand(const String &cmd, const char *expect = "OK", unsigned long timeoutMs = 2000) {
  return modemAsk(cmd, expect, timeoutMs).indexOf(expect) >= 0;
}

void modemSetup() {
  modem.begin(MODEM_BAUD, SERIAL_8N1, PIN_MODEM_RX, PIN_MODEM_TX);
  bool ok = false;
  for (int i = 0; i < 20 && !ok; i++) ok = modemCommand("AT", "OK", 500);  // 4G modems take ~10 s to boot
  ok = ok && modemCommand("ATE0") && modemCommand("AT+CMGF=1");            // no echo, text-mode SMS
  Serial.println(ok ? "modem ok" : "modem not responding — check its 5V/2A supply, TX/RX and baud");
}

// Registered on LTE (CEREG) or 2G/3G (CREG): 1 = home network, 5 = roaming.
bool modemRegistered() {
  for (const char *cmd : {"AT+CEREG?", "AT+CREG?"}) {
    String r = modemAsk(cmd, "OK", 1000);
    if (r.indexOf(",1") >= 0 || r.indexOf(",5") >= 0) return true;
  }
  return false;
}

bool sendSms(const char *number, const String &text) {
  if (!modemCommand(String("AT+CMGS=\"") + number + "\"", ">", 5000)) {
    modem.write(27);  // ESC: leave the prompt if it opened late
    return false;
  }
  modem.print(text);
  modem.write(26);  // Ctrl+Z sends
  return modemReply("+CMGS:", 30000).indexOf("+CMGS:") >= 0;
}

String textedStatus = "green";         // last status texted; follows the water back down
unsigned long textedAt[3] = {0, 0, 0}; // per status rank
unsigned long smsRetryAt = 0;

// Texts on the way up only (green->yellow, yellow->red, green->red), so a board that boots
// into a flood still warns. Falling never texts.
void smsOnRise(const String &status, float levelCm) {
  int r = rank(status);
  if (r <= rank(textedStatus)) {
    textedStatus = status;
    return;
  }
  unsigned long now = millis();
  if (smsRetryAt && now < smsRetryAt) return;
  if (textedAt[r] && now - textedAt[r] < SMS_MIN_GAP_MS) {
    textedStatus = status;  // bobbing on the line: already told everyone
    return;
  }

  String text = String("BahAlert ") + SITE_NAME + ": " + (r == 2 ? "CRITICAL" : "WARNING") +
                ". Water level " + String(levelCm, 1) + " cm. " +
                (r == 2 ? "Move to a safe zone now." : "Water is rising. Prepare to leave.");
  bool ok = modemRegistered();
  if (!ok) Serial.println("SMS: no network");
  for (const char *number : SMS_RECIPIENTS) {
    if (!ok) break;
    ok = sendSms(number, text);
    Serial.printf("SMS %s %s\n", number, ok ? "sent" : "failed");
  }
  if (!ok) {
    smsRetryAt = now + SMS_RETRY_MS;  // textedStatus unchanged, so a later tick retries
    return;
  }
  smsRetryAt = 0;
  textedStatus = status;
  textedAt[r] = now;
}

// ---------- Firebase ----------

bool loadConfig() {
  if (!Firebase.RTDB.getJSON(&fbdo, DEVICE_PATH + "/config")) {
    Serial.println("config read failed: " + fbdo.errorReason());
    return false;
  }
  FirebaseJson &json = fbdo.jsonObject();
  FirebaseJsonData r;
  if (json.get(r, "sensorHeightCm")) sensorHeightCm = r.floatValue;
  if (json.get(r, "yellowCm")) yellowCm = r.floatValue;
  if (json.get(r, "redCm")) redCm = r.floatValue;
  if (json.get(r, "dangerCm")) dangerCm = r.floatValue;
  return true;
  // TODO: switch to Firebase.RTDB.beginStream so threshold changes apply instantly
}

FirebaseJson readingJson(float levelCm, float distanceCm, float tempC) {
  FirebaseJson json;
  json.set("levelCm", round(levelCm * 10) / 10.0);
  json.set("distanceCm", round(distanceCm * 10) / 10.0);
  json.set("tempC", round(tempC * 10) / 10.0);
  json.set("ts/.sv", "timestamp");  // server time in ms
  return json;
}

void pushAlert(const String &from, const String &to, float levelCm) {
  FirebaseJson json;
  json.set("from", from);
  json.set("to", to);
  json.set("levelCm", round(levelCm * 10) / 10.0);
  json.set("ack", false);
  json.set("ts/.sv", "timestamp");
  Firebase.RTDB.pushJSON(&fbdo, String("/alerts/") + DEVICE_ID, &json);
  // TODO: update /stats/{id}/{yyyy-mm-dd} { maxLevelCm, redMinutes } — needs NTP for the Manila date
}

// ---------- Main ----------

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_LED_G, OUTPUT);
  pinMode(PIN_LED_Y, OUTPUT);
  pinMode(PIN_LED_R, OUTPUT);
  pinMode(PIN_SIREN, OUTPUT);
  digitalWrite(PIN_SIREN, !SIREN_ON);
  tempSensor.begin();

  modemSetup();

  // Don't wait for Wi-Fi: the alarm and SMS must run without it. It connects in the background.
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  fbConfig.api_key = FIREBASE_API_KEY;
  fbConfig.database_url = FIREBASE_DATABASE_URL;
  fbAuth.user.email = DEVICE_EMAIL;
  fbAuth.user.password = DEVICE_PASSWORD;
  Firebase.begin(&fbConfig, &fbAuth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  unsigned long now = millis();
  if (now - lastLive < LIVE_EVERY_MS) return;
  lastLive = now;

  float tempC = readTempC();
  float distanceCm = readDistanceCm(tempC);
  if (isnan(distanceCm)) {
    Serial.println("no echo");
    return;  // website marks sensor offline after 60 s
  }
  float levelCm = sensorHeightCm - distanceCm;
  String status = statusFor(levelCm);
  showStatus(status);          // local alarm works even with no Wi-Fi
  smsOnRise(status, levelCm);  // so does SMS
  float batteryV = readBatteryV();

  Serial.printf("dist %.1f cm  level %.1f cm  %s  %.1f C  %.2f V  wifi %s\n", distanceCm, levelCm,
                status.c_str(), tempC, batteryV, WiFi.status() == WL_CONNECTED ? "up" : "down");

  String from = lastStatus;
  lastStatus = status;
  if (!Firebase.ready()) return;

  FirebaseJson live = readingJson(levelCm, distanceCm, tempC);
  live.set("status", status);
  live.set("batteryV", round(batteryV * 100) / 100.0);
  Firebase.RTDB.setJSON(&fbdo, DEVICE_PATH + "/live", &live);

  if (now - lastReading >= READING_EVERY_MS) {
    lastReading = now;
    FirebaseJson reading = readingJson(levelCm, distanceCm, tempC);
    Firebase.RTDB.pushJSON(&fbdo, String("/readings/") + DEVICE_ID, &reading);
  }

  if (from != "" && status != from) pushAlert(from, status, levelCm);

  if (!configLoaded || now - lastConfig >= CONFIG_EVERY_MS) {
    lastConfig = now;
    configLoaded = loadConfig();
  }
}
