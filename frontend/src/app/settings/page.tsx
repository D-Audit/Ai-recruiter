"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import { getMe, changePassword } from "../../services/authService";
import { RootState } from "../../store";
import toast from "react-hot-toast";
import {
  Sun, Moon, Monitor, CheckCircle2, Shield, Bell, Eye, EyeOff,
  Palette, Database, Info, FileText, Trash2, User, Building2, Mail,
  Zap, Globe, Lock, BarChart3, RefreshCw,
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { user } = useSelector((s: RootState) => s.auth);
  const [me, setMe] = useState<any>(null);

  const getInitialTheme = () => {
    if (typeof window !== "undefined") return localStorage.getItem("theme") || "light";
    return "light";
  };
  const [theme, setTheme] = useState<"light" | "dark" | "system">(getInitialTheme as any);

  const [notifyScreening, setNotifyScreening] = useState(true);
  const [notifyUpload,    setNotifyUpload]    = useState(true);
  const [notifyWeekly,    setNotifyWeekly]    = useState(false);

  const [pwd, setPwd]       = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSaved,  setPwdSaved]  = useState(false);

  useEffect(() => {
    getMe().then((d) => setMe(d.user)).catch(() => {});
    const saved = localStorage.getItem("notify_prefs");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setNotifyScreening(p.screening ?? true);
        setNotifyUpload(p.upload ?? true);
        setNotifyWeekly(p.weekly ?? false);
      } catch {}
    }
  }, []);

  const applyTheme = (t: "light" | "dark" | "system") => {
    setTheme(t);
    localStorage.setItem("theme", t);
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else if (t === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }
    toast.success(`Theme set to ${t}`);
  };

  const handleToggleNotif = (key: string, val: boolean, setter: (v: boolean) => void) => {
    setter(val);
    const current = { screening: notifyScreening, upload: notifyUpload, weekly: notifyWeekly, [key]: val };
    localStorage.setItem("notify_prefs", JSON.stringify(current));
  };

  const handleChangePassword = async () => {
    if (!pwd.currentPassword || !pwd.newPassword) { toast.error("Fill in all password fields"); return; }
    if (pwd.newPassword !== pwd.confirmPassword)    { toast.error("New passwords don't match"); return; }
    if (pwd.newPassword.length < 6)                { toast.error("Password must be at least 6 characters"); return; }
    setPwdSaving(true);
    try {
      await changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      setPwdSaved(true);
      toast.success("Password updated");
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPwdSaved(false), 3000);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not update password");
    } finally {
      setPwdSaving(false);
    }
  };

  const passwordStrength = (p: string) => {
    if (p.length === 0) return null;
    if (p.length < 6)  return { label: "Weak",   color: "#ef4444", w: "25%" };
    if (p.length < 10) return { label: "Fair",   color: "#d97706", w: "55%" };
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) return { label: "Strong", color: "#16a34a", w: "100%" };
    return { label: "Good", color: "#2563eb", w: "80%" };
  };
  const strength = passwordStrength(pwd.newPassword);

  const displayUser = me || user;
  const initials = (displayUser?.name || "HR").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <style>{`
        .st-root    { display: flex; font-family: var(--font-body, system-ui); }
        .st-main    { margin-left: var(--sidebar-width); min-height: 100vh; background: var(--surface-base); flex: 1; display: flex; flex-direction: column; }
        .st-body    { padding: 32px 40px 100px; animation: fadeIn 0.28s ease; }
        .st-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
        .st-col     { display: flex; flex-direction: column; gap: 20px; }

        /* Section labels */
        .st-section-label {
          font-size: 10px; font-weight: 800; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: 0.14em;
          margin: 0 0 12px; display: flex; align-items: center; gap: 8px;
        }
        .st-section-label::after {
          content: ''; flex: 1; height: 1px; background: var(--border-muted);
        }

        /* Card */
        .st-card {
          background: var(--surface-card); border: 1.5px solid var(--border-soft);
          border-radius: 18px; padding: 24px 26px;
          box-shadow: var(--shadow-card);
        }
        .st-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
        .st-card-icon   {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .st-card-title  { font-size: 15px; font-weight: 800; color: var(--text-primary); }
        .st-card-sub    { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; line-height: 1.55; padding-left: 46px; }
        .st-divider     { height: 1px; background: var(--border-muted); margin: 16px 0; }

        /* Account hero */
        .st-account-hero {
          display: flex; align-items: center; gap: 18px;
          background: linear-gradient(135deg, rgba(37,99,235,0.06), rgba(124,58,237,0.04));
          border: 1.5px solid rgba(37,99,235,0.12);
          border-radius: 18px; padding: 22px 24px; margin-bottom: 20px;
        }
        .st-account-avatar {
          width: 64px; height: 64px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #1d4ed8, #7c3aed);
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 22px; font-weight: 800;
          box-shadow: 0 4px 18px rgba(37,99,235,0.35);
        }
        .st-account-name  { font-size: 18px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; }
        .st-account-field { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-muted); margin-top: 4px; }
        .st-edit-btn {
          margin-left: auto; display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 18px; border-radius: 11px;
          border: 1.5px solid var(--border-soft); background: var(--surface-card);
          color: var(--text-secondary); font-size: 13.5px; font-weight: 700;
          text-decoration: none; transition: all var(--transition-fast); white-space: nowrap;
          font-family: var(--font-body);
        }
        .st-edit-btn:hover { border-color: rgba(37,99,235,0.35); color: #2563eb; background: rgba(37,99,235,0.04); }

        /* Theme grid */
        .st-theme-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .st-theme-option {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          padding: 18px 12px; border-radius: 14px; border: 2px solid var(--border-soft);
          background: var(--surface-hover); cursor: pointer; font-family: var(--font-body);
          transition: all var(--transition-fast); position: relative;
        }
        .st-theme-option:hover { border-color: rgba(37,99,235,0.3); background: var(--surface-card); }
        .st-theme-option.active { border-color: #2563eb; background: rgba(37,99,235,0.05); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .st-theme-option-icon  { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .st-theme-option-label { font-size: 13.5px; font-weight: 800; color: var(--text-primary); }
        .st-theme-option-desc  { font-size: 11px; color: var(--text-muted); font-weight: 500; }
        .st-theme-check { position: absolute; top: 10px; right: 10px; }

        /* Notification rows */
        .st-notif-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 13px 0; border-bottom: 1px solid var(--border-muted); gap: 16px;
        }
        .st-notif-row:last-child { border-bottom: none; padding-bottom: 0; }
        .st-notif-label { font-weight: 700; font-size: 14px; color: var(--text-primary); }
        .st-notif-desc  { font-size: 12.5px; color: var(--text-muted); margin-top: 3px; line-height: 1.45; }

        /* Toggle */
        .st-toggle {
          width: 48px; height: 26px; border-radius: 99px; border: none; cursor: pointer;
          background: var(--border-soft); flex-shrink: 0; position: relative;
          transition: background 0.22s ease; outline: none;
        }
        .st-toggle::after {
          content: ''; position: absolute; left: 3px; top: 3px;
          width: 20px; height: 20px; border-radius: 50%;
          background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.25);
          transition: transform 0.22s ease;
        }
        .st-toggle.on { background: linear-gradient(135deg, #2563eb, #4f46e5); }
        .st-toggle.on::after { transform: translateX(22px); }

        /* Form fields */
        .st-field { margin-bottom: 16px; }
        .st-label {
          display: block; font-size: 11.5px; font-weight: 700;
          color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 7px;
        }
        .st-input-wrap { position: relative; }
        .st-input {
          width: 100%; padding: 11px 42px 11px 14px; border-radius: 11px;
          border: 1.5px solid var(--border-input); background: var(--surface-input);
          color: var(--text-primary); font-size: 14px; font-family: var(--font-body); outline: none;
          transition: all var(--transition-fast);
        }
        .st-input:focus { border-color: var(--brand-primary); background: var(--surface-card); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .st-eye-btn {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex;
          transition: color var(--transition-fast);
        }
        .st-eye-btn:hover { color: var(--text-primary); }
        .st-strength-track { height: 5px; background: var(--border-muted); border-radius: 99px; overflow: hidden; margin-top: 8px; }
        .st-strength-fill  { height: 100%; border-radius: 99px; transition: all 0.3s ease; }
        .st-strength-label { font-size: 12px; font-weight: 700; margin-top: 5px; }

        /* Buttons */
        .st-btn {
          display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px;
          border-radius: 11px; border: none; background: linear-gradient(135deg, #2563eb, #4f46e5);
          color: white; font-weight: 700; font-size: 14px; cursor: pointer;
          font-family: var(--font-body); box-shadow: 0 4px 16px rgba(37,99,235,0.3);
          transition: all var(--transition-fast);
        }
        .st-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(37,99,235,0.42); }
        .st-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }
        .st-btn.saved { background: linear-gradient(135deg, #16a34a, #15803d); box-shadow: 0 4px 14px rgba(22,163,74,0.3); }

        .st-btn-ghost {
          display: inline-flex; align-items: center; gap: 7px; padding: 10px 20px;
          border-radius: 10px; border: 1.5px solid var(--border-soft);
          background: var(--surface-card); color: var(--text-secondary);
          font-weight: 600; font-size: 13.5px; cursor: pointer;
          font-family: var(--font-body); transition: all var(--transition-fast);
        }
        .st-btn-ghost:hover { border-color: var(--border-input); color: var(--text-primary); background: var(--surface-hover); }

        .st-btn-danger {
          display: inline-flex; align-items: center; gap: 7px; padding: 10px 20px;
          border-radius: 10px; border: 1.5px solid rgba(239,68,68,0.25);
          background: rgba(239,68,68,0.06); color: #ef4444;
          font-weight: 700; font-size: 13.5px; cursor: pointer;
          font-family: var(--font-body); transition: all var(--transition-fast);
        }
        .st-btn-danger:hover { background: #ef4444; color: white; border-color: #ef4444; box-shadow: 0 4px 14px rgba(239,68,68,0.3); }

        /* Meta grid */
        .st-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .st-meta-cell {
          padding: 13px 15px; background: var(--surface-hover);
          border-radius: 11px; border: 1px solid var(--border-muted);
        }
        .st-meta-k { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); }
        .st-meta-v { font-size: 14px; font-weight: 800; color: var(--text-primary); margin-top: 5px; }

        /* Info rows */
        .st-info-row {
          display: flex; align-items: flex-start; gap: 11px;
          color: var(--text-secondary); font-size: 13.5px; line-height: 1.65;
          padding: 12px 0; border-bottom: 1px solid var(--border-muted);
        }
        .st-info-row:last-child { border-bottom: none; }
        .st-info-icon { flex-shrink: 0; margin-top: 2px; color: var(--text-muted); }

        /* Quick stats bar */
        .st-stats-bar {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 0;
          border: 1.5px solid var(--border-soft); border-radius: 14px; overflow: hidden;
          margin-bottom: 20px;
        }
        .st-stat-cell {
          padding: 16px 18px; text-align: center;
          border-right: 1px solid var(--border-muted);
        }
        .st-stat-cell:last-child { border-right: none; }
        .st-stat-num   { font-size: 22px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.04em; line-height: 1; }
        .st-stat-label { font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; margin-top: 5px; }

        @media (max-width: 900px) {
          .st-main    { margin-left: 0; }
          .st-body    { padding: 20px 16px 80px; }
          .st-columns { grid-template-columns: 1fr; }
          .st-meta    { grid-template-columns: 1fr; }
          .st-stats-bar { grid-template-columns: 1fr; }
          .st-stat-cell { border-right: none; border-bottom: 1px solid var(--border-muted); }
          .st-stat-cell:last-child { border-bottom: none; }
          .st-account-hero { flex-direction: column; align-items: flex-start; }
          .st-edit-btn { margin-left: 0; }
        }
      `}</style>

      <div className="st-root">
        <Sidebar />
        <div className="st-main">
          <AppHeader title="Settings" subtitle="Account, appearance and workspace preferences" />
          <div className="st-body">

            {/* ── Account hero ── */}
            <div className="st-account-hero">
              <div className="st-account-avatar">{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="st-account-name">{displayUser?.name || "User"}</p>
                {displayUser?.email && (
                  <p className="st-account-field"><Mail size={13} /> {displayUser.email}</p>
                )}
                {displayUser?.company && (
                  <p className="st-account-field"><Building2 size={13} /> {displayUser.company}</p>
                )}
              </div>
              <Link href="/profile" className="st-edit-btn">
                <User size={15} /> Edit Profile
              </Link>
            </div>

            {/* ── Quick stats ── */}
            <div className="st-stats-bar">
              <div className="st-stat-cell">
                <p className="st-stat-num" style={{ color: "#2563eb" }}>Gemini</p>
                <p className="st-stat-label">AI Model</p>
              </div>
              <div className="st-stat-cell">
                <p className="st-stat-num">24h</p>
                <p className="st-stat-label">Cache TTL</p>
              </div>
              <div className="st-stat-cell">
                <p className="st-stat-num" style={{ color: "#7c3aed" }}>3</p>
                <p className="st-stat-label">Max Compare</p>
              </div>
            </div>

            {/* ── Two-column layout ── */}
            <div className="st-columns">

              {/* LEFT column */}
              <div className="st-col">

                {/* Appearance */}
                <div>
                  <p className="st-section-label"><Palette size={13} /> Appearance</p>
                  <div className="st-card">
                    <div className="st-card-header">
                      <div className="st-card-icon" style={{ background: "rgba(124,58,237,0.1)" }}>
                        <Palette size={18} color="#7c3aed" />
                      </div>
                      <p className="st-card-title">Theme</p>
                    </div>
                    <p className="st-card-sub">Choose how Umurava AI looks. System follows your device.</p>
                    <div className="st-theme-grid">
                      {([
                        { value: "light",  icon: <Sun size={22} color="#d97706" />,     label: "Light",  iconBg: "#fffbeb", desc: "Bright & clean" },
                        { value: "dark",   icon: <Moon size={22} color="#6366f1" />,    label: "Dark",   iconBg: "#eef2ff", desc: "Easy on eyes" },
                        { value: "system", icon: <Monitor size={22} color="#64748b" />, label: "System", iconBg: "#f1f5f9", desc: "Auto-detect" },
                      ] as const).map((t) => (
                        <button key={t.value} className={`st-theme-option${theme === t.value ? " active" : ""}`} onClick={() => applyTheme(t.value)}>
                          <div className="st-theme-option-icon" style={{ background: t.iconBg }}>{t.icon}</div>
                          <p className="st-theme-option-label">{t.label}</p>
                          <p className="st-theme-option-desc">{t.desc}</p>
                          {theme === t.value && (
                            <span className="st-theme-check"><CheckCircle2 size={16} color="#2563eb" /></span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div>
                  <p className="st-section-label"><Bell size={13} /> Notifications</p>
                  <div className="st-card">
                    <div className="st-card-header">
                      <div className="st-card-icon" style={{ background: "rgba(37,99,235,0.1)" }}>
                        <Bell size={18} color="#2563eb" />
                      </div>
                      <p className="st-card-title">Notification Preferences</p>
                    </div>
                    <p className="st-card-sub">Saved locally on this device.</p>
                    {[
                      { key: "screening", label: "Screening completed", desc: "Alert when an AI screening run finishes",        value: notifyScreening, set: setNotifyScreening },
                      { key: "upload",    label: "Candidates uploaded",  desc: "Alert when candidates are added to a job",       value: notifyUpload,    set: setNotifyUpload },
                      { key: "weekly",    label: "Weekly summary",       desc: "Digest of screening activity each Monday",       value: notifyWeekly,    set: setNotifyWeekly },
                    ].map((n) => (
                      <div key={n.key} className="st-notif-row">
                        <div>
                          <p className="st-notif-label">{n.label}</p>
                          <p className="st-notif-desc">{n.desc}</p>
                        </div>
                        <button
                          type="button"
                          className={`st-toggle${n.value ? " on" : ""}`}
                          aria-pressed={n.value}
                          onClick={() => handleToggleNotif(n.key, !n.value, n.set)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* About */}
                <div>
                  <p className="st-section-label"><Info size={13} /> About</p>
                  <div className="st-card">
                    <div className="st-card-header">
                      <div className="st-card-icon" style={{ background: "rgba(100,116,139,0.1)" }}>
                        <Zap size={18} color="#64748b" />
                      </div>
                      <p className="st-card-title">About Umurava AI</p>
                    </div>
                    <p className="st-card-sub">Version 1.0 · Built for Rwanda&apos;s talent market.</p>
                    <div className="st-info-row">
                      <FileText size={16} className="st-info-icon" />
                      <span>Upload candidates via CSV, PDF, DOCX or manual entry, run AI-powered screening in seconds, and compare top candidates side by side.</span>
                    </div>
                    <div className="st-info-row">
                      <Shield size={16} className="st-info-icon" />
                      <span>AI rankings are decision-support tools only. Final hiring decisions must always be made by qualified human recruiters.</span>
                    </div>
                    <div className="st-info-row">
                      <Globe size={16} className="st-info-icon" />
                      <span>Powered by Google Gemini AI with a 24-hour semantic cache for fast re-runs on the same candidate pool.</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT column */}
              <div className="st-col">

                {/* Security */}
                <div>
                  <p className="st-section-label"><Shield size={13} /> Security</p>
                  <div className="st-card">
                    <div className="st-card-header">
                      <div className="st-card-icon" style={{ background: "rgba(37,99,235,0.1)" }}>
                        <Lock size={18} color="#2563eb" />
                      </div>
                      <p className="st-card-title">Change Password</p>
                    </div>
                    <p className="st-card-sub">Use a strong password with uppercase letters and numbers.</p>

                    <div className="st-field">
                      <label className="st-label">Current password</label>
                      <div className="st-input-wrap">
                        <input className="st-input" type={showPwd.current ? "text" : "password"} placeholder="Enter current password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} />
                        <button className="st-eye-btn" type="button" onClick={() => setShowPwd((s) => ({ ...s, current: !s.current }))}>
                          {showPwd.current ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <div className="st-field">
                      <label className="st-label">New password</label>
                      <div className="st-input-wrap">
                        <input className="st-input" type={showPwd.new ? "text" : "password"} placeholder="At least 6 characters" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} />
                        <button className="st-eye-btn" type="button" onClick={() => setShowPwd((s) => ({ ...s, new: !s.new }))}>
                          {showPwd.new ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {strength && (
                        <>
                          <div className="st-strength-track">
                            <div className="st-strength-fill" style={{ width: strength.w, background: strength.color }} />
                          </div>
                          <p className="st-strength-label" style={{ color: strength.color }}>{strength.label} password</p>
                        </>
                      )}
                    </div>

                    <div className="st-field">
                      <label className="st-label">Confirm new password</label>
                      <div className="st-input-wrap">
                        <input className="st-input" type={showPwd.confirm ? "text" : "password"} placeholder="Repeat new password" value={pwd.confirmPassword} onChange={(e) => setPwd({ ...pwd, confirmPassword: e.target.value })} />
                        <button className="st-eye-btn" type="button" onClick={() => setShowPwd((s) => ({ ...s, confirm: !s.confirm }))}>
                          {showPwd.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {pwd.confirmPassword && pwd.newPassword !== pwd.confirmPassword && (
                        <p style={{ fontSize: 12.5, color: "#dc2626", marginTop: 6, fontWeight: 600 }}>Passwords don&apos;t match</p>
                      )}
                      {pwd.confirmPassword && pwd.newPassword === pwd.confirmPassword && pwd.confirmPassword.length >= 6 && (
                        <p style={{ fontSize: 12.5, color: "#16a34a", marginTop: 6, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                          <CheckCircle2 size={13} /> Passwords match
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      className={`st-btn${pwdSaved ? " saved" : ""}`}
                      disabled={pwdSaving || !pwd.currentPassword || !pwd.newPassword}
                      onClick={handleChangePassword}
                    >
                      {pwdSaved ? <CheckCircle2 size={15} /> : <Shield size={15} />}
                      {pwdSaving ? "Updating…" : pwdSaved ? "Updated!" : "Update Password"}
                    </button>
                  </div>
                </div>

                {/* Workspace */}
                <div>
                  <p className="st-section-label"><Database size={13} /> Workspace</p>
                  <div className="st-card">
                    <div className="st-card-header">
                      <div className="st-card-icon" style={{ background: "rgba(100,116,139,0.1)" }}>
                        <Database size={18} color="#64748b" />
                      </div>
                      <p className="st-card-title">Workspace Info</p>
                    </div>
                    <p className="st-card-sub">Screening data is scoped per job. Candidates are attached only to jobs you select.</p>
                    <div className="st-meta">
                      {[
                        ["Account",         displayUser?.name    || "—"],
                        ["Company",         displayUser?.company || "—"],
                        ["AI Model",        "Gemini 2.5 Flash"],
                        ["Screening Cache", "24 hours"],
                        ["Compare Limit",   "Up to 3"],
                        ["Data Scope",      "Per-job"],
                      ].map(([k, v]) => (
                        <div key={k} className="st-meta-cell">
                          <p className="st-meta-k">{k}</p>
                          <p className="st-meta-v">{v}</p>
                        </div>
                      ))}
                    </div>
                    <div className="st-divider" />
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        className="st-btn-ghost"
                        onClick={() => { localStorage.clear(); toast.success("Local data cleared"); }}
                      >
                        <RefreshCw size={14} /> Clear Local Data
                      </button>
                      <button
                        className="st-btn-danger"
                        onClick={() => toast.error("Contact support to delete your account.")}
                      >
                        <Trash2 size={14} /> Delete Account
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 