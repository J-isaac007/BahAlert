# Data contract — Firebase Realtime Database

The ESP8266 firmware, `scripts/simulate.mjs`, and the website all read and write this exact shape.
**Change it only when hardware and web people both agree**, and update all three plus this file.

High-volume data (`readings`, `alerts`, `stats`) lives in its own top-level branch, so the map can
listen to `/devices` without downloading every reading.

```
/devices/{deviceId}
  meta:    { name, barangay, lat, lng, dangerRadiusM }            admin writes
  config:  { sensorHeightCm, yellowCm, redCm, dangerCm, intervalSec }   admin writes, device reads
  live:    { levelCm, distanceCm, tempC, status, ts }             device writes every ~2 s

/readings/{deviceId}/{pushId}   { levelCm, distanceCm, tempC, ts }        device pushes every ~5 s
/alerts/{deviceId}/{pushId}     { from, to, levelCm, ts, ack }            device pushes on status change
/stats/{deviceId}/{yyyy-mm-dd}  { maxLevelCm, redMinutes }                device updates (Asia/Manila date)

/safeZones/{id}  { name, type, lat, lng, address, capacity, contact, active }   admin
/hotlines/{id}   { name, number, category, area, order, verified }              admin

/admins/{uid}: true          set by hand in Firebase console
/deviceAuth/{deviceId}: uid  set by hand — the Firebase Auth account each board signs in with
```

## Field rules

| Field | Type | Notes |
|---|---|---|
| `ts` | number | Unix **milliseconds**. Firmware uses server time (`{".sv": "timestamp"}`). |
| `levelCm` | number | `sensorHeightCm − distanceCm`. 1 decimal. |
| `distanceCm` | number | Raw sensor → water distance after temperature correction. |
| `tempC` | number | DS18B20 reading. Omit if sensor missing. |
| `status` | string | `green` \| `yellow` \| `red`. Device computes from `config`. Website adds `offline` itself when `ts` is older than 60 s — **device never writes `offline`**. |
| `from` / `to` | string | Status before / after the change. |
| `ack` | bool | Admin acknowledged. Device writes `false`. |
| `dangerRadiusM` | number | Meters. Red sensor → circle of this radius is a danger zone. Default 300. |
| `type` (safe zone) | string | `evac` \| `school` \| `court` \| `church` |
| `category` (hotline) | string | `national` \| `city` \| `barangay` |
| `verified` (hotline) | bool | `false` hides the call button. Only set `true` after checking an official source. |

## Status thresholds

```
level >= redCm     -> red
level >= yellowCm  -> yellow
else               -> green
dangerCm           -> the "overflow" line used by minutes-to-overflow
```
