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
import { User, Save, Settings } from "lucide-react";

export default function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      await updateMe(form);
      dispatch(updateProfileFields(form));
      toast.success("Profile updated");
      setMe((prev: any) => ({ ...prev, ...form }));
    } catch {
      toast.error("Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  const initials = form.name
    ? form.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "HR";

  return (
    <>
      <style>{`
        .pf-root { display: flex; font-family: system-ui, sans-serif; }
        .pf-main { margin-left: 260px; min-height: 100vh; background: #f8fafc; flex: 1; display: flex; flex-direction: column; }
        .pf-content { padding: 36px 40px; max-width: 720px; }
        .pf-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 28px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); margin-bottom: 20px; }
        .pf-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
        .pf-sub { color: #94a3b8; font-size: 13px; margin-bottom: 22px; }
        .pf-label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
        .pf-input {
          width: 100%; padding: 11px 14px; border-radius: 10px;
          border: 1.5px solid #e2e8f0; font-size: 14px; color: #1e293b;
          outline: none; background: #fafafa; transition: border-color 0.2s, box-shadow 0.2s;
          margin-bottom: 14px;
        }
        .pf-input:focus { border-color: #2563eb; background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .pf-input:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
        .pf-save {
          display: inline-flex; align-items: center; gap: 7px; padding: 11px 22px;
          border-radius: 11px; border: none;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white; font-weight: 700; font-size: 14px; cursor: pointer;
          box-shadow: 0 4px 14px rgba(37,99,235,0.28);
          transition: transform 0.15s;
        }
        .pf-save:hover { transform: translateY(-1px); }
        .pf-save:disabled { background: #94a3b8; cursor: not-allowed; transform: none; box-shadow: none; }
        .pf-avatar {
          width: 88px; height: 88px; border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 28px; font-weight: 800;
          margin-bottom: 16px; box-shadow: 0 8px 24px rgba(37,99,235,0.28);
        }
        .pf-settings-link {
          display: inline-flex; align-items: center; gap: 8px;
          margin-top: 20px; font-size: 13px; font-weight: 600; color: #2563eb;
          text-decoration: none;
        }
        .pf-settings-link:hover { text-decoration: underline; }
        @media (max-width: 900px) { .pf-main { margin-left: 0; } }
      `}</style>

      <div className="pf-root">
        <Sidebar />
        <div className="pf-main">
          <AppHeader
            title="Profile"
            subtitle="Your name and company — how you appear in the app"
          />
          <div className="pf-content">
            {loading ? (
              <div style={{ textAlign: "center", padding: 64, color: "#94a3b8" }}>Loading…</div>
            ) : (
              <>
                <div className="pf-card">
                  <div className="pf-avatar">{initials}</div>
                  <p className="pf-title">
                    <User size={18} color="#2563eb" />
                    Recruiter profile
                  </p>
                  <p className="pf-sub">
                    This information identifies you to your team. Security and password are under Settings.
                  </p>
                  <label className="pf-label">Full name</label>
                  <input
                    className="pf-input"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                  />
                  <label className="pf-label">Company</label>
                  <input
                    className="pf-input"
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="Organization name"
                  />
                  <label className="pf-label">Work email</label>
                  <input className="pf-input" type="email" value={me?.email || ""} disabled />
                  <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 18, marginTop: -8 }}>
                    Email is tied to your account. Contact support to change it.
                  </p>
                  <button
                    type="button"
                    className="pf-save"
                    disabled={saving}
                    onClick={handleSave}
                  >
                    <Save size={15} />
                    {saving ? "Saving…" : "Save profile"}
                  </button>
                  <Link href="/settings" className="pf-settings-link">
                    <Settings size={16} />
                    Account settings &amp; security
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
