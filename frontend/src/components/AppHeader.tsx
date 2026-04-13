"use client";

import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Plus, Settings, Bell, LogOut, User, ChevronDown, X } from "lucide-react";
import { RootState } from "../store";
import { logout } from "../store/slices/authSlice";
import { clearAssistantContext } from "../store/slices/screeningSlice";

type Props = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

export default function AppHeader({ title, subtitle, actions }: Props) {
  const { user } = useSelector((s: RootState) => s.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "HR";

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearAssistantContext());
    router.push("/");
  };

  return (
    <>
      <style>{`
        .app-hdr {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 32px;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid #e8edf3;
          position: sticky; top: 0; z-index: 40;
          box-shadow: 0 1px 0 rgba(0,0,0,0.04);
        }
        .app-hdr-text { flex: 1; min-width: 0; }
        .app-hdr-title { font-size: 17px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; line-height: 1.2; }
        .app-hdr-sub { font-size: 12.5px; color: #94a3b8; margin-top: 2px; }
        .app-hdr-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

        .app-hdr-icon-btn {
          width: 36px; height: 36px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          color: #64748b; border: 1.5px solid #e8edf3; background: white;
          text-decoration: none; cursor: pointer; transition: all 0.15s; flex-shrink: 0;
          position: relative;
        }
        .app-hdr-icon-btn:hover { color: #2563eb; border-color: #bfdbfe; background: #eff6ff; }

        .app-hdr-post {
          display: flex; align-items: center; gap: 6px; padding: 8px 16px;
          border-radius: 9px; background: linear-gradient(135deg,#2563eb,#7c3aed);
          color: white; border: none; cursor: pointer; font-weight: 700; font-size: 13px;
          text-decoration: none; box-shadow: 0 4px 14px rgba(37,99,235,0.28);
          transition: all 0.15s; white-space: nowrap;
        }
        .app-hdr-post:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.38); }

        .app-hdr-divider { width: 1px; height: 22px; background: #e8edf3; flex-shrink: 0; }

        /* Profile button */
        .app-hdr-profile-btn {
          display: flex; align-items: center; gap: 8px; padding: 5px 10px 5px 5px;
          border-radius: 10px; border: 1.5px solid #e8edf3; background: white;
          cursor: pointer; transition: all 0.15s;
        }
        .app-hdr-profile-btn:hover { border-color: #bfdbfe; background: #f8fafc; }

        .app-hdr-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: linear-gradient(135deg,#2563eb,#7c3aed);
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 11px; font-weight: 700; flex-shrink: 0;
        }
        .app-hdr-uname { font-size: 13px; font-weight: 600; color: #0f172a; max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Dropdown */
        .app-hdr-dropdown {
          position: absolute; top: calc(100% + 8px); right: 0;
          background: white; border: 1.5px solid #e8edf3; border-radius: 14px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.12); min-width: 200px; z-index: 100;
          overflow: hidden; animation: fadeInDown 0.15s ease;
        }
        @keyframes fadeInDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }

        .app-hdr-drop-header {
          padding: 14px 16px 10px; border-bottom: 1px solid #f1f5f9;
        }
        .app-hdr-drop-name { font-weight: 700; font-size: 14px; color: #0f172a; }
        .app-hdr-drop-email { font-size: 12px; color: #94a3b8; margin-top: 2px; }

        .app-hdr-drop-item {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 16px; color: #374151; font-size: 13.5px; font-weight: 500;
          text-decoration: none; cursor: pointer; transition: background 0.12s;
          background: none; border: none; width: 100%; text-align: left; font-family: inherit;
        }
        .app-hdr-drop-item:hover { background: #f8fafc; color: #0f172a; }
        .app-hdr-drop-item.danger { color: #ef4444; }
        .app-hdr-drop-item.danger:hover { background: #fef2f2; }
        .app-hdr-drop-divider { height: 1px; background: #f1f5f9; margin: 4px 0; }

        /* Notif dot */
        .notif-dot {
          position: absolute; top: 6px; right: 6px; width: 8px; height: 8px;
          border-radius: 50%; background: #ef4444; border: 2px solid white;
        }

        /* Notif dropdown */
        .notif-dropdown {
          position: absolute; top: calc(100% + 8px); right: 0;
          background: white; border: 1.5px solid #e8edf3; border-radius: 14px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.12); width: 300px; z-index: 100;
          animation: fadeInDown 0.15s ease;
        }
        .notif-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px 10px; border-bottom: 1px solid #f1f5f9;
        }
        .notif-title { font-weight: 700; font-size: 14px; color: #0f172a; }
        .notif-item { padding: 12px 16px; border-bottom: 1px solid #f8fafc; }
        .notif-item:last-child { border-bottom: none; }
        .notif-item-title { font-size: 13px; font-weight: 600; color: #0f172a; }
        .notif-item-sub { font-size: 12px; color: #94a3b8; margin-top: 2px; }
        .notif-empty { padding: 28px 16px; text-align: center; color: #94a3b8; font-size: 13px; }

        /* Logout modal */
        .lo-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.55); backdrop-filter: blur(6px);
          z-index: 300; display: flex; align-items: center; justify-content: center; padding: 20px;
          animation: fadeIn 0.15s ease;
        }
        .lo-modal {
          background: white; border-radius: 20px; padding: 32px; width: 100%; max-width: 360px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.2); animation: scaleIn 0.18s ease;
        }
        .lo-icon { width: 52px; height: 52px; border-radius: 14px; background: #fef2f2; border: 2px solid #fecaca; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
        .lo-title { font-size: 19px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
        .lo-text { color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
        .lo-btns { display: flex; gap: 10px; }
        .lo-cancel { flex: 1; padding: 12px; border-radius: 11px; border: 1.5px solid #e2e8f0; background: white; color: #64748b; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.15s; font-family: inherit; }
        .lo-cancel:hover { background: #f8fafc; }
        .lo-confirm { flex: 1; padding: 12px; border-radius: 11px; border: none; background: linear-gradient(135deg,#ef4444,#dc2626); color: white; font-weight: 700; font-size: 14px; cursor: pointer; box-shadow: 0 4px 14px rgba(239,68,68,0.3); transition: all 0.15s; font-family: inherit; }
        .lo-confirm:hover { transform: translateY(-1px); }

        @media (max-width: 768px) {
          .app-hdr { padding: 12px 16px; }
          .app-hdr-post span { display: none; }
          .app-hdr-post { padding: 8px 10px; }
          .app-hdr-uname { display: none; }
        }
      `}</style>

      <header className="app-hdr">
        <div className="app-hdr-text">
          <h1 className="app-hdr-title">{title}</h1>
          {subtitle && <p className="app-hdr-sub">{subtitle}</p>}
        </div>

        <div className="app-hdr-actions">
          {actions}

          <Link href="/jobs/create" className="app-hdr-post">
            <Plus size={15} strokeWidth={2.5} />
            <span>Post a Job</span>
          </Link>

          <div className="app-hdr-divider" />

          {/* Notifications */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              className="app-hdr-icon-btn"
              onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
              title="Notifications"
            >
              <Bell size={16} />
              <span className="notif-dot" />
            </button>
            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-header">
                  <span className="notif-title">Notifications</span>
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }} onClick={() => setNotifOpen(false)}>
                    <X size={14} />
                  </button>
                </div>
                <div className="notif-item">
                  <p className="notif-item-title">✅ Screening completed</p>
                  <p className="notif-item-sub">AI screening for your latest job is ready</p>
                </div>
                <div className="notif-item">
                  <p className="notif-item-title">📋 New candidates uploaded</p>
                  <p className="notif-item-sub">3 candidates were added via CSV</p>
                </div>
              </div>
            )}
          </div>

          {/* Profile dropdown */}
          <div ref={profileRef} style={{ position: "relative" }}>
            <button
              className="app-hdr-profile-btn"
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            >
              <div className="app-hdr-avatar">{initials}</div>
              <span className="app-hdr-uname">{user?.name || "Recruiter"}</span>
              <ChevronDown size={13} color="#94a3b8" />
            </button>

            {profileOpen && (
              <div className="app-hdr-dropdown">
                <div className="app-hdr-drop-header">
                  <p className="app-hdr-drop-name">{user?.name || "Recruiter"}</p>
                  <p className="app-hdr-drop-email">{user?.email || ""}</p>
                </div>

                <Link href="/profile" className="app-hdr-drop-item" onClick={() => setProfileOpen(false)}>
                  <User size={15} color="#2563eb" /> View Profile
                </Link>
                <Link href="/settings" className="app-hdr-drop-item" onClick={() => setProfileOpen(false)}>
                  <Settings size={15} color="#7c3aed" /> Settings
                </Link>

                <div className="app-hdr-drop-divider" />

                <button
                  className="app-hdr-drop-item danger"
                  onClick={() => { setProfileOpen(false); setShowLogout(true); }}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Logout confirm modal */}
      {showLogout && (
        <div className="lo-overlay" onClick={() => setShowLogout(false)}>
          <div className="lo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lo-icon"><LogOut size={22} color="#ef4444" /></div>
            <h2 className="lo-title">Sign out?</h2>
            <p className="lo-text">You'll need to sign back in to access your screening workspace and candidate data.</p>
            <div className="lo-btns">
              <button className="lo-cancel" onClick={() => setShowLogout(false)}>Stay</button>
              <button className="lo-confirm" onClick={handleLogout}>Sign out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}