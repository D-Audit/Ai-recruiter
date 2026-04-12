"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import { changePassword } from "../../services/authService";
import toast from "react-hot-toast";
import {
  Settings,
  Shield,
  KeyRound,
  User,
  Bell,
  Database,
  FileText,
} from "lucide-react";

export default function SettingsPage() {
  const [pwd, setPwd] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [notifyScreening, setNotifyScreening] = useState(true);

  const handleChangePassword = async () => {
    if (!pwd.currentPassword || !pwd.newPassword) {
      toast.error("Fill in current and new password");
      return;
    }
    if (pwd.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (pwd.newPassword !== pwd.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setPwdSaving(true);
    try {
      await changePassword({
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      toast.success("Password updated");
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Could not change password";
      toast.error(msg);
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <>
      <style>{`
        .st-root { display: flex; font-family: system-ui, sans-serif; }
        .st-main { margin-left: 260px; min-height: 100vh; background: #f8fafc; flex: 1; display: flex; flex-direction: column; }
        .st-content { padding: 36px 40px; max-width: 720px; }
        .st-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 28px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); margin-bottom: 20px; }
        .st-card-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
        .st-card-sub { color: #94a3b8; font-size: 13px; margin-bottom: 22px; line-height: 1.5; }
        .st-label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
        .st-input {
          width: 100%; max-width: 400px; padding: 11px 14px; border-radius: 10px;
          border: 1.5px solid #e2e8f0; font-size: 14px; color: #1e293b;
          outline: none; background: #fafafa; transition: border-color 0.2s, box-shadow 0.2s;
          margin-bottom: 14px;
        }
        .st-input:focus { border-color: #2563eb; background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .st-btn {
          display: inline-flex; align-items: center; gap: 7px; padding: 11px 22px;
          border-radius: 11px; border: none;
          background: linear-gradient(135deg, #0f172a, #334155);
          color: white; font-weight: 700; font-size: 14px; cursor: pointer;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.2);
          transition: transform 0.15s;
        }
        .st-btn:hover { transform: translateY(-1px); }
        .st-btn:disabled { background: #94a3b8; cursor: not-allowed; transform: none; box-shadow: none; }
        .st-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 0; border-bottom: 1px solid #f1f5f9; }
        .st-row:last-of-type { border-bottom: none; }
        .st-toggle {
          width: 44px; height: 26px; border-radius: 99px; border: none; cursor: pointer;
          background: #e2e8f0; position: relative; transition: background 0.2s;
        }
        .st-toggle.on { background: #2563eb; }
        .st-toggle::after {
          content: ''; position: absolute; top: 3px; left: 3px;
          width: 20px; height: 20px; border-radius: 50%; background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15); transition: transform 0.2s;
        }
        .st-toggle.on::after { transform: translateX(18px); }
        .st-profile-link {
          display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #2563eb;
          text-decoration: none; margin-bottom: 20px;
        }
        .st-profile-link:hover { text-decoration: underline; }
        .st-meta { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; margin-top: 8px; }
        .st-meta-cell { background: #f8fafc; border-radius: 10px; padding: 12px; border: 1px solid #e2e8f0; font-size: 12px; }
        .st-meta-k { color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 10px; }
        .st-meta-v { color: #1e293b; font-weight: 600; margin-top: 4px; }
        @media (max-width: 900px) { .st-main { margin-left: 0; } }
      `}</style>

      <div className="st-root">
        <Sidebar />
        <div className="st-main">
          <AppHeader title="Settings" subtitle="Security, preferences, and workspace" />
          <div className="st-content">
            <Link href="/profile" className="st-profile-link">
              <User size={16} />
              Edit profile &amp; display name
            </Link>

            <div className="st-card">
              <p className="st-card-title">
                <KeyRound size={18} color="#2563eb" />
                Password
              </p>
              <p className="st-card-sub">
                Use a strong password unique to this workspace. You’ll need your current password to change it.
              </p>
              <label className="st-label">Current password</label>
              <input
                className="st-input"
                type="password"
                autoComplete="current-password"
                value={pwd.currentPassword}
                onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
              />
              <label className="st-label">New password</label>
              <input
                className="st-input"
                type="password"
                autoComplete="new-password"
                value={pwd.newPassword}
                onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
              />
              <label className="st-label">Confirm new password</label>
              <input
                className="st-input"
                type="password"
                autoComplete="new-password"
                value={pwd.confirmPassword}
                onChange={(e) => setPwd({ ...pwd, confirmPassword: e.target.value })}
              />
              <button
                type="button"
                className="st-btn"
                disabled={pwdSaving}
                onClick={handleChangePassword}
              >
                <Shield size={15} />
                {pwdSaving ? "Updating…" : "Update password"}
              </button>
            </div>

            <div className="st-card">
              <p className="st-card-title">
                <Bell size={18} color="#7c3aed" />
                Preferences
              </p>
              <p className="st-card-sub">
                Notification toggles are stored on this device for your workflow (demo).
              </p>
              <div className="st-row">
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>Screening completed</p>
                  <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    Toast when an AI screening run finishes
                  </p>
                </div>
                <button
                  type="button"
                  className={`st-toggle${notifyScreening ? " on" : ""}`}
                  aria-pressed={notifyScreening}
                  onClick={() => setNotifyScreening(!notifyScreening)}
                />
              </div>
            </div>

            <div className="st-card">
              <p className="st-card-title">
                <Settings size={18} color="#64748b" />
                Workspace &amp; data
              </p>
              <p className="st-card-sub">
                Umurava AI Recruiter — screening data is scoped per job. Uploaded candidates are attached only to the job you select.
              </p>
              <div className="st-meta">
                {[
                  ["Screening cache", "24h semantic"],
                  ["Compare", "Up to 3 candidates"],
                  ["AI", "Gemini"],
                  ["Exports", "PDF / CSV"],
                ].map(([k, v]) => (
                  <div key={k} className="st-meta-cell">
                    <p className="st-meta-k">{k}</p>
                    <p className="st-meta-v">{v}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, display: "flex", alignItems: "flex-start", gap: 10, color: "#64748b", fontSize: 13 }}>
                <Database size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <p>
                  Candidate uploads (CSV, PDF, manual) are always tied to the job chosen on the Applicants page.
                  Open a job and use &quot;Add applicants&quot; to pre-select that role.
                </p>
              </div>
              <div style={{ marginTop: 14, display: "flex", alignItems: "flex-start", gap: 10, color: "#64748b", fontSize: 13 }}>
                <FileText size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <p>
                  Use screening results to compare two or three candidates side-by-side; the AI assistant uses your latest screening when you ask about shortlists.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
