import { Link } from 'react-router';
import { Map } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="page notfound">
      <span className="fw-over">404</span>
      <h1 className="page-title">Page not found</h1>
      <p className="fw-body-s">The link may be old. The map has the live flood levels.</p>
      <Link to="/" className="fw-btn fw-btn--primary">
        <Map size={20} aria-hidden="true" />
        Back to map
      </Link>
    </div>
  );
}
