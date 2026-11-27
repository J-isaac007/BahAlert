import { useEffect, useRef } from 'react';
import { Navigation, OctagonAlert, TriangleAlert } from 'lucide-react';

const COPY = {
  danger: { title: 'You are in a flood danger zone', cls: 'fw-banner--danger fw-alarm fw-drop', Icon: OctagonAlert },
  approaching: { title: 'Flood zone nearby', cls: 'fw-banner--approaching fw-drop', Icon: TriangleAlert },
  caution: { title: 'Water rising in this area', cls: 'fw-banner--caution fw-drop', Icon: TriangleAlert },
};

const level = (s) => (s.online ? ` Water at ${Math.round(s.live.levelCm)} cm.` : '');

// Shows when the user's position is in or near a flagged zone. Buzzes + notifies on entering danger.
// routing = a route is already on screen, so the button gives way to "Follow the route".
export default function DangerBanner({ danger, onRoute, routing }) {
  const prev = useRef('safe');
  const state = danger?.level ?? 'safe';

  useEffect(() => {
    if (state === 'danger' && prev.current !== 'danger') {
      navigator.vibrate?.([400, 200, 400, 200, 400]);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('BahAlert: danger zone', { body: `Near ${danger.sensor.name}. Move to a safe zone now.` });
      }
      // TODO: alarm sound (needs a user gesture first on mobile)
    }
    prev.current = state;
  }, [state, danger]);

  if (state === 'safe') return null;
  const { title, cls, Icon } = COPY[state];

  return (
    <div className={`fw-banner ${cls}`} role="alert">
      <div className="fw-banner__msg">
        <Icon size={28} className="fw-icon" aria-hidden="true" />
        <div className="fw-banner__text">
          <h2 className="fw-h3">{title}</h2>
          <p>
            {danger.sensor.name} is {Math.round(danger.distanceM)} m away.{level(danger.sensor)}
            {routing ? ' Follow the route to safety.' : ''}
          </p>
        </div>
      </div>
      {state !== 'caution' && !routing && (
        <button type="button" className="fw-btn fw-btn--block" onClick={onRoute}>
          <Navigation size={20} aria-hidden="true" />
          Route to safety
        </button>
      )}
    </div>
  );
}
