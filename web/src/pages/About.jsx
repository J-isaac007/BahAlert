import { ChevronRight, Info, Lock } from 'lucide-react';
import { Link } from 'react-router';
import { StatusChip } from '../components/ui/Status.jsx';
import { STATUS } from '../lib/flood.js';

// TODO(M5): fill in team names.
// Production hardware: estimated single-unit parts prices in USD, from the Blueprint "Flood Warning System" parts list.
// Parts shared by both units (cable glands, M3 screws) are split evenly.
const UNITS = [
  {
    name: 'Sensor unit',
    note: 'Mounted on a bridge or post above the channel',
    parts: [
      ['ESP32-WROOM-32D DevKitC', 8.5],
      ['24 GHz radar level sensor (RS485) + MAX485 converter', 87.5],
      ['SIM7672G 4G LTE modem', 32],
      ['RFM95W 915 MHz LoRa radio + antenna', 14],
      ['20 W solar panel, 10 A MPPT controller, 12 Ah LiFePO4 battery', 99],
      ['INA219 battery monitor, 5 V buck converter', 8],
      ['IP65 enclosure, pole and solar mounts, cable glands, screws, 3D-printed tray and radar bracket', 79.8],
    ],
  },
  {
    name: 'Announcer unit',
    note: 'LED display and siren, placed where people can see and hear it',
    parts: [
      ['ESP32-WROOM-32D DevKitC', 8.5],
      ['Six P10 outdoor LED panels (3 × 2, 960 × 320 mm) + HUB12 level shifter', 87],
      ['12 V 110 dB IP65 siren + siren relay', 21],
      ['RFM95W 915 MHz LoRa radio + antenna', 14],
      ['100 W solar panel, 20 A MPPT controller, 50 Ah LiFePO4 battery', 252],
      ['40 A 5 V buck converter, 40 A display power relay, INA219 battery monitor', 40.5],
      ['2020 aluminium frame, IP65 enclosure, pole and solar mounts, cable glands, screws, 3D-printed tray', 197.4],
    ],
  },
];

const usd = (n) => `~$${n.toFixed(2)}`;
const subtotal = (unit) => unit.parts.reduce((sum, [, cost]) => sum + cost, 0);
const TOTAL = UNITS.reduce((sum, unit) => sum + subtotal(unit), 0);

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
            <h2 className="section-title">Radar tells us the water level</h2>
            <p>
              A radar sensor mounted under a bridge or on a post above the channel sends a radio wave down to the water and
              measures how long the reflection takes to come back:
            </p>
            <p className="about-formula">distance = (speed of light × travel time) ÷ 2</p>
            <p>
              We divide by 2 because the wave travels down and back. Radio waves are not slowed by heat, wind, rain or fog
              the way sound is, so the reading stays steady in a storm and needs no temperature correction. The water level
              is the sensor&apos;s height above the channel bed minus that distance.
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
          <figure className="echo-fig fw-rise fw-d2" aria-label="A radar sensor above the channel times a radio wave reflecting off the water surface">
            <div className="echo-fig__sensor">Radar sensor</div>
            <div className="echo-fig__beam">
              <div className="echo-fig__line">
                <span className="fw-echo" aria-hidden="true" />
              </div>
              <div className="echo-fig__note">
                radio wave goes down
                <br />
                and reflects back
              </div>
            </div>
            <div className="echo-fig__water">Water surface</div>
            <figcaption className="fw-caption" style={{ marginTop: 12, textAlign: 'center' }}>
              level = sensor height − distance
            </figcaption>
          </figure>

          <section className="panel fw-rise fw-d3" style={{ gap: 12 }}>
            <h2 className="fw-h3">Hardware and costs</h2>
            <p className="fw-body-s">
              Two separate solar-powered units. The sensor unit sends alerts over 4G and LoRa, so the announcer still
              warns people nearby when there is no cell signal.
            </p>
            {UNITS.map((unit) => (
              <div key={unit.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h3 className="fw-strong" style={{ margin: 0 }}>{unit.name}</h3>
                <span className="fw-caption">{unit.note}</span>
                <ul className="parts">
                  {unit.parts.map(([part, cost]) => (
                    <li key={part}>
                      <span>{part}</span>
                      <span style={{ whiteSpace: 'nowrap' }}>{usd(cost)}</span>
                    </li>
                  ))}
                  <li style={{ fontWeight: 600 }}>
                    <span>{unit.name} subtotal</span>
                    <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{usd(subtotal(unit))}</span>
                  </li>
                </ul>
              </div>
            ))}
            <ul className="parts">
              <li style={{ fontWeight: 600 }}>
                <span>Total, one complete system</span>
                <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{usd(TOTAL)}</span>
              </li>
            </ul>
            <p className="fw-caption" style={{ margin: 0 }}>
              Estimated parts prices in US dollars when buying for a single system. Buying in batches of 50 to 100
              should bring this to about $200–250 for the sensor unit and $350–450 for the announcer.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
