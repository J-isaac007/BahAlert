// TODO(M5): fill in cited flood event, wiring photo, team names, final costs.
export default function About() {
  return (
    <main className="page prose">
      <h1>How FloodWatch Lite works</h1>

      <h2>The problem</h2>
      <p>
        Flash floods and typhoon-driven river overflows hit communities with little warning. Even 15–30 minutes of
        warning lets families move belongings and evacuate.
      </p>
      <p className="notice">TODO: add one recent local flood event with a cited source.</p>

      <h2>The physics: echo time-of-flight</h2>
      <p>
        An HC-SR04 ultrasonic sensor above the channel sends a sound pulse down. It bounces off the water and comes
        back. The board times the echo:
      </p>
      <pre>distance = (speed of sound × echo time) / 2</pre>
      <p>
        Divide by 2 because the sound travels down and back. Speed of sound changes with air temperature, so a
        DS18B20 sensor corrects it:
      </p>
      <pre>v ≈ 331.3 + 0.606 × T  (m/s, T in °C)</pre>
      <p>Water level = sensor height above channel bed − measured distance.</p>

      <h2>Alerts</h2>
      <ul>
        <li><strong>Green</strong> — normal.</li>
        <li><strong>Yellow</strong> — water rising, get ready.</li>
        <li><strong>Red</strong> — danger. The area around the sensor becomes a danger zone on the map.</li>
      </ul>
      <p>
        <strong>Minutes to overflow:</strong> the app fits a line through the last few minutes of readings to get the
        rise rate (cm/min), then divides the distance left to the danger line by that rate.
      </p>

      <h2>Hardware</h2>
      <p>ESP8266 NodeMCU, HC-SR04, DS18B20, buzzer, 3 LEDs, resistors, breadboard.</p>
      <p className="notice">TODO: wiring diagram + cost table.</p>

      <h2>Your privacy</h2>
      <p>Your location is only used on your phone to check danger zones and find routes. It is never uploaded or stored.</p>

      <h2>Team</h2>
      <p className="notice">TODO: team members and roles.</p>
    </main>
  );
}
