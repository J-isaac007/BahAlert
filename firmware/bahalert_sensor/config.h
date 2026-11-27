#pragma once

// ---- Pins (the team's prototype wiring) ----
// JSN-SR04T / AJ-SR04M: VCC 5V, GND, TRIG -> GPIO 25, ECHO -> GPIO 26.
// ECHO outputs 5V: put a divider (e.g. 1k + 2k) between ECHO and GPIO 26 to protect the ESP32.
#define PIN_TRIG 25
#define PIN_ECHO 26

// ---- Defaults until /devices/{id}/config is read (desk test: sensor 50 cm above the table) ----
#define DEFAULT_SENSOR_HEIGHT_CM 50.0
#define DEFAULT_YELLOW_CM 10.0  // 40 cm from the sensor (prototype "LOW")
#define DEFAULT_RED_CM 20.0     // 30 cm from the sensor (prototype "MEDIUM")
#define DEFAULT_DANGER_CM 27.0  // 23 cm from the sensor (prototype "HIGH", overflow line)

// ---- Sensor & filtering ----
#define MIN_VALID_CM 20.0     // blind zone: anything closer is noise
#define MAX_VALID_CM 400.0
#define PING_SAMPLES 9        // pings per measurement; the median is used
#define ECHO_TIMEOUT_US 30000
#define SPEED_CM_PER_US 0.0343  // speed of sound at ~20-25 C (no thermometer in the prototype)

// Status only switches when VOTE_THRESHOLD of the last HISTORY_SIZE measurements agree,
// so a splash or a stray echo doesn't flip the alarm.
#define HISTORY_SIZE 7
#define VOTE_THRESHOLD 5

// ---- Timing ----
#define MEASURE_EVERY_MS 500
#define LIVE_EVERY_MS 2000
#define READING_EVERY_MS 5000
#define CONFIG_EVERY_MS 60000
