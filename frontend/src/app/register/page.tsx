"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { registerUser } from "@/store/slices/authSlice";
import { AppDispatch, RootState } from "@/store";
import { Eye, EyeOff, ArrowRight, Mail, Lock, User, Building2, Zap, BarChart2, GitCompare, Search, Sparkles } from "lucide-react";
import AnimatedLogo from "@/components/AnimatedLogo";

const FEATURES = [
  { icon: Zap,        text: "Screen 100+ candidates instantly" },
  { icon: BarChart2,  text: "AI-powered match scoring 0–100" },
  { icon: GitCompare, text: "Side-by-side candidate comparison" },
  { icon: Search,     text: "Detailed strengths & gap analysis" },
];

export default function RegisterPage() {
  const router   = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { token, loading, error } = useSelector((s: RootState) => s.auth);
  const [form, setForm] = useState({ firstName:"", lastName:"", email:"", password:"", company:"" });
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => { if (token) router.push("/dashboard"); }, [token, router]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    const { firstName, lastName, email, password, company } = form;
    if (!firstName || !lastName || !email || !password) return;
    await dispatch(registerUser({ name: `${firstName.trim()} ${lastName.trim()}`, email, password, company }));
  };

  const pwStrength = (p: string) => {
    if (!p) return null;
    if (p.length < 6)  return { label:"Weak",   color:"#ef4444", w:"25%" };
    if (p.length < 10) return { label:"Fair",    color:"#f59e0b", w:"55%" };
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) return { label:"Strong", color:"#22c55e", w:"100%" };
    return { label:"Good", color:"#2452d4", w:"80%" };
  };
  const pw = pwStrength(form.password);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        :root { --f: 'Inter', var(--font-body, system-ui), sans-serif; --blue: #2452d4; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; font-family: var(--f); }

        .rg-root { display: flex; min-height: 100vh; }

        /* ══ LEFT ══ */
        .rg-left {
          width: 50%;
          flex: 0 0 50%;
          background: linear-gradient(160deg, #1230a8 0%, #1a40cc 40%, #2655e8 70%, #3468f0 100%);
          padding: 48px 56px;
          display: flex; flex-direction: column;
          position: relative; overflow: hidden;
        }
        .rg-left::after {
          content: ''; position: absolute; bottom: -200px; right: -200px;
          width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(100,140,255,0.28) 0%, transparent 65%);
          pointer-events: none;
        }
        .rg-left::before {
          content: ''; position: absolute; top: -120px; left: -80px;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(60,100,255,0.15) 0%, transparent 65%);
          pointer-events: none;
        }

        .rg-logo-tag  { font-size: 9px; font-weight: 600; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1.8px; margin-top: 2px; }

        .rg-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 13px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.08); backdrop-filter: blur(10px); color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 500; margin-bottom: 22px; width: fit-content; position: relative; z-index: 2; letter-spacing: -0.1px; }

        .rg-hero { font-family: var(--f); font-size: clamp(2.4rem, 4vw, 3.2rem); font-weight: 800; color: #fff; line-height: 1.08; letter-spacing: -2px; position: relative; z-index: 2; }
        .rg-hero-accent { display: block; position: relative; width: fit-content; padding-bottom: 6px; }
        .rg-hero-accent::after { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 2px; background: rgba(255,255,255,0.3); border-radius: 2px; }
        .rg-hero-sub { font-family: var(--f); font-size: 14.5px; color: rgba(255,255,255,0.55); line-height: 1.72; margin-top: 18px; margin-bottom: 40px; max-width: 360px; position: relative; z-index: 2; letter-spacing: -0.1px; }

        .rg-feats { display: flex; flex-direction: column; gap: 9px; position: relative; z-index: 2; max-width: 420px; }
        .rg-feat { display: flex; align-items: center; gap: 13px; padding: 13px 16px; border-radius: 11px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.11); transition: background 0.15s; cursor: default; backdrop-filter: blur(6px); }
        .rg-feat:hover { background: rgba(255,255,255,0.13); }
        .rg-feat-ico { width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .rg-feat-label { flex: 1; font-family: var(--f); font-size: 13.5px; color: rgba(255,255,255,0.88); font-weight: 500; letter-spacing: -0.1px; }
        .rg-feat-ring { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.28); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

        .rg-left-foot { margin-top: auto; padding-top: 40px; font-family: var(--f); font-size: 11.5px; color: rgba(255,255,255,0.25); position: relative; z-index: 2; }

        /* ══ RIGHT ══ */
        .rg-right { width: 50%; flex: 0 0 50%; background: #fff; display: flex; align-items: center; justify-content: center; padding: 44px 60px; overflow-y: auto; }
        .rg-box { width: 100%; max-width: 370px; margin: auto 0; }

        .rg-title { font-family: var(--f); font-size: 28px; font-weight: 800; color: #0d1525; letter-spacing: -0.8px; margin-bottom: 5px; line-height: 1.15; }
        .rg-subtitle { font-family: var(--f); font-size: 14px; color: #64748b; margin-bottom: 26px; line-height: 1.5; letter-spacing: -0.1px; }

        .rg-tabs { display: flex; border: 1.5px solid #e8edf3; border-radius: 10px; overflow: hidden; margin-bottom: 22px; }
        .rg-tab { flex: 1; padding: 11px 16px; text-align: center; font-family: var(--f); font-size: 13.5px; font-weight: 600; border: none; background: transparent; cursor: pointer; color: #94a3b8; transition: all 0.15s; letter-spacing: -0.1px; }
        .rg-tab + .rg-tab { border-left: 1.5px solid #e8edf3; }
        .rg-tab.on { color: white; background: var(--blue); font-weight: 700; border-radius: 8px; }
        .rg-tab:not(.on):hover { background: #f8fafc; color: #475569; }

        .rg-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }
        .rg-field { margin-bottom: 14px; }
        .rg-label { display: block; font-family: var(--f); font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 7px; text-transform: uppercase; letter-spacing: 0.9px; }
        .rg-opt   { font-weight: 400; color: #94a3b8; text-transform: none; letter-spacing: 0; margin-left: 3px; }
        .rg-ig    { position: relative; display: flex; align-items: center; }
        .rg-ic    { position: absolute; left: 12px; color: #c0cad5; display: flex; pointer-events: none; }
        .rg-input { width: 100%; padding: 11px 13px 11px 38px; border: 1.5px solid #e8edf3; border-radius: 10px; background: #f9fafb; color: #0d1525; font-family: var(--f); font-size: 13.5px; outline: none; transition: all 0.15s; letter-spacing: -0.1px; }
        .rg-input:focus { border-color: var(--blue); background: #fff; box-shadow: 0 0 0 3px rgba(36,82,212,0.08); }
        .rg-input::placeholder { color: #b8c4d0; }
        .rg-eye { position: absolute; right: 11px; background: none; border: none; cursor: pointer; color: #94a3b8; display: flex; padding: 4px; transition: color 0.15s; align-items: center; }
        .rg-eye:hover { color: var(--blue); }

        .rg-bar  { height: 3px; background: #f1f5f9; border-radius: 99px; overflow: hidden; margin-top: 5px; }
        .rg-fill { height: 100%; border-radius: 99px; transition: all 0.3s; }

        .rg-error { background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 10px; padding: 10px 13px; color: #dc2626; font-family: var(--f); font-size: 13px; font-weight: 500; margin-bottom: 12px; }

        .rg-btn { width: 100%; padding: 14px; border-radius: 10px; border: none; background: var(--blue); color: #fff; font-family: var(--f); font-weight: 600; font-size: 14.5px; letter-spacing: -0.2px; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 4px; box-shadow: 0 4px 16px rgba(36,82,212,0.26); }
        .rg-btn:hover:not(:disabled) { background: #1a3ec7; box-shadow: 0 6px 22px rgba(36,82,212,0.38); transform: translateY(-1px); }
        .rg-btn:active:not(:disabled) { transform: translateY(0); }
        .rg-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

        .rg-spin { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: rgSpin 0.7s linear infinite; flex-shrink: 0; }
        @keyframes rgSpin { to { transform: rotate(360deg); } }

        .rg-foot { text-align: center; margin-top: 16px; font-family: var(--f); font-size: 12.5px; color: #94a3b8; line-height: 1.8; }
        .rg-foot a { color: var(--blue); font-weight: 600; text-decoration: none; }
        .rg-foot a:hover { text-decoration: underline; }

        @media (max-width: 960px) {
          .rg-left  { display: none; }
          .rg-right { width: 100%; padding: 40px 24px; }
          .rg-row   { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="rg-root">

        {/* ══ LEFT ══ */}
        <div className="rg-left">
          <div style={{ marginBottom: 60, position: "relative", zIndex: 2 }}>
            <AnimatedLogo size="md" dark={true} />
          </div>

          <div className="rg-badge"><Sparkles size={11} /> Powered by Gemini AI</div>

          <h1 className="rg-hero">
            Hire smarter<br />
            <span className="rg-hero-accent">with AI precision</span>
          </h1>
          <p className="rg-hero-sub">Screen hundreds of candidates in seconds. Get ranked shortlists with AI-powered explanations tailored to your job requirements.</p>

          <div className="rg-feats">
            {FEATURES.map(f => (
              <div key={f.text} className="rg-feat">
                <div className="rg-feat-ico"><f.icon size={14} color="rgba(255,255,255,0.9)" /></div>
                <span className="rg-feat-label">{f.text}</span>
                <div className="rg-feat-ring">
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3l1.5 1.5L7 1" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          <div className="rg-left-foot">Powered by Google Gemini AI · Debug Thugs Team</div>
        </div>

        {/* ══ RIGHT ══ */}
        <div className="rg-right">
          <div className="rg-box">
            <h2 className="rg-title">Create account</h2>
            <p className="rg-subtitle">Start screening smarter — free for 14 days</p>

            <div className="rg-tabs">
              <Link href="/login" style={{ flex:1, display:"flex" }}>
                <button className="rg-tab" style={{ width:"100%" }}>Login</button>
              </Link>
              <button className="rg-tab on">Register</button>
            </div>

            <div className="rg-row">
              <div className="rg-field">
                <label className="rg-label">First Name</label>
                <div className="rg-ig">
                  <span className="rg-ic"><User size={13} /></span>
                  <input className="rg-input" type="text" placeholder="First" value={form.firstName} onChange={e => set("firstName", e.target.value)} />
                </div>
              </div>
              <div className="rg-field">
                <label className="rg-label">Last Name</label>
                <div className="rg-ig">
                  <span className="rg-ic"><User size={13} /></span>
                  <input className="rg-input" type="text" placeholder="Last" value={form.lastName} onChange={e => set("lastName", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="rg-field">
              <label className="rg-label">Email Address</label>
              <div className="rg-ig">
                <span className="rg-ic"><Mail size={13} /></span>
                <input className="rg-input" type="email" placeholder="you@company.com" value={form.email} onChange={e => set("email", e.target.value)} />
              </div>
            </div>

            <div className="rg-field">
              <label className="rg-label">Password</label>
              <div className="rg-ig">
                <span className="rg-ic"><Lock size={13} /></span>
                <input className="rg-input" type={showPwd?"text":"password"} placeholder="Min. 6 characters" value={form.password} onChange={e => set("password", e.target.value)} style={{ paddingRight:40 }} />
                <button className="rg-eye" type="button" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {pw && (
                <>
                  <div className="rg-bar"><div className="rg-fill" style={{ width:pw.w, background:pw.color }} /></div>
                  <p style={{ fontFamily:"var(--f)", fontSize:11, color:pw.color, marginTop:4, fontWeight:600 }}>{pw.label} password</p>
                </>
              )}
            </div>

            <div className="rg-field">
              <label className="rg-label">Company <span className="rg-opt">(optional)</span></label>
              <div className="rg-ig">
                <span className="rg-ic"><Building2 size={13} /></span>
                <input className="rg-input" type="text" placeholder="Your organisation" value={form.company} onChange={e => set("company", e.target.value)} />
              </div>
            </div>

            {error && <div className="rg-error">⚠ {error}</div>}

            <button className="rg-btn" disabled={loading || !form.firstName || !form.lastName || !form.email || !form.password} onClick={handleSubmit}>
              {loading ? <><div className="rg-spin" /> Creating account…</> : <>Create Account <ArrowRight size={15} /></>}
            </button>

            <p className="rg-foot">
              Powered by Google Gemini AI · Debug Thugs Team<br />
              Already have an account? <Link href="/login">Sign in →</Link>
            </p>
          </div>
        </div>

      </div>
    </>
  );
}