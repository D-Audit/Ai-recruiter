"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch } from "react-redux";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import { getMe, updateMe } from "../../services/authService";
import { updateProfileFields } from "../../store/slices/authSlice";
import { AppDispatch } from "../../store";
import toast from "react-hot-toast";
import { User, Save, Settings, Building2, Mail, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: "", company: "" });

  useEffect(() => {
    getMe()
      .then((d) => {
        setMe(d.user);
        setForm({ name: d.user.name || "", company: d.user.company || "" });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      await updateMe(form);
      dispatch(updateProfileFields(form));
      setMe((prev: any) => ({ ...prev, ...form }));
      setSaved(true);
      toast.success("Profile updated");
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error("Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  const initials = form.name
    ? form.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "HR";

  const isDirty = me && (form.name !== me.name || form.company !== me.company);

  return (
    <>
      <style>{`
        .pf-root { display: flex; font-family: var(--font-body); }
        .pf-main { margin-left: var(--sidebar-width); min-height: 100vh; background: var(--surface-base); flex: 1; display: flex; flex-direction: column; }
        .pf-content { padding: 32px 40px 80px; max-width: 680px; animation: fadeIn 0.28s ease; }

        .pf-hero {
          display: flex; align-items: center; gap: 24px;
          background: white; border-radius: 20px; padding: 28px;
          border: 1.5px solid var(--border-soft); box-shadow: var(--shadow-card);
          margin-bottom: 20px;
        }
        .pf-avatar {
          width: 80px; height: 80px; border-radius: 50%; flex-shrink: 0;
          background: var(--brand-gradient); display: flex; align-items: center; justify-content: center;
          color: white; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;
          box-shadow: 0 8px 24px rgba(37,99,235,0.25);
        }
        .pf-hero-name { font-size: 20px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; margin-bottom: 4px; }
        .pf-hero-company { font-size: 14px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; }
        .pf-hero-email { font-size: 13px; color: var(--text-muted); margin-top: 4px; display: flex; align-items: center; gap: 6px; }

        .pf-card {
          background: white; border-radius: 18px; border: 1.5px solid var(--border-soft);
          padding: 28px; box-shadow: var(--shadow-card); margin-bottom: 16px;
        }
        .pf-card-title { font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
        .pf-card-sub { color: var(--text-muted); font-size: 13px; margin-bottom: 22px; line-height: 1.5; }

        .pf-field { margin-bottom: 18px; }
        .pf-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 11.5px; font-weight: 700; color: #374151; margin-bottom: 7px;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        .pf-input {
          width: 100%; padding: 11px 14px; border-radius: 11px;
          border: 1.5px solid var(--border-soft); font-size: 14px; color: var(--text-primary);
          font-family: var(--font-body); outline: none; background: #fafbfc;
          transition: all var(--transition-fast);
        }
        .pf-input:focus { border-color: var(--brand-primary); background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .pf-input:disabled { background: #f8fafc; color: var(--text-muted); cursor: not-allowed; }
        .pf-input-hint { font-size: 12px; color: var(--text-muted); margin-top: 5px; line-height: 1.4; }

        .pf-actions { display: flex; align-items: center; gap: 12px; margin-top: 4px; flex-wrap: wrap; }
        .pf-save {
          display: inline-flex; align-items: center; gap: 7px; padding: 11px 24px;
          border-radius: 11px; border: none; background: var(--brand-gradient);
          color: white; font-weight: 700; font-size: 14px; cursor: pointer;
          box-shadow: var(--shadow-button); transition: all var(--transition-fast);
          font-family: var(--font-body);
        }
        .pf-save:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.38); }
        .pf-save:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }
        .pf-save.saved { background: linear-gradient(135deg, #16a34a, #15803d); box-shadow: 0 4px 14px rgba(22,163,74,0.3); }

        .pf-settings-link {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 600; color: var(--text-secondary); text-decoration: none;
          padding: 9px 16px; border-radius: 10px; border: 1.5px solid var(--border-soft);
          background: white; transition: all var(--transition-fast);
        }
        .pf-settings-link:hover { border-color: #bfdbfe; color: var(--brand-primary); background: #eff6ff; }

        @media (max-width: 1024px) and (min-width: 769px) { .pf-main { margin-left: var(--sidebar-collapsed); } }
        @media (max-width: 768px) {
          .pf-main { margin-left: 0; }
          .pf-content { padding: 20px 16px 80px; }
          .pf-hero { flex-direction: column; text-align: center; align-items: center; }
        }
      `}</style>

      <div className="pf-root">
        <Sidebar />
        <div className="pf-main">
          <AppHeader title="Profile" subtitle="Your identity in the workspace" />
          <div className="pf-content">
            {loading ? (
              <div style={{ padding: 64, textAlign: "center", color: "var(--text-muted)" }}>
                <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.75s linear infinite", margin: "0 auto 14px" }} />
                Loading your profile…
              </div>
            ) : (
              <>
                {/* Hero */}
                <div className="pf-hero">
                  <div className="pf-avatar">{initials}</div>
                  <div>
                    <p className="pf-hero-name">{form.name || "Your Name"}</p>
                    <p className="pf-hero-company">
                      <Building2 size={13} /> {form.company || "Your Company"}
                    </p>
                    <p className="pf-hero-email">
                      <Mail size={13} /> {me?.email}
                    </p>
                  </div>
                </div>

                {/* Edit form */}
                <div className="pf-card">
                  <p className="pf-card-title">
                    <User size={16} color="#2563eb" />
                    Edit Profile
                  </p>
                  <p className="pf-card-sub">
                    Update your name and company. These appear across your workspace.
                  </p>

                  <div className="pf-field">
                    <label className="pf-label">
                      <User size={12} /> Full Name
                    </label>
                    <input
                      className="pf-input"
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="pf-field">
                    <label className="pf-label">
                      <Building2 size={12} /> Company
                    </label>
                    <input
                      className="pf-input"
                      type="text"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder="Your organization"
                    />
                  </div>

                  <div className="pf-field">
                    <label className="pf-label">
                      <Mail size={12} /> Work Email
                    </label>
                    <input className="pf-input" type="email" value={me?.email || ""} disabled />
                    <p className="pf-input-hint">Email is tied to your account and cannot be changed here.</p>
                  </div>

                  <div className="pf-actions">
                    <button
                      type="button"
                      className={`pf-save${saved ? " saved" : ""}`}
                      disabled={saving || !isDirty}
                      onClick={handleSave}
                    >
                      {saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
                      {saving ? "Saving…" : saved ? "Saved!" : "Save Profile"}
                    </button>

                    <Link href="/settings" className="pf-settings-link">
                      <Settings size={14} />
                      Security & Settings
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}