"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import { changePassword } from "../../services/authService";
import toast from "react-hot-toast";
import { RootState } from "../../store";
import {
  Shield, KeyRound, Bell, Database, FileText,
  Eye, EyeOff, CheckCircle2, Sun, Moon, Monitor,
  Palette, User, Download, Trash2, Info,
} from "lucide-react";

type Theme = "light" | "dark" | "system";

export default function SettingsPage() {
  const { user } = useSelector((s: RootState) => s.auth);

  // Password
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSaved, setPwdSaved] = useState(false);

  // Notifications
  const [notifyScreening, setNotifyScreening] = useState(true);
  const [notifyUpload, setNotifyUpload] = useState(true);
  const [notifyWeekly, setNotifyWeekly] = useState(false);

  // Theme
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  const applyTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem("theme", t);
    const root = document.documentElement;
    if (t === "dark") root.setAttribute("data-theme", "dark");
    else if (t === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
    toast.success(`Theme set to ${t}`);
  };

  const handleChangePassword = async () => {
    if (!pwd.currentPassword || !pwd.newPassword) { toast.error("Fill in current and new password"); return; }
    if (pwd.newPassword.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    if (pwd.newPassword !== pwd.confirmPassword) { toast.error("New passwords do not match"); return; }
    setPwdSaving(true);
    try {
      await changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      toast.success("Password updated successfully");
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPwdSaved(true);
      setTimeout(() => setPwdSaved(false), 3000);
    } catch (e: unknown) {
      toast.error((e as any)?.response?.data?.message || "Could not change password");
    } finally {
      setPwdSaving(false);
    }
  };

  const pwdStrength = (p: string) => {
    if (!p) return null;
    const score = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/, p.length >= 10]
      .filter((t) => typeof t === "boolean" ? t : (t as RegExp).test(p)).length;
    if (score >= 4) return { label: "Strong", color: "#15803d", bg: "#4ade80", w: "100%" };
    if (score >= 2) return { label: "Medium", color: "#d97706", bg: "#fcd34d", w: "60%" };
    return { label: "Weak", color: "#dc2626", bg: "#fca5a5", w: "30%" };
  };
  const strength = pwdStrength(pwd.newPassword);

  return (
    <>
      <style>{`
        .st-root { display: flex; font-family: var(--font-body); }
        .st-main { margin-left: var(--sidebar-width); min-height: 100vh; background: var(--surface-base,#f8fafc); flex: 1; display: flex; flex-direction: column; }
        .st-content { padding: 32px 40px 80px; max-width: 760px; animation: fadeIn 0.28s ease; }

        .st-section-title {
          font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
          color: #94a3b8; margin: 28px 0 10px; padding-left: 2px;
        }
        .st-section-title:first-child { margin-top: 0; }

        .st-card {
          background: white; border-radius: 18px; border: 1.5px solid #e8edf3;
          padding: 24px 28px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); margin-bottom: 14px;
        }
        .st-card-title {
          font-size: 15px; font-weight: 700; color: #0f172a;
          margin-bottom: 4px; display: flex; align-items: center; gap: 9px;
        }
        .st-card-sub { color: #94a3b8; font-size: 13px; margin-bottom: 20px; line-height: 1.55; }

        /* Profile quick link */
        .st-profile-link {
          display: flex; align-items: center; gap: 8px; padding: 12px 16px;
          border-radius: 12px; background: linear-gradient(135deg,rgba(37,99,235,0.06),rgba(124,58,237,0.04));
          border: 1.5px solid rgba(37,99,235,0.12); color: #2563eb; font-weight: 600;
          font-size: 13.5px; text-decoration: none; margin-bottom: 20px;
          transition: all 0.15s;
        }
        .st-profile-link:hover { background: rgba(37,99,235,0.1); border-color: rgba(37,99,235,0.25); }

        /* Field */
        .st-field { margin-bottom: 16px; }
        .st-label { display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #374151; margin-bottom: 7px; }
        .st-input-wrap { position: relative; }
        .st-input {
          width: 100%; padding: 11px 42px 11px 14px; background: #fafbfc;
          border: 1.5px solid #e2e8f0; border-radius: 11px; color: #0f172a;
          font-size: 14px; font-family: inherit; outline: none; transition: all 0.18s;
        }
        .st-input:focus { border-color: #2563eb; background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .st-eye-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94a3b8; padding: 4px; }
        .st-eye-btn:hover { color: #2563eb; }

        .st-strength-track { height: 5px; border-radius: 99px; background: #f1f5f9; overflow: hidden; margin-top: 7px; }
        .st-strength-fill { height: 100%; border-radius: 99px; transition: width 0.28s; }
        .st-strength-label { font-size: 11.5px; font-weight: 600; margin-top: 5px; }

        /* Button */
        .st-btn {
          display: inline-flex; align-items: center; gap: 7px; padding: 11px 22px;
          border-radius: 11px; border: none; font-weight: 700; font-size: 13.5px;
          cursor: pointer; transition: all 0.15s; font-family: inherit;
          background: linear-gradient(135deg,#2563eb,#7c3aed); color: white;
          box-shadow: 0 4px 14px rgba(37,99,235,0.25);
        }
        .st-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.35); }
        .st-btn:disabled { background: #e2e8f0; color: #94a3b8; box-shadow: none; cursor: not-allowed; transform: none; }
        .st-btn.saved { background: linear-gradient(135deg,#16a34a,#15803d); box-shadow: 0 4px 14px rgba(22,163,74,0.25); }

        .st-btn-outline {
          display: inline-flex; align-items: center; gap: 7px; padding: 10px 18px;
          border-radius: 11px; border: 1.5px solid #e2e8f0; background: white; color: #475569;
          font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.15s; font-family: inherit;
        }
        .st-btn-outline:hover { border-color: #cbd5e1; background: #f8fafc; }
        .st-btn-danger {
          display: inline-flex; align-items: center; gap: 7px; padding: 10px 18px;
          border-radius: 11px; border: 1.5px solid #fecaca; background: #fef2f2; color: #dc2626;
          font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.15s; font-family: inherit;
        }
        .st-btn-danger:hover { background: #fee2e2; border-color: #fca5a5; }

        /* Toggle row */
        .st-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 0; border-bottom: 1px solid #f1f5f9; }
        .st-row:last-of-type { border-bottom: none; padding-bottom: 0; }
        .st-toggle { width: 44px; height: 26px; border-radius: 99px; border: none; cursor: pointer; background: #e2e8f0; position: relative; transition: background 0.22s; flex-shrink: 0; }
        .st-toggle.on { background: #2563eb; }
        .st-toggle::after { content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.2); transition: transform 0.22s; }
        .st-toggle.on::after { transform: translateX(18px); }

        /* Theme picker */
        .st-theme-grid { display: flex; gap: 10px; margin-top: 4px; }
        .st-theme-option {
          flex: 1; padding: 14px 10px; border-radius: 12px; border: 2px solid #e8edf3;
          background: white; cursor: pointer; text-align: center; transition: all 0.15s;
          font-family: inherit;
        }
        .st-theme-option:hover { border-color: #93c5fd; background: #f0f7ff; }
        .st-theme-option.active { border-color: #2563eb; background: #eff6ff; }
        .st-theme-option-icon { margin: 0 auto 8px; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .st-theme-option-label { font-size: 12px; font-weight: 600; color: #374151; }
        .st-theme-option.active .st-theme-option-label { color: #2563eb; }

        /* Meta grid */
        .st-meta { display: grid; grid-template-columns: repeat(auto-fill,minmax(140px,1fr)); gap: 10px; margin-top: 12px; }
        .st-meta-cell { background: #f8fafc; border-radius: 10px; padding: 12px; border: 1px solid #e8edf3; }
        .st-meta-k { color: #94a3b8; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.06em; margin-bottom: 4px; }
        .st-meta-v { color: #0f172a; font-weight: 600; font-size: 13px; }

        .st-divider { height: 1px; background: #f1f5f9; margin: 16px 0; }
        .st-info-row { display: flex; align-items: flex-start; gap: 10px; color: #64748b; font-size: 13px; margin-top: 12px; line-height: 1.55; }

        @media (max-width: 1024px) and (min-width: 769px) { .st-main { margin-left: var(--sidebar-collapsed,72px); } }
        @media (max-width: 768px) { .st-main { margin-left: 0; } .st-content { padding: 20px 16px 80px; } }
      `}</style>

      <div className="st-root">
        <Sidebar />
        <div className="st-main">
          <AppHeader title="Settings" subtitle="Security, appearance & workspace preferences" />
          <div className="st-content">

            {/* Quick profile link */}
            <Link href="/profile" className="st-profile-link">
              <User size={16} /> Edit your profile & display name →
            </Link>

            {/* ── SECURITY ── */}
            <p className="st-section-title">Security</p>
            <div className="st-card">
              <p className="st-card-title"><KeyRound size={17} color="#2563eb" /> Change Password</p>
              <p className="st-card-sub">Use a strong, unique password. You'll need your current password to update it.</p>

              <div className="st-field">
                <label className="st-label">Current password</label>
                <div className="st-input-wrap">
                  <input className="st-input" type={showPwd.current ? "text" : "password"} autoComplete="current-password" placeholder="Enter current password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} />
                  <button className="st-eye-btn" type="button" onClick={() => setShowPwd((s) => ({ ...s, current: !s.current }))}>{showPwd.current ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                </div>
              </div>

              <div className="st-field">
                <label className="st-label">New password</label>
                <div className="st-input-wrap">
                  <input className="st-input" type={showPwd.new ? "text" : "password"} autoComplete="new-password" placeholder="Min. 6 characters" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} />
                  <button className="st-eye-btn" type="button" onClick={() => setShowPwd((s) => ({ ...s, new: !s.new }))}>{showPwd.new ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                </div>
                {strength && (
                  <>
                    <div className="st-strength-track"><div className="st-strength-fill" style={{ width: strength.w, background: strength.bg }} /></div>
                    <p className="st-strength-label" style={{ color: strength.color }}>{strength.label} password</p>
                  </>
                )}
              </div>

              <div className="st-field">
                <label className="st-label">Confirm new password</label>
                <div className="st-input-wrap">
                  <input className="st-input" type={showPwd.confirm ? "text" : "password"} autoComplete="new-password" placeholder="Repeat new password" value={pwd.confirmPassword} onChange={(e) => setPwd({ ...pwd, confirmPassword: e.target.value })} />
                  <button className="st-eye-btn" type="button" onClick={() => setShowPwd((s) => ({ ...s, confirm: !s.confirm }))}>{showPwd.confirm ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                </div>
                {pwd.confirmPassword && pwd.newPassword !== pwd.confirmPassword && (
                  <p style={{ fontSize: 12, color: "#dc2626", marginTop: 5, fontWeight: 500 }}>Passwords don't match</p>
                )}
                {pwd.confirmPassword && pwd.newPassword === pwd.confirmPassword && pwd.confirmPassword.length >= 6 && (
                  <p style={{ fontSize: 12, color: "#15803d", marginTop: 5, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={13} /> Passwords match</p>
                )}
              </div>

              <button type="button" className={`st-btn${pwdSaved ? " saved" : ""}`} disabled={pwdSaving || !pwd.currentPassword || !pwd.newPassword} onClick={handleChangePassword}>
                {pwdSaved ? <CheckCircle2 size={15} /> : <Shield size={15} />}
                {pwdSaving ? "Updating…" : pwdSaved ? "Updated!" : "Update Password"}
              </button>
            </div>

            {/* ── APPEARANCE ── */}
            <p className="st-section-title">Appearance</p>
            <div className="st-card">
              <p className="st-card-title"><Palette size={17} color="#7c3aed" /> Theme</p>
              <p className="st-card-sub">Choose how Umurava AI looks. System follows your OS preference.</p>
              <div className="st-theme-grid">
                {([
                  { value: "light", icon: <Sun size={18} color="#d97706" />, label: "Light", bg: "#fffbeb" },
                  { value: "dark",  icon: <Moon size={18} color="#6366f1" />, label: "Dark",  bg: "#eef2ff" },
                  { value: "system",icon: <Monitor size={18} color="#64748b" />, label: "System", bg: "#f1f5f9" },
                ] as const).map((t) => (
                  <button key={t.value} className={`st-theme-option${theme === t.value ? " active" : ""}`} onClick={() => applyTheme(t.value)}>
                    <div className="st-theme-option-icon" style={{ background: t.bg }}>{t.icon}</div>
                    <p className="st-theme-option-label">{t.label}</p>
                    {theme === t.value && <CheckCircle2 size={14} color="#2563eb" style={{ margin: "4px auto 0" }} />}
                  </button>
                ))}
              </div>
            </div>

            {/* ── NOTIFICATIONS ── */}
            <p className="st-section-title">Notifications</p>
            <div className="st-card">
              <p className="st-card-title"><Bell size={17} color="#7c3aed" /> Notification Preferences</p>
              <p className="st-card-sub">Stored locally on this device. No emails are sent.</p>

              {[
                { key: "screening", label: "Screening completed", desc: "Alert when an AI screening run finishes", value: notifyScreening, set: setNotifyScreening },
                { key: "upload",    label: "Candidates uploaded",  desc: "Alert when new candidates are added to a job", value: notifyUpload,    set: setNotifyUpload },
                { key: "weekly",    label: "Weekly summary",        desc: "Digest of screening activity each Monday", value: notifyWeekly,    set: setNotifyWeekly },
              ].map((n) => (
                <div key={n.key} className="st-row">
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{n.label}</p>
                    <p style={{ fontSize: 12.5, color: "#94a3b8", marginTop: 3 }}>{n.desc}</p>
                  </div>
                  <button type="button" className={`st-toggle${n.value ? " on" : ""}`} aria-pressed={n.value} onClick={() => n.set(!n.value)} />
                </div>
              ))}
            </div>

            {/* ── DATA & WORKSPACE ── */}
            <p className="st-section-title">Data & Workspace</p>
            <div className="st-card">
              <p className="st-card-title"><Database size={17} color="#64748b" /> Workspace Info</p>
              <p className="st-card-sub">Screening data is scoped per job. Candidates are attached only to the job you select.</p>

              <div className="st-meta">
                {[
                  ["Account", user?.name || "—"],
                  ["Company", user?.company || "—"],
                  ["AI model", "Gemini"],
                  ["Screening cache", "24 h"],
                  ["Candidate compare", "Up to 3"],
                  ["Exports", "CSV / PDF"],
                ].map(([k, v]) => (
                  <div key={k} className="st-meta-cell">
                    <p className="st-meta-k">{k}</p>
                    <p className="st-meta-v">{v}</p>
                  </div>
                ))}
              </div>

              <div className="st-divider" />

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="st-btn-outline" onClick={() => toast("Export coming soon — use the Screenings page CSV download.", { icon: "ℹ️" })}>
                  <Download size={14} /> Export my data
                </button>
                <button className="st-btn-danger" onClick={() => toast.error("Contact support to delete your account.")}>
                  <Trash2 size={14} /> Delete account
                </button>
              </div>
            </div>

            {/* ── ABOUT ── */}
            <p className="st-section-title">About</p>
            <div className="st-card">
              <p className="st-card-title"><Info size={17} color="#64748b" /> About Umurava AI Recruiter</p>
              <div className="st-info-row">
                <FileText size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <p>Upload candidates via CSV, PDF, DOCX or manual entry, run AI-powered screening in seconds, and compare top candidates side-by-side — all in one workspace.</p>
              </div>
              <div className="st-info-row">
                <Shield size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <p>Screening results include a bias notice. AI rankings are decision-support tools — final hiring decisions must always be made by qualified human recruiters.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}