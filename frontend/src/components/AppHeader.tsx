"use client";

import { useState } from "react";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "../store";
import { logout } from "../store/slices/authSlice";
import { clearAssistantContext } from "../store/slices/screeningSlice";
import {
  Bell, Settings, ChevronDown, CheckCircle2,
  Users, Briefcase, Sparkles, User, LogOut, ArrowRight, Info,
} from "lucide-react";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  workflowBanner?: { message: string; linkText: string; linkHref: string };
  actions?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, subtitle, workflowBanner, actions }) => {
  const { user }   = useSelector((s: RootState) => s.auth);
  const dispatch   = useDispatch();
  const router     = useRouter();
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogout,  setShowLogout]  = useState(false);
  const [notifications] = useState([
    { id: 1, type: "screening", title: "AI screening ready",    message: "Upload candidates to a job and run AI screening to get ranked results.", read: false, time: "2 min ago",   icon: Sparkles, color: "#7c3aed" },
    { id: 2, type: "candidates", title: "New candidates added", message: "5 new candidates were uploaded to Senior Frontend Developer.",             read: false, time: "1 hour ago", icon: Users,    color: "#2563eb" },
    { id: 3, type: "job",        title: "Job published",        message: "Your job position is now live and receiving applications.",                read: true,  time: "3 hours ago", icon: Briefcase, color: "#16a34a" },
  ]);

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "HR";

  const confirmSignout = () => {
    dispatch(logout());
    dispatch(clearAssistantContext());
    setShowLogout(false);
    setProfileOpen(false);
    router.push("/");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="header-wrapper">
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Header shell — matches sidebar dark theme ── */
        .header-wrapper {
          position: sticky; top: 0; z-index: 100;
          background: #060d1a;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          box-shadow: 0 1px 0 rgba(0,0,0,0.3), 0 4px 32px rgba(0,0,0,0.25);
        }
        /* Gradient accent line at very top */
        .header-wrapper::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%);
          z-index: 1;
        }

        .app-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 28px; height: 64px; gap: 16px;
          font-family: var(--font-body, system-ui);
        }

        /* Left: page title */
        .header-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
        .header-accent {
          width: 3px; height: 36px; border-radius: 2px; flex-shrink: 0;
          background: linear-gradient(180deg, #60a5fa, #818cf8);
        }
        .header-title {
          font-size: 20px; font-weight: 800; color: #f1f5f9;
          letter-spacing: -0.04em; line-height: 1.15;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          font-family: var(--font-display, 'Syne', sans-serif);
        }
        .header-subtitle {
          font-size: 12.5px; color: rgba(148,163,184,0.7); margin-top: 2px;
          white-space: nowrap; font-weight: 500;
        }

        /* Right controls */
        .header-right   { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .header-actions { display: flex; align-items: center; gap: 8px; margin-right: 4px; }

        /* Icon buttons */
        .header-icon-btn {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: #94a3b8; cursor: pointer; text-decoration: none;
          transition: all 0.15s; position: relative;
        }
        .header-icon-btn:hover {
          background: rgba(255,255,255,0.09);
          color: #e2e8f0;
          border-color: rgba(255,255,255,0.15);
        }
        .header-notif-badge {
          position: absolute; top: 7px; right: 7px;
          width: 7px; height: 7px; border-radius: 50%;
          background: #ef4444; border: 1.5px solid #060d1a;
        }

        /* Notification panel */
        .notif-panel {
          position: absolute; top: calc(100% + 10px); right: 0;
          width: 340px; background: var(--surface-card);
          border: 1px solid var(--border-soft); border-radius: 16px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1);
          animation: slideDown 0.18s ease; overflow: hidden; z-index: 299;
        }
        .notif-header {
          padding: 14px 16px; border-bottom: 1px solid var(--border-muted);
          display: flex; align-items: center; justify-content: space-between;
        }
        .notif-title { font-weight: 700; font-size: 14px; color: var(--text-primary); }
        .notif-count-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 99px; background: rgba(37,99,235,0.1); color: #2563eb; }
        .notif-item {
          display: flex; align-items: flex-start; gap: 11px;
          padding: 12px 16px; cursor: pointer; transition: background 0.15s;
          border-bottom: 1px solid var(--border-muted);
        }
        .notif-item:last-child { border-bottom: none; }
        .notif-item:hover { background: var(--surface-hover); }
        .notif-item.unread { background: rgba(37,99,235,0.03); }
        .notif-icon-wrap { width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .notif-item-title { font-size: 13px; font-weight: 700; color: var(--text-primary); }
        .notif-item-msg   { font-size: 12px; color: var(--text-secondary); margin-top: 2px; line-height: 1.45; }
        .notif-item-time  { font-size: 10.5px; color: var(--text-muted); margin-top: 4px; }
        .notif-dot { width: 7px; height: 7px; border-radius: 50%; background: #3b82f6; flex-shrink: 0; margin-top: 5px; }

        /* Profile button */
        .header-profile-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 5px 12px 5px 5px; border-radius: 11px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          cursor: pointer; transition: all 0.15s; font-family: var(--font-body);
        }
        .header-profile-btn:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.16);
        }
        .header-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: linear-gradient(135deg, #1d4ed8, #7c3aed);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; color: white; flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(37,99,235,0.35);
        }
        .header-profile-name { font-size: 13.5px; font-weight: 700; color: #e2e8f0; }

        /* Profile dropdown */
        .dropdown-panel {
          position: absolute; top: calc(100% + 10px); right: 0;
          width: 220px; background: var(--surface-card);
          border: 1px solid var(--border-soft); border-radius: 14px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1);
          animation: slideDown 0.18s ease; overflow: hidden; z-index: 299;
        }
        .dropdown-header { padding: 14px 16px 11px; border-bottom: 1px solid var(--border-muted); }
        .dropdown-username { font-weight: 700; font-size: 13.5px; color: var(--text-primary); }
        .dropdown-email    { font-size: 11.5px; color: var(--text-muted); margin-top: 2px; }
        .dropdown-section  { padding: 5px 0; }
        .dropdown-item {
          display: flex; align-items: center; gap: 9px;
          padding: 9px 14px; font-size: 13.5px; font-weight: 500;
          color: var(--text-secondary); text-decoration: none;
          transition: all 0.12s; cursor: pointer;
          border: none; background: none; width: 100%;
          font-family: var(--font-body); text-align: left;
        }
        .dropdown-item:hover { background: var(--surface-hover); color: var(--text-primary); }
        .dropdown-item.danger:hover { background: rgba(239,68,68,0.06); color: #ef4444; }
        .dropdown-divider { height: 1px; background: var(--border-muted); margin: 2px 0; }

        /* Workflow banner */
        .workflow-banner {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 28px; font-size: 13px; font-weight: 500;
          color: rgba(148,163,184,0.85);
          background: rgba(255,255,255,0.03);
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .workflow-banner-link {
          display: inline-flex; align-items: center; gap: 4px;
          color: #60a5fa; font-weight: 700; font-size: 13px;
          text-decoration: none; margin-left: auto; transition: gap 0.15s;
        }
        .workflow-banner-link:hover { gap: 7px; }

        /* Sign-out modal */
        .ah-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.65); backdrop-filter: blur(8px);
          z-index: 500; display: flex; align-items: center; justify-content: center;
          padding: 20px; animation: fadeIn 0.15s ease;
        }
        .ah-modal {
          background: var(--surface-card); border: 1px solid var(--border-soft);
          border-radius: 20px; padding: 28px; max-width: 360px; width: 100%;
          box-shadow: 0 24px 60px rgba(0,0,0,0.25); animation: scaleIn 0.18s ease;
        }
        .ah-modal-icon {
          width: 52px; height: 52px; border-radius: 14px;
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15);
          display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
        }
        .ah-modal-title { font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; }
        .ah-modal-text  { color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
        .ah-modal-btns  { display: flex; gap: 10px; }
        .ah-modal-cancel {
          flex: 1; padding: 12px; border-radius: 11px;
          border: 1.5px solid var(--border-soft); background: var(--surface-card);
          color: var(--text-secondary); font-weight: 600; font-size: 14px;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .ah-modal-cancel:hover { background: var(--surface-hover); }
        .ah-modal-confirm {
          flex: 1; padding: 12px; border-radius: 11px; border: none;
          background: #ef4444; color: white; font-weight: 700; font-size: 14px;
          cursor: pointer; font-family: inherit;
          box-shadow: 0 4px 14px rgba(239,68,68,0.3); transition: all 0.15s;
        }
        .ah-modal-confirm:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(239,68,68,0.4); }

        @media (max-width: 768px) {
          .app-header { padding: 0 16px; }
          .header-profile-name { display: none; }
        }
      `}</style>

      <div className="app-header">
        {/* Left: title */}
        <div className="header-left">
          <div className="header-accent" />
          <div>
            <p className="header-title">{title}</p>
            {subtitle && <p className="header-subtitle">{subtitle}</p>}
          </div>
        </div>

        {/* Right: actions + icons + profile */}
        <div className="header-right">
          {actions && <div className="header-actions">{actions}</div>}

          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button
              className="header-icon-btn"
              onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
              aria-label="Notifications"
            >
              <Bell size={17} />
              {unreadCount > 0 && <span className="header-notif-badge" />}
            </button>

            {notifOpen && (
              <div className="notif-panel">
                <div className="notif-header">
                  <span className="notif-title">Notifications</span>
                  {unreadCount > 0 && <span className="notif-count-badge">{unreadCount} new</span>}
                </div>
                {notifications.map((n) => (
                  <div key={n.id} className={`notif-item${n.read ? "" : " unread"}`} onClick={() => setNotifOpen(false)}>
                    <div className="notif-icon-wrap" style={{ background: `${n.color}15` }}>
                      <n.icon size={16} color={n.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="notif-item-title">{n.title}</p>
                      <p className="notif-item-msg">{n.message}</p>
                      <p className="notif-item-time">{n.time}</p>
                    </div>
                    {!n.read && <div className="notif-dot" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settings icon */}
          <Link href="/settings" className="header-icon-btn" aria-label="Settings">
            <Settings size={17} />
          </Link>

          {/* Profile button */}
          <div style={{ position: "relative" }}>
            <button
              className="header-profile-btn"
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            >
              <div className="header-avatar">{initials}</div>
              <span className="header-profile-name">{user?.name?.split(" ")[0] || "User"}</span>
              <ChevronDown size={14} color="#64748b" />
            </button>

            {profileOpen && (
              <div className="dropdown-panel">
                <div className="dropdown-header">
                  <p className="dropdown-username">{user?.name || "User"}</p>
                  <p className="dropdown-email">{user?.email || ""}</p>
                </div>
                <div className="dropdown-section">
                  <Link href="/profile" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                    <User size={15} /> Profile
                  </Link>
                  <Link href="/settings" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                    <Settings size={15} /> Settings
                  </Link>
                </div>
                <div className="dropdown-divider" />
                <div className="dropdown-section">
                  <button className="dropdown-item danger" onClick={() => { setProfileOpen(false); setShowLogout(true); }}>
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Workflow banner */}
      {workflowBanner && (
        <div className="workflow-banner">
          <Info size={14} />
          <span>{workflowBanner.message}</span>
          <Link href={workflowBanner.linkHref} className="workflow-banner-link">
            {workflowBanner.linkText} <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* Sign-out modal */}
      {showLogout && (
        <div className="ah-modal-overlay" onClick={() => setShowLogout(false)}>
          <div className="ah-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ah-modal-icon"><LogOut size={22} color="#ef4444" /></div>
            <p className="ah-modal-title">Sign out?</p>
            <p className="ah-modal-text">You'll be redirected to the login page. Any unsaved changes will be lost.</p>
            <div className="ah-modal-btns">
              <button className="ah-modal-cancel" onClick={() => setShowLogout(false)}>Cancel</button>
              <button className="ah-modal-confirm" onClick={confirmSignout}>Sign out</button>
            </div>
          </div>
        </div>
      )}

      {/* Click-away */}
      {(notifOpen || profileOpen) && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 298 }}
          onClick={() => { setNotifOpen(false); setProfileOpen(false); }}
        />
      )}
    </div>
  );
};

export default AppHeader;