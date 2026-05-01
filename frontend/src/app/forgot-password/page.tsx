"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { requestPasswordReset } from "../../services/authService";

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      toast.error("Email is required");
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(cleanEmail);
      setSent(true);
      toast.success(res?.message || "Reset link sent");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Could not request reset link"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .fp-root { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; padding: 24px; font-family: Inter, system-ui, sans-serif; }
        .fp-panel { width: 100%; max-width: 420px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08); }
        .fp-back { display: inline-flex; align-items: center; gap: 7px; color: #2563eb; font-size: 13px; font-weight: 700; text-decoration: none; margin-bottom: 22px; }
        .fp-title { font-size: 28px; line-height: 1.1; color: #0f172a; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 8px; }
        .fp-sub { color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 22px; }
        .fp-field { margin-bottom: 16px; }
        .fp-label { display: block; font-size: 12.5px; color: #374151; font-weight: 700; margin-bottom: 7px; }
        .fp-input-wrap { position: relative; }
        .fp-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: #94a3b8; display: flex; }
        .fp-input { width: 100%; height: 46px; padding: 0 14px 0 42px; border-radius: 10px; border: 1.5px solid #e2e8f0; outline: none; color: #0f172a; font-size: 14px; }
        .fp-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .fp-btn { width: 100%; height: 48px; border: 0; border-radius: 10px; background: #1e3a5f; color: #ffffff; font-size: 15px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; }
        .fp-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .fp-note { margin-top: 16px; padding: 12px 14px; border-radius: 10px; background: #ecfdf5; color: #166534; font-size: 13px; line-height: 1.5; font-weight: 600; }
      `}</style>

      <main className="fp-root">
        <section className="fp-panel">
          <Link href="/login" className="fp-back"><ArrowLeft size={15} /> Back to login</Link>
          <h1 className="fp-title">Reset password</h1>
          <p className="fp-sub">Enter your account email and we will send a secure link to create a new password.</p>

          <form onSubmit={handleSubmit}>
            <div className="fp-field">
              <label className="fp-label">Email address</label>
              <div className="fp-input-wrap">
                <span className="fp-icon"><Mail size={15} /></span>
                <input
                  className="fp-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <button className="fp-btn" type="submit" disabled={loading}>
              {loading ? "Sending..." : <>Send reset link <Send size={15} /></>}
            </button>
          </form>

          {sent && (
            <p className="fp-note">Check your email for the reset link. In local development, check the backend terminal for the link.</p>
          )}
        </section>
      </main>
    </>
  );
}
