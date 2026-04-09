"use client";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { loginUser, registerUser } from "../store/slices/authSlice";
import { AppDispatch, RootState } from "../store";
import toast from "react-hot-toast";
import {
  Brain, Mail, Lock, User, Building2, ArrowRight,
  Zap, Target, BarChart3, Search, CheckCircle2,
  Sparkles, AlertCircle, Eye, EyeOff,
} from "lucide-react";

const features = [
  { icon: Zap,       text: "Screen 100+ candidates instantly"  },
  { icon: Target,    text: "AI-powered match scoring 0–100"    },
  { icon: BarChart3, text: "Side-by-side candidate comparison" },
  { icon: Search,    text: "Detailed strengths & gap analysis" },
];

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router   = useRouter();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const [isLogin, setIsLogin]         = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", company: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await dispatch(loginUser({ email: form.email, password: form.password })).unwrap();
        toast.success("Welcome back!");
      } else {
        await dispatch(registerUser(form)).unwrap();
        toast.success("Account created!");
      }
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err || "Something went wrong");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          display: flex;
          background: #ffffff;
        }

        /* ══════════════════════════
           LEFT PANEL
        ══════════════════════════ */
        .auth-left {
          flex: 1;
          background: linear-gradient(150deg, #1e3a8a 0%, #1d4ed8 50%, #4338ca 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 64px 60px;
          position: relative;
          overflow: hidden;
        }

        .auth-left::before {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px);
          background-size: 26px 26px;
        }

        .auth-left::after {
          content: '';
          position: absolute;
          bottom: -140px; right: -140px;
          width: 420px; height: 420px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
        }

        .left-inner { position: relative; z-index: 1; max-width: 440px; }

        .brand-mark {
          display: flex; align-items: center; gap: 13px;
          margin-bottom: 56px;
        }

        .brand-icon {
          width: 46px; height: 46px; border-radius: 13px;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.22);
          display: flex; align-items: center; justify-content: center;
        }

        .brand-name {
          font-family: 'Sora', sans-serif;
          font-size: 19px; font-weight: 700;
          color: #fff; letter-spacing: -0.3px;
        }

        .brand-sub {
          font-size: 10.5px; color: rgba(255,255,255,0.42);
          font-weight: 500; letter-spacing: 0.09em;
          text-transform: uppercase; margin-top: 2px;
        }

        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 5px 13px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 100px;
          color: rgba(255,255,255,0.8);
          font-size: 11.5px; font-weight: 600; letter-spacing: 0.04em;
          margin-bottom: 22px;
        }

        .hero-title {
          font-family: 'Sora', sans-serif;
          font-size: clamp(30px, 3.2vw, 48px);
          font-weight: 800; color: #fff;
          line-height: 1.1; letter-spacing: -1.5px;
          margin-bottom: 18px;
        }

        .hero-title em {
          font-style: normal; position: relative; white-space: nowrap;
        }

        .hero-title em::after {
          content: '';
          position: absolute; left: 0; bottom: -3px;
          width: 100%; height: 3px;
          background: rgba(255,255,255,0.38); border-radius: 2px;
        }

        .hero-desc {
          color: rgba(255,255,255,0.55);
          font-size: 15px; line-height: 1.75;
          margin-bottom: 40px; max-width: 380px;
        }

        .feature-list { display: flex; flex-direction: column; gap: 9px; }

        .feature-item {
          display: flex; align-items: center; gap: 13px;
          padding: 12px 15px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 11px; transition: background 0.2s;
        }

        .feature-item:hover { background: rgba(255,255,255,0.1); }

        .feature-icon-wrap {
          width: 33px; height: 33px; border-radius: 9px;
          background: rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .feature-text { color: rgba(255,255,255,0.78); font-size: 13.5px; font-weight: 500; flex: 1; }

        .testimonial {
          margin-top: 36px; padding: 18px 20px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 13px;
        }

        .testimonial-quote {
          color: rgba(255,255,255,0.65);
          font-size: 13px; line-height: 1.65;
          font-style: italic; margin-bottom: 13px;
        }

        .testimonial-author { display: flex; align-items: center; gap: 10px; }

        .testimonial-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: linear-gradient(135deg, #60a5fa, #a78bfa);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0;
        }

        .testimonial-name { color: rgba(255,255,255,0.6); font-size: 12px; font-weight: 600; }
        .testimonial-role { color: rgba(255,255,255,0.32); font-size: 11px; }

        /* ══════════════════════════
           RIGHT PANEL
        ══════════════════════════ */
        .auth-right {
          width: 500px;
          display: flex; align-items: center; justify-content: center;
          padding: 56px 52px;
          background: #ffffff;
          border-left: 1px solid #e2e8f0;
        }

        .form-card { width: 100%; }

        .form-header { margin-bottom: 30px; }

        .form-title {
          font-family: 'Sora', sans-serif;
          color: #0f172a; font-size: 23px; font-weight: 700;
          letter-spacing: -0.5px; margin-bottom: 6px;
        }

        .form-subtitle { color: #94a3b8; font-size: 13.5px; }

        .tab-bar {
          display: flex; background: #f1f5f9;
          border-radius: 11px; padding: 4px;
          margin-bottom: 28px; gap: 4px;
        }

        .tab-btn {
          flex: 1; padding: 9px; border-radius: 8px; border: none;
          cursor: pointer; font-weight: 600; font-size: 13.5px;
          font-family: 'DM Sans', sans-serif; transition: all 0.2s ease;
        }

        .tab-btn.active {
          background: #fff; color: #1d4ed8;
          box-shadow: 0 2px 8px rgba(30,58,138,0.12);
        }

        .tab-btn.inactive { background: transparent; color: #94a3b8; }
        .tab-btn.inactive:hover { color: #64748b; }

        .form-body { display: flex; flex-direction: column; gap: 18px; }

        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

        .field-label {
          color: #374151; font-size: 11.5px; font-weight: 600;
          letter-spacing: 0.07em; text-transform: uppercase;
          display: block; margin-bottom: 7px;
        }

        .field-wrap { position: relative; }

        .field-icon {
          position: absolute; left: 13px; top: 50%;
          transform: translateY(-50%); color: #94a3b8;
          display: flex; pointer-events: none;
        }

        .field-input {
          width: 100%;
          padding: 11px 44px 11px 42px; /* right padding for toggle */
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          color: #0f172a; font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }

        /* inputs without toggle keep normal right padding */
        .field-input.no-toggle { padding-right: 14px; }

        .field-input::placeholder { color: #c4cdd6; }

        .field-input:focus {
          border-color: #2563eb;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
        }

        /* Eye toggle button */
        .pwd-toggle {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer; color: #94a3b8;
          display: flex; align-items: center; justify-content: center;
          padding: 4px; border-radius: 6px;
          transition: color 0.18s, background 0.18s;
        }

        .pwd-toggle:hover {
          color: #2563eb;
          background: rgba(37,99,235,0.07);
        }

        .form-error {
          display: flex; align-items: flex-start; gap: 9px;
          padding: 11px 14px;
          background: #fef2f2; border: 1.5px solid #fecaca;
          border-radius: 10px; color: #dc2626; font-size: 13px;
        }

        .submit-btn {
          width: 100%; padding: 13px; border-radius: 11px; border: none;
          font-weight: 700; font-size: 14.5px;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: opacity 0.18s, transform 0.15s, box-shadow 0.18s;
        }

        .submit-btn:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%);
          color: white;
          box-shadow: 0 4px 18px rgba(29,78,216,0.28);
        }

        .submit-btn:not(:disabled):hover {
          box-shadow: 0 6px 26px rgba(29,78,216,0.38);
          transform: translateY(-1px);
        }

        .submit-btn:not(:disabled):active { transform: translateY(0); }

        .submit-btn:disabled {
          background: #f1f5f9; color: #94a3b8; cursor: not-allowed;
        }

        .form-footer {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          color: #cbd5e1; font-size: 12px; margin-top: 24px;
        }

        .footer-dot { width: 3px; height: 3px; border-radius: 50%; background: #e2e8f0; }

        /* ══════════════════════════
           RESPONSIVE
        ══════════════════════════ */
        @media (max-width: 1060px) {
          .auth-left  { padding: 48px 40px; }
          .auth-right { width: 440px; padding: 48px 40px; }
          .two-col    { grid-template-columns: 1fr; }
        }

        @media (max-width: 860px) {
          .auth-root  { flex-direction: column; }
          .auth-left  { padding: 36px 28px 40px; flex: none; }
          .auth-right { width: 100%; border-left: none; border-top: 1px solid #e2e8f0; padding: 36px 28px 52px; }
          .feature-list { display: none; }
          .hero-desc    { display: none; }
          .hero-eyebrow { display: none; }
          .testimonial  { display: none; }
          .brand-mark   { margin-bottom: 20px; }
          .hero-title   { font-size: 28px; margin-bottom: 0; }
          .two-col      { grid-template-columns: 1fr 1fr; }
        }

        @media (max-width: 480px) {
          .auth-left  { padding: 28px 20px 32px; }
          .auth-right { padding: 28px 20px 44px; }
          .hero-title { font-size: 24px; }
          .two-col    { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="auth-root">

        {/* ── Left panel ── */}
        <div className="auth-left">
          <div className="left-inner">

            <div className="brand-mark">
              <div className="brand-icon">
                <Brain size={22} color="white" />
              </div>
              <div>
                <p className="brand-name">Umurava</p>
                <p className="brand-sub">AI Screening Platform</p>
              </div>
            </div>

            <div className="hero-eyebrow">
              <Sparkles size={12} />
              Powered by Gemini AI
            </div>

            <h1 className="hero-title">
              Hire smarter<br />with <em>AI precision</em>
            </h1>

            <p className="hero-desc">
              Screen hundreds of candidates in seconds. Get ranked shortlists
              with AI-powered explanations tailored to your job requirements.
            </p>

            <div className="feature-list">
              {features.map(({ icon: Icon, text }) => (
                <div className="feature-item" key={text}>
                  <div className="feature-icon-wrap">
                    <Icon size={15} color="rgba(255,255,255,0.85)" />
                  </div>
                  <span className="feature-text">{text}</span>
                  <CheckCircle2 size={14} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="auth-right">
          <div className="form-card">

            <div className="form-header">
              <h2 className="form-title">
                {isLogin ? "Welcome back" : "Create your account"}
              </h2>
              <p className="form-subtitle">
                {isLogin
                  ? "Sign in to your recruiter dashboard"
                  : "Start screening candidates with AI today"}
              </p>
            </div>

            <div className="tab-bar">
              {["Login", "Register"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setIsLogin(tab === "Login");
                    setShowPassword(false);
                  }}
                  className={`tab-btn ${(tab === "Login") === isLogin ? "active" : "inactive"}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="form-body">

              {!isLogin && (
                <div className="two-col">
                  <div>
                    <label className="field-label">Full Name</label>
                    <div className="field-wrap">
                      <span className="field-icon"><User size={15} /></span>
                      <input
                        className="field-input no-toggle"
                        type="text" placeholder="Your name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="field-label">Company</label>
                    <div className="field-wrap">
                      <span className="field-icon"><Building2 size={15} /></span>
                      <input
                        className="field-input no-toggle"
                        type="text" placeholder="Your Company"
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="field-label">Email Address</label>
                <div className="field-wrap">
                  <span className="field-icon"><Mail size={15} /></span>
                  <input
                    className="field-input no-toggle"
                    type="email" placeholder="you@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Password with show/hide toggle */}
              <div>
                <label className="field-label">Password</label>
                <div className="field-wrap">
                  <span className="field-icon"><Lock size={15} /></span>
                  <input
                    className="field-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="pwd-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="form-error">
                  <AlertCircle size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? "Please wait…" : (
                  <>{isLogin ? "Sign In" : "Create Account"}<ArrowRight size={16} /></>
                )}
              </button>

            </form>

            <div className="form-footer">
              <span>Powered by Google Gemini AI</span>
              <span className="footer-dot" />
              <span>Debug Thugs Team</span>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}