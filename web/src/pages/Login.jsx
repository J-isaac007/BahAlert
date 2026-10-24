import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, LoaderCircle, TriangleAlert } from 'lucide-react';
import { LogoMark } from '../components/ui/Logo.jsx';
import { login, resetPassword } from '../hooks/useAuth.js';
import { auth } from '../lib/firebase.js';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [resetMsg, setResetMsg] = useState('');
  const emailRef = useRef(null);

  // Same message whether or not the account exists, so the form can't be used to find admin emails
  const forgot = async () => {
    if (!email.trim()) {
      setResetMsg('Enter your email above first.');
      emailRef.current?.focus();
      return;
    }
    setResetMsg('Sending…');
    try {
      await resetPassword(email.trim());
      setResetMsg('If that email has an admin account, a reset link is on its way.');
    } catch (err) {
      setResetMsg(
        err.code === 'auth/user-not-found'
          ? 'If that email has an admin account, a reset link is on its way.'
          : err.code === 'auth/invalid-email'
            ? 'Check the email address.'
            : 'Could not send the email. Check your connection and try again.',
      );
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!auth) {
    return (
      <div className="page">
        <p className="notice">Firebase is not configured — fill in web/.env</p>
      </div>
    );
  }

  return (
    <div className="login-wrap fw-waves">
      <div className="login-card fw-rise">
        <div className="fw-brand login-brand">
          <LogoMark size={40} />
          BahAlert
        </div>
        <div className="fw-col" style={{ gap: 8 }}>
          <h1 className="page-title">Admin login</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            For barangay DRRM officers who manage sensors, safe zones and hotlines. Residents do not need an account.
          </p>
        </div>
        <form onSubmit={submit}>
          <div className={`fw-field ${error ? 'fw-field--error' : ''}`}>
            <label htmlFor="email">Email</label>
            <input
              ref={emailRef}
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className={`fw-field ${error ? 'fw-field--error' : ''}`}>
            <label htmlFor="pw">Password</label>
            <div className="pw-wrap">
              <input
                id="pw"
                type={shown ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="fw-iconbtn"
                aria-label="Show password"
                aria-pressed={shown}
                onClick={() => setShown((s) => !s)}
              >
                {shown ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
              </button>
            </div>
            {error && (
              <span className="fw-field__help" role="alert">
                <TriangleAlert size={14} aria-hidden="true" />
                {error}
              </span>
            )}
          </div>
          <button type="submit" className="fw-btn fw-btn--primary fw-btn--lg fw-btn--block" disabled={busy}>
            {busy && <LoaderCircle size={20} className="fw-spin" aria-hidden="true" />}
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <div className="login-forgot">
          <button type="button" className="fw-btn fw-btn--ghost" onClick={forgot}>
            Forgot password?
          </button>
          <p className="fw-body-s" role="status">
            {resetMsg}
          </p>
        </div>
      </div>
    </div>
  );
}
