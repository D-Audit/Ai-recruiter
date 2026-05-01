"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Eye, EyeOff, Lock, Save } from "lucide-react";
import { resetPassword } from "../../../services/authService";

const getErrorMessage = (err: unknown, fallback: string) => {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof err.response === "object" &&
    err.response !== null &&
    "data" in err.response &&
    typeof err.response.data === "object" &&
    err.response.data !== null &&
    "message" in err.response.data &&
    typeof err.response.data.message === "string"
  ) {
    return err.response.data.message;
  }

  return fallback;
};

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params?.token || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Fill in both password fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      toast.success("Password reset successfully");
      router.replace("/login");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Could not reset password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .rp-root { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; padding: 24px; font-family: Inter, system-ui, sans-serif; }
        .rp-panel { width: 100%; max-width: 420px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08); }
        .rp-back { display: inline-flex; align-items: center; gap: 7px; color: #2563eb; font-size: 13px; font-weight: 700; text-decoration: none; margin-bottom: 22px; }
        .rp-title { font-size: 28px; line-height: 1.1; color: #0f172a; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 8px; }
        .rp-sub { color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 22px; }
        .rp-field { margin-bottom: 14px; }
        .rp-label { display: block; font-size: 12.5px; color: #374151; font-weight: 700; margin-bottom: 7px; }
        .rp-input-wrap { position: relative; }
        .rp-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: #94a3b8; display: flex; }
        .rp-eye { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); border: 0; background: transparent; color: #64748b; display: flex; cursor: pointer; }
        .rp-input { width: 100%; height: 46px; padding: 0 44px 0 42px; border-radius: 10px; border: 1.5px solid #e2e8f0; outline: none; color: #0f172a; font-size: 14px; }
        .rp-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .rp-btn { width: 100%; height: 48px; margin-top: 4px; border: 0; border-radius: 10px; background: #1e3a5f; color: #ffffff; font-size: 15px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; }
        .rp-btn:disabled { opacity: 0.65; cursor: not-allowed; }
      `}</style>

      <main className="rp-root">
        <section className="rp-panel">
          <Link href="/login" className="rp-back"><ArrowLeft size={15} /> Back to login</Link>
          <h1 className="rp-title">Create new password</h1>
          <p className="rp-sub">Choose a new password for your Umurava AI account.</p>

          <form onSubmit={handleSubmit}>
            <div className="rp-field">
              <label className="rp-label">New password</label>
              <div className="rp-input-wrap">
                <span className="rp-icon"><Lock size={15} /></span>
                <input
                  className="rp-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button type="button" className="rp-eye" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="rp-field">
              <label className="rp-label">Confirm password</label>
              <div className="rp-input-wrap">
                <span className="rp-icon"><Lock size={15} /></span>
                <input
                  className="rp-input"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
            </div>

            <button className="rp-btn" type="submit" disabled={loading}>
              {loading ? "Saving..." : <>Save new password <Save size={15} /></>}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
