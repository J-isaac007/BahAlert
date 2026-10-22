import { useEffect, useRef } from 'react';

const COPY = {
  danger: { title: 'You are in a flood danger zone', cls: 'banner-danger' },
  approaching: { title: 'Flood zone nearby', cls: 'banner-warning' },
  caution: { title: 'Water rising in this area', cls: 'banner-caution' },
};

// Shows when the user's position is in or near a flagged zone. Buzzes + notifies on entering danger.
export default function DangerBanner({ danger, onRoute }) {
  const prev = useRef('safe');
  const level = danger?.level ?? 'safe';

  useEffect(() => {
    if (level === 'danger' && prev.current !== 'danger') {
      navigator.vibrate?.([400, 200, 400, 200, 400]);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('FloodWatch: danger zone', { body: `Near ${danger.sensor.name}. Move to a safe zone now.` });
      }
      // TODO: alarm sound (needs a user gesture first on mobile)
    }
    prev.current = level;
  }, [level, danger]);

  if (level === 'safe') return null;
  const { title, cls } = COPY[level];

  return (
    <div className={`danger-banner ${cls}`} role="alert">
      <div>
        <strong>{title}</strong>
        <div>
          {danger.sensor.name} · {Math.round(danger.distanceM)} m away
        </div>
      </div>
      {level !== 'caution' && (
        <button type="button" className="btn btn-light" onClick={onRoute}>
          Route to safety
        </button>
      )}
    </div>
  );
}
