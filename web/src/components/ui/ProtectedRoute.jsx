import { Navigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth.js';

export default function ProtectedRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <p className="page">Checking login…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <p className="page">This account is not an admin. Ask the team lead to add your UID to /admins.</p>;
  return children;
}
