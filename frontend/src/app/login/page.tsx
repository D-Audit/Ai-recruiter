"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { loginUser } from "@/store/slices/authSlice";
import { AppDispatch, RootState } from "@/store";
import AnimatedLogo from "@/components/AnimatedLogo";
import { Eye, EyeOff, ArrowRight, Mail, Lock, Zap, BarChart2, GitCompare, Search, Sparkles } from "lucide-react";

const FEATURES = [
  { icon: Zap,        text: "Screen 100+ candidates instantly" },
  { icon: BarChart2,  text: "AI-powered match scoring 0–100" },
  { icon: GitCompare, text: "Side-by-side candidate comparison" },
  { icon: Search,     text: "Detailed strengths & gap analysis" },
];

export default function LoginPage() {
  const router   = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { token, loading, error } = useSelector((s: RootState) => s.auth);
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);

  useEffect(() => { if (token) router.push("/dashboard"); }, [token, router]);

  const handleSubmit = async () => {
    if (!email || !password) return;
    await dispatch(loginUser({ email, password }));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        :root { --f: 'Inter', var(--font-body, system-ui), sans-serif; --blue: #2452d4; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; font-family: var(--f); }

        .lg-root { display: flex; min-height: 100vh; }

        /* ══ LEFT ══ */
        .lg-left {
          flex: 1;
          background: linear-gradient(160deg, #1230a8 0%, #1a40cc 40%, #2655e8 70%, #3468f0 100%);
          padding: 48px 56px;
          display: flex; flex-direction: column;
          position: relative; overflow: hidden;
        }
        .lg-left::after {
          content: '';
          position: absolute; bottom: -200px; right: -200px;
          width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(100,140,255,0.28) 0%, transparent 65%);
          pointer-events: none;
        }
        .lg-left::before {
          content: '';
          position: absolute; top: -120px; left: -80px;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(60,100,255,0.15) 0%, transparent 65%);
          pointer-events: none;
        }

        /* Logo */
        .lg-logo-tag  { font-size: 9px; font-weight: 600; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1.8px; margin-top: 2px; }

        /* Badge */
        .lg-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 13px; border-radius: 99px;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(10px);
          color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 500;
          margin-bottom: 22px; width: fit-content; position: relative; z-index: 2;
          letter-spacing: -0.1px;
        }

        /* Hero */
        .lg-hero {
          font-family: var(--f);
          font-size: clamp(2.4rem, 4vw, 3.2rem);
          font-weight: 800; color: #fff;
          line-height: 1.08; letter-spacing: -2px;
          position: relative; z-index: 2;
        }
        .lg-hero-accent {
          display: block; position: relative; width: fit-content; padding-bottom: 6px;
        }
        .lg-hero-accent::after {
          content: ''; position: absolute; bottom: 0; left: 0;
          width: 100%; height: 2px;
          background: rgba(255,255,255,0.3); border-radius: 2px;
        }
        .lg-hero-sub {
          font-family: var(--f); font-size: 14.5px; color: rgba(255,255,255,0.55);
          line-height: 1.72; margin-top: 18px; margin-bottom: 40px;
          max-width: 360px; position: relative; z-index: 2; letter-spacing: -0.1px;
        }

        /* Features */
        .lg-feats { display: flex; flex-direction: column; gap: 9px; position: relative; z-index: 2; max-width: 420px; }
        .lg-feat {
          display: flex; align-items: center; gap: 13px; padding: 13px 16px;
          border-radius: 11px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.11);
          transition: background 0.15s; cursor: default;
          backdrop-filter: blur(6px);
        }
        .lg-feat:hover { background: rgba(255,255,255,0.13); }
        .lg-feat-ico {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(255,255,255,0.12);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .lg-feat-label { flex: 1; font-family: var(--f); font-size: 13.5px; color: rgba(255,255,255,0.88); font-weight: 500; letter-spacing: -0.1px; }
        .lg-feat-ring {
          width: 18px; height: 18px; border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.28);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .lg-left-foot {
          margin-top: auto; padding-top: 40px;
          font-family: var(--f); font-size: 11.5px; color: rgba(255,255,255,0.25);
          position: relative; z-index: 2; letter-spacing: -0.05px;
        }

        /* ══ RIGHT ══ */
        .lg-right {
          width: 500px; flex-shrink: 0; background: #fff;
          display: flex; align-items: center; justify-content: center;
          padding: 52px 60px;
        }
        .lg-box { width: 100%; max-width: 370px; }

        /* Title */
        .lg-title {
          font-family: var(--f); font-size: 28px; font-weight: 800;
          color: #0d1525; letter-spacing: -0.8px; margin-bottom: 5px; line-height: 1.15;
        }
        .lg-subtitle { font-family: var(--f); font-size: 14px; color: #64748b; margin-bottom: 30px; line-height: 1.5; letter-spacing: -0.1px; }

        /* Tabs */
        .lg-tabs { display: flex; border: 1.5px solid #e8edf3; border-radius: 10px; overflow: hidden; margin-bottom: 28px; }
        .lg-tab {
          flex: 1; padding: 11px 16px; text-align: center;
          font-family: var(--f); font-size: 13.5px; font-weight: 600;
          border: none; background: transparent; cursor: pointer;
          color: #94a3b8; transition: all 0.15s; letter-spacing: -0.1px;
        }
        .lg-tab + .lg-tab { border-left: 1.5px solid #e8edf3; }
        .lg-tab.on { color: white; background: var(--blue); font-weight: 700; border-radius: 8px; }
        .lg-tab:not(.on):hover { background: #f8fafc; color: #475569; }

        /* Fields */
        .lg-field { margin-bottom: 18px; }
        .lg-label { display: block; font-family: var(--f); font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 7px; text-transform: uppercase; letter-spacing: 0.9px; }
        .lg-ig    { position: relative; display: flex; align-items: center; }
        .lg-ic    { position: absolute; left: 13px; color: #c0cad5; display: flex; pointer-events: none; }
        .lg-input {
          width: 100%; padding: 12px 14px 12px 40px;
          border: 1.5px solid #e8edf3; border-radius: 10px;
          background: #f9fafb; color: #0d1525;
          font-family: var(--f); font-size: 14px; outline: none; transition: all 0.15s;
          letter-spacing: -0.1px;
        }
        .lg-input:focus { border-color: var(--blue); background: #fff; box-shadow: 0 0 0 3px rgba(36,82,212,0.08); }
        .lg-input::placeholder { color: #b8c4d0; }
        .lg-eye { position: absolute; right: 11px; background: none; border: none; cursor: pointer; color: #94a3b8; display: flex; padding: 4px; transition: color 0.15s; align-items: center; }
        .lg-eye:hover { color: var(--blue); }

        /* Error */
        .lg-error { background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 10px; padding: 10px 14px; color: #dc2626; font-family: var(--f); font-size: 13px; font-weight: 500; margin-bottom: 14px; letter-spacing: -0.1px; }

        /* Button */
        .lg-btn {
          width: 100%; padding: 14px; border-radius: 10px; border: none;
          background: var(--blue); color: #fff;
          font-family: var(--f); font-weight: 600; font-size: 14.5px;
          letter-spacing: -0.2px; cursor: pointer; transition: all 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 16px rgba(36,82,212,0.26);
        }
        .lg-btn:hover:not(:disabled) { background: #1a3ec7; box-shadow: 0 6px 22px rgba(36,82,212,0.38); transform: translateY(-1px); }
        .lg-btn:active:not(:disabled) { transform: translateY(0); }
        .lg-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

        .lg-spin { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: lgSpin 0.7s linear infinite; flex-shrink: 0; }
        @keyframes lgSpin { to { transform: rotate(360deg); } }

        /* Footer */
        .lg-foot { text-align: center; margin-top: 20px; font-family: var(--f); font-size: 12.5px; color: #94a3b8; line-height: 1.8; letter-spacing: -0.05px; }
        .lg-foot a { color: var(--blue); font-weight: 600; text-decoration: none; }
        .lg-foot a:hover { text-decoration: underline; }

        @media (max-width: 960px) {
          .lg-left  { display: none; }
          .lg-right { width: 100%; padding: 40px 24px; }
        }
      `}</style>

      <div className="lg-root">

        {/* ══ LEFT ══ */}
        <div className="lg-left">
          <div style={{ marginBottom: 60, position: "relative", zIndex: 2 }}>
            <AnimatedLogo size="md" dark={true} />
          </div>

          <div className="lg-badge"><Sparkles size={11} /> Powered by Gemini AI</div>

          <h1 className="lg-hero">
            Hire smarter<br />
            <span className="lg-hero-accent">with AI precision</span>
          </h1>
          <p className="lg-hero-sub">Screen hundreds of candidates in seconds. Get ranked shortlists with AI-powered explanations tailored to your job requirements.</p>

          <div className="lg-feats">
            {FEATURES.map(f => (
              <div key={f.text} className="lg-feat">
                <div className="lg-feat-ico"><f.icon size={14} color="rgba(255,255,255,0.9)" /></div>
                <span className="lg-feat-label">{f.text}</span>
                <div className="lg-feat-ring">
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3l1.5 1.5L7 1" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          <div className="lg-left-foot">Powered by Google Gemini AI · Debug Thugs Team</div>
        </div>

        {/* ══ RIGHT ══ */}
        <div className="lg-right">
          <div className="lg-box">
            <h2 className="lg-title">Welcome back</h2>
            <p className="lg-subtitle">Sign in to your recruiter dashboard</p>

            <div className="lg-tabs">
              <button className="lg-tab on">Login</button>
              <Link href="/register" style={{ flex:1, display:"flex" }}>
                <button className="lg-tab" style={{ width:"100%" }}>Register</button>
              </Link>
            </div>

            <div className="lg-field">
              <label className="lg-label">Email Address</label>
              <div className="lg-ig">
                <span className="lg-ic"><Mail size={14} /></span>
                <input className="lg-input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==="Enter" && handleSubmit()} />
              </div>
            </div>

            <div className="lg-field">
              <label className="lg-label">Password</label>
              <div className="lg-ig">
                <span className="lg-ic"><Lock size={14} /></span>
                <input className="lg-input" type={showPwd?"text":"password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==="Enter" && handleSubmit()} style={{ paddingRight:42 }} />
                <button className="lg-eye" type="button" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <div className="lg-error">⚠ {error}</div>}

            <button className="lg-btn" disabled={loading || !email || !password} onClick={handleSubmit}>
              {loading ? <><div className="lg-spin" /> Signing in…</> : <>Sign In <ArrowRight size={15} /></>}
            </button>

            <p className="lg-foot">
              Powered by Google Gemini AI · Debug Thugs Team<br />
              No account? <Link href="/register">Register here →</Link>
            </p>
          </div>
        </div>

      </div>
    </>
  );
}