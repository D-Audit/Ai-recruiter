"use client";

import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { loginUser, registerUser } from "../store/slices/authSlice";
import { AppDispatch, RootState } from "../store";
import toast from "react-hot-toast";
import {
  Brain, Mail, Lock, User, Building2,
  ArrowRight, Sparkles, AlertCircle, Eye, EyeOff,
  CheckCircle2, Zap, Shield, TrendingUp, Users,
} from "lucide-react";

function passwordStrength(pwd: string): "weak" | "medium" | "strong" {
  if (pwd.length < 6) return "weak";
  const checks = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter((r) => r.test(pwd)).length;
  const score = checks + (pwd.length >= 10 ? 2 : pwd.length >= 8 ? 1 : 0);
  if (score >= 5) return "strong";
  if (score >= 3) return "medium";
  return "weak";
}

const features = [
  { icon: Zap,        text: "Screen hundreds of candidates in seconds" },
  { icon: TrendingUp, text: "AI-ranked shortlists with confidence scores" },
  { icon: Shield,     text: "Bias-aware evaluation on every hire" },
  { icon: Users,      text: "Side-by-side candidate comparison built in" },
];

const stats = [
  { value: "10×", label: "Faster screening" },
  { value: "AI", label: "Ranked results" },
  { value: "100%", label: "Bias-aware" },
];

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", company: "" });

  const strength = useMemo(() => passwordStrength(form.password), [form.password]);
  const strengthConfig = {
    weak:   { label: "Weak",   color: "#dc2626", fill: "#fca5a5", w: "30%" },
    medium: { label: "Medium", color: "#d97706", fill: "#fcd34d", w: "65%" },
    strong: { label: "Strong", color: "#15803d", fill: "#4ade80", w: "100%" },
  }[strength];

  const handleAuth = async () => {
    try {
      if (isLogin) {
        await dispatch(loginUser({ email: form.email, password: form.password })).unwrap();
        toast.success("Welcome back!");
      } else {
        const name = `${form.firstName} ${form.lastName}`.trim();
        if (!name) { toast.error("Enter your first and last name"); return; }
        if (!form.company.trim()) { toast.error("Enter your company name"); return; }
        await dispatch(registerUser({ name, email: form.email, password: form.password, company: form.company.trim() })).unwrap();
        toast.success("Account created! Welcome aboard 🎉");
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(typeof err === "string" ? err : "Something went wrong");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@700;800&display=swap');

        .auth-root { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; min-height: 100vh; display: flex; background: #fff; }

        /* ── Left panel ── */
        .auth-left {
          flex: 1; display: flex; flex-direction: column;
          background: linear-gradient(160deg, #0d1b3e 0%, #0f2564 40%, #1a1060 100%);
          padding: 48px 56px; position: relative; overflow: hidden; min-width: 0;
        }
        .auth-left-grid {
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .auth-left-glow-1 { position: absolute; top: -80px; left: -80px; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%); pointer-events: none; }
        .auth-left-glow-2 { position: absolute; bottom: -60px; right: -60px; width: 320px; height: 320px; border-radius: 50%; background: radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%); pointer-events: none; }
        .auth-left-inner { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; }

        /* Brand */
        .auth-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 64px; }
        .auth-brand-icon {
          width: 46px; height: 46px; border-radius: 13px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          display: flex; align-items: center; justify-content: center; gap: 3px;
          box-shadow: 0 8px 24px rgba(37,99,235,0.45);
        }
        .auth-brand-name { font-family: 'Sora', sans-serif; font-size: 19px; font-weight: 800; color: #f8fafc; letter-spacing: -0.3px; }
        .auth-brand-tag { font-size: 10px; color: rgba(255,255,255,0.3); font-weight: 600; text-transform: uppercase; letter-spacing: 0.7px; margin-top: 2px; }

        /* Hero */
        .auth-hero { flex: 1; }
        .auth-hero-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 99px;
          background: rgba(37,99,235,0.2); border: 1px solid rgba(37,99,235,0.35);
          color: #93c5fd; font-size: 12px; font-weight: 600; letter-spacing: 0.04em;
          margin-bottom: 20px;
        }
        .auth-hero-title {
          font-family: 'Sora', sans-serif;
          font-size: clamp(28px, 3.4vw, 44px); font-weight: 800; color: #fff;
          line-height: 1.08; letter-spacing: -1.2px; margin-bottom: 18px;
        }
        .auth-hero-title span {
          background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 60%, #f472b6 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .auth-hero-sub { color: rgba(255,255,255,0.48); font-size: 15.5px; line-height: 1.75; max-width: 420px; margin-bottom: 48px; }

        /* Features */
        .auth-features { display: flex; flex-direction: column; gap: 16px; }
        .auth-feature { display: flex; align-items: center; gap: 14px; }
        .auth-feature-icon {
          width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
        }
        .auth-feature-text { color: rgba(255,255,255,0.72); font-size: 14.5px; font-weight: 500; }

        /* Stats */
        .auth-stats { display: flex; gap: 12px; margin-top: auto; padding-top: 48px; flex-wrap: wrap; }
        .auth-stat {
          padding: 12px 20px; border-radius: 12px;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
          text-align: center;
        }
        .auth-stat-v { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 800; color: #fff; }
        .auth-stat-l { font-size: 11px; color: rgba(255,255,255,0.45); font-weight: 600; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.06em; }

        /* ── Right panel ── */
        .auth-right { width: 480px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; padding: 48px 44px; background: #fff; border-left: 1px solid #e8edf3; }
        .auth-form-wrap { width: 100%; max-width: 400px; }

        /* Tabs */
        .auth-tabs { display: flex; background: #f1f5f9; border-radius: 12px; padding: 4px; margin-bottom: 28px; gap: 4px; }
        .auth-tab { flex: 1; padding: 10px; border-radius: 9px; border: none; cursor: pointer; font-weight: 600; font-size: 14px; font-family: 'Plus Jakarta Sans', system-ui; transition: all 0.2s; }
        .auth-tab.active { background: #fff; color: #2563eb; box-shadow: 0 2px 8px rgba(30,58,138,0.1); }
        .auth-tab.inactive { background: transparent; color: #94a3b8; }
        .auth-tab.inactive:hover { color: #64748b; }

        .auth-heading { font-family: 'Sora', sans-serif; font-size: 23px; font-weight: 800; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.5px; }
        .auth-subheading { font-size: 14px; color: #64748b; margin-bottom: 24px; }

        /* Fields */
        .auth-fields { display: flex; flex-direction: column; gap: 16px; }
        .auth-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .auth-field-label { display: block; font-size: 11.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #374151; margin-bottom: 7px; }
        .auth-field-wrap { position: relative; }
        .auth-field-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
        .auth-field-input {
          width: 100%; padding: 11px 42px 11px 40px; background: #fafbfc;
          border: 1.5px solid #e2e8f0; border-radius: 11px; color: #0f172a;
          font-size: 14px; font-family: 'Plus Jakarta Sans', system-ui; outline: none; transition: all 0.18s;
        }
        .auth-field-input.no-toggle { padding-right: 14px; }
        .auth-field-input:focus { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .auth-field-input::placeholder { color: #94a3b8; }
        .auth-pwd-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94a3b8; padding: 4px 5px; border-radius: 6px; transition: color 0.15s; }
        .auth-pwd-toggle:hover { color: #2563eb; }

        .auth-strength-track { height: 5px; border-radius: 99px; background: #f1f5f9; overflow: hidden; margin-top: 8px; }
        .auth-strength-fill { height: 100%; border-radius: 99px; transition: width 0.28s ease, background 0.28s; }
        .auth-strength-label { font-size: 12px; font-weight: 600; margin-top: 5px; }

        .auth-error { display: flex; align-items: flex-start; gap: 9px; padding: 11px 14px; background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 10px; color: #dc2626; font-size: 13px; line-height: 1.5; }

        .auth-submit {
          width: 100%; padding: 14px; border-radius: 12px; border: none; font-weight: 700; font-size: 15px;
          font-family: 'Plus Jakarta Sans', system-ui; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: linear-gradient(135deg, #2563eb, #7c3aed); color: white;
          box-shadow: 0 4px 18px rgba(37,99,235,0.28); margin-top: 4px; transition: all 0.18s;
        }
        .auth-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(37,99,235,0.38); }
        .auth-submit:disabled { background: #e2e8f0; color: #94a3b8; box-shadow: none; cursor: not-allowed; transform: none; }

        .auth-forgot { text-align: center; margin-top: 10px; }
        .auth-forgot button { background: none; border: none; color: #2563eb; font-weight: 600; font-size: 13px; cursor: pointer; font-family: inherit; }
        .auth-forgot button:hover { text-decoration: underline; }

        .auth-footer { margin-top: 24px; text-align: center; font-size: 12.5px; color: #94a3b8; }
        .auth-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.75s linear infinite; }

        @media (max-width: 960px) {
          .auth-root { flex-direction: column; }
          .auth-right { width: 100%; border-left: none; border-top: 1px solid #e8edf3; padding: 40px 28px; }
          .auth-left { padding: 36px 28px; min-height: 260px; }
          .auth-features { display: none; }
        }
        @media (max-width: 520px) {
          .auth-two-col { grid-template-columns: 1fr; }
          .auth-right { padding: 28px 20px; }
        }
      `}</style>

      <div className="auth-root">

        {/* ── Left panel ── */}
        <div className="auth-left">
          <div className="auth-left-grid" />
          <div className="auth-left-glow-1" />
          <div className="auth-left-glow-2" />
          <div className="auth-left-inner">

            <div className="auth-brand">
              <div className="auth-brand-icon">
                <Brain size={19} color="white" />
                <Sparkles size={13} color="rgba(255,255,255,0.85)" />
              </div>
              <div>
                <p className="auth-brand-name">Umurava AI</p>
                <p className="auth-brand-tag">Recruiter Platform</p>
              </div>
            </div>

            <div className="auth-hero">
              <div className="auth-hero-eyebrow">
                <Sparkles size={12} /> AI-Powered Talent Screening
              </div>
              <h1 className="auth-hero-title">
                Hire the best.<br />Skip the noise.<br /><span>Powered by AI.</span>
              </h1>
              <p className="auth-hero-sub">
                Upload your candidates, define your requirements, and let our AI rank, score, and compare applicants — so your team focuses only on the people who truly fit.
              </p>

              <div className="auth-features">
                {features.map((f) => (
                  <div key={f.text} className="auth-feature">
                    <div className="auth-feature-icon">
                      <f.icon size={17} color="#60a5fa" />
                    </div>
                    <p className="auth-feature-text">{f.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="auth-stats">
              {stats.map((s) => (
                <div key={s.label} className="auth-stat">
                  <p className="auth-stat-v">{s.value}</p>
                  <p className="auth-stat-l">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="auth-right">
          <div className="auth-form-wrap">

            <div className="auth-tabs">
              {(["Sign In", "Create Account"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`auth-tab ${(tab === "Sign In") === isLogin ? "active" : "inactive"}`}
                  onClick={() => { setIsLogin(tab === "Sign In"); setShowPassword(false); }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <h2 className="auth-heading">{isLogin ? "Welcome back" : "Get started free"}</h2>
            <p className="auth-subheading">
              {isLogin ? "Sign in to your recruitment workspace." : "Create your account and start screening candidates."}
            </p>

            <div className="auth-fields">
              {!isLogin && (
                <>
                  <div>
                    <span className="auth-field-label">Company</span>
                    <div className="auth-field-wrap">
                      <span className="auth-field-icon"><Building2 size={15} /></span>
                      <input className="auth-field-input no-toggle" type="text" placeholder="Your company name" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                    </div>
                  </div>
                  <div className="auth-two-col">
                    <div>
                      <span className="auth-field-label">First name</span>
                      <div className="auth-field-wrap">
                        <span className="auth-field-icon"><User size={15} /></span>
                        <input className="auth-field-input no-toggle" type="text" placeholder="First" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <span className="auth-field-label">Last name</span>
                      <div className="auth-field-wrap">
                        <span className="auth-field-icon"><User size={15} /></span>
                        <input className="auth-field-input no-toggle" type="text" placeholder="Last" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <span className="auth-field-label">Email address</span>
                <div className="auth-field-wrap">
                  <span className="auth-field-icon"><Mail size={15} /></span>
                  <input className="auth-field-input no-toggle" type="email" placeholder="you@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter" && isLogin) handleAuth(); }} />
                </div>
              </div>

              <div>
                <span className="auth-field-label">Password</span>
                <div className="auth-field-wrap">
                  <span className="auth-field-icon"><Lock size={15} /></span>
                  <input className="auth-field-input" type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") handleAuth(); }} />
                  <button type="button" className="auth-pwd-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {!isLogin && form.password && (
                  <>
                    <div className="auth-strength-track">
                      <div className="auth-strength-fill" style={{ width: strengthConfig.w, background: strengthConfig.fill }} />
                    </div>
                    <p className="auth-strength-label" style={{ color: strengthConfig.color }}>{strengthConfig.label}</p>
                  </>
                )}
              </div>

              {error && (
                <div className="auth-error">
                  <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                  {error}
                </div>
              )}

              {isLogin && (
                <div className="auth-forgot">
                  <button type="button" onClick={() => toast("Contact your admin to reset your password.", { icon: "ℹ️" })}>
                    Forgot password?
                  </button>
                </div>
              )}

              <button type="button" className="auth-submit" disabled={loading} onClick={handleAuth}>
                {loading ? (
                  <span className="auth-spinner" />
                ) : isLogin ? (
                  <>Sign In <ArrowRight size={16} /></>
                ) : (
                  <>Create Account <ArrowRight size={16} /></>
                )}
              </button>
            </div>

            <p className="auth-footer">
              {isLogin ? "New to Umurava AI? " : "Already have an account? "}
              <button type="button" onClick={() => setIsLogin(!isLogin)} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer", fontSize: 12.5, fontFamily: "inherit" }}>
                {isLogin ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}