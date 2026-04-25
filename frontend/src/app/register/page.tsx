"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, loginWithGoogle, clearError } from "../../store/slices/authSlice";
import { AppDispatch, RootState } from "../../store";
import { Eye, EyeOff, Mail, Lock, User, Building2, AlertCircle, ArrowRight, CheckCircle2, FileText, Brain, Layers } from "lucide-react";

type GoogleCredentialResponse = { credential?: string };
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: any) => void;
          renderButton: (el: HTMLElement, opts: any) => void;
        };
      };
    };
  }
}

// Shared with login page — same module-level guard
let _gsiReady = false;

// ✅ Uses renderButton() — zero FedCM errors, zero "called multiple times" warnings
function GoogleSignInButton({
  onCredential, loading, text = "signup_with",
}: {
  onCredential: (credential: string) => void;
  loading: boolean;
  text?: "signin_with" | "signup_with";
}) {
  const clientId    = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const btnRef      = useRef<HTMLDivElement>(null);
  const callbackRef = useRef<(r: GoogleCredentialResponse) => void>(() => {});
  callbackRef.current = (r: GoogleCredentialResponse) => {
    if (r?.credential) onCredential(r.credential);
  };

  const initAndRender = useCallback(() => {
    if (!window.google?.accounts?.id || !clientId || !btnRef.current) return;
    if (!_gsiReady) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (r: GoogleCredentialResponse) => callbackRef.current(r),
      });
      _gsiReady = true;
    }
    window.google.accounts.id.renderButton(btnRef.current, {
      type: "standard", theme: "outline", size: "large",
      text: text, width: btnRef.current.offsetWidth || 360, logo_alignment: "left",
    });
  }, [clientId, text]);

  useEffect(() => {
    if (!clientId) return;
    if (window.google?.accounts?.id) { initAndRender(); return; }
    const existing = document.getElementById("google-gsi-script") as HTMLScriptElement | null;
    if (existing) { existing.addEventListener("load", initAndRender, { once: true }); return; }
    const s = document.createElement("script");
    s.id = "google-gsi-script"; s.src = "https://accounts.google.com/gsi/client";
    s.async = true; s.defer = true;
    s.addEventListener("load", initAndRender, { once: true });
    document.head.appendChild(s);
  }, [clientId, initAndRender]);

  if (!clientId) {
    return (
      <div style={{ width:"100%", height:44, borderRadius:10, border:"1.5px solid #e2e8f0", background:"#f9fafb", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:"#94a3b8" }}>
        Google sign-in not configured
      </div>
    );
  }
  return (
    <div style={{ width:"100%", minHeight:44, opacity:loading ? 0.6 : 1, pointerEvents:loading ? "none" : "auto", transition:"opacity 0.15s" }}>
      <div ref={btnRef} style={{ width:"100%" }} />
    </div>
  );
}

function passwordStrength(p: string): { score: number; label: string; color: string } {
  if (!p) return { score: 0, label: "", color: "#e2e8f0" };
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  const map = [
    { score:1, label:"Very weak", color:"#ef4444" },
    { score:2, label:"Weak",      color:"#f97316" },
    { score:3, label:"Fair",      color:"#eab308" },
    { score:4, label:"Good",      color:"#22c55e" },
    { score:5, label:"Strong",    color:"#16a34a" },
  ];
  return map[score - 1] || { score: 0, label: "", color: "#e2e8f0" };
}

const HOW_STEPS = [
  { icon: FileText, num: "01", title: "Post a Job",             desc: "Define the role, required skills, experience level, and location." },
  { icon: Brain,    num: "02", title: "Upload Candidates",      desc: "CSV, PDF resumes, or import from the Umurava talent pool."        },
  { icon: Layers,   num: "03", title: "Get a Ranked Shortlist", desc: "Gemini AI scores every applicant and explains each decision."     },
];
const LEFT_BADGES = ["No credit card needed", "Free forever tier", "Setup in 2 minutes"];

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
    setLocalErr(""); dispatch(clearError());
    if (!form.name.trim())        { setLocalErr("Full name is required"); return; }
    if (!form.email.trim())       { setLocalErr("Email is required"); return; }
    if (!form.password)           { setLocalErr("Password is required"); return; }
    if (form.password.length < 6) { setLocalErr("Password must be at least 6 characters"); return; }
    try {
      await dispatch(registerUser(form)).unwrap();
      router.push("/dashboard");
    } catch { /* error shown via Redux state */ }
  };

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setLocalErr(""); dispatch(clearError());
    try {
      await dispatch(loginWithGoogle({ credential, company: form.company })).unwrap();
      router.push("/dashboard");
    } catch { /* error shown via Redux state */ }
  }, [dispatch, router, form.company]);

  const displayError = localErr || error;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .rn-root { min-height: 100vh; display: flex; font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        .rn-left { flex: 0 0 46%; background: #0a1628; display: flex; flex-direction: column; position: relative; overflow: hidden; }
        .rn-left::before { content: ''; position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px); background-size: 28px 28px; pointer-events: none; }
        .rn-left::after  { content: ''; position: absolute; bottom: -100px; right: -100px; width: 420px; height: 420px; border-radius: 50%; background: radial-gradient(circle, rgba(37,99,235,0.09) 0%, transparent 65%); pointer-events: none; }
        .rn-left-inner { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; padding: 48px 52px; }
        .rn-logo { display: flex; align-items: center; gap: 13px; margin-bottom: 60px; }
        .rn-logo-mark { width: 44px; height: 44px; border-radius: 12px; background: #2563eb; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .rn-logo-name { font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: -0.03em; line-height: 1; }
        .rn-logo-sub  { font-size: 11px; color: rgba(255,255,255,0.35); font-weight: 500; letter-spacing: 0.04em; margin-top: 3px; text-transform: uppercase; }
        .rn-eyebrow   { font-size: 11.5px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 14px; }
        .rn-hero-h    { font-size: clamp(1.8rem,2.6vw,2.35rem); font-weight: 800; color: #ffffff; letter-spacing: -0.04em; line-height: 1.12; margin-bottom: 14px; }
        .rn-hero-sub  { font-size: 14.5px; color: rgba(255,255,255,0.5); line-height: 1.65; max-width: 360px; margin-bottom: 36px; }
        .rn-steps { display: flex; flex-direction: column; gap: 20px; margin-bottom: 36px; }
        .rn-step  { display: flex; align-items: flex-start; gap: 14px; }
        .rn-step-left { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; }
        .rn-step-icon { width: 34px; height: 34px; border-radius: 9px; background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.2); display: flex; align-items: center; justify-content: center; }
        .rn-step-num  { font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.2); letter-spacing: 0.04em; }
        .rn-step-title { font-size: 14px; font-weight: 700; color: #ffffff; margin-bottom: 2px; }
        .rn-step-desc  { font-size: 13px; color: rgba(255,255,255,0.42); line-height: 1.5; }
        .rn-badges { display: flex; flex-wrap: wrap; gap: 8px; margin-top: auto; padding-top: 28px; border-top: 1px solid rgba(255,255,255,0.07); }
        .rn-badge  { display: flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 99px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.6); }
        .rn-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; flex-shrink: 0; }
        .rn-right { flex: 1; background: #ffffff; display: flex; align-items: center; justify-content: center; padding: 40px 40px; overflow-y: auto; }
        .rn-form-wrap { width: 100%; max-width: 420px; animation: rn-up 0.28s ease; }
        @keyframes rn-up { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .rn-form-title { font-size: clamp(1.6rem,2.6vw,2rem); font-weight: 800; color: #0f172a; letter-spacing: -0.04em; line-height: 1.1; margin-bottom: 6px; }
        .rn-form-sub   { font-size: 14px; color: #64748b; margin-bottom: 24px; font-weight: 400; }
        .rn-err { display: flex; align-items: flex-start; gap: 9px; padding: 11px 14px; border-radius: 9px; margin-bottom: 16px; background: #fef2f2; border: 1.5px solid #fecaca; animation: rn-shake 0.25s ease; }
        @keyframes rn-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
        .rn-err-text { font-size: 13px; color: #dc2626; line-height: 1.5; font-weight: 500; }
        .rn-divider { display: flex; align-items: center; gap: 12px; margin: 16px 0; }
        .rn-divider-line { flex:1; height:1px; background:#e2e8f0; }
        .rn-divider-text { font-size: 12px; color: #94a3b8; font-weight: 600; white-space: nowrap; }
        .rn-two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .rn-field { margin-bottom: 13px; }
        .rn-label { display: block; font-size: 12.5px; font-weight: 600; color: #374151; margin-bottom: 5px; letter-spacing: 0.01em; }
        .rn-inp-w { position: relative; }
        .rn-ico   { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; display: flex; }
        .rn-inp { width: 100%; height: 44px; padding: 0 13px 0 39px; border-radius: 10px; border: 1.5px solid #e2e8f0; font-size: 14px; color: #0f172a; outline: none; background: #ffffff; font-family: inherit; transition: border-color 0.15s, box-shadow 0.15s; }
        .rn-inp:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .rn-inp::placeholder { color: #9ca3af; }
        .rn-eye { position: absolute; right: 11px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #9ca3af; padding: 2px; display: flex; transition: color 0.15s; }
        .rn-eye:hover { color: #374151; }
        .rn-strength-wrap { margin-top: 7px; }
        .rn-strength-bar  { height: 4px; border-radius: 2px; background: #f1f5f9; overflow: hidden; }
        .rn-strength-fill { height: 100%; border-radius: 2px; transition: width 0.3s, background 0.3s; }
        .rn-strength-lbl  { font-size: 11.5px; font-weight: 600; margin-top: 4px; }
        .rn-terms { font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.6; margin-top: 6px; }
        .rn-terms a { color: #2563eb; text-decoration: none; }
        .rn-terms a:hover { text-decoration: underline; }
        .rn-btn { width: 100%; height: 48px; border-radius: 10px; border: none; background: #1e3a5f; color: white; font-size: 15px; font-weight: 700; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; margin-top: 14px; transition: background 0.15s, transform 0.15s; letter-spacing: 0.01em; }
        .rn-btn:hover:not(:disabled) { background: #162d4a; transform: translateY(-1px); }
        .rn-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .rn-spin { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,0.35); border-top-color: white; border-radius: 50%; animation: rn-spin-a 0.7s linear infinite; }
        @keyframes rn-spin-a { to { transform: rotate(360deg); } }
        .rn-footer { text-align: center; font-size: 13.5px; color: #64748b; margin-top: 20px; }
        .rn-footer a { color: #2563eb; font-weight: 700; text-decoration: none; }
        .rn-footer a:hover { text-decoration: underline; }
        @media (max-width: 960px) { .rn-left { display: none; } .rn-right { background: #f8fafc; padding: 28px 20px; } .rn-two { grid-template-columns: 1fr; } }
      `}</style>

      <div className="rn-root">
        <div className="rn-left">
          <div className="rn-left-inner">
            <div className="rn-logo">
              <div className="rn-logo-mark">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M11 2L19 7.5V14.5L11 20L3 14.5V7.5L11 2Z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
                  <path d="M11 6L16 9.5V13.5L11 17L6 13.5V9.5L11 6Z" fill="white" fillOpacity="0.5" stroke="white" strokeWidth="0.8" strokeLinejoin="round"/>
                  <circle cx="11" cy="11" r="2.5" fill="white"/>
                </svg>
              </div>
              <div>
                <p className="rn-logo-name">Umurava AI</p>
                <p className="rn-logo-sub">Talent Screening</p>
              </div>
            </div>
            <p className="rn-eyebrow">Start in 2 minutes</p>
            <h1 className="rn-hero-h">Your smarter<br/>hiring workspace.</h1>
            <p className="rn-hero-sub">Create a free account and start screening candidates with AI. No setup fees, no limits on your first jobs.</p>
            <div className="rn-steps">
              {HOW_STEPS.map(s => (
                <div key={s.num} className="rn-step">
                  <div className="rn-step-left">
                    <div className="rn-step-icon"><s.icon size={16} color="#60a5fa"/></div>
                    <span className="rn-step-num">{s.num}</span>
                  </div>
                  <div style={{ paddingTop:2 }}>
                    <p className="rn-step-title">{s.title}</p>
                    <p className="rn-step-desc">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="rn-badges">
              {LEFT_BADGES.map(b => (
                <div key={b} className="rn-badge"><span className="rn-badge-dot"/>{b}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="rn-right">
          <div className="rn-form-wrap">
            <h2 className="rn-form-title">Create your account</h2>
            <p className="rn-form-sub">Start screening candidates with AI today</p>

            {displayError && (
              <div className="rn-err">
                <AlertCircle size={15} color="#dc2626" style={{ flexShrink:0, marginTop:1 }}/>
                <p className="rn-err-text">{displayError}</p>
              </div>
            )}

            <GoogleSignInButton onCredential={handleGoogleCredential} loading={loading} text="signup_with"/>

            <div className="rn-divider">
              <div className="rn-divider-line"/>
              <span className="rn-divider-text">or register with email</span>
              <div className="rn-divider-line"/>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="rn-two">
                <div className="rn-field">
                  <label className="rn-label">Full name</label>
                  <div className="rn-inp-w">
                    <span className="rn-ico"><User size={14}/></span>
                    <input className="rn-inp" type="text" placeholder="Your full name" value={form.name} onChange={e => setForm({...form, name:e.target.value})} autoComplete="name" disabled={loading}/>
                  </div>
                </div>
                <div className="rn-field">
                  <label className="rn-label">Company</label>
                  <div className="rn-inp-w">
                    <span className="rn-ico"><Building2 size={14}/></span>
                    <input className="rn-inp" type="text" placeholder="Company name" value={form.company} onChange={e => setForm({...form, company:e.target.value})} autoComplete="organization" disabled={loading}/>
                  </div>
                </div>
              </div>

              <div className="rn-field">
                <label className="rn-label">Email address</label>
                <div className="rn-inp-w">
                  <span className="rn-ico"><Mail size={14}/></span>
                  <input className="rn-inp" type="email" placeholder="you@company.com" value={form.email} onChange={e => setForm({...form, email:e.target.value})} autoComplete="email" disabled={loading}/>
                </div>
              </div>

              <div className="rn-field">
                <label className="rn-label">Password</label>
                <div className="rn-inp-w">
                  <span className="rn-ico"><Lock size={14}/></span>
                  <input className="rn-inp" type={showPass ? "text" : "password"} placeholder="Min 6 characters" value={form.password} onChange={e => setForm({...form, password:e.target.value})} autoComplete="new-password" disabled={loading} style={{ paddingRight:40 }}/>
                  <button type="button" className="rn-eye" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                    {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
                {form.password && (
                  <div className="rn-strength-wrap">
                    <div className="rn-strength-bar">
                      <div className="rn-strength-fill" style={{ width:`${(strength.score/5)*100}%`, background:strength.color }}/>
                    </div>
                    <p className="rn-strength-lbl" style={{ color:strength.color }}>{strength.label}</p>
                  </div>
                )}
              </div>

              <p className="rn-terms">
                By creating an account you agree to our{" "}
                <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
              </p>

              <button type="submit" className="rn-btn" disabled={loading}>
                {loading ? <><div className="rn-spin"/> Creating account…</> : <>Create account <ArrowRight size={15}/></>}
              </button>
            </form>

            <p className="rn-footer">
              Already have an account?{" "}
              <Link href="/login">Sign in</Link>
            </p>

            <div style={{ marginTop:24, padding:"12px 16px", borderRadius:10, background:"#f8fafc", border:"1px solid #f1f5f9", display:"flex", alignItems:"center", gap:8 }}>
              <CheckCircle2 size={13} color="#16a34a" style={{ flexShrink:0 }}/>
              <p style={{ fontSize:12, color:"#64748b", lineHeight:1.5 }}>Free to start · No card required · Powered by Gemini AI</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}