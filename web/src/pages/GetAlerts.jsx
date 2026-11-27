import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { LoaderCircle, TriangleAlert } from 'lucide-react';
import { LogoMark } from '../components/ui/Logo.jsx';
import { useAlertService, useResident } from '../hooks/useResident.js';
import { auth } from '../lib/firebase.js';
import { maskPhone, normalizePhone } from '../lib/phone.js';
import { finishSignIn, requestCode, submitCode, watchRequest } from '../lib/residents.js';

const NO_ANSWER_MS = 20_000;

// What the alert service said, in words people can act on
const PROBLEMS = {
  bad_phone: 'Enter a Philippine mobile number, like 0917 123 4567.',
  too_soon: 'A code was just sent. Wait a minute before asking for another one.',
  daily_limit: 'Too many codes for this number today. Try again tomorrow.',
  busy: 'Many people are signing up right now. Try again in a few minutes.',
  sms_failed: "We couldn't send the text. Check the number and try again.",
  expired: 'That code has expired. Ask for a new one.',
  locked: 'Too many wrong tries. Ask for a new code.',
  error: 'Something went wrong. Try again.',
  no_answer: "The alert service didn't answer. Try again in a few minutes.",
};

export default function GetAlerts() {
  const navigate = useNavigate();
  const { rid, loading } = useResident();
  const service = useAlertService();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [uid, setUid] = useState(null);
  const [req, setReq] = useState(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(null);
  const [now, setNow] = useState(Date.now());
  const codeRef = useRef(null);
  const askedAt = useRef(0);

  const normalized = normalizePhone(phone);
  const step = req && ['sent', 'wrong_code'].includes(req.status) ? 'code' : 'phone';

  // Follow the request: the service writes status (and finally a sign-in token)
  useEffect(() => {
    if (!uid) return undefined;
    return watchRequest(uid, async (r) => {
      setReq(r);
      if (!r?.status) return;
      if (r.status === 'verified' && r.token) {
        setBusy(true);
        try {
          await finishSignIn(r.token);
          navigate('/account', { replace: true, state: { welcome: true } });
        } catch {
          setProblem('error');
          setBusy(false);
        }
        return;
      }
      setBusy(false);
      if (r.status === 'sent') setProblem(null);
      else if (r.status !== 'wrong_code') setProblem(r.status);
    });
  }, [uid, navigate]);

  // No status within 20 s: the service is probably down
  useEffect(() => {
    if (!busy) return undefined;
    const t = setTimeout(() => {
      setBusy(false);
      setProblem('no_answer');
    }, NO_ANSWER_MS);
    return () => clearTimeout(t);
  }, [busy, step, req?.status]);

  // Resend countdown
  useEffect(() => {
    if (step !== 'code') return undefined;
    codeRef.current?.focus();
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [step]);

  if (loading) return <p className="loading">Loading…</p>;
  if (rid) return <Navigate to="/account" replace />;
  if (!auth) {
    return (
      <div className="page">
        <p className="notice">Firebase is not configured — fill in web/.env</p>
      </div>
    );
  }

  const ask = async (e) => {
    e?.preventDefault();
    if (!normalized) return setProblem('bad_phone');
    setProblem(null);
    setBusy(true);
    setCode('');
    askedAt.current = Date.now();
    try {
      setUid(await requestCode(normalized));
    } catch (err) {
      setBusy(false);
      setProblem(err.message === 'bad_phone' ? 'bad_phone' : 'error');
    }
  };

  const confirm = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return;
    setBusy(true);
    try {
      await submitCode(uid, code);
    } catch {
      setBusy(false);
      setProblem('error');
    }
  };

  const resendIn = req?.retryAt ? Math.max(0, Math.ceil((req.retryAt - now) / 1000)) : 0;
  const wrong = req?.status === 'wrong_code';
  const help = (key) =>
    key && (
      <span className="fw-field__help" role="alert">
        <TriangleAlert size={14} aria-hidden="true" />
        {key === 'wrong_code' ? `That code is wrong. ${req?.attemptsLeft ?? 0} ${req?.attemptsLeft === 1 ? 'try' : 'tries'} left.` : PROBLEMS[key]}
      </span>
    );

  return (
    <div className="login-wrap fw-waves">
      <div className="login-card fw-rise">
        <div className="fw-brand login-brand">
          <LogoMark size={40} />
          BahAlert
        </div>

        {step === 'phone' ? (
          <>
            <div className="fw-col" style={{ gap: 8 }}>
              <h1 className="page-title">Get flood alerts</h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                We&apos;ll text you when the water rises at the sensors near you. It&apos;s free. Enter your mobile number
                and we&apos;ll send a 6-digit code to confirm it&apos;s yours.
              </p>
            </div>
            {!service.loading && !service.online && (
              <p className="notice" role="status">
                <TriangleAlert size={18} aria-hidden="true" style={{ flex: 'none', marginTop: 2 }} />
                Sign-up is paused right now because the alert service is offline. Please try again later.
              </p>
            )}
            <form onSubmit={ask}>
              <div className={`fw-field ${problem ? 'fw-field--error' : ''}`}>
                <label htmlFor="phone">Mobile number</label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="09XX XXX XXXX"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {help(problem)}
              </div>
              <button type="submit" className="fw-btn fw-btn--primary fw-btn--lg fw-btn--block" disabled={busy || !service.online}>
                {busy && <LoaderCircle size={20} className="fw-spin" aria-hidden="true" />}
                {busy ? 'Sending code…' : 'Text me a code'}
              </button>
            </form>
            <p className="fw-body-s">
              Already signed up? Use the same number to sign in. Your number is only used for BahAlert alerts and is never
              shown on the website.
            </p>
          </>
        ) : (
          <>
            <div className="fw-col" style={{ gap: 8 }}>
              <h1 className="page-title">Enter the code</h1>
              <p style={{ color: 'var(--text-secondary)' }}>We texted a 6-digit code to {maskPhone(req?.phone)}.</p>
            </div>
            <form onSubmit={confirm}>
              <div className={`fw-field ${wrong || problem ? 'fw-field--error' : ''}`}>
                <label htmlFor="code">6-digit code</label>
                <input
                  ref={codeRef}
                  id="code"
                  className="otp-input"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                {help(wrong ? 'wrong_code' : problem)}
              </div>
              <button type="submit" className="fw-btn fw-btn--primary fw-btn--lg fw-btn--block" disabled={busy || code.length !== 6}>
                {busy && <LoaderCircle size={20} className="fw-spin" aria-hidden="true" />}
                {busy ? 'Checking…' : 'Confirm'}
              </button>
            </form>
            <div className="fw-row" style={{ justifyContent: 'space-between' }}>
              <button type="button" className="fw-btn fw-btn--ghost" disabled={busy || resendIn > 0} onClick={ask}>
                {resendIn > 0 ? `Resend in ${resendIn} s` : 'Resend code'}
              </button>
              <button
                type="button"
                className="fw-btn fw-btn--ghost"
                onClick={() => {
                  setReq(null);
                  setUid(null);
                  setProblem(null);
                  setBusy(false);
                }}
              >
                Change number
              </button>
            </div>
          </>
        )}
        <Link to="/alerts" className="fw-body-s" style={{ textAlign: 'center' }}>
          Back to the alert log
        </Link>
      </div>
    </div>
  );
}
