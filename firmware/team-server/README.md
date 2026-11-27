# Team server + BahAlert website link

This is the team's flood server for the prototype ESP32s (`flood_sensor.ino` posts to `/api/level`,
`alarm_system.ino` reads `/api/alarm`), with one addition: every reading also goes to the BahAlert website,
so the prototype shows up live on the map, the sensor page (chart) and the alert log.

Nothing changes on the boards, the alarm or your Telegram messages.

## Set up (once)

Put these three files in the same folder:

| File | What it is |
|---|---|
| `server.js` | Your server, with two lines added (marked `BahAlert website`) |
| `bahalert-link.js` | Sends each reading to the website. No `npm install` needed (Node 18+) |
| `bahalert.config.json` | Website login for the prototype board. **Private**: get it from Isaac, never post it or commit it |

Already changed your own `server.js`? Instead of ours, add these two lines to yours:

```js
const { sendReading } = require("./bahalert-link");           // at the top
sendReading({ distanceCm: state.distanceCm, level: state.level }); // in /api/level, after res.end(...)
```

## Run

```bash
node server.js
```

When the sensor posts, the website (https://j-isaac007.github.io/BahAlert/sensor/bah-001) shows
**Prototype sensor — Live** within a few seconds. When the level changes colour, the terminal prints e.g.
`[WEBSITE] bah-001 green -> yellow (LOW, 12 cm)` and the website's Alert log gets a row.

| Board level | Website |
|---|---|
| NORMAL | green |
| LOW | yellow |
| MEDIUM, HIGH | red |

The water level on the website is `sensorHeightCm − distance_cm` (50 cm for the desk test; change it in
Admin → Sensors → Calibrate). If the internet drops, your server and the alarm keep working; it prints one
`[WEBSITE] not sent: …` line and catches up on the next reading. If you stop the server, the website shows the
sensor offline after 60 seconds.
