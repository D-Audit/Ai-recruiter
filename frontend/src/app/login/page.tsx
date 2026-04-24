"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, loginWithGoogle, clearError } from "../../store/slices/authSlice";
import { AppDispatch, RootState } from "../../store";
import { Eye, EyeOff, Mail, Lock, AlertCircle, Sparkles } from "lucide-react";

// ── Shared Diamond Logo (identical to Sidebar) ──────────────────────────────
function DiamondLogo({ size = 40 }: { size?: number }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 22 22" fill="none">
      <path d="M11 1L21 8.5L17 21H5L1 8.5L11 1Z" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M11 5L18 9.5L15 19H7L4 9.5L11 5Z" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M11 9L14.5 11.5L13 17H9L7.5 11.5L11 9Z" fill="white" />
    </svg>
  );
}

// ── Animated Logo (same as sidebar but larger) ────────────────────────────
function AnimatedBrandLogo() {
  return (
    <>
      <style>{`
        @keyframes logo-glow {
          0%,100% { box-shadow: 0 4px 20px rgba(37,99,235,0.5), 0 0 0 0 rgba(99,102,241,0.5); }
          50%     { box-shadow: 0 6px 30px rgba(124,58,237,0.8), 0 0 0 10px rgba(99,102,241,0); }
        }
        @keyframes logo-orbit-cw  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes logo-orbit-ccw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes logo-float {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(-4px); }
        }

        .brand-logo-wrap {
          display: flex; flex-direction: column; align-items: center; gap: 16px;
          animation: logo-float 4s ease-in-out infinite;
        }
        .brand-logo-orbit-wrap {
          position: relative; width: 100px; height: 100px;
          display: flex; align-items: center; justify-content: center;
        }
        .brand-logo-icon {
          width: 68px; height: 68px; border-radius: 20px; flex-shrink: 0;
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 60%, #7c3aed 100%);
          display: flex; align-items: center; justify-content: center;
          position: relative; z-index: 2;
        }
        .brand-logo-ring {
          position: absolute; inset: 0; border-radius: 50%;
          border: 1.5px dashed rgba(147,197,253,0.4);
          animation: logo-orbit-cw 8s linear infinite;
        }
        .brand-logo-ring-2 {
          position: absolute; inset: 8px; border-radius: 50%;
          border: 1px dashed rgba(167,139,250,0.3);
          animation: logo-orbit-ccw 6s linear infinite;
        }
        /* Orbiting dots */
        .brand-logo-dot {
          position: absolute; width: 8px; height: 8px; border-radius: 50%;
          top: 50%; left: 50%; margin-top: -4px; margin-left: -4px;
        }
        .brand-logo-dot-1 {
          background: rgba(147,197,253,0.9);
          box-shadow: 0 0 6px rgba(147,197,253,0.8);
          transform-origin: 50px 4px;
          animation: logo-orbit-cw 8s linear infinite;
          transform: translateX(46px);
        }
        .brand-logo-dot-2 {
          background: rgba(167,139,250,0.9);
          box-shadow: 0 0 6px rgba(167,139,250,0.8);
          transform-origin: 37px 4px;
          animation: logo-orbit-ccw 6s linear infinite;
          transform: translateX(33px);
        }
        .brand-name {
          font-family: var(--font-display, 'Sora', sans-serif);
          font-size: 28px; font-weight: 700; color: #ffffff;
          letter-spacing: -0.5px; line-height: 1;
        }
        .brand-tag {
          font-family: var(--font-body, 'Manrope', sans-serif);
          font-size: 11px; font-weight: 600; letter-spacing: 2px;
          text-transform: uppercase; color: rgba(255,255,255,0.42);
          margin-top: 4px; text-align: center;
        }
      `}</style>
      <div className="brand-logo-wrap">
        <div className="brand-logo-orbit-wrap">
          <div className="brand-logo-ring" />
          <div className="brand-logo-ring-2" />
          <div className="brand-logo-dot brand-logo-dot-1" />
          <div className="brand-logo-dot brand-logo-dot-2" />
          <div className="brand-logo-icon">
            <DiamondLogo size={36} />
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <p className="brand-name">ScreenAI</p>
          <p className="brand-tag">Talent Screening Platform</p>
        </div>
      </div>
    </>
  );
}

// ── Google Sign-In Button ─────────────────────────────────────────────────
declare global {
  interface Window {
    google?: any;
    handleGoogleCredential?: (response: any) => void;
  }
}

function GoogleSignInButton({ onCredential, loading }: {
  onCredential: (credential: string) => void;
  loading: boolean;
}) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const hiddenButtonRef = useRef<HTMLDivElement | null>(null);
  const googleCallbackRef = useRef<(response: any) => void>(() => {});

  useEffect(() => {
    if (!clientId) return;

    googleCallbackRef.current = (response: any) => {
      if (response?.credential) {
        onCredential(response.credential);
      }
    };
    window.handleGoogleCredential = googleCallbackRef.current;

    // Load Google Identity Services script
    const existingScript = document.getElementById("google-gsi-script");
    if (existingScript) {
      initGoogle();
      return;
    }

    const script = document.createElement("script");
    script.id  = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);

    return () => {
      window.handleGoogleCredential = undefined;
    };
  }, [clientId, onCredential]);

  function initGoogle() {
    if (!window.google || !clientId) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback:  googleCallbackRef.current,
      ux_mode:   "popup",
    });
    window.google.accounts.id.renderButton(
      hiddenButtonRef.current,
      {
        theme:     "outline",
        size:      "large",
        width:     "100%",
        text:      "signin_with",
        logo_alignment: "left",
      }
    );
  }

  function triggerGoogleButton() {
    if (loading) return;
    const host = hiddenButtonRef.current;
    const clickable = host?.querySelector('[role="button"]') as HTMLElement | null;
    if (clickable) {
      clickable.click();
      return;
    }
    window.google?.accounts?.id?.prompt?.();
  }

  if (!clientId) {
    // Show a placeholder if GOOGLE_CLIENT_ID is not set
    return (
      <button
        type="button"
        disabled
        style={{
          width: "100%", padding: "12px 16px", borderRadius: 12,
          border: "1.5px solid #e2e8f0", background: "#f8fafc",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          fontSize: 14, fontWeight: 600, color: "#94a3b8", cursor: "not-allowed",
          fontFamily: "inherit",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
          <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
          <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
          <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
        </svg>
        Google sign-in not configured
      </button>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        minHeight: 58,
        opacity: loading ? 0.6 : 1,
        pointerEvents: loading ? "none" : "auto"
      }}
    >
      <div
        role="button"
        tabIndex={loading ? -1 : 0}
        onClick={triggerGoogleButton}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            triggerGoogleButton();
          }
        }}
        style={{
          width: "100%",
          minHeight: 56,
          borderRadius: 999,
          background: "#ffffff",
          border: "1.5px solid #8b9098",
          boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          cursor: loading ? "not-allowed" : "pointer"
        }}
      >
        <div
          aria-hidden="true"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              color: "#2d3138",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              pointerEvents: "none"
            }}
          >
            <svg width="26" height="26" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
          </svg>
          <span>Sign in with Google</span>
        </div>
      </div>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "0",
          width: "320px",
          height: "60px",
          overflow: "hidden",
        }}
      >
        <div id="google-btn-container" ref={hiddenButtonRef} />
      </div>
    </div>
  );
}

// ── Main Login Page ───────────────────────────────────────────────────────
export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router   = useRouter();
  const { loading, error, user } = useSelector((s: RootState) => s.auth);

  const [email,     setEmail]    = useState("");
  const [password,  setPassword] = useState("");
  const [showPass,  setShowPass] = useState(false);
  const [localErr,  setLocalErr] = useState("");

  // If already logged in, redirect
  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  // Clear store error on unmount
  useEffect(() => {
    return () => { dispatch(clearError()); };
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr("");
    dispatch(clearError());

    if (!email.trim()) { setLocalErr("Email is required"); return; }
    if (!password)     { setLocalErr("Password is required"); return; }

    try {
      await dispatch(loginUser({ email: email.trim(), password })).unwrap();
      router.push("/dashboard");
    } catch {
      // error is already in Redux state
    }
  };

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setLocalErr("");
    dispatch(clearError());
    try {
      await dispatch(loginWithGoogle({ credential })).unwrap();
      router.push("/dashboard");
    } catch {
      // error in Redux state
    }
  }, [dispatch, router]);

  const displayError = localErr || error;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* ── Left panel — deep navy hero ── */
        .login-hero {
          flex: 1 1 50%;
          background: linear-gradient(160deg, #0f1c3a 0%, #0b1528 40%, #0d1f4a 100%);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 60px 48px;
          position: relative; overflow: hidden;
        }
        .login-hero::before {
          content: '';
          position: absolute; top: -120px; left: -120px;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .login-hero::after {
          content: '';
          position: absolute; bottom: -80px; right: -80px;
          width: 300px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-content { position: relative; z-index: 1; width: 100%; }
        .hero-tagline {
          font-family: var(--font-body, 'Manrope', sans-serif);
          font-size: 18px; line-height: 1.45;
          font-weight: 500;
          color: rgba(255,255,255,0.9);
          margin-top: 28px; text-align: left;
        }
        .hero-features {
          margin-top: 34px; display: flex; flex-direction: column; gap: 18px; width: 100%;
        }
        .hero-feature {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 0;
          border-radius: 0;
          background: transparent;
          border: none;
        }
        .hero-feature-icon {
          width: 28px; height: 28px; border-radius: 0; flex-shrink: 0;
          background: transparent;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          margin-top: 2px;
        }
        .hero-feature-text { font-family: var(--font-body, 'Manrope', sans-serif); font-size: 14px; color: rgba(255,255,255,0.68); line-height: 1.45; }
        .hero-feature-title { font-family: var(--font-body, 'Manrope', sans-serif); font-weight: 600; color: white; font-size: 18px; letter-spacing: -0.02em; margin-bottom: 3px; }

        /* ── Right panel — form ── */
        .login-form-panel {
          flex: 1 1 50%; display: flex; align-items: center; justify-content: center;
          background: #f8fafc; padding: 40px 24px;
        }
        .login-form-card {
          width: 100%; max-width: 440px;
          background: white; border-radius: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 24px rgba(0,0,0,0.07);
          padding: 40px 36px;
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .form-title { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.4px; margin-bottom: 4px; }
        .form-sub   { font-size: 14px; color: #64748b; margin-bottom: 28px; }

        /* Error banner */
        .form-error {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 12px 14px; border-radius: 11px; margin-bottom: 20px;
          background: #fef2f2; border: 1px solid #fecaca;
          animation: slideDown 0.2s ease;
        }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .form-error-text { font-size: 13.5px; color: #dc2626; line-height: 1.5; font-weight: 500; }

        /* Divider */
        .form-divider {
          display: flex; align-items: center; gap: 12px; margin: 20px 0;
        }
        .form-divider-line { flex: 1; height: 1px; background: #e2e8f0; }
        .form-divider-text { font-size: 12px; color: #94a3b8; font-weight: 600; white-space: nowrap; }

        /* Field */
        .field-wrap { margin-bottom: 16px; }
        .field-label {
          display: block; font-size: 12px; font-weight: 700;
          color: #475569; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.06em;
        }
        .field-input-wrap { position: relative; }
        .field-icon {
          position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
          color: #94a3b8; pointer-events: none;
        }
        .field-input {
          width: 100%; padding: 12px 14px 12px 40px;
          border-radius: 11px; border: 1.5px solid #e2e8f0;
          font-size: 14px; color: #0f172a; outline: none;
          background: #f8fafc; font-family: inherit;
          transition: all 0.15s;
        }
        .field-input:focus { border-color: #2563eb; background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .field-input::placeholder { color: #cbd5e1; }
        .field-eye {
          position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #94a3b8;
          padding: 2px; display: flex; align-items: center;
          transition: color 0.15s;
        }
        .field-eye:hover { color: #475569; }

        /* Forgot link */
        .forgot-row { display: flex; justify-content: flex-end; margin-top: -8px; margin-bottom: 20px; }
        .forgot-link { font-size: 12.5px; color: #2563eb; font-weight: 600; text-decoration: none; }
        .forgot-link:hover { text-decoration: underline; }

        /* Submit button */
        .btn-submit {
          width: 100%; padding: 13px; border-radius: 12px; border: none;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white; font-size: 15px; font-weight: 700;
          cursor: pointer; font-family: inherit;
          box-shadow: 0 4px 14px rgba(37,99,235,0.35);
          transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-bottom: 20px;
        }
        .btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.45); }
        .btn-submit:disabled { opacity: 0.65; cursor: not-allowed; transform: none; box-shadow: none; }

        /* Spinner */
        .spin { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.35); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Footer link */
        .form-footer { text-align: center; font-size: 13.5px; color: #64748b; margin-top: 20px; }
        .form-footer a { color: #2563eb; font-weight: 700; text-decoration: none; }
        .form-footer a:hover { text-decoration: underline; }

        @media (max-width: 900px) {
          .login-hero { display: none; }
          .login-form-panel { padding: 24px 16px; background: white; }
          .login-form-card { box-shadow: none; border: none; padding: 32px 20px; }
        }
      `}</style>

      <div className="login-root">
        {/* ── Hero ── */}
        <div className="login-hero">
          <div className="hero-content">
            <AnimatedBrandLogo />
            <p className="hero-tagline">
              AI-powered talent screening that helps you hire the best candidates — faster and more fairly.
            </p>
            <div className="hero-features">
              {[
                { icon: "📋", title: "Structured Screening", text: "Review every candidate with a consistent and well-defined process." },
                { icon: "📊", title: "Ranked Shortlists", text: "See top candidates clearly organized with practical evaluation details." },
                { icon: "⚖️", title: "Fair Evaluation", text: "Support balanced hiring decisions with a more transparent review flow." },
              ].map((f) => (
                <div key={f.title} className="hero-feature">
                  <div className="hero-feature-icon">{f.icon}</div>
                  <div>
                    <p className="hero-feature-title">{f.title}</p>
                    <p className="hero-feature-text">{f.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Form Panel ── */}
        <div className="login-form-panel">
          <div className="login-form-card">
            <h1 className="form-title">Welcome back</h1>
            <p className="form-sub">Sign in to your ScreenAI account</p>

            {/* Error */}
            {displayError && (
              <div className="form-error">
                <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                <p className="form-error-text">{displayError}</p>
              </div>
            )}

            {/* Google Sign-In */}
            <GoogleSignInButton onCredential={handleGoogleCredential} loading={loading} />

            <div className="form-divider">
              <div className="form-divider-line" />
              <span className="form-divider-text">or sign in with email</span>
              <div className="form-divider-line" />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit}>
              <div className="field-wrap">
                <label className="field-label">Email address</label>
                <div className="field-input-wrap">
                  <Mail size={15} className="field-icon" />
                  <input
                    className="field-input"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="field-wrap">
                <label className="field-label">Password</label>
                <div className="field-input-wrap">
                  <Lock size={15} className="field-icon" />
                  <input
                    className="field-input"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="field-eye"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="forgot-row">
                <Link href="/forgot-password" className="forgot-link">Forgot password?</Link>
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  <><div className="spin" /> Signing in…</>
                ) : (
                  <><Sparkles size={15} /> Sign in</>
                )}
              </button>
            </form>

            <p className="form-footer">
              Don't have an account?{" "}
              <Link href="/register">Create one free</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
