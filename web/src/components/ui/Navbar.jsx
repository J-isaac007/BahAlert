import { Bell, Lock, LogOut, Map, Menu, Phone, Radio, ShieldCheck, WifiOff } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { logout, useAuth } from '../../hooks/useAuth.js';
import { useSensors } from '../../hooks/useSensors.js';
import { LogoMark } from './Logo.jsx';

// match: which paths light up the item (Map stays lit on /sensor/:id, More on about/login/admin)
const LINKS = [
  { to: '/', label: 'Map', icon: Map, match: (p) => p === '/' || p.startsWith('/sensor') },
  { to: '/safe-zones', label: 'Safe zones', icon: ShieldCheck },
  { to: '/hotlines', label: 'Hotlines', icon: Phone },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/about', label: 'About', mobileLabel: 'More', icon: Menu, match: (p) => ['/about', '/login', '/admin'].includes(p) },
];

const isActive = (link, path) => (link.match ? link.match(path) : path.startsWith(link.to));
const current = (link, path) => (isActive(link, path) ? 'page' : undefined);

function LiveChip() {
  const { sensors, loading } = useSensors();
  if (loading) return null;
  const online = sensors.filter((s) => s.online).length;
  if (!online) {
    return (
      <span className="fw-chip fw-chip--offline">
        <WifiOff size={16} aria-hidden="true" />
        No live sensors
      </span>
    );
  }
  return (
    <span className="fw-chip fw-chip--normal">
      <Radio size={16} className="fw-live" aria-hidden="true" />
      Live · {online} sensor{online === 1 ? '' : 's'}
    </span>
  );
}

export function TopNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  return (
    <header className="fw-topnav app-topnav only-desktop">
      <Link to="/" className="fw-brand">
        <LogoMark size={28} className="fw-brand__mark" />
        BahAlert
      </Link>
      <nav className="fw-topnav__links" aria-label="Main">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="fw-toplink" aria-current={current(l, pathname)}>
            {l.label}
          </Link>
        ))}
      </nav>
      <LiveChip />
      {user ? (
        <>
          <span className="fw-caption topnav-email" style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            {user.email}
          </span>
          <button type="button" className="fw-topnav__admin" onClick={logout} style={{ border: 0, background: 'none', cursor: 'pointer' }}>
            <LogOut size={18} aria-hidden="true" />
            Log out
          </button>
        </>
      ) : (
        <Link to="/admin" className="fw-topnav__admin" aria-current={pathname === '/login' ? 'page' : undefined}>
          <Lock size={18} aria-hidden="true" />
          Admin
        </Link>
      )}
    </header>
  );
}

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fw-bottomnav app-bottomnav only-mobile" aria-label="Main">
      {LINKS.map((l) => (
        <Link key={l.to} to={l.to} className="fw-navitem" aria-current={current(l, pathname)}>
          <span className="fw-navitem__pill">
            <l.icon size={22} aria-hidden="true" />
          </span>
          <span className="fw-navitem__label">{l.mobileLabel ?? l.label}</span>
        </Link>
      ))}
    </nav>
  );
}
