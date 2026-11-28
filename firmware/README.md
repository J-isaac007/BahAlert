# BahAlert firmware

| Folder | Board | What it does |
|---|---|---|
| `bahalert_sensor/` | ESP32 + JSN-SR04T (prototype) | Measures the water, writes `/devices/{id}/live`, `/readings`, `/alerts` to Firebase |
| `bahalert_alarm/` | ESP32 + 16×2 I2C LCD + MAX98357A + speaker (prototype) | Follows one sensor from Firebase; shows and sounds NORMAL / LOW / MEDIUM / HIGH / SENSOR OFFLINE |
| `floodwatch_esp32/` | Older production design (DS18B20, relay siren, 4G modem) | Reference only, not built |

Both prototype boards only need Wi-Fi; no laptop server.

## 1. Register the sensor (once)

```powershell
node scripts/add-device.mjs bah-001 "Prototype sensor — BatStateU Alangilan" Alangilan 13.7837 121.0745 --secrets firmware/bahalert_sensor/secrets.h
```

This makes the board's own Firebase login, links it in `/deviceAuth/bah-001`, writes desk-test thresholds and writes `secrets.h` (gitignored). Set `WIFI_SSID` / `WIFI_PASSWORD` in the environment first, or edit them in `secrets.h` afterwards. Add `--reset-password` to rewrite `secrets.h` for an existing board.

Copy `bahalert_alarm/secrets.example.h` to `bahalert_alarm/secrets.h` and fill in the Wi-Fi and the database URL. **Never commit a `secrets.h`.**

## 2. Arduino IDE setup

- Boards Manager: **esp32** by Espressif. Board: **ESP32 Dev Module**.
- Library Manager:
  - Sensor: **Firebase Arduino Client Library for ESP8266 and ESP32** (Mobizt)
  - Alarm: **ArduinoJson** (v7) and **LiquidCrystal I2C** (Frank de Brabander)
- Windows: the CP2102 chip needs the Silicon Labs CP210x driver if no COM port shows. If upload stalls at "Connecting…", hold **BOOT**.
- Alarm voice clip: copy the team's `flood_level_critical.h` into `bahalert_alarm/`. Without it the alarm still beeps.

## 3. Wiring

**Sensor:** JSN-SR04T VCC → 5V, GND → GND, TRIG → GPIO 25, ECHO → GPIO 26 through a 1k/2k divider (ECHO is 5V).

**Alarm:** LCD SDA → GPIO 32, SCL → GPIO 33 (address 0x27, or 0x3F). MAX98357A LRC → 25, BCLK → 26, DIN → 27, VIN → 5V.

## 4. Thresholds

The water level is `sensorHeightCm − distance`. The desk test assumes the sensor is 50 cm above the table:

| Distance from sensor | Level | Website | Alarm |
|---|---|---|---|
| > 40 cm | < 10 cm | green | NORMAL |
| 40 cm | 10 cm (`yellowCm`) | yellow | LOW |
| 30 cm | 20 cm (`redCm`) | red | MEDIUM |
| 23 cm | 27 cm (`dangerCm`) | red, overflow | HIGH |

Change them in `/devices/bah-001/config`. The sensor re-reads config every minute; the alarm on every poll. A status only switches after 5 of the last 7 measurements agree (about 3 s).

## 5. Check it works

1. Serial Monitor (115200) on the sensor shows `dist … | level … | confirmed …`.
2. The website map shows **Prototype sensor** live; move a hand toward the sensor and it turns yellow, then red, within a few seconds, with a row on the Alerts page.
3. The alarm LCD follows: LOW, MEDIUM (beeps), HIGH (beeps + clip).
4. Unplug the sensor: after 60 s the website shows it offline and the LCD shows SENSOR OFFLINE.

SMS and Telegram alerts for residents are sent by `service/` (see the main README), only for sensors an admin has switched on.
