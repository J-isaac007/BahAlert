# FloodWatch Lite

Low-cost community flood monitor. ESP8266 + HC-SR04 sensors measure channel water levels, push them to
Firebase, and a map-first website shows flooded areas, warns people inside danger zones, routes them to the
nearest safe zone, and lists Philippine emergency hotlines.

```
firmware/   ESP8266 sketch (skeleton — test when hardware arrives)
web/        React + Vite site (Mapbox map, Chart.js, Firebase)
scripts/    seed sample data + simulate sensors (no hardware needed)
docs/       data-contract.md — the Firebase shape everyone must follow
```

## 1. One-time setup

1. **Firebase** — create project → enable *Realtime Database* (region: asia-southeast1) and *Authentication → Email/Password*.
   Put the project id in `.firebaserc`.
2. **Mapbox** — create account → copy the default public token (`pk.…`). Add URL restrictions
   (`http://localhost:5173`, your Firebase Hosting domain).
3. **OpenRouteService** (optional fallback) — free key at openrouteservice.org.
4. `web/.env` — copy `web/.env.example`, fill Firebase web config + `VITE_MAPBOX_TOKEN` (+ `VITE_ORS_KEY`).
5. `.env` (repo root, for scripts) — copy `.env.example`, set `FIREBASE_DATABASE_URL` and download a service
   account key to `serviceAccount.json` (Project settings → Service accounts). **Never commit it.**
6. Install the Firebase CLI: `npm i -g firebase-tools`, then `firebase login`.
7. Deploy rules: `firebase deploy --only database`.
8. Make an admin: create a user in Auth, then in the RTDB console add `/admins/<uid>: true`.

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

## 4. When the hardware is ready

1. Create an Auth user for the board, put its UID at `/deviceAuth/<deviceId>`.
2. Copy `firmware/floodwatch_esp8266/secrets.example.h` → `secrets.h`, fill in.
3. Flash from Arduino IDE. Stop the simulator. The website needs no change.

## Team

| Member | Owns |
|---|---|
| M1 Hardware | `firmware/`, calibration vs ruler |
| M2 Backend | Firebase, `database.rules.json`, `scripts/`, `web/src/lib/routing.js` |
| M3 Frontend | `web/src/components/map/`, `MapPage`, geolocation + danger check |
| M4 UI / Data viz | `styles/`, `components/sensor/`, heatmap, Hotlines + Safe Zones pages |
| M5 Docs / Pitch | `About` page, verified hotlines + safe zone data, cited flood event, demo script |

Search the code for `TODO` to find open work.
