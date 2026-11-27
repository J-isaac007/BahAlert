# FloodWatch Lite

Low-cost community flood monitor. Solar-powered sensor units (ESP32 + 24 GHz radar level sensor) measure channel
water levels, text residents by SMS (4G modem) when the water rises, and push readings to Firebase. A separate
announcer unit (P10 LED display + siren) receives alerts from the sensor over LoRa radio, so it still warns people
nearby with no cell signal. A map-first website shows flooded areas, warns people inside danger zones, routes them
to the nearest safe zone, and lists Philippine emergency hotlines.

## Hardware

### Production design

Two separate units with no cable between them, each with its own solar panel, MPPT controller, LiFePO4 battery
and ESP32 in an IP65 enclosure. Full parts list and prices are on the About page (`web/src/pages/About.jsx`).

| Unit | Main parts | Parts cost (single system) |
|---|---|---|
| Sensor | 24 GHz radar level sensor (RS485 via MAX485), SIM7672G 4G modem, RFM95W 915 MHz LoRa, 20 W panel, 12 Ah battery | ~₱20,990 |
| Announcer | Six P10 LED panels (3 × 2 grid, HUB12 via 74AHCT245), 12 V 110 dB siren + relay, RFM95W LoRa, 100 W panel, 50 Ah battery | ~₱39,600 |

Converted from US dollar online prices at ₱63.85 per $1 (BSP, 23 Nov 2026).

### Test prototype

The built prototype is two ESP32 boards that only need Wi-Fi (see `firmware/README.md`):

- **Sensor unit** (`firmware/bahalert_sensor/`): JSN-SR04T ultrasonic sensor. Writes live data, readings and
  alerts straight to Firebase as `bah-001`, in the same shape (`docs/data-contract.md`) the production units will use.
- **Alarm unit** (`firmware/bahalert_alarm/`): 16×2 LCD, MAX98357A amp and speaker. Follows the sensor from
  Firebase and shows/sounds NORMAL, LOW, MEDIUM, HIGH or SENSOR OFFLINE.

Residents get SMS or Telegram alerts from the alert service (`service/`, see section 5). Production firmware
for the radar sensor (RS485), LoRa link and announcer unit is still to be written.

```
firmware/   ESP32 sketches: prototype sensor + alarm (and the older production skeleton)
service/    alert service: sign-up codes, SMS (Android gateway) + Telegram alerts
web/        React + Vite site (Mapbox map, Chart.js, Firebase)
scripts/    seed sample data, simulate sensors, register a board (add-device.mjs)
docs/       data-contract.md — the Firebase shape everyone must follow
```

## 1. One-time setup

1. **Firebase** — create project → enable *Realtime Database* (region: asia-southeast1) and *Authentication →
   Email/Password* and *Anonymous* (residents' sign-up uses it while their code is checked).
   Put the project id in `.firebaserc`.
2. **Mapbox** — create account → copy the default public token (`pk.…`). Add URL restrictions
   (`http://localhost:5173`, your Firebase Hosting domain).
3. **OpenRouteService** (optional fallback) — free key at openrouteservice.org.
4. `web/.env` — copy `web/.env.example`, fill Firebase web config + `VITE_MAPBOX_TOKEN` (+ `VITE_ORS_KEY`).
5. `.env` (repo root, for scripts) — copy `.env.example`, set `FIREBASE_DATABASE_URL` and download a service
   account key to `serviceAccount.json` (Project settings → Service accounts). **Never commit it.**
6. Install the Firebase CLI: `npm i -g firebase-tools`, then `firebase login`.
7. Deploy rules: `firebase deploy --only database`.
8. Make the first admin: `npm run make-admin -- you@example.com`, then open the printed link to set a password.
   There is no sign-up: further admins are invited from the site (Admin → Admins → Send invite), and get an
   email to set their password. Remove one with the Admins tab or `npm run make-admin -- --remove <email>`.

## 2. Run without hardware

```bash
npm install                 # root: script deps
npm run seed                # sample sensors, safe zones, hotlines
npm run simulate            # fake sensors rise/fall every 6 min (Ctrl+C to stop)

cd web
npm install
npm run dev                 # http://localhost:5173
npm test                    # flood + geo logic tests
```

Test danger alerts: Chrome DevTools → ⋮ → More tools → Sensors → set a location inside a red circle.

### Run the simulator on GitHub (for the live site)

The live site only shows moving sensors while a simulator is running somewhere. To run it on GitHub instead
of a laptop:

1. One time: repo Settings → Secrets and variables → Actions → New secret `FIREBASE_SERVICE_ACCOUNT`, and
   paste the whole contents of `serviceAccount.json`. (It uses the existing `VITE_FIREBASE_DATABASE_URL` secret.)
2. **Start:** Actions → *Sensor simulator* → Run workflow → mode `start`, pick minutes (max 350).
3. **Stop:** run it again with mode `stop`, or cancel the running job. Sensors show offline within 60 s.

Don't run it on GitHub and on a laptop at the same time — both would write to the same sensors.

### Local emulator instead of real Firebase

```bash
firebase emulators:start    # RTDB :9000, Auth :9099, UI :4000
```
Root `.env`: use option B. `web/.env`: `VITE_USE_EMULATORS=true`.

## 3. Deploy

```bash
cd web && npm run build && cd ..
firebase deploy             # hosting + database rules
```

## 4. Connect the prototype hardware

**Option A — the team's sketches and server (what the prototype uses).** The ESP32s post to the team's own
Node server on a laptop (`POST /api/level`, `GET /api/alarm`); it runs the alarm and sends Telegram. To put the
readings on the website, run that server from `firmware/team-server/` (see its README): two added lines and
`bahalert-link.js` forward every reading to Firebase as `bah-001` (NORMAL → green, LOW → yellow, MEDIUM/HIGH →
red), so the map, charts and alert log go live. It needs the private `bahalert.config.json` (gitignored).

(`node service/index.mjs` can also serve those endpoints itself with `BRIDGE_PORT=3000`, if the team's server
isn't running.)

**Option B — boards write to Firebase themselves (no laptop).** Full steps, wiring and thresholds:
`firmware/README.md`. In short:

1. `node scripts/add-device.mjs bah-001 "<name>" <barangay> <lat> <lng> --secrets firmware/bahalert_sensor/secrets.h`
   makes the board's login, `/deviceAuth/bah-001`, desk-test thresholds and its `secrets.h`.
2. Fill `firmware/bahalert_alarm/secrets.h` from its example.
3. Flash both from Arduino IDE (board: *ESP32 Dev Module*). The website needs no change, and the simulator
   doesn't touch `bah-001`.

## 5. Resident alerts (SMS + Telegram)

Residents sign up on the site (Alerts → *Sign up with your number*) with their mobile number and a texted code,
pick the sensors near them, and choose SMS and/or Telegram. The alert service sends the codes and the alerts.

1. **SMS:** on a spare Android phone with a loaded SIM, install *SMS Gateway for Android* (sms-gate.app), start
   *Cloud server*, and copy the username and password it shows into the root `.env` as `SMS_GATEWAY_USER` and
   `SMS_GATEWAY_PASS`. Keep the phone charged and online. Without them, SMS is a dry run that only logs.
2. **Telegram:** create a bot with **@BotFather**, put the token in `.env` as `TELEGRAM_BOT_TOKEN`.
3. Run the service and leave it running (laptop or an always-on machine; hosts that sleep when idle miss alerts):
   ```bash
   node service/index.mjs
   ```
4. Admin → Sensors: switch on alerts for the real sensors only (keep simulated ones off). The top switch pauses
   all messages. Admin → Residents lists who signed up.

Tests: `node --test service/messages.test.mjs` (message rules) and `cd web && npm test`.

## Team

| Member | Owns |
|---|---|
| M1 Hardware | `firmware/`, calibration vs ruler |
| M2 Backend | Firebase, `database.rules.json`, `scripts/`, `web/src/lib/routing.js` |
| M3 Frontend | `web/src/components/map/`, `MapPage`, geolocation + danger check |
| M4 UI / Data viz | `styles/`, `components/sensor/`, heatmap, Hotlines + Safe Zones pages |
| M5 Docs / Pitch | `About` page, verified hotlines + safe zone data, cited flood event, demo script |

Search the code for `TODO` to find open work.
