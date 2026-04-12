"use client";

import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { loginUser, registerUser } from "../store/slices/authSlice";
import { AppDispatch, RootState } from "../store";
import toast from "react-hot-toast";
import {
  Brain,
  Mail,
  Lock,
  User,
  Building2,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

function passwordStrength(pwd: string): "weak" | "medium" | "strong" {
  if (pwd.length < 6) return "weak";
  const hasLower = /[a-z]/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNum = /\d/.test(pwd);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);
  const score =
    (pwd.length >= 10 ? 2 : pwd.length >= 8 ? 1 : 0) +
    (hasLower ? 1 : 0) +
    (hasUpper ? 1 : 0) +
    (hasNum ? 1 : 0) +
    (hasSpecial ? 1 : 0);
  if (score >= 5) return "strong";
  if (score >= 3) return "medium";
  return "weak";
}

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    company: "",
  });

  const strength = useMemo(
    () => passwordStrength(form.password),
    [form.password]
  );

  const strengthStyle = {
    weak: { label: "Weak", bg: "#fee2e2", color: "#dc2626", w: "33%" },
    medium: { label: "Medium", bg: "#fef9c3", color: "#ca8a04", w: "66%" },
    strong: { label: "Strong", bg: "#dcfce7", color: "#15803d", w: "100%" },
  }[strength];

  const handleAuth = async () => {
    try {
      if (isLogin) {
        await dispatch(
          loginUser({ email: form.email, password: form.password })
        ).unwrap();
        toast.success("Welcome back!");
      } else {
        const name = `${form.firstName} ${form.lastName}`.trim();
        if (!name) {
          toast.error("Enter your first and last name");
          return;
        }
        if (!form.company.trim()) {
          toast.error("Enter your company name");
          return;
        }
        await dispatch(
          registerUser({
            name,
            email: form.email,
            password: form.password,
            company: form.company.trim(),
          })
        ).unwrap();
        toast.success("Account created!");
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(typeof err === "string" ? err : "Something went wrong");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        .auth-root { font-family: 'DM Sans', sans-serif; min-height: 100vh; display: flex; background: #fff; }
        .auth-left {
          flex: 1;
          background: linear-gradient(165deg, #0f172a 0%, #1e3a5f 100%);
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 48px 56px 40px; position: relative; overflow: hidden;
        }
        .auth-left::before {
          content: ''; position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .auth-left-inner { position: relative; z-index: 1; max-width: 460px; }
        .brand-row { display: flex; align-items: center; gap: 12px; margin-bottom: 48px; }
        .brand-icon {
          width: 48px; height: 48px; border-radius: 14px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          display: flex; align-items: center; justify-content: center; gap: 4px;
          box-shadow: 0 6px 20px rgba(37,99,235,0.35);
        }
        .brand-name { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 800; color: #f8fafc; }
        .hero-title {
          font-family: 'Sora', sans-serif; font-size: clamp(28px, 3.5vw, 44px);
          font-weight: 800; color: #fff; line-height: 1.12; letter-spacing: -1px; margin-bottom: 16px;
        }
        .hero-sub { color: rgba(255,255,255,0.62); font-size: 16px; line-height: 1.65; max-width: 400px; }
        .stat-row { display: flex; gap: 14px; flex-wrap: wrap; margin-top: auto; position: relative; z-index: 1; }
        .stat-pill {
          padding: 12px 18px; border-radius: 12px;
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.88); font-size: 13px; font-weight: 700;
        }
        .auth-right {
          width: 480px; display: flex; align-items: center; justify-content: center;
          padding: 48px 44px; background: #fff; border-left: 1px solid #e2e8f0;
        }
        .tab-bar { display: flex; background: #f1f5f9; border-radius: 11px; padding: 4px; margin-bottom: 26px; gap: 4px; }
        .tab-btn {
          flex: 1; padding: 10px; border-radius: 8px; border: none; cursor: pointer;
          font-weight: 600; font-size: 14px; font-family: 'DM Sans', sans-serif; transition: all 0.2s;
        }
        .tab-btn.active { background: #fff; color: #2563eb; box-shadow: 0 2px 8px rgba(30,58,138,0.1); }
        .tab-btn.inactive { background: transparent; color: #94a3b8; }
        .field-label {
          color: #374151; font-size: 11px; font-weight: 600; letter-spacing: 0.07em;
          text-transform: uppercase; display: block; margin-bottom: 7px;
        }
        .field-wrap { position: relative; }
        .field-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
        .field-input {
          width: 100%; padding: 11px 44px 11px 42px; background: #f8fafc;
          border: 1.5px solid #e2e8f0; border-radius: 10px; color: #0f172a; font-size: 14px;
          font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s, box-shadow 0.2s;
        }
        .field-input.no-toggle { padding-right: 14px; }
        .field-input:focus { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .pwd-toggle {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #94a3b8; padding: 4px; border-radius: 6px;
        }
        .pwd-toggle:hover { color: #2563eb; background: rgba(37,99,235,0.07); }
        .strength-track { height: 6px; border-radius: 99px; background: #f1f5f9; overflow: hidden; margin-top: 8px; }
        .strength-fill { height: 100%; border-radius: 99px; transition: width 0.25s ease; }
        .strength-label { font-size: 12px; font-weight: 600; margin-top: 6px; }
        .form-error {
          display: flex; align-items: flex-start; gap: 9px; padding: 11px 14px;
          background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 10px;
          color: #dc2626; font-size: 13px;
        }
        .submit-btn {
          width: 100%; padding: 14px; border-radius: 11px; border: none; font-weight: 700; font-size: 15px;
          font-family: 'DM Sans', sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          background: linear-gradient(135deg, #2563eb, #7c3aed); color: white;
          box-shadow: 0 4px 18px rgba(37,99,235,0.28); margin-top: 8px;
        }
        .submit-btn:disabled { background: #e2e8f0; color: #94a3b8; box-shadow: none; cursor: not-allowed; }
        .forgot {
          margin-top: 12px; text-align: center; font-size: 13px; color: #64748b;
        }
        .forgot button {
          background: none; border: none; color: #2563eb; font-weight: 600; cursor: pointer; font-size: 13px;
        }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 960px) {
          .auth-root { flex-direction: column; }
          .auth-right { width: 100%; border-left: none; border-top: 1px solid #e2e8f0; }
          .auth-left { padding: 36px 28px; min-height: 320px; }
        }
        @media (max-width: 520px) { .two-col { grid-template-columns: 1fr; } }
      `}</style>

      <div className="auth-root">
        <div className="auth-left">
          <div className="auth-left-inner">
            <div className="brand-row">
              <div className="brand-icon">
                <Brain size={20} color="white" />
                <Sparkles size={16} color="white" />
              </div>
              <span className="brand-name">Umurava AI</span>
            </div>
            <h1 className="hero-title">AI-Powered Talent Screening</h1>
            <p className="hero-sub">
              Screen hundreds of candidates in seconds. Ranked, explained, ready
              to hire.
            </p>
          </div>
          <div className="stat-row">
            <span className="stat-pill">10–100x Faster</span>
            <span className="stat-pill">AI-Ranked</span>
            <span className="stat-pill">Bias-Aware</span>
          </div>
        </div>

        <div className="auth-right">
          <div style={{ width: "100%", maxWidth: 400 }}>
            <div className="tab-bar">
              {(["Login", "Register"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`tab-btn ${(tab === "Login") === isLogin ? "active" : "inactive"}`}
                  onClick={() => {
                    setIsLogin(tab === "Login");
                    setShowPassword(false);
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {!isLogin && (
                <>
                  <div>
                    <span className="field-label">Company name</span>
                    <div className="field-wrap">
                      <span className="field-icon">
                        <Building2 size={15} />
                      </span>
                      <input
                        className="field-input no-toggle"
                        type="text"
                        placeholder="Your company"
                        value={form.company}
                        onChange={(e) =>
                          setForm({ ...form, company: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="two-col">
                    <div>
                      <span className="field-label">First name</span>
                      <div className="field-wrap">
                        <span className="field-icon">
                          <User size={15} />
                        </span>
                        <input
                          className="field-input no-toggle"
                          type="text"
                          placeholder="First name"
                          value={form.firstName}
                          onChange={(e) =>
                            setForm({ ...form, firstName: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <span className="field-label">Last name</span>
                      <div className="field-wrap">
                        <span className="field-icon">
                          <User size={15} />
                        </span>
                        <input
                          className="field-input no-toggle"
                          type="text"
                          placeholder="Last name"
                          value={form.lastName}
                          onChange={(e) =>
                            setForm({ ...form, lastName: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <span className="field-label">Email</span>
                <div className="field-wrap">
                  <span className="field-icon">
                    <Mail size={15} />
                  </span>
                  <input
                    className="field-input no-toggle"
                    type="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <span className="field-label">Password</span>
                <div className="field-wrap">
                  <span className="field-icon">
                    <Lock size={15} />
                  </span>
                  <input
                    className="field-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="pwd-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {!isLogin && form.password ? (
                  <>
                    <div className="strength-track">
                      <div
                        className="strength-fill"
                        style={{
                          width: strengthStyle.w,
                          background: strengthStyle.bg,
                        }}
                      />
                    </div>
                    <p
                      className="strength-label"
                      style={{ color: strengthStyle.color }}
                    >
                      {strengthStyle.label}
                    </p>
                  </>
                ) : null}
              </div>

              {error ? (
                <div className="form-error">
                  <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                  {error}
                </div>
              ) : null}

              {isLogin ? (
                <div className="forgot">
                  <button
                    type="button"
                    onClick={() =>
                      toast("Contact your admin", { icon: "ℹ️" })
                    }
                  >
                    Forgot password?
                  </button>
                </div>
              ) : null}

              <button
                type="button"
                className="submit-btn"
                disabled={loading}
                onClick={handleAuth}
              >
                {loading ? (
                  "Please wait…"
                ) : isLogin ? (
                  <>
                    Sign In <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    Create Account <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
