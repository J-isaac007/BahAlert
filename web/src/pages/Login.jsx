import { useState } from 'react';
import { useNavigate } from 'react-router';
import { login } from '../hooks/useAuth.js';
import { auth } from '../lib/firebase.js';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    }
  };

  if (!auth) return <p className="page notice">Firebase is not configured — fill in web/.env</p>;

  return (
    <main className="page narrow">
      <h1>Admin login</h1>
      <p className="muted">For barangay DRRM officers. Residents do not need an account.</p>
      <form className="card form" onSubmit={submit}>
        <label>Email <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-primary">Log in</button>
      </form>
    </main>
  );
}
