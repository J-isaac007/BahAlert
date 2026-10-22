import { NavLink } from 'react-router';

const LINKS = [
  { to: '/', label: 'Map', end: true },
  { to: '/safe-zones', label: 'Safe Zones' },
  { to: '/hotlines', label: 'Hotlines' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/about', label: 'About' },
  { to: '/admin', label: 'Admin' },
];

export default function Navbar() {
  return (
    <header className="navbar">
      <NavLink to="/" className="brand">
        <img src="/icon.svg" alt="" width="28" height="28" />
        FloodWatch
      </NavLink>
      <nav>
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
