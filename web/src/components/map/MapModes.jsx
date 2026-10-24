import { useEffect } from 'react';
import { X } from 'lucide-react';
import LayerToggles from './LayerToggles.jsx';
import StyleSwitcher from './StyleSwitcher.jsx';

const KEY = [
  ['var(--status-normal)', 'Normal'],
  ['var(--status-warning)', 'Warning'],
  ['var(--status-danger)', 'Danger zone'],
  ['var(--status-offline)', 'Offline'],
  ['var(--safe)', 'Safe zone'],
];

// Bottom sheet on mobile, floating panel on desktop (see .modes-sheet)
export default function MapModes({ styleKey, onStyleChange, overlays, onOverlaysChange, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <button type="button" className="map-scrim only-mobile" aria-label="Close map modes" onClick={onClose} />
      <section className="fw-sheet map-sheet modes-sheet" role="dialog" aria-labelledby="modes-title">
        <div className="fw-sheet__grip" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 id="modes-title" className="fw-h2">
            Map modes
          </h2>
          <button type="button" className="fw-iconbtn" aria-label="Close map modes" onClick={onClose}>
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <StyleSwitcher value={styleKey} onChange={onStyleChange} />
        <LayerToggles value={overlays} onChange={onOverlaysChange} />
        <div className="modes-key">
          {KEY.map(([color, label]) => (
            <span key={label}>
              <i style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
