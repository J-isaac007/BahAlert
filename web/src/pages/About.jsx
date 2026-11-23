import { ChevronRight, Info, Lock, Megaphone, Radar } from 'lucide-react';
import { Link } from 'react-router';
import { StatusChip } from '../components/ui/Status.jsx';
import { STATUS } from '../lib/flood.js';
import aifaPhoto from '../assets/team/aifa.jpg';
import christianPhoto from '../assets/team/christian.jpg';
import edzelPhoto from '../assets/team/edzel.jpg';
import isaacPhoto from '../assets/team/isaac.jpg';
import luanPhoto from '../assets/team/luan.jpg';

// Production hardware: estimated single-unit parts prices in USD, from the Blueprint "Flood Warning System" parts list.
// Parts shared by both units (cable glands, M3 screws) are split evenly. Each part: [short name, spec, cost].
const UNITS = [
  {
    name: 'Sensor unit',
    note: 'Mounted on a bridge or post above the channel',
    icon: Radar,
    colour: 'var(--accent)',
    parts: [
      ['Microcontroller', 'ESP32-WROOM-32D DevKitC', 8.5],
      ['Radar level sensor', '24 GHz, RS485, with MAX485 converter', 87.5],
      ['4G modem', 'SIM7672G LTE', 32],
      ['LoRa radio', 'RFM95W 915 MHz with antenna', 14],
      ['Solar power', '20 W panel, 10 A MPPT controller, 12 Ah LiFePO4 battery', 99],
      ['Power monitoring', 'INA219 battery monitor, 5 V buck converter', 8],
      ['Enclosure and mounts', 'IP65 box, pole and solar mounts, cable glands, screws, 3D-printed tray and radar bracket', 79.8],
    ],
  },
  {
    name: 'Announcer unit',
    note: 'LED display and siren, placed where people can see and hear it',
    icon: Megaphone,
    colour: 'var(--brand-azure)',
    parts: [
      ['Microcontroller', 'ESP32-WROOM-32D DevKitC', 8.5],
      ['LED display', 'Six P10 outdoor panels (3 × 2, 960 × 320 mm), HUB12 level shifter', 87],
      ['Siren', '12 V, 110 dB, IP65, with relay', 21],
      ['LoRa radio', 'RFM95W 915 MHz with antenna', 14],
      ['Solar power', '100 W panel, 20 A MPPT controller, 50 Ah LiFePO4 battery', 252],
      ['Power', '40 A 5 V buck converter, 40 A display relay, INA219 battery monitor', 40.5],
      ['Frame and enclosure', '2020 aluminium frame, IP65 box, pole and solar mounts, cable glands, screws, 3D-printed tray', 197.4],
    ],
  },
];

const TEAM = [
  ['Edzel', 'Team lead, quality checker', edzelPhoto],
  ['Isaac', 'Full-stack developer', isaacPhoto],
  ['Luan', 'Hardware', luanPhoto],
  ['Aifa', 'Product, pitcher', aifaPhoto],
  ['Christian', 'Paper, pitcher', christianPhoto],
];

// Shown in pesos: converted at PHP_PER_USD, rounded to the nearest ₱10 per part; subtotals add the rounded parts.
const PHP_PER_USD = 63.85; // BSP weighted average, 23 Nov 2026
const toPhp = (usd) => Math.round((usd * PHP_PER_USD) / 10) * 10;
const peso = (n) => `~₱${n.toLocaleString('en-PH')}`;
const subtotal = (unit) => unit.parts.reduce((sum, [, , usd]) => sum + toPhp(usd), 0);
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

          <section className="about-cost fw-rise fw-d3" aria-labelledby="about-cost-title">
            <h2 className="fw-over" id="about-cost-title">Cost per system</h2>
            <div>
              <p className="fw-num">{peso(TOTAL)}</p>
              <p className="fw-caption">One sensor unit and one announcer unit, at single-unit prices</p>
            </div>
            <div className="about-cost__bar" aria-hidden="true">
              {UNITS.map((unit) => (
                <span key={unit.name} style={{ flexGrow: subtotal(unit), background: unit.colour }} />
              ))}
            </div>
            <ul className="about-cost__legend">
              {UNITS.map((unit) => (
                <li key={unit.name}>
                  <span className="about-cost__dot" style={{ background: unit.colour }} aria-hidden="true" />
                  <span>{unit.name}</span>
                  <span>{peso(subtotal(unit))}</span>
                </li>
              ))}
            </ul>
            <hr />
            <p className="fw-caption">
              Bought in batches of 50 to 100, a sensor unit drops to about ₱13,000–16,000 and an announcer to about
              ₱22,000–29,000. Converted from US dollar prices at ₱63.85 per $1 (BSP, 23 Nov 2026).
            </p>
          </section>
        </aside>
      </div>

      <div className="about-lower">
        <section className="fw-rise" aria-labelledby="about-hw-title">
          <div className="about-lower__intro">
            <h2 className="section-title" id="about-hw-title">Hardware and costs</h2>
            <p>
              Two separate solar-powered units. The sensor unit sends alerts over 4G and LoRa, so the announcer still
              warns people nearby when there is no cell signal.
            </p>
          </div>
          <div className="about-units">
            {UNITS.map((unit) => {
              const Icon = unit.icon;
              return (
                <section key={unit.name} className="about-unit" aria-label={unit.name}>
                  <header className="about-unit__head">
                    <span className="about-unit__icon" aria-hidden="true">
                      <Icon size={20} />
                    </span>
                    <div className="about-unit__title">
                      <h3 className="fw-h3">{unit.name}</h3>
                      <p className="fw-caption">{unit.note}</p>
                    </div>
                    <p className="about-unit__subtotal">
                      <span className="fw-h3">{peso(subtotal(unit))}</span>
                      <span className="fw-caption">subtotal</span>
                    </p>
                  </header>
                  <ul className="about-parts">
                    {unit.parts.map(([part, spec, cost]) => (
                      <li key={part}>
                        <div>
                          <span className="fw-strong">{part}</span>
                          <span className="fw-body-s">{spec}</span>
                        </div>
                        <span className="about-parts__price">{peso(toPhp(cost))}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </section>

        <section className="fw-rise" aria-labelledby="about-team-title">
          <div className="about-lower__intro">
            <h2 className="section-title" id="about-team-title">The team</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Built by team Limang Piso for CS Bootcamp 2026 — Build the way forward.
            </p>
          </div>
          <ul className="about-members">
            {TEAM.map(([name, role, photo]) => (
              <li key={name} className="about-member">
                <img className="about-member__avatar" src={photo} alt="" width="48" height="48" loading="lazy" decoding="async" />
                <span>
                  <span className="fw-strong">{name}</span>
                  <span className="fw-body-s">{role}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
