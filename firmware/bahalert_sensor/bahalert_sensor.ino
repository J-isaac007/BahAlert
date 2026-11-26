// BahAlert prototype sensor unit: ESP32 + JSN-SR04T (or AJ-SR04M) ultrasonic sensor.
// Measures the water and writes it straight to Firebase in the shape of docs/data-contract.md:
//   /devices/{id}/live   every 2 s   { levelCm, distanceCm, status, ts }
//   /readings/{id}       every 5 s   { levelCm, distanceCm, ts }
//   /alerts/{id}         on change   { from, to, levelCm, ack, ts }   (the alert service texts residents)
// The alarm unit (bahalert_alarm) and the website both read /devices/{id}.
//
// Libraries (Arduino Library Manager):
//   - Firebase Arduino Client Library for ESP8266 and ESP32 (Mobizt) -> Firebase_ESP_Client.h
// Board: ESP32 Dev Module. Serial Monitor at 115200.

#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "config.h"
#include "secrets.h"

FirebaseData fbdo;
FirebaseAuth fbAuth;
FirebaseConfig fbConfig;

float sensorHeightCm = DEFAULT_SENSOR_HEIGHT_CM;
float yellowCm = DEFAULT_YELLOW_CM;
float redCm = DEFAULT_RED_CM;
float dangerCm = DEFAULT_DANGER_CM;

enum Status { GREEN = 0, YELLOW = 1, RED = 2 };
const char *STATUS_NAMES[] = {"green", "yellow", "red"};

Status history[HISTORY_SIZE];
int historyIndex = 0;
int historyCount = 0;
Status confirmed = GREEN;

// An alert that still has to reach Firebase (status changed while offline)
bool alertPending = false;
Status alertFrom = GREEN, alertTo = GREEN;
float alertLevel = 0;

float lastDistance = NAN, lastLevel = NAN;
unsigned long lastMeasure = 0, lastLive = 0, lastReading = 0, lastConfig = 0;
bool configLoaded = false;

const String DEVICE_PATH = String("/devices/") + DEVICE_ID;

// ---------- Sensor ----------

float pingOnceCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(5);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(15);
  digitalWrite(PIN_TRIG, LOW);
  unsigned long us = pulseIn(PIN_ECHO, HIGH, ECHO_TIMEOUT_US);
  if (us == 0) return -1;
  float cm = us * SPEED_CM_PER_US / 2.0;  // sound goes down and back
  return (cm < MIN_VALID_CM || cm > MAX_VALID_CM) ? -1 : cm;
}

// Median of the valid pings; -1 if fewer than 3 came back
float medianDistanceCm() {
  float s[PING_SAMPLES];
  int n = 0;
  for (int i = 0; i < PING_SAMPLES; i++) {
    float d = pingOnceCm();
    if (d > 0) s[n++] = d;
    delay(30);
  }
  if (n < 3) return -1;
  for (int i = 1; i < n; i++)
    for (int j = i; j > 0 && s[j - 1] > s[j]; j--) {
      float t = s[j]; s[j] = s[j - 1]; s[j - 1] = t;
    }
  return s[n / 2];
}

Status classify(float levelCm) {
  if (levelCm >= redCm) return RED;
  if (levelCm >= yellowCm) return YELLOW;
  return GREEN;
}

// Rolling vote: switch only when one status holds VOTE_THRESHOLD of the last HISTORY_SIZE
Status vote(Status raw) {
  history[historyIndex] = raw;
  historyIndex = (historyIndex + 1) % HISTORY_SIZE;
  if (historyCount < HISTORY_SIZE) historyCount++;
  int counts[3] = {0, 0, 0};
  for (int i = 0; i < historyCount; i++) counts[history[i]]++;
  for (int s = 0; s < 3; s++)
    if (s != confirmed && counts[s] >= VOTE_THRESHOLD) return (Status)s;
  return confirmed;
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
  configLoaded = true;
  Serial.printf("config: height %.1f  yellow %.1f  red %.1f  danger %.1f cm\n", sensorHeightCm, yellowCm, redCm, dangerCm);
}

float round1(float v) { return round(v * 10) / 10.0; }

void writeLive() {
  FirebaseJson json;
  json.set("levelCm", round1(lastLevel));
  json.set("distanceCm", round1(lastDistance));
  json.set("status", STATUS_NAMES[confirmed]);
  json.set("ts/.sv", "timestamp");  // server time, so a wrong board clock can't fake "live"
  if (!Firebase.RTDB.setJSON(&fbdo, DEVICE_PATH + "/live", &json))
    Serial.println("live write failed: " + fbdo.errorReason());
}

void pushReading() {
  FirebaseJson json;
  json.set("levelCm", round1(lastLevel));
  json.set("distanceCm", round1(lastDistance));
  json.set("ts/.sv", "timestamp");
  Firebase.RTDB.pushJSON(&fbdo, String("/readings/") + DEVICE_ID, &json);
}

void pushAlert() {
  FirebaseJson json;
  json.set("from", STATUS_NAMES[alertFrom]);
  json.set("to", STATUS_NAMES[alertTo]);
  json.set("levelCm", round1(alertLevel));
  json.set("ack", false);
  json.set("ts/.sv", "timestamp");
  if (Firebase.RTDB.pushJSON(&fbdo, String("/alerts/") + DEVICE_ID, &json)) {
    alertPending = false;
    Serial.printf("alert sent: %s -> %s\n", STATUS_NAMES[alertFrom], STATUS_NAMES[alertTo]);
  }
}

// ---------- Main ----------

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  for (int i = 0; i < HISTORY_SIZE; i++) history[i] = GREEN;

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) {  // up to 20 s, then keep going
    delay(500);
    Serial.print(".");
  }
  Serial.println(WiFi.status() == WL_CONNECTED ? " connected" : " not yet (will keep trying)");

  fbConfig.api_key = FIREBASE_API_KEY;
  fbConfig.database_url = FIREBASE_DATABASE_URL;
  fbAuth.user.email = DEVICE_EMAIL;
  fbAuth.user.password = DEVICE_PASSWORD;
  Firebase.begin(&fbConfig, &fbAuth);
  Firebase.reconnectWiFi(true);

  Serial.printf("BahAlert sensor %s ready\n", DEVICE_ID);
}

void loop() {
  unsigned long now = millis();

  if (now - lastMeasure >= MEASURE_EVERY_MS) {
    lastMeasure = now;
    float d = medianDistanceCm();
    if (d < 0) {
      // No echo: write nothing, so the website shows the sensor offline after 60 s
      Serial.println("reading skipped (no valid echo)");
    } else {
      lastDistance = d;
      lastLevel = sensorHeightCm - d;
      Status raw = classify(lastLevel);
      Status next = vote(raw);
      if (next != confirmed) {
        alertFrom = confirmed;
        alertTo = next;
        alertLevel = lastLevel;
        alertPending = true;  // sent below as soon as Firebase is ready
        confirmed = next;
      }
      Serial.printf("dist %.1f cm | level %.1f cm | raw %s | confirmed %s | wifi %s\n", d, lastLevel,
                    STATUS_NAMES[raw], STATUS_NAMES[confirmed], WiFi.status() == WL_CONNECTED ? "up" : "down");
    }
  }

  if (!Firebase.ready() || isnan(lastLevel)) return;

  if (!configLoaded || now - lastConfig >= CONFIG_EVERY_MS) {
    lastConfig = now;
    loadConfig();
  }
  if (alertPending) pushAlert();
  if (now - lastLive >= LIVE_EVERY_MS) {
    lastLive = now;
    writeLive();
  }
  if (now - lastReading >= READING_EVERY_MS) {
    lastReading = now;
    pushReading();
  }
}
