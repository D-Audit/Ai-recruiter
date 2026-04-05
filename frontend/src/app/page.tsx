"use client";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { loginUser, registerUser } from "../store/slices/authSlice";
import { AppDispatch, RootState } from "../store";
import toast from "react-hot-toast";
export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await dispatch(
          loginUser({ email: form.email, password: form.password })
        ).unwrap();
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
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background decoration */}
      <div style={{
        position: "absolute", top: "-200px", right: "-200px",
        width: "600px", height: "600px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)",
      }} />
      <div style={{
        position: "absolute", bottom: "-200px", left: "-200px",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
      }} />

      {/* Left side — branding */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "60px",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ maxWidth: "480px" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "20px",
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "32px", fontSize: "28px", fontWeight: "800", color: "white",
          }}>
            U
          </div>
          <h1 style={{
            fontSize: "48px", fontWeight: "800", color: "white",
            lineHeight: "1.1", marginBottom: "16px",
          }}>
            Hire smarter<br />
            <span style={{ background: "linear-gradient(135deg, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              with AI
            </span>
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "18px", lineHeight: "1.6", marginBottom: "40px" }}>
            Screen hundreds of candidates in seconds. Get ranked shortlists with AI-powered explanations.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              { icon: "⚡", text: "Screen 100+ candidates instantly" },
              { icon: "🎯", text: "AI-powered match scoring 0-100" },
              { icon: "📊", text: "Side-by-side candidate comparison" },
              { icon: "🔍", text: "Detailed strengths and gaps analysis" },
            ].map((item) => (
              <div key={item.text} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "20px" }}>{item.icon}</span>
                <span style={{ color: "#cbd5e1", fontSize: "15px" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side — form */}
      <div style={{
        width: "480px", display: "flex", alignItems: "center",
        justifyContent: "center", padding: "40px",
        position: "relative", zIndex: 1,
      }}>
        <div style={{
          width: "100%", background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(20px)", borderRadius: "24px",
          border: "1px solid rgba(255,255,255,0.1)",
          padding: "40px",
        }}>
          <h2 style={{ color: "white", fontSize: "24px", fontWeight: "700", marginBottom: "8px" }}>
            {isLogin ? "Welcome back" : "Create account"}
          </h2>
          <p style={{ color: "#94a3b8", marginBottom: "32px", fontSize: "14px" }}>
            {isLogin ? "Sign in to your recruiter dashboard" : "Start screening candidates with AI"}
          </p>

          {/* Tabs */}
          <div style={{
            display: "flex", background: "rgba(0,0,0,0.3)",
            borderRadius: "12px", padding: "4px", marginBottom: "24px",
          }}>
            {["Login", "Register"].map((tab) => (
              <button
                key={tab}
                onClick={() => setIsLogin(tab === "Login")}
                style={{
                  flex: 1, padding: "10px", borderRadius: "10px",
                  border: "none", cursor: "pointer", fontWeight: "600",
                  fontSize: "14px", transition: "all 0.2s",
                  background: (tab === "Login") === isLogin
                    ? "linear-gradient(135deg, #2563eb, #7c3aed)"
                    : "transparent",
                  color: (tab === "Login") === isLogin ? "white" : "#94a3b8",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {!isLogin && (
              <>
                <div>
                  <label style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    style={{
                      width: "100%", padding: "12px 16px",
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px", color: "white",
                      fontSize: "14px", outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                    Company
                  </label>
                  <input
                    type="text"
                    placeholder="Your Company"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    style={{
                      width: "100%", padding: "12px 16px",
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px", color: "white",
                      fontSize: "14px", outline: "none",
                    }}
                  />
                </div>
              </>
            )}

            <div>
              <label style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                style={{
                  width: "100%", padding: "12px 16px",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px", color: "white",
                  fontSize: "14px", outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                style={{
                  width: "100%", padding: "12px 16px",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px", color: "white",
                  fontSize: "14px", outline: "none",
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: "12px 16px", background: "rgba(220,38,38,0.15)",
                border: "1px solid rgba(220,38,38,0.3)", borderRadius: "10px",
                color: "#fca5a5", fontSize: "13px",
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "14px", borderRadius: "12px", border: "none",
                background: loading ? "#374151" : "linear-gradient(135deg, #2563eb, #7c3aed)",
                color: "white", fontWeight: "700", fontSize: "15px",
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: "8px", transition: "all 0.2s",
              }}
            >
              {loading ? "Please wait..." : isLogin ? "Sign In →" : "Create Account →"}
            </button>
          </form>

          <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", marginTop: "24px" }}>
            Powered by Google Gemini AI • Debug Thugs Team
          </p>
        </div>
      </div>
    </div>
  );
}