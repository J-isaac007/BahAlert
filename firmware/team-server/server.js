// The team's flood server for the prototype ESP32s, plus the BahAlert website link.
// Only two lines are new (marked "BahAlert website"); everything else is the original server.
const http = require("http");
const { sendReading } = require("./bahalert-link"); // BahAlert website

const PORT = 3000;

let state = {
  distanceCm: null,
  level: "NORMAL", // NORMAL, LOW, MEDIUM, CRITICAL
  alarmActive: false,
  updatedAt: null
};

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");

  // Sensor ESP32 posts water level updates here
  if (req.method === "POST" && req.url === "/api/level") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        state.distanceCm = data.distance_cm ?? state.distanceCm;
        state.rawLevel = data.raw_level ?? state.rawLevel ?? "NORMAL";
        state.stableLevel = data.level ?? "NORMAL";
        state.level = state.stableLevel;
        state.alarmActive = (state.stableLevel === "CRITICAL" || state.stableLevel === "HIGH");
        state.updatedAt = new Date().toISOString();

        console.log("[LEVEL UPDATE]", state);
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true, state }));
        sendReading({ distanceCm: state.distanceCm, level: state.level }); // BahAlert website
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  // Alarm ESP32 checks this endpoint to see if it should sound
  if (req.method === "GET" && req.url === "/api/alarm") {
    res.writeHead(200);
    res.end(JSON.stringify({
      alarm: state.alarmActive,
      level: state.level,
      distance_cm: state.distanceCm
    }));
    return;
  }

  // Optional: inspect current state in browser at http://localhost:3000/status
  if (req.method === "GET" && req.url === "/status") {
    res.writeHead(200);
    res.end(JSON.stringify(state, null, 2));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Flood server running on http://0.0.0.0:${PORT}`);
});
