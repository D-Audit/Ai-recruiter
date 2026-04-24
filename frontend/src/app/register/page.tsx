"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, loginWithGoogle, clearError } from "../../store/slices/authSlice";
import { AppDispatch, RootState } from "../../store";
import { Eye, EyeOff, Mail, Lock, User, Building2, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";

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

function AnimatedBrandLogo() {
  return (
    <>
      <style>{`
        @keyframes reg-logo-glow {
          0%,100% { box-shadow: 0 4px 20px rgba(37,99,235,0.5), 0 0 0 0 rgba(99,102,241,0.5); }
          50%     { box-shadow: 0 6px 30px rgba(124,58,237,0.8), 0 0 0 10px rgba(99,102,241,0); }
        }
        @keyframes reg-orbit-cw  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes reg-orbit-ccw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes reg-float {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(-4px); }
        }
        .reg-brand-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; animation: reg-float 4s ease-in-out infinite; }
        .reg-orbit-wrap { position: relative; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; }
        .reg-logo-icon {
          width: 68px; height: 68px; border-radius: 20px;
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 60%, #7c3aed 100%);
          display: flex; align-items: center; justify-content: center;
          position: relative; z-index: 2;
        }
        .reg-ring   { position: absolute; inset: 0; border-radius: 50%; border: 1.5px dashed rgba(147,197,253,0.4); animation: reg-orbit-cw 8s linear infinite; }
        .reg-ring-2 { position: absolute; inset: 8px; border-radius: 50%; border: 1px dashed rgba(167,139,250,0.3); animation: reg-orbit-ccw 6s linear infinite; }
        .reg-dot {
          position: absolute; width: 8px; height: 8px; border-radius: 50%;
          top: 50%; left: 50%; margin-top: -4px; margin-left: -4px;
        }
        .reg-dot-1 { background: rgba(147,197,253,0.9); box-shadow: 0 0 6px rgba(147,197,253,0.8); transform: translateX(46px); animation: reg-orbit-cw 8s linear infinite; transform-origin: 50px 4px; }
        .reg-dot-2 { background: rgba(167,139,250,0.9); box-shadow: 0 0 6px rgba(167,139,250,0.8); transform: translateX(33px); animation: reg-orbit-ccw 6s linear infinite; transform-origin: 37px 4px; }
        .reg-brand-name { font-family: var(--font-display, 'Sora', sans-serif); font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; line-height: 1; }
        .reg-brand-tag  { font-family: var(--font-body, 'Manrope', sans-serif); font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.42); margin-top: 4px; text-align: center; }
      `}</style>
      <div className="reg-brand-wrap">
        <div className="reg-orbit-wrap">
          <div className="reg-ring" />
          <div className="reg-ring-2" />
          <div className="reg-dot reg-dot-1" />
          <div className="reg-dot reg-dot-2" />
          <div className="reg-logo-icon"><DiamondLogo size={36} /></div>
        </div>
        <div style={{ textAlign: "center" }}>
          <p className="reg-brand-name">ScreenAI</p>
          <p className="reg-brand-tag">Talent Screening Platform</p>
        </div>
      </div>
    </>
  );
}

declare global { interface Window { google?: any; handleGoogleCredentialReg?: (r: any) => void; } }

function GoogleSignInButton({ onCredential, loading }: { onCredential: (c: string) => void; loading: boolean }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const hiddenButtonRef = useRef<HTMLDivElement | null>(null);
  const googleCallbackRef = useRef<(response: any) => void>(() => {});

  useEffect(() => {
    if (!clientId) return;
    googleCallbackRef.current = (response: any) => { if (response?.credential) onCredential(response.credential); };
    window.handleGoogleCredentialReg = googleCallbackRef.current;
    const existing = document.getElementById("google-gsi-script");
    const init = () => {
      if (!window.google || !clientId) return;
      window.google.accounts.id.initialize({ client_id: clientId, callback: googleCallbackRef.current, ux_mode: "popup" });
      window.google.accounts.id.renderButton(hiddenButtonRef.current, { theme: "outline", size: "large", width: "100%", text: "signup_with", logo_alignment: "left" });
    };
    if (existing) { init(); return; }
    const script = document.createElement("script");
    script.id = "google-gsi-script"; script.src = "https://accounts.google.com/gsi/client"; script.async = true; script.defer = true; script.onload = init;
    document.head.appendChild(script);
    return () => { window.handleGoogleCredentialReg = undefined; };
  }, [clientId, onCredential]);

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

  if (!clientId) return (
    <button type="button" disabled style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 14, fontWeight: 600, color: "#94a3b8", cursor: "not-allowed", fontFamily: "inherit" }}>
      <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/><path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/><path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/></svg>
      Google sign-in not configured
    </button>
  );

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
        <div id="google-reg-btn" ref={hiddenButtonRef} />
      </div>
    </div>
  );
}

// ── Password strength ─────────────────────────────────────────────────────
function passwordStrength(p: string): { score: number; label: string; color: string } {
  if (!p) return { score: 0, label: "", color: "#e2e8f0" };
  let score = 0;
  if (p.length >= 8)  score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  const map = [
    { score: 1, label: "Very weak",  color: "#ef4444" },
    { score: 2, label: "Weak",       color: "#f97316" },
    { score: 3, label: "Fair",       color: "#eab308" },
    { score: 4, label: "Good",       color: "#22c55e" },
    { score: 5, label: "Strong",     color: "#16a34a" },
  ];
  return map[score - 1] || { score: 0, label: "", color: "#e2e8f0" };
}

export default function RegisterPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router   = useRouter();
  const { loading, error, user } = useSelector((s: RootState) => s.auth);

  const [form,     setForm]     = useState({ name: "", email: "", password: "", company: "" });
  const [showPass, setShowPass] = useState(false);
  const [localErr, setLocalErr] = useState("");

  useEffect(() => { if (user) router.replace("/dashboard"); }, [user, router]);
  useEffect(() => () => { dispatch(clearError()); }, [dispatch]);

  const strength = passwordStrength(form.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr("");
    dispatch(clearError());

    if (!form.name.trim())     { setLocalErr("Full name is required"); return; }
    if (!form.email.trim())    { setLocalErr("Email is required"); return; }
    if (!form.password)        { setLocalErr("Password is required"); return; }
    if (form.password.length < 6) { setLocalErr("Password must be at least 6 characters"); return; }

    try {
      await dispatch(registerUser(form)).unwrap();
      router.push("/dashboard");
    } catch { /* Redux error state handles display */ }
  };

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setLocalErr(""); dispatch(clearError());
    try {
      await dispatch(loginWithGoogle({ credential, company: form.company })).unwrap();
      router.push("/dashboard");
    } catch { /* Redux error state */ }
  }, [dispatch, router, form.company]);

  const displayError = localErr || error;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .reg-root { min-height: 100vh; display: flex; font-family: 'Inter', system-ui, sans-serif; }
        .reg-hero {
          flex: 1 1 50%;
          background: linear-gradient(160deg, #0f1c3a 0%, #0b1528 40%, #0d1f4a 100%);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 60px 48px; position: relative; overflow: hidden;
        }
        .reg-hero::before {
          content: ''; position: absolute; top: -120px; left: -120px;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%); pointer-events: none;
        }
        .reg-hero::after {
          content: ''; position: absolute; bottom: -80px; right: -80px;
          width: 300px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%); pointer-events: none;
        }
        .reg-hero-content { position: relative; z-index: 1; width: 100%; }
        .reg-hero-tagline { font-family: var(--font-body, 'Manrope', sans-serif); font-size: 17px; line-height: 1.65; color: rgba(255,255,255,0.55); margin-top: 28px; text-align: center; }
        .reg-hero-steps { margin-top: 40px; display: flex; flex-direction: column; gap: 0; }
        .reg-step { display: flex; align-items: flex-start; gap: 14px; padding: 16px 0; position: relative; }
        .reg-step:not(:last-child)::after { content: ''; position: absolute; left: 17px; top: 46px; width: 1px; height: 20px; background: rgba(255,255,255,0.1); }
        .reg-step-num { width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, rgba(37,99,235,0.4), rgba(124,58,237,0.4)); border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: white; }
        .reg-step-title { font-family: var(--font-display, 'Sora', sans-serif); font-weight: 700; color: white; font-size: 14px; margin-bottom: 2px; }
        .reg-step-text  { font-family: var(--font-body, 'Manrope', sans-serif); font-size: 12.5px; color: rgba(255,255,255,0.55); line-height: 1.4; }

        .reg-form-panel { flex: 1 1 50%; display: flex; align-items: center; justify-content: center; background: #f8fafc; padding: 40px 24px; }
        .reg-form-card  { width: 100%; max-width: 440px; background: white; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 24px rgba(0,0,0,0.07); padding: 40px 36px; animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

        .form-title { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.4px; margin-bottom: 4px; }
        .form-sub   { font-size: 14px; color: #64748b; margin-bottom: 28px; }

        .form-error { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 11px; margin-bottom: 20px; background: #fef2f2; border: 1px solid #fecaca; animation: slideDown 0.2s ease; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .form-error-text { font-size: 13.5px; color: #dc2626; line-height: 1.5; font-weight: 500; }

        .form-divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; }
        .form-divider-line { flex: 1; height: 1px; background: #e2e8f0; }
        .form-divider-text { font-size: 12px; color: #94a3b8; font-weight: 600; white-space: nowrap; }

        .field-wrap  { margin-bottom: 14px; }
        .field-label { display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.06em; }
        .field-input-wrap { position: relative; }
        .field-icon  { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
        .field-input { width: 100%; padding: 12px 14px 12px 40px; border-radius: 11px; border: 1.5px solid #e2e8f0; font-size: 14px; color: #0f172a; outline: none; background: #f8fafc; font-family: inherit; transition: all 0.15s; }
        .field-input:focus { border-color: #2563eb; background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .field-input::placeholder { color: #cbd5e1; }
        .field-eye { position: absolute; right: 13px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94a3b8; padding: 2px; display: flex; transition: color 0.15s; }
        .field-eye:hover { color: #475569; }

        /* Strength bar */
        .strength-wrap { margin-top: 7px; }
        .strength-bar  { height: 4px; border-radius: 2px; background: #e2e8f0; overflow: hidden; }
        .strength-fill { height: 100%; border-radius: 2px; transition: width 0.3s, background 0.3s; }
        .strength-label { font-size: 11.5px; font-weight: 600; margin-top: 4px; }

        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .btn-submit { width: 100%; padding: 13px; border-radius: 12px; border: none; background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 4px 14px rgba(37,99,235,0.35); transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 20px; margin-top: 20px; }
        .btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.45); }
        .btn-submit:disabled { opacity: 0.65; cursor: not-allowed; transform: none; box-shadow: none; }

        .spin { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.35); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .terms-note { font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5; }
        .terms-note a { color: #2563eb; text-decoration: none; }
        .terms-note a:hover { text-decoration: underline; }

        .form-footer { text-align: center; font-size: 13.5px; color: #64748b; margin-top: 16px; }
        .form-footer a { color: #2563eb; font-weight: 700; text-decoration: none; }
        .form-footer a:hover { text-decoration: underline; }

        @media (max-width: 900px) { .reg-hero { display: none; } .reg-form-panel { background: white; padding: 24px 16px; } .reg-form-card { box-shadow: none; border: none; padding: 32px 20px; } .two-col { grid-template-columns: 1fr; } }
      `}</style>

      <div className="reg-root">
        {/* ── Hero ── */}
        <div className="reg-hero">
          <div className="reg-hero-content">
            <AnimatedBrandLogo />
            <p className="reg-hero-tagline">
              Join ScreenAI and start hiring smarter with AI-powered candidate screening.
            </p>
            <div className="reg-hero-steps">
              {[
                { n: "1", title: "Create your account", text: "Free to start — no credit card needed." },
                { n: "2", title: "Post a job", text: "Define the role requirements and required skills." },
                { n: "3", title: "Upload candidates", text: "Import from CSV, Excel, PDF or add manually." },
                { n: "4", title: "Run AI screening", text: "Get a ranked shortlist with explanations in seconds." },
              ].map(s => (
                <div key={s.n} className="reg-step">
                  <div className="reg-step-num">{s.n}</div>
                  <div>
                    <p className="reg-step-title">{s.title}</p>
                    <p className="reg-step-text">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Form ── */}
        <div className="reg-form-panel">
          <div className="reg-form-card">
            <h1 className="form-title">Create your account</h1>
            <p className="form-sub">Start screening candidates with AI today</p>

            {displayError && (
              <div className="form-error">
                <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                <p className="form-error-text">{displayError}</p>
              </div>
            )}

            <GoogleSignInButton onCredential={handleGoogleCredential} loading={loading} />

            <div className="form-divider">
              <div className="form-divider-line" />
              <span className="form-divider-text">or register with email</span>
              <div className="form-divider-line" />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="two-col">
                <div className="field-wrap">
                  <label className="field-label">Full name</label>
                  <div className="field-input-wrap">
                    <User size={15} className="field-icon" />
                    <input className="field-input" type="text" placeholder="Alice Uwimana" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoComplete="name" disabled={loading} />
                  </div>
                </div>
                <div className="field-wrap">
                  <label className="field-label">Company</label>
                  <div className="field-input-wrap">
                    <Building2 size={15} className="field-icon" />
                    <input className="field-input" type="text" placeholder="Optional" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} autoComplete="organization" disabled={loading} />
                  </div>
                </div>
              </div>

              <div className="field-wrap">
                <label className="field-label">Email address</label>
                <div className="field-input-wrap">
                  <Mail size={15} className="field-icon" />
                  <input className="field-input" type="email" placeholder="you@company.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} autoComplete="email" disabled={loading} />
                </div>
              </div>

              <div className="field-wrap">
                <label className="field-label">Password</label>
                <div className="field-input-wrap">
                  <Lock size={15} className="field-icon" />
                  <input className="field-input" type={showPass ? "text" : "password"} placeholder="Min. 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} autoComplete="new-password" disabled={loading} />
                  <button type="button" className="field-eye" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password && (
                  <div className="strength-wrap">
                    <div className="strength-bar">
                      <div className="strength-fill" style={{ width: `${(strength.score / 5) * 100}%`, background: strength.color }} />
                    </div>
                    <p className="strength-label" style={{ color: strength.color }}>{strength.label}</p>
                  </div>
                )}
              </div>

              <p className="terms-note">
                By creating an account you agree to our{" "}
                <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
              </p>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? <><div className="spin" /> Creating account…</> : <><Sparkles size={15} /> Create account</>}
              </button>
            </form>

            <p className="form-footer">
              Already have an account?{" "}
              <Link href="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
