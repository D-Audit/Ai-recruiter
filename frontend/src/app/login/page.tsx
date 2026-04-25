"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, loginWithGoogle, clearError } from "../../store/slices/authSlice";
import { AppDispatch, RootState } from "../../store";
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2, Users, BarChart3, Shield } from "lucide-react";

// ── Google type declarations ──────────────────────────────────────────────────
type GoogleCredentialResponse = { credential?: string };
type GoogleAccountsId = {
  initialize: (config: { client_id: string; callback: (r: GoogleCredentialResponse) => void; ux_mode: "popup" }) => void;
  renderButton: (el: HTMLElement, opts: object) => void;
  prompt: () => void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
    handleGoogleCredential?: (response: GoogleCredentialResponse) => void;
  }
}

function GoogleSignInButton({
  onCredential, loading, text = "signin_with",
}: {
  onCredential: (c: string) => void;
  loading: boolean;
  text?: "signin_with" | "signup_with";
}) {
  const clientId          = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const googleCallbackRef = useRef<(r: GoogleCredentialResponse) => void>(() => {});
  const initializedRef    = useRef(false);

  const initSdk = useCallback(() => {
    if (!window.google || !clientId) return;
    if (initializedRef.current) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback:  googleCallbackRef.current,
      ux_mode:   "popup",
    });
    initializedRef.current = true;
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    googleCallbackRef.current = (r: GoogleCredentialResponse) => {
      if (r?.credential) onCredential(r.credential);
    };
    window.handleGoogleCredential = googleCallbackRef.current;

    const existing = document.getElementById("google-gsi-script");
    if (existing) { initSdk(); return; }

    const s    = document.createElement("script");
    s.id       = "google-gsi-script";
    s.src      = "https://accounts.google.com/gsi/client";
    s.async    = true;
    s.defer    = true;
    s.onload   = initSdk;
    document.head.appendChild(s);
    return () => { window.handleGoogleCredential = undefined; };
  }, [clientId, initSdk, onCredential]);

  const handleClick = () => {
    if (!window.google || !clientId || loading) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback:  googleCallbackRef.current,
      ux_mode:   "popup",
    });
    window.google.accounts.id.prompt();
  };

  const btnLabel = text === "signup_with" ? "Sign up with Google" : "Sign in with Google";
  const disabled = loading || !clientId;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      style={{
        width: "100%", height: 48,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        borderRadius: 10, border: "1.5px solid #e2e8f0",
        background: "#ffffff", color: "#374151",
        fontSize: 14, fontWeight: 600, fontFamily: "inherit",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
        transition: "border-color 0.15s, background 0.15s",
        letterSpacing: "0.01em",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#ffffff"; }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
        <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
        <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
        <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
        <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
      </svg>
      {!clientId ? "Google sign-in not configured" : btnLabel}
    </button>
  );
}

const LEFT_FEATURES = [
  {
    icon: BarChart3,
    title: "AI-Ranked Shortlists",
    desc: "Every candidate scored and ranked against your job requirements automatically.",
  },
  {
    icon: Users,
    title: "100+ Candidates in Minutes",
    desc: "Upload CSV or PDF resumes in bulk. Gemini AI parses and profiles each one.",
  },
  {
    icon: Shield,
    title: "Bias-Aware Screening",
    desc: "Skills-first scoring with automatic alerts when rankings skew unfairly.",
  },
];

const LEFT_STATS = [
  { value: "10K+", label: "Candidates Screened" },
  { value: "98%",  label: "Parse Accuracy"      },
  { value: "3.2×", label: "Faster Hiring"        },
];

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router   = useRouter();
  const { loading, error, user } = useSelector((s: RootState) => s.auth);

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [localErr, setLocalErr] = useState("");

  useEffect(() => { if (user) router.replace("/dashboard"); }, [user, router]);
  useEffect(() => () => { dispatch(clearError()); }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr(""); dispatch(clearError());
    if (!email.trim()) { setLocalErr("Email is required"); return; }
    if (!password)     { setLocalErr("Password is required"); return; }
    try {
      await dispatch(loginUser({ email: email.trim(), password })).unwrap();
      router.push("/dashboard");
    } catch { /* Redux state holds error */ }
  };

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setLocalErr(""); dispatch(clearError());
    try {
      await dispatch(loginWithGoogle({ credential })).unwrap();
      router.push("/dashboard");
    } catch { /* Redux state holds error */ }
  }, [dispatch, router]);

  const displayError = localErr || error;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ln-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Inter', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        /* ══════════════════════════════════════════════════
           LEFT PANEL — real dark navy, NO glows, NO orbits
           ══════════════════════════════════════════════════ */
        .ln-left {
          flex: 0 0 52%;
          background: #0a1628;
          display: flex;
          flex-direction: column;
          padding: 0;
          position: relative;
          overflow: hidden;
        }

        /* Subtle dot-grid texture — very faint, not glowing */
        .ln-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        /* Single very soft blue tint — bottom right only */
        .ln-left::after {
          content: '';
          position: absolute;
          bottom: -120px;
          right: -120px;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(37,99,235,0.09) 0%, transparent 65%);
          pointer-events: none;
        }

        .ln-left-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 52px 56px;
        }

        /* ── Logo area ── */
        .ln-logo {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 72px;
        }
        .ln-logo-mark {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ln-logo-name {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .ln-logo-sub {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          font-weight: 500;
          letter-spacing: 0.04em;
          margin-top: 3px;
          text-transform: uppercase;
        }

        /* ── Hero copy ── */
        .ln-hero-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #60a5fa;
          margin-bottom: 18px;
        }
        .ln-hero-h {
          font-size: clamp(2rem, 2.8vw, 2.6rem);
          font-weight: 800;
          color: #ffffff;
          line-height: 1.1;
          letter-spacing: -0.04em;
          margin-bottom: 18px;
        }
        .ln-hero-sub {
          font-size: 15.5px;
          color: rgba(255,255,255,0.52);
          line-height: 1.65;
          font-weight: 400;
          max-width: 380px;
          margin-bottom: 52px;
        }

        /* ── Features ── */
        .ln-features {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-bottom: 56px;
        }
        .ln-feature {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 18px 0;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .ln-feature:last-child {
          border-bottom: none;
        }
        .ln-feature-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(37,99,235,0.15);
          border: 1px solid rgba(37,99,235,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .ln-feature-title {
          font-size: 14.5px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 4px;
          letter-spacing: -0.02em;
        }
        .ln-feature-desc {
          font-size: 13px;
          color: rgba(255,255,255,0.45);
          line-height: 1.55;
          font-weight: 400;
        }

        /* ── Stats row ── */
        .ln-stats {
          display: flex;
          gap: 0;
          border-top: 1px solid rgba(255,255,255,0.08);
          padding-top: 28px;
          margin-top: auto;
        }
        .ln-stat {
          flex: 1;
          padding-right: 24px;
          border-right: 1px solid rgba(255,255,255,0.08);
          margin-right: 24px;
        }
        .ln-stat:last-child {
          border-right: none;
          margin-right: 0;
          padding-right: 0;
        }
        .ln-stat-val {
          font-size: 22px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.04em;
          line-height: 1;
          margin-bottom: 5px;
        }
        .ln-stat-label {
          font-size: 11.5px;
          color: rgba(255,255,255,0.38);
          font-weight: 500;
          line-height: 1.3;
        }

        /* ══════════════════════════════════════════════════
           RIGHT PANEL — pure white form
           ══════════════════════════════════════════════════ */
        .ln-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          padding: 48px 40px;
          overflow-y: auto;
        }
        .ln-form-wrap {
          width: 100%;
          max-width: 390px;
          animation: ln-up 0.25s ease;
        }
        @keyframes ln-up {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }

        .ln-form-title {
          font-size: clamp(1.7rem,3vw,2.1rem);
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.04em;
          line-height: 1.1;
          margin-bottom: 6px;
        }
        .ln-form-sub {
          font-size: 14.5px;
          color: #64748b;
          margin-bottom: 28px;
          font-weight: 400;
          line-height: 1.5;
        }

        /* Error */
        .ln-err {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          padding: 11px 14px;
          border-radius: 9px;
          margin-bottom: 18px;
          background: #fef2f2;
          border: 1.5px solid #fecaca;
          animation: ln-shake 0.25s ease;
        }
        @keyframes ln-shake {
          0%,100% { transform:translateX(0); }
          25%      { transform:translateX(-4px); }
          75%      { transform:translateX(4px); }
        }
        .ln-err-text {
          font-size: 13px;
          color: #dc2626;
          line-height: 1.5;
          font-weight: 500;
        }

        /* Divider */
        .ln-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 18px 0;
        }
        .ln-divider-line { flex:1; height:1px; background:#e2e8f0; }
        .ln-divider-text {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 600;
          white-space: nowrap;
        }

        /* Field */
        .ln-field { margin-bottom: 14px; }
        .ln-label {
          display: block;
          font-size: 12.5px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
          letter-spacing: 0.01em;
        }
        .ln-inp-w { position: relative; }
        .ln-ico {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
          display: flex;
        }
        .ln-inp {
          width: 100%;
          height: 46px;
          padding: 0 14px 0 42px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          background: #ffffff;
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .ln-inp:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .ln-inp::placeholder { color: #9ca3af; }
        .ln-eye {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          padding: 2px;
          display: flex;
          transition: color 0.15s;
        }
        .ln-eye:hover { color: #374151; }

        /* Forgot */
        .ln-forgot-row {
          display: flex;
          justify-content: flex-end;
          margin-top: -4px;
          margin-bottom: 14px;
        }
        .ln-forgot {
          font-size: 13px;
          color: #2563eb;
          font-weight: 600;
          text-decoration: none;
        }
        .ln-forgot:hover { text-decoration: underline; }

        /* Submit */
        .ln-btn {
          width: 100%;
          height: 48px;
          border-radius: 10px;
          border: none;
          background: #1e3a5f;
          color: white;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          margin-top: 6px;
          transition: background 0.15s, transform 0.15s;
          letter-spacing: 0.01em;
        }
        .ln-btn:hover:not(:disabled) {
          background: #162d4a;
          transform: translateY(-1px);
        }
        .ln-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        /* Spinner */
        .ln-spin {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: white;
          border-radius: 50%;
          animation: ln-spin-a 0.7s linear infinite;
        }
        @keyframes ln-spin-a { to { transform: rotate(360deg); } }

        /* Footer */
        .ln-footer {
          text-align: center;
          font-size: 13.5px;
          color: #64748b;
          margin-top: 22px;
        }
        .ln-footer a {
          color: #2563eb;
          font-weight: 700;
          text-decoration: none;
        }
        .ln-footer a:hover { text-decoration: underline; }

        @media (max-width: 960px) {
          .ln-left { display: none; }
          .ln-right { background: #f8fafc; padding: 32px 20px; }
        }
      `}</style>

      <div className="ln-root">

        {/* ═══════════════════════════════════════
            LEFT — dark navy, professional, clean
            ═══════════════════════════════════════ */}
        <div className="ln-left">
          <div className="ln-left-inner">

            {/* Logo */}
            <div className="ln-logo">
              <div className="ln-logo-mark">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M11 2L19 7.5V14.5L11 20L3 14.5V7.5L11 2Z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
                  <path d="M11 6L16 9.5V13.5L11 17L6 13.5V9.5L11 6Z" fill="white" fillOpacity="0.5" stroke="white" strokeWidth="0.8" strokeLinejoin="round"/>
                  <circle cx="11" cy="11" r="2.5" fill="white"/>
                </svg>
              </div>
              <div>
                <p className="ln-logo-name">Umurava AI</p>
                <p className="ln-logo-sub">Talent Screening</p>
              </div>
            </div>

            {/* Hero copy */}
            <p className="ln-hero-eyebrow">AI-Powered Recruitment</p>
            <h1 className="ln-hero-h">
              Hire Rwanda&apos;s best<br />talent, faster.
            </h1>
            <p className="ln-hero-sub">
              Screen hundreds of candidates in minutes. Gemini AI ranks, scores, and shortlists — so your team decides, not drowns.
            </p>

            {/* Features */}
            <div className="ln-features">
              {LEFT_FEATURES.map((f) => (
                <div key={f.title} className="ln-feature">
                  <div className="ln-feature-icon">
                    <f.icon size={17} color="#60a5fa" />
                  </div>
                  <div>
                    <p className="ln-feature-title">{f.title}</p>
                    <p className="ln-feature-desc">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="ln-stats">
              {LEFT_STATS.map((s) => (
                <div key={s.label} className="ln-stat">
                  <p className="ln-stat-val">{s.value}</p>
                  <p className="ln-stat-label">{s.label}</p>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ═══════════════════════════════════════
            RIGHT — pure white form
            ═══════════════════════════════════════ */}
        <div className="ln-right">
          <div className="ln-form-wrap">

            <h2 className="ln-form-title">Welcome back</h2>
            <p className="ln-form-sub">Sign in to your Umurava AI workspace</p>

            {displayError && (
              <div className="ln-err">
                <AlertCircle size={15} color="#dc2626" style={{ flexShrink:0, marginTop:1 }}/>
                <p className="ln-err-text">{displayError}</p>
              </div>
            )}

            <GoogleSignInButton
              onCredential={handleGoogleCredential}
              loading={loading}
              text="signin_with"
            />

            <div className="ln-divider">
              <div className="ln-divider-line"/>
              <span className="ln-divider-text">or continue with email</span>
              <div className="ln-divider-line"/>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="ln-field">
                <label className="ln-label">Email address</label>
                <div className="ln-inp-w">
                  <span className="ln-ico"><Mail size={15}/></span>
                  <input
                    className="ln-inp"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="ln-field">
                <label className="ln-label">Password</label>
                <div className="ln-inp-w">
                  <span className="ln-ico"><Lock size={15}/></span>
                  <input
                    className="ln-inp"
                    type={showPass ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={loading}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    className="ln-eye"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>

              <div className="ln-forgot-row">
                <a href="#" className="ln-forgot">Forgot password?</a>
              </div>

              <button type="submit" className="ln-btn" disabled={loading}>
                {loading
                  ? <><div className="ln-spin"/> Signing in…</>
                  : <>Sign in <ArrowRight size={15}/></>
                }
              </button>
            </form>

            <p className="ln-footer">
              Don&apos;t have an account?{" "}
              <Link href="/register">Create one free</Link>
            </p>

            {/* Trust badge */}
            <div style={{ marginTop: 32, padding: "12px 16px", borderRadius: 10, background: "#f8fafc", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={13} color="#16a34a" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                Trusted by leading Rwandan companies · Powered by Gemini AI
              </p>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}