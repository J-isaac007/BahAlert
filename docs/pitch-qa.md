# BahAlert — Panel Q&A prep (software)

Likely panelist questions about the software, each with a short answer drawn from the actual code.
⚠ marks weak spots panelists are likely to probe — answer honestly and close with the planned fix.

---

## A. Problem & concept

1. **What problem does the software solve that existing apps (PAGASA, NDRRMC, Waze) don't?**
   Hyper-local, street-level warning from a sensor in *your* creek, plus "minutes to overflow", a danger-zone
   warning based on your GPS, and a route to the nearest safe zone that avoids flooded areas — one page, no install.
2. **Who are the users?**
   Residents (public map, no login) and barangay/LGU admins (login: alerts, safe zones, hotlines, devices).
3. **Why a website, not a native app?**
   Works on any phone from a link, no Play Store, one codebase, deployed free on GitHub Pages / Firebase Hosting.
   Mobile layout with bottom nav is built in.
4. **Why Batangas City / Alangilan–Balagtas?**
   Local area we know; cite the Rosario, Batangas event (About page).

## B. Architecture & tech stack

5. **Walk us through the architecture.**
   Sensor unit (ESP32 + radar) → 4G → Firebase Realtime Database → React + Vite web app (Mapbox map, Chart.js).
   The sensor also texts residents via its 4G modem and sends alerts over LoRa radio to a separate announcer
   unit (LED display + siren), so the local warning works without internet or cell signal.
6. **Why Firebase Realtime Database instead of SQL / your own server?**
   Live push to every browser with no backend to run, free tier, built-in auth and security rules,
   Asia-Southeast region.
7. **How is the data organized?**
   See `docs/data-contract.md`: `/devices/{id}/{meta,config,live}`, with high-volume `/readings`, `/alerts`,
   `/stats` in separate branches so the map listens to `/devices` without downloading history.
8. **How do the hardware and web teams stay in sync?**
   One written data contract that firmware, simulator and site all follow; changes need both sides to agree.
9. **Why React + Vite? Why Mapbox?**
   Component reuse, fast dev/build; Mapbox gives vector map styles, heatmap, Directions + Matrix APIs.

## C. Flood logic & algorithms

10. **How do you measure water level?**
    A 24 GHz non-contact radar sensor above the water: distance = speed of light × travel time ÷ 2;
    level = sensor height − distance. The sensor works out the distance itself and sends it to the ESP32 over
    RS485. (24 GHz level radars typically measure the tiny travel time indirectly, by comparing the frequency
    sent with the frequency returned.)
    **Why radar, not ultrasonic?** Radio waves aren't affected by air temperature, wind, rain, fog or foam, so
    no thermometer correction is needed, and the range is up to 20 m.
    **Why does the firmware use an ultrasonic sensor?** That's our low-cost test prototype for developing and
    testing the software. The production design uses radar; it sends the same data, so the website doesn't change.
    ⚠ Production firmware for the radar, LoRa link and announcer unit is still to be written.
11. **How is green / yellow / red decided?**
    `getStatus` in `web/src/lib/flood.js`: ≥ redCm → red, ≥ yellowCm → yellow, else green. Thresholds are
    per-sensor in `/devices/{id}/config` (firmware defaults: yellow 40, red 60, overflow 80 cm).
12. **How do you compute "minutes to overflow"? How accurate is it?**
    Least-squares slope over the last 3 minutes (at least 5 points) gives the rise rate in cm/min;
    ETA = (overflow line − level) ÷ rate. Below 0.05 cm/min it shows "Stable / falling".
    ⚠ It's a linear estimate — heavy rain can accelerate the rise. It's a guide, recalculated every few seconds.
13. **Why a 3-minute window?**
    Short enough to react to sudden rises, long enough (≥ 5 points) to smooth out sensor noise.
14. **How do you know a sensor is dead vs. the water is safe?**
    If the last reading is older than 60 s (measured against server time, `serverTime.js`), the sensor shows
    **offline** in grey with "Do not assume it is safe". The device never writes "offline" itself.
15. **How is a danger zone defined?**
    A red sensor creates a circle of `dangerRadiusM` (default 300 m). Your GPS position is checked: inside =
    danger, within a further 200 m = approaching (`checkDanger` in `geo.js`).
    ⚠ Circles simplify real flood extent — next step is drawing zones from barangay hazard maps.
16. **How does safe routing work?**
    `routing.js`: take the 5 nearest safe zones, rank them by real travel time (Mapbox Matrix), fetch
    alternative routes (Mapbox Directions), and reject any that cross a red circle. If none is clear, it adds
    hidden waypoints beside each red circle to steer the route around it, swinging wider when roads still lead
    back through (e.g. the only bridge is inside the zone). OpenRouteService with avoid-polygons is a backup.
    **We never draw a route through a red zone:** if no flood-free way exists, the app says so and offers
    hotlines. If you're already inside a red zone, the route may cross that one zone only, to get you out.
17. **What if the APIs are down or there's no internet?**
    Matrix failure falls back to straight-line order; ORS is a second provider.
    ⚠ Without internet the website can't route — that's why SMS, the LoRa link and the siren live on the hardware.
18. **How do you prevent SMS spam when water bobs on a threshold?**
    Texts only when the status *rises*, at most once per 10 min per status, retry after 30 s with no signal
    (`config.h`).

## D. Security & privacy

19. **Can anyone fake sensor data or change thresholds?**
    No. `database.rules.json`: only the board's own Auth account (`/deviceAuth/{id}`) can write its
    `live` / `readings`; only admins write `meta` / `config`, safe zones and hotlines; `live` writes are
    validated (required fields, status must be green / yellow / red).
20. **How are admins managed?**
    No public sign-up. The first admin is made by script; others are invited by email from Admin → Admins.
    Rules block admins from changing their own admin flag.
21. **What about user location privacy?**
    Location stays on the phone — used only to check danger zones and route. It's never sent to our database.
    SMS phone numbers live only on the board, not in Firebase.
22. **API keys are in the frontend — isn't that a leak?**
    Firebase web config is public by design (security comes from the rules). The Mapbox token is a public
    `pk.` token restricted to our domains.

## E. Reliability, scale & cost

23. **What happens when Wi-Fi or power fails during a typhoon?**
    SMS works over 4G without Wi-Fi, and the sensor reaches the announcer's siren and LED display over LoRa
    even with no cell signal. Each unit has its own solar panel and LiFePO4 battery (12 Ah sensor, 50 Ah
    announcer) with an INA219 battery monitor. The board falls back to the thresholds in `config.h` until it
    reaches Firebase. Battery voltage is reported so admins see a dying unit.
24. **How many sensors can it handle?**
    The map only listens to `/devices` (small). ⚠ Known limits we've already logged: 7-day charts need
    downsampling (~120k points), the all-sensors alerts view needs a limit, safe-zone markers need clustering
    past ~30. Firebase's free tier covers a barangay pilot.
25. **What does it cost to run?**
    Software: free tiers (Firebase, Mapbox, GitHub Pages). Recurring: SIM load for SMS and 4G data.
    Production hardware (parts for a single system): ~₱20,990 for the sensor unit + ~₱39,600 for the announcer unit =
    ~₱60,590 for one complete system. The announcer costs more because of its 50 Ah battery, 100 W solar panel and six
    LED panels. In batches of 50–100: about ₱13,000–16,000 (sensor) and ₱22,000–29,000 (announcer).
    ⚠ These are US dollar online prices converted at ₱63.85 per $1 (BSP, 23 Nov 2026) — have local supplier quotes ready.
26. **How often does the sensor report?**
    Live status every ~2 s, history reading every ~5 s, config re-read every 60 s.
    ⚠ TODO: stream config so threshold changes apply instantly.

## F. Testing & validation

27. **How did you test without hardware?**
    `npm run seed` + `npm run simulate`: fake sensors rise and fall on a 6-minute cycle, written exactly like
    the firmware. Danger alerts tested by spoofing GPS in Chrome DevTools.
28. **Do you have automated tests?**
    Unit tests for flood logic, geo logic and server time (`flood.test.js`, `geo.test.js`,
    `serverTime.test.js` — `npm test`). ⚠ No end-to-end or field tests yet.
29. **How accurate is the sensor?**
    ⚠ Not yet field-calibrated — plan: compare against a ruler. Like any level sensor, the radar has a
    minimum range (blind zone) — check its datasheet and mount it at least that far above the highest water.
30. **Did real residents test it?**
    ⚠ Be honest; describe the planned barangay pilot / usability test.

## G. Usability & accessibility

31. **Will elderly or non-tech users understand it?**
    Plain-language colour meanings, "12 min" instead of "52 cm", a big danger banner, one-tap hotline calls,
    mobile-first layout.
32. **Filipino language support?**
    ⚠ Currently English — Filipino / Batangueño text is a clear next step.
33. **How are people warned if the site isn't open?**
    SMS from the sensor unit, plus the siren and LED display on the announcer unit (alerted over LoRa).
    ⚠ No web push notifications yet; the in-browser alarm sound is a TODO.
34. **Are the hotlines trustworthy?**
    Each hotline has a `verified` flag; unverified numbers hide the call button. The national lines (911, Red Cross 143,
    PAGASA) and the Batangas City lines (CDRRMO, 24/7 health hotline, fire, police, Batangas Medical Center) were checked
    on the agencies' and the city's official websites on 23 Nov 2026.
    ⚠ NDRRMC and the barangay hall are still unverified, so they show without a call button.

## H. Sustainability & future

35. **Who maintains it after the bootcamp?**
    The barangay DRRM office as admins; there's no server to maintain; safe zones and hotlines are edited from
    the admin page (⚠ device threshold/location edit form is still TODO).
36. **What's next?**
    Push notifications, Filipino UI, hazard-map-based zones, device config form, chart downsampling, offline
    (PWA) map caching, PAGASA rainfall data for better ETAs.
37. **How does it scale to other LGUs?**
    Adding a sensor = one database entry + one sensor unit (plus an announcer unit where people need to see
    and hear warnings); the site needs no code change (README §4).
38. **What was the biggest technical challenge?**
    Pick one honestly: sensor freshness (device clocks drift, so we use server timestamps), or routing around
    danger zones with free APIs.

---

## Rehearsal tips

- Close every ⚠ answer with the planned fix — panels reward knowing your limits.
- Keep the simulator running during the demo so statuses change live.
- Before the pitch, verify the NDRRMC and barangay hall numbers — panelists may open the site.
