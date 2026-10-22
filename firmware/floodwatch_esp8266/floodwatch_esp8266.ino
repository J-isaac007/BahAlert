// FloodWatch Lite — ESP8266 firmware (skeleton, untested until hardware arrives)
// Writes the shape in docs/data-contract.md. scripts/simulate.mjs is the reference behaviour.
//
// Libraries (Arduino Library Manager):
//   - Firebase Arduino Client Library for ESP8266 and ESP32 (Mobizt)  -> Firebase_ESP_Client.h
//   - OneWire, DallasTemperature
// Board: NodeMCU 1.0 (ESP-12E Module)

#include <ESP8266WiFi.h>
#include <Firebase_ESP_Client.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "config.h"
#include "secrets.h"

OneWire oneWire(PIN_TEMP);
DallasTemperature tempSensor(&oneWire);

FirebaseData fbdo;
FirebaseAuth fbAuth;
FirebaseConfig fbConfig;

float sensorHeightCm = DEFAULT_SENSOR_HEIGHT_CM;
float yellowCm = DEFAULT_YELLOW_CM;
float redCm = DEFAULT_RED_CM;
float dangerCm = DEFAULT_DANGER_CM;

String lastStatus = "";
unsigned long lastLive = 0, lastReading = 0, lastConfig = 0;

const String DEVICE_PATH = String("/devices/") + DEVICE_ID;

// ---------- Sensors ----------

float readTempC() {
  tempSensor.requestTemperatures();
  float t = tempSensor.getTempCByIndex(0);
  return (t == DEVICE_DISCONNECTED_C) ? DEFAULT_TEMP_C : t;
}

// distance = (speed of sound x echo time) / 2, speed corrected for air temperature.
// Median of 5 pings drops stray echoes.
float readDistanceCm(float tempC) {
  const float speedMs = 331.3 + 0.606 * tempC;
  float samples[5];
  int n = 0;
  for (int i = 0; i < 5; i++) {
    digitalWrite(PIN_TRIG, LOW);
    delayMicroseconds(2);
    digitalWrite(PIN_TRIG, HIGH);
    delayMicroseconds(10);
    digitalWrite(PIN_TRIG, LOW);
    unsigned long us = pulseIn(PIN_ECHO, HIGH, ECHO_TIMEOUT_US);
    if (us > 0) samples[n++] = (speedMs * (us / 1e6) / 2.0) * 100.0;
    delay(60);  // let echoes die out
  }
  if (n == 0) return NAN;
  for (int i = 1; i < n; i++)  // insertion sort
    for (int j = i; j > 0 && samples[j - 1] > samples[j]; j--) {
      float t = samples[j]; samples[j] = samples[j - 1]; samples[j - 1] = t;
    }
  return samples[n / 2];
}

String statusFor(float levelCm) {
  if (levelCm >= redCm) return "red";
  if (levelCm >= yellowCm) return "yellow";
  return "green";
}

// ---------- Local alarm ----------

void showStatus(const String &status) {
  digitalWrite(PIN_LED_G, status == "green");
  digitalWrite(PIN_LED_Y, status == "yellow");
  digitalWrite(PIN_LED_R, status == "red");
  if (status == "red") tone(PIN_BUZZER, 2000);
  else noTone(PIN_BUZZER);
}

// ---------- Firebase ----------

void loadConfig() {
  if (!Firebase.RTDB.getJSON(&fbdo, DEVICE_PATH + "/config")) {
    Serial.println("config read failed: " + fbdo.errorReason());
    return;
  }
  FirebaseJson &json = fbdo.jsonObject();
  FirebaseJsonData r;
  if (json.get(r, "sensorHeightCm")) sensorHeightCm = r.floatValue;
  if (json.get(r, "yellowCm")) yellowCm = r.floatValue;
  if (json.get(r, "redCm")) redCm = r.floatValue;
  if (json.get(r, "dangerCm")) dangerCm = r.floatValue;
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
  // TODO: send Telegram message (HTTPS GET to api.telegram.org/bot<TOKEN>/sendMessage)
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
  pinMode(PIN_BUZZER, OUTPUT);
  tempSensor.begin();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" ok " + WiFi.localIP().toString());

  fbConfig.api_key = FIREBASE_API_KEY;
  fbConfig.database_url = FIREBASE_DATABASE_URL;
  fbAuth.user.email = DEVICE_EMAIL;
  fbAuth.user.password = DEVICE_PASSWORD;
  Firebase.begin(&fbConfig, &fbAuth);
  Firebase.reconnectWiFi(true);

  loadConfig();
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
  showStatus(status);  // local alarm works even with no WiFi

  Serial.printf("dist %.1f cm  level %.1f cm  %s  %.1f C\n", distanceCm, levelCm, status.c_str(), tempC);
  if (!Firebase.ready()) return;

  FirebaseJson live = readingJson(levelCm, distanceCm, tempC);
  live.set("status", status);
  Firebase.RTDB.setJSON(&fbdo, DEVICE_PATH + "/live", &live);

  if (now - lastReading >= READING_EVERY_MS) {
    lastReading = now;
    FirebaseJson reading = readingJson(levelCm, distanceCm, tempC);
    Firebase.RTDB.pushJSON(&fbdo, String("/readings/") + DEVICE_ID, &reading);
  }

  if (lastStatus != "" && status != lastStatus) pushAlert(lastStatus, status, levelCm);
  lastStatus = status;

  if (now - lastConfig >= CONFIG_EVERY_MS) {
    lastConfig = now;
    loadConfig();
  }
}
