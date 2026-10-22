import { Link } from 'react-router';

export default function NotFound() {
  return (
    <main className="page">
      <h1>Page not found</h1>
      <Link to="/">Back to map</Link>
    </main>
  );
}
