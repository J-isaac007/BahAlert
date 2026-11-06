#pragma once

// ---- Device identity (must match /devices/{id} in Firebase) ----
#define DEVICE_ID "fw-001"
#define SITE_NAME "Test site"  // shown in SMS alerts; keep it short (SMS limit is 160 characters)

// ---- Pins (GPIO numbers, printed as D18 / G18 / 18 on most ESP32 DevKit boards) ----
// Avoid GPIO 0, 2, 5, 12, 15 (boot strapping) and 6-11 (flash). 34-39 are input only.
//
// JSN-SR04T: VCC to 5V. Its ECHO pin outputs 5V — use a voltage divider (e.g. 1k + 2k)
// down to 3.3V before GPIO 19, or the ESP32 can be damaged.
#define PIN_TRIG   18
#define PIN_ECHO   19
#define PIN_TEMP   4    // DS18B20 data, 4.7k pull-up to 3.3V. Keep the probe in the air, not the water:
                        // it corrects the speed of sound between the sensor and the water.
#define PIN_LED_G  25
#define PIN_LED_Y  26
#define PIN_LED_R  27

// 12V siren (or buzzer) through a relay module or logic-level MOSFET — the ESP32 pin only drives
// the switch, never the siren itself. Many relay modules switch on when the input is LOW.
#define PIN_SIREN  23
#define SIREN_ON   HIGH  // set to LOW for an active-low relay module

// A7670 / SIM7600 4G modem on UART2, used for SMS. Power it from its own 5V supply that can give
// 2 A — never the ESP32's 5V pin. Share GND. Check the breakout's UART level: most boards are
// 3.3V-safe; if yours is 1.8V, add a level shifter.
#define PIN_MODEM_RX 16  // ESP32 RX2 <- modem TXD
#define PIN_MODEM_TX 17  // ESP32 TX2 -> modem RXD
#define MODEM_BAUD 115200

// Battery voltage through a divider into an ADC1 pin (ADC2 stops working while Wi-Fi is on).
// Assumes a 12V battery (it also runs the siren): 100k from battery+, 22k to GND, so 14.4V
// at full charge reads 2.6V at the pin. Factor = (100k + 22k) / 22k.
#define PIN_BATTERY 34
#define BATTERY_DIVIDER 5.545

// ---- Defaults (overwritten by /devices/{id}/config once the board reaches Firebase) ----
// With no internet the board keeps using these, so set them for the site.
#define DEFAULT_SENSOR_HEIGHT_CM 100.0
#define DEFAULT_YELLOW_CM 40.0
#define DEFAULT_RED_CM 60.0
#define DEFAULT_DANGER_CM 80.0

// ---- Sensor ----
#define DEFAULT_TEMP_C 28.0    // used if DS18B20 missing
#define MIN_DISTANCE_CM 25.0   // JSN-SR04T blind zone; mount it at least this far above the highest water
#define ECHO_TIMEOUT_US 30000  // ~5 m max range

// ---- Timing ----
#define LIVE_EVERY_MS 2000
#define READING_EVERY_MS 5000
#define CONFIG_EVERY_MS 60000
#define SMS_MIN_GAP_MS 600000  // the same status texts at most once per 10 min (water bobbing on a line)
#define SMS_RETRY_MS 30000     // wait before retrying a failed SMS (no signal yet)
