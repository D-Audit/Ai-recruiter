"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import { getMe, changePassword } from "../../services/authService";  // ← FIX: was updatePassword (doesn't exist), correct name is changePassword
import { RootState } from "../../store";
import toast from "react-hot-toast";
import {
  Sun, Moon, Monitor, CheckCircle2, Shield, Bell, Eye, EyeOff,
  Palette, Database, Info, FileText, Trash2, User, Building2, Mail,
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
  const [notifyUpload, setNotifyUpload] = useState(true);
  const [notifyWeekly, setNotifyWeekly] = useState(false);

  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSaved, setPwdSaved] = useState(false);

  useEffect(() => {
    getMe().then((d) => setMe(d.user)).catch(() => {});
    const savedNotify = localStorage.getItem("notify_prefs");
    if (savedNotify) {
      try {
        const p = JSON.parse(savedNotify);
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
    if (pwd.newPassword !== pwd.confirmPassword) { toast.error("New passwords don't match"); return; }
    if (pwd.newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setPwdSaving(true);
    try {
      await changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword }); // ← uses the correctly named import
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
    if (p.length < 6) return { label: "Weak", color: "#ef4444", bg: "#fee2e2", w: "25%" };
    if (p.length < 10) return { label: "Fair", color: "#d97706", bg: "#fef9c3", w: "55%" };
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) return { label: "Strong", color: "#16a34a", bg: "#dcfce7", w: "100%" };
    return { label: "Good", color: "#2563eb", bg: "#dbeafe", w: "80%" };
  };
  const strength = passwordStrength(pwd.newPassword);

  return (
    <>
      <style>{`
        .st-root { display: flex; font-family: var(--font-body, system-ui); }
        .st-main { margin-left: var(--sidebar-width); min-height: 100vh; background: var(--surface-base); flex: 1; display: flex; flex-direction: column; }
        .st-content { padding: 28px 40px 80px; max-width: 720px; animation: fadeIn 0.28s ease; }

        .st-section-title { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin: 28px 0 10px; }
        .st-section-title:first-child { margin-top: 0; }

        .st-card { background: var(--surface-card); border: 1.5px solid var(--border-soft); border-radius: 18px; padding: 24px 26px; box-shadow: var(--shadow-card); margin-bottom: 4px; }
        .st-card-title { font-size: 15px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .st-card-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; line-height: 1.5; }
        .st-divider { height: 1px; background: var(--border-muted); margin: 16px 0; }

        /* Theme cards */
        .st-theme-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
        .st-theme-option {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          padding: 16px 12px; border-radius: 14px; border: 2px solid var(--border-soft);
          background: var(--surface-card); cursor: pointer; font-family: var(--font-body);
          transition: all var(--transition-fast); position: relative;
        }
        .st-theme-option:hover { border-color: rgba(37,99,235,0.3); background: var(--surface-hover); }
        .st-theme-option.active { border-color: #2563eb; background: rgba(37,99,235,0.04); }
        .st-theme-option-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .st-theme-option-label { font-size: 13px; font-weight: 700; color: var(--text-primary); }

        /* Form fields */
        .st-field { margin-bottom: 16px; }
        .st-label { display: block; font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 7px; }
        .st-input-wrap { position: relative; }
        .st-input {
          width: 100%; padding: 11px 42px 11px 14px; border-radius: 11px;
          border: 1.5px solid var(--border-input); background: var(--surface-input);
          color: var(--text-primary); font-size: 14px; font-family: var(--font-body); outline: none;
          transition: all var(--transition-fast);
        }
        .st-input:focus { border-color: var(--brand-primary); background: var(--surface-card); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .st-eye-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; transition: color var(--transition-fast); }
        .st-eye-btn:hover { color: var(--text-primary); }

        .st-strength-track { height: 4px; background: var(--border-muted); border-radius: 99px; overflow: hidden; margin-top: 8px; }
        .st-strength-fill { height: 100%; border-radius: 99px; transition: all 0.3s ease; }
        .st-strength-label { font-size: 12px; font-weight: 600; margin-top: 5px; }

        .st-btn {
          display: inline-flex; align-items: center; gap: 7px; padding: 11px 22px;
          border-radius: 11px; border: none; background: var(--brand-gradient);
          color: white; font-weight: 700; font-size: 14px; cursor: pointer;
          font-family: var(--font-body); box-shadow: var(--shadow-button);
          transition: all var(--transition-fast);
        }
        .st-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.38); }
        .st-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }
        .st-btn.saved { background: linear-gradient(135deg, #16a34a, #15803d); box-shadow: 0 4px 14px rgba(22,163,74,0.3); }

        /* Toggle switch */
        .st-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-muted); gap: 16px; }
        .st-row:last-child { border-bottom: none; padding-bottom: 0; }
        .st-toggle {
          width: 44px; height: 24px; border-radius: 99px; border: none; cursor: pointer;
          background: var(--border-soft); flex-shrink: 0; position: relative;
          transition: background 0.2s ease; outline: none;
        }
        .st-toggle::after { content: ''; position: absolute; left: 3px; top: 3px; width: 18px; height: 18px; border-radius: 50%; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: transform 0.2s ease; }
        .st-toggle.on { background: #2563eb; }
        .st-toggle.on::after { transform: translateX(20px); }

        .st-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .st-meta-cell { padding: 12px 14px; background: var(--surface-hover); border-radius: 10px; border: 1px solid var(--border-muted); }
        .st-meta-k { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); }
        .st-meta-v { font-size: 14px; font-weight: 700; color: var(--text-primary); margin-top: 4px; }

        .st-info-row { display: flex; align-items: flex-start; gap: 10px; color: var(--text-secondary); font-size: 13px; line-height: 1.6; padding: 10px 0; border-bottom: 1px solid var(--border-muted); }
        .st-info-row:last-child { border-bottom: none; }

        .st-btn-danger { display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px; border-radius: 10px; border: 1.5px solid rgba(239,68,68,0.2); background: rgba(239,68,68,0.06); color: #ef4444; font-weight: 600; font-size: 13px; cursor: pointer; font-family: var(--font-body); transition: all var(--transition-fast); }
        .st-btn-danger:hover { background: #ef4444; color: white; border-color: #ef4444; }

        @media (max-width: 768px) { .st-main { margin-left: 0; } .st-content { padding: 20px 16px 80px; } .st-theme-grid { grid-template-columns: repeat(3, 1fr); } .st-meta { grid-template-columns: 1fr; } }
      `}</style>

      <div className="st-root">
        <Sidebar />
        <div className="st-main">
          <AppHeader title="Settings" subtitle="Theme, security and workspace preferences" />
          <div className="st-content">

            {/* Account info */}
            <p className="st-section-title">Account</p>
            <div className="st-card" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 4 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #2563eb, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 20, fontWeight: 800 }}>
                {(me?.name || user?.name || "HR").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>{me?.name || user?.name || "User"}</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                  <Mail size={12} /> {me?.email || user?.email || ""}
                </p>
                {me?.company && <p style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}><Building2 size={12} /> {me.company}</p>}
              </div>
              <Link href="/profile" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, border: "1.5px solid var(--border-soft)", background: "var(--surface-card)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, textDecoration: "none", transition: "all var(--transition-fast)", flexShrink: 0 }}>
                <User size={14} /> Edit Profile
              </Link>
            </div>

            {/* Appearance */}
            <p className="st-section-title">Appearance</p>
            <div className="st-card">
              <p className="st-card-title"><Palette size={17} color="#7c3aed" /> Theme</p>
              <p className="st-card-sub">Choose how Umurava AI looks. System follows your device preference.</p>

              <div className="st-theme-grid">
                {([
                  { value: "light",  icon: <Sun size={20} color="#d97706" />,     label: "Light",  iconBg: "#fffbeb", desc: "Bright & clean" },
                  { value: "dark",   icon: <Moon size={20} color="#6366f1" />,    label: "Dark",   iconBg: "#eef2ff", desc: "Easy on eyes" },
                  { value: "system", icon: <Monitor size={20} color="#64748b" />, label: "System", iconBg: "#f1f5f9", desc: "Auto-detect" },
                ] as const).map((t) => (
                  <button
                    key={t.value}
                    className={`st-theme-option${theme === t.value ? " active" : ""}`}
                    onClick={() => applyTheme(t.value)}
                  >
                    <div className="st-theme-option-icon" style={{ background: t.iconBg }}>{t.icon}</div>
                    <p className="st-theme-option-label">{t.label}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{t.desc}</p>
                    {theme === t.value && <CheckCircle2 size={15} color="#2563eb" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <p className="st-section-title">Notifications</p>
            <div className="st-card">
              <p className="st-card-title"><Bell size={17} color="#7c3aed" /> Notification Preferences</p>
              <p className="st-card-sub">Preferences are saved locally on this device.</p>
              {[
                { key: "screening", label: "Screening completed", desc: "Alert when an AI screening run finishes", value: notifyScreening, set: setNotifyScreening },
                { key: "upload",    label: "Candidates uploaded",  desc: "Alert when candidates are added to a job", value: notifyUpload,    set: setNotifyUpload },
                { key: "weekly",    label: "Weekly summary",        desc: "Digest of screening activity each Monday", value: notifyWeekly,   set: setNotifyWeekly },
              ].map((n) => (
                <div key={n.key} className="st-row">
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{n.label}</p>
                    <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 3 }}>{n.desc}</p>
                  </div>
                  <button type="button" className={`st-toggle${n.value ? " on" : ""}`} aria-pressed={n.value} onClick={() => handleToggleNotif(n.key, !n.value, n.set)} />
                </div>
              ))}
            </div>

            {/* Security */}
            <p className="st-section-title">Security</p>
            <div className="st-card">
              <p className="st-card-title"><Shield size={17} color="#2563eb" /> Change Password</p>
              <p className="st-card-sub">Use a strong password with at least 8 characters.</p>

              <div className="st-field">
                <label className="st-label">Current password</label>
                <div className="st-input-wrap">
                  <input className="st-input" type={showPwd.current ? "text" : "password"} placeholder="Enter current password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} />
                  <button className="st-eye-btn" type="button" onClick={() => setShowPwd((s) => ({ ...s, current: !s.current }))}>{showPwd.current ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                </div>
              </div>

              <div className="st-field">
                <label className="st-label">New password</label>
                <div className="st-input-wrap">
                  <input className="st-input" type={showPwd.new ? "text" : "password"} placeholder="At least 6 characters" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} />
                  <button className="st-eye-btn" type="button" onClick={() => setShowPwd((s) => ({ ...s, new: !s.new }))}>{showPwd.new ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                </div>
                {strength && (
                  <>
                    <div className="st-strength-track"><div className="st-strength-fill" style={{ width: strength.w, background: strength.color }} /></div>
                    <p className="st-strength-label" style={{ color: strength.color }}>{strength.label} password</p>
                  </>
                )}
              </div>

              <div className="st-field">
                <label className="st-label">Confirm new password</label>
                <div className="st-input-wrap">
                  <input className="st-input" type={showPwd.confirm ? "text" : "password"} placeholder="Repeat new password" value={pwd.confirmPassword} onChange={(e) => setPwd({ ...pwd, confirmPassword: e.target.value })} />
                  <button className="st-eye-btn" type="button" onClick={() => setShowPwd((s) => ({ ...s, confirm: !s.confirm }))}>{showPwd.confirm ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                </div>
                {pwd.confirmPassword && pwd.newPassword !== pwd.confirmPassword && <p style={{ fontSize: 12, color: "#dc2626", marginTop: 5, fontWeight: 500 }}>Passwords don&apos;t match</p>}
                {pwd.confirmPassword && pwd.newPassword === pwd.confirmPassword && pwd.confirmPassword.length >= 6 && <p style={{ fontSize: 12, color: "#16a34a", marginTop: 5, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={13} /> Passwords match</p>}
              </div>

              <button type="button" className={`st-btn${pwdSaved ? " saved" : ""}`} disabled={pwdSaving || !pwd.currentPassword || !pwd.newPassword} onClick={handleChangePassword}>
                {pwdSaved ? <CheckCircle2 size={15} /> : <Shield size={15} />}
                {pwdSaving ? "Updating…" : pwdSaved ? "Updated!" : "Update Password"}
              </button>
            </div>

            {/* Workspace */}
            <p className="st-section-title">Workspace</p>
            <div className="st-card">
              <p className="st-card-title"><Database size={17} color="#64748b" /> Workspace Info</p>
              <p className="st-card-sub">Screening data is scoped per job. Candidates are attached only to the job you select.</p>
              <div className="st-meta">
                {[
                  ["Account",         me?.name    || user?.name    || "—"],
                  ["Company",         me?.company || user?.company || "—"],
                  ["AI Model",        "Gemini"],
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
              <button className="st-btn-danger" onClick={() => toast.error("Contact support to delete your account.")}>
                <Trash2 size={14} /> Delete Account
              </button>
            </div>

            {/* About */}
            <p className="st-section-title">About</p>
            <div className="st-card">
              <p className="st-card-title"><Info size={17} color="#64748b" /> About Umurava AI</p>
              <div className="st-info-row">
                <FileText size={15} style={{ flexShrink: 0, marginTop: 2, color: "var(--text-muted)" }} />
                <p>Upload candidates via CSV, PDF, DOCX or manual entry, run AI-powered screening in seconds, and compare top candidates side by side.</p>
              </div>
              <div className="st-info-row">
                <Shield size={15} style={{ flexShrink: 0, marginTop: 2, color: "var(--text-muted)" }} />
                <p>AI rankings are decision-support tools. Final hiring decisions must always be made by qualified human recruiters.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}