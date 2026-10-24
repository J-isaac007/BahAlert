import { ChevronRight, Info, Lock } from 'lucide-react';
import { Link } from 'react-router';
import { StatusChip } from '../components/ui/Status.jsx';
import { STATUS } from '../lib/flood.js';

// TODO(M5): fill in team names, final costs.
const PARTS = ['ESP8266 NodeMCU (Wi-Fi)', 'HC-SR04 ultrasonic sensor', 'DS18B20 thermometer', 'Buzzer, 3 LEDs, resistors'];

const COLOURS = [
  [STATUS.GREEN, 'Water is at a safe level.'],
  [STATUS.YELLOW, 'Water is rising. Get your family and documents ready.'],
  [STATUS.RED, 'Move to a safe zone now. The area around the sensor becomes a danger zone on the map.'],
  [STATUS.OFFLINE, 'The sensor has not reported for a minute. Do not assume it is safe.'],
];

export default function About() {
  return (
    <div className="page page--narrow about-page fw-waves">
      {/* Mobile "More" tab: the bottom nav has no room for Admin */}
      <nav className="list-box more-nav only-mobile fw-rise" aria-label="More">
        <Link className="list-row" to="/about" aria-current="page">
          <Info size={20} aria-hidden="true" />
          About BahAlert
        </Link>
        <Link className="list-row fw-rowlink" to="/admin">
          <Lock size={20} aria-hidden="true" />
          Admin login
          <ChevronRight size={20} aria-hidden="true" style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
        </Link>
      </nav>

      <div className="about">
        <article className="about-article">
          <header className="fw-rise fw-d1" style={{ gap: 8 }}>
            <span className="fw-over">Our purpose</span>
            <h1 className="page-title">How BahAlert works</h1>
            <p className="about-tagline">Minutes matter. We give communities those minutes.</p>
            <p style={{ color: 'var(--text-secondary)' }}>
              Low-cost sensors watch the water in our creeks and river, so families get a warning before it reaches their
              street.
            </p>
          </header>

          <section className="fw-rise fw-d2">
            <h2 className="section-title">Why it matters</h2>
            <p>
              Flash floods and typhoon-driven river overflows arrive with little warning. Official gauges are far apart, so
              most people learn the water is rising when it is already at the door. Even 15 to 30 minutes of warning lets a
              family move belongings and leave safely.
            </p>
            <blockquote className="about-event">
              3 October 2026, Rosario, Batangas: a jeepney carrying 14 people was swept away while crossing a flooded
              spillway in Barangay Colongan. Two people died.
              <cite>Daily Tribune, 4 October 2026</cite>
            </blockquote>
          </section>

          <section className="fw-rise fw-d3" style={{ gap: 16 }}>
            <h2 className="section-title">Sound tells us the water level</h2>
            <p>An ultrasonic sensor above the channel sends a short pulse of sound down to the water and times the echo:</p>
            <p className="about-formula">distance = (speed of sound × echo time) ÷ 2</p>
            <p>
              We divide by 2 because the sound travels down and back. Warm air carries sound faster, so a small thermometer
              corrects the speed: about 331.3 + 0.606 × temperature metres per second. The water level is the sensor&apos;s
              height above the channel bed minus that distance.
            </p>
          </section>

          <section>
            <h2 className="section-title">What the colours mean</h2>
            {COLOURS.map(([status, text]) => (
              <div key={status} className="about-key">
                <StatusChip status={status} />
                <span>{text}</span>
              </div>
            ))}
          </section>

          <section>
            <h2 className="section-title">Minutes to overflow</h2>
            <p>
              BahAlert fits a line through the last few minutes of readings to see how fast the water is rising, then
              works out how long until it reaches the overflow line. &ldquo;12 min&rdquo; is easier to act on than
              &ldquo;52 cm&rdquo;.
            </p>
          </section>

          <section>
            <h2 className="section-title">Your privacy</h2>
            <p>Your location is only used on your device to check danger zones and find a route. It is never sent to us or stored.</p>
          </section>

          <section>
            <h2 className="section-title">The team</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Built by team Limang Piso for CS Bootcamp 2026 — Build the way forward. [TEAM MEMBERS AND ROLES]
            </p>
          </section>
        </article>

        <aside className="about-aside">
          <figure className="echo-fig fw-rise fw-d2" aria-label="An ultrasonic sensor above the channel times an echo off the water surface">
            <div className="echo-fig__sensor">Ultrasonic sensor</div>
            <div className="echo-fig__beam">
              <div className="echo-fig__line">
                <span className="fw-echo" aria-hidden="true" />
              </div>
              <div className="echo-fig__note">
                sound goes down
                <br />
                and echoes back
              </div>
            </div>
            <div className="echo-fig__water">Water surface</div>
            <figcaption className="fw-caption" style={{ marginTop: 12, textAlign: 'center' }}>
              level = sensor height − distance
            </figcaption>
          </figure>

          <section className="panel fw-rise fw-d3" style={{ gap: 12 }}>
            <h2 className="fw-h3">Hardware per sensor</h2>
            <ul className="parts">
              {PARTS.map((p) => (
                <li key={p}>
                  <span>{p}</span>
                  <span>[COST]</span>
                </li>
              ))}
              <li style={{ fontWeight: 600 }}>
                <span>Total</span>
                <span style={{ color: 'var(--text-primary)' }}>[TOTAL]</span>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
