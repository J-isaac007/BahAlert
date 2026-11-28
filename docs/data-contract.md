# Data contract — Firebase Realtime Database

The ESP32 firmware, `scripts/simulate.mjs`, and the website all read and write this exact shape.
**Change it only when hardware and web people both agree**, and update all three plus this file.

High-volume data (`readings`, `alerts`, `stats`) lives in its own top-level branch, so the map can
listen to `/devices` without downloading every reading.

```
/devices/{deviceId}
  meta:    { name, barangay, lat, lng, dangerRadiusM }            admin writes
  config:  { sensorHeightCm, yellowCm, redCm, dangerCm, intervalSec, boardDistances? }   admin writes, device reads
  live:    { levelCm, distanceCm, tempC, batteryV, status, ts }   device writes every ~2 s

/readings/{deviceId}/{pushId}   { levelCm, distanceCm, tempC, ts }        device pushes every ~5 s
/alerts/{deviceId}/{pushId}     { from, to, levelCm, ts, ack }            device pushes on status change
/stats/{deviceId}/{yyyy-mm-dd}  { maxLevelCm, redMinutes }                device updates (Asia/Manila date)

/safeZones/{id}  { name, type, lat, lng, address, capacity, contact, active }   admin
/hotlines/{id}   { name, number, category, area, order, verified }              admin

/admins/{uid}: true          another admin (Admin > Admins) or `npm run make-admin`; nobody edits their own
/adminProfiles/{uid}  { email, addedBy, addedAt }   written with /admins; admins read the list
/deviceAuth/{deviceId}: uid  `node scripts/add-device.mjs` — the Firebase Auth account each board signs in with

/residents/{ph_639XXXXXXXXX}   { name, barangay, watch: {deviceId: true}, channels: {sms, telegram},
                                 phone, telegramChatId, createdAt }
                               resident writes name/barangay/watch/channels; alert service writes the rest
/otpRequests/{anonUid}         { phone, requestedAt, code }  site · { status, token, expiresAt, retryAt, attemptsLeft }  service
/telegramLinks/{code}          { rid, ts }   resident creates for "Connect Telegram"; service consumes it
/settings/alerts               { enabled }   admin pause switch (public read)
/settings/service              { heartbeatAt, startedAt, sms, telegramBot }   alert service heartbeat (public read)
/otpSecrets, /otpThrottle, /alertLog        alert service only (no client access)
```

`devices/{id}/meta.notify` (bool, admin) turns SMS/Telegram alerts on for that sensor. Keep it off for
simulated sensors.

## Field rules

| Field | Type | Notes |
|---|---|---|
| `ts` | number | Unix **milliseconds**. Firmware and simulator use server time (`{".sv": "timestamp"}`); the website measures age against server time too. |
| `levelCm` | number | `sensorHeightCm − distanceCm`. 1 decimal. |
| `distanceCm` | number | Raw sensor → water distance after temperature correction. |
| `tempC` | number | DS18B20 reading. Omit if sensor missing. |
| `batteryV` | number | Battery voltage from the divider, 2 decimals. `live` only — not stored in `readings`. |
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

`config.boardDistances` `{ yellow, red, danger }` (cm from the sensor to the water) is set only for a board that
picks its colour from **distance** instead of from `config`: the prototype (`bah-001`), whose sketch says LOW at
40 cm, MEDIUM at 30 cm and HIGH at 23 cm. Admin > Sensors > Calibrate then sets `yellowCm = height − yellow`
(and the same for red and danger), so the chart and gauge lines keep matching the board's colours.

## Resident alerts (SMS + Telegram)

`service/` (Node, Admin SDK) watches `/alerts/{id}` for sensors with `meta.notify` and messages the residents
whose `watch` includes that sensor:

- sends on a **rise** to yellow or red, and on the return to green; red → yellow stays quiet
- the same level for a sensor at most once per 15 minutes (`alertLog/{id}/last`), each alert once (`alertLog/{id}/sent`)
- only alerts written after the sensor was switched on, so turning a sensor on never replays old ones
- SMS through an Android phone running SMS Gateway for Android; Telegram through a bot (long polling)

Sign-up: the site signs in anonymously and writes `otpRequests/{uid}`; the service texts a 6-digit code
(1 per minute and 5 per day per number, 60 per hour overall), checks it (5 tries, 10 minutes) and answers
with a custom token for `ph_<digits>`, so a resident is the same account on any device. Residents can only
change their name, barangay, sensors and channels; `phone` and `telegramChatId` are service-only.

The older production firmware (`firmware/floodwatch_esp32`) also texts the numbers in its `secrets.h`
through a 4G modem. The prototype has no modem and relies on the service.
