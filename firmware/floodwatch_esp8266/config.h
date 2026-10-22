#pragma once

// ---- Device identity (must match /devices/{id} in Firebase) ----
#define DEVICE_ID "fw-001"

// ---- Pins (NodeMCU labels) ----
// HC-SR04 runs on 5V (VIN). Its ECHO pin outputs 5V — use a voltage divider
// (e.g. 1k + 2k) down to 3.3V before D6, or the ESP8266 can be damaged.
#define PIN_TRIG   D5
#define PIN_ECHO   D6
#define PIN_TEMP   D7   // DS18B20 data, 4.7k pull-up to 3.3V
#define PIN_LED_G  D1
#define PIN_LED_Y  D2
#define PIN_LED_R  D0
#define PIN_BUZZER D8

// ---- Defaults (overwritten by /devices/{id}/config) ----
#define DEFAULT_SENSOR_HEIGHT_CM 100.0
#define DEFAULT_YELLOW_CM 40.0
#define DEFAULT_RED_CM 60.0
#define DEFAULT_DANGER_CM 80.0
#define DEFAULT_TEMP_C 28.0   // used if DS18B20 missing

// ---- Timing ----
#define LIVE_EVERY_MS 2000
#define READING_EVERY_MS 5000
#define CONFIG_EVERY_MS 60000
#define ECHO_TIMEOUT_US 30000  // ~5 m max range
