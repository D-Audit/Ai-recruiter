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
  Users, Briefcase, Sparkles, User, LogOut,
  ArrowRight, Info,
} from "lucide-react";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  workflowBanner?: {
    message: string;
    linkText: string;
    linkHref: string;
  };
  actions?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  workflowBanner,
  actions,
}) => {
  const { user } = useSelector((s: RootState) => s.auth);
  const dispatch = useDispatch();
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1, type: "screening", title: "AI screening ready",
      message: "Upload candidates to a job and run AI screening to get ranked results.",
      read: false, time: "2 min ago", icon: Sparkles, color: "#7c3aed",
    },
    {
      id: 2, type: "candidates", title: "New candidates added",
      message: "5 new candidates were uploaded to Senior Frontend Developer.",
      read: false, time: "1 hour ago", icon: Users, color: "#2563eb",
    },
    {
      id: 3, type: "job", title: "Job published",
      message: "Your job position is now live and receiving applications.",
      read: true, time: "3 hours ago", icon: Briefcase, color: "#16a34a",
    },
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

        .header-wrapper {
          position: sticky; top: 0; z-index: 100;
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(24px) saturate(1.6);
          -webkit-backdrop-filter: blur(24px) saturate(1.6);
          border-bottom: 1px solid rgba(226,232,240,0.8);
          box-shadow: 0 1px 0 rgba(0,0,0,0.05), 0 4px 28px rgba(0,0,0,0.04);
        }
        /* Colored accent line at very top of header */
        .header-wrapper::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2.5px;
          background: linear-gradient(90deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%);
          z-index: 1;
        }
        html.dark .header-wrapper {
          background: rgba(8,12,20,0.95);
          border-bottom-color: rgba(255,255,255,0.06);
          box-shadow: 0 1px 0 rgba(0,0,0,0.3), 0 4px 28px rgba(0,0,0,0.2);
        }

        .app-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 28px; height: 60px; gap: 16px;
          font-family: var(--font-body, system-ui);
        }

        /* Left: page identity */
        .header-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .header-page-icon {
          display: none;
        }
        .header-title {
          font-size: 17px; font-weight: 800; color: var(--text-primary);
          letter-spacing: -0.04em; line-height: 1.2;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          font-family: var(--font-display, 'Syne', sans-serif);
        }
        .header-subtitle {
          font-size: 12px; color: var(--text-secondary); margin-top: 2px;
          white-space: nowrap; font-weight: 500;
        }

        /* Right controls */
        .header-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .header-actions { display: flex; align-items: center; gap: 8px; margin-right: 4px; }

        /* Icon buttons */
        .header-icon-btn {
          width: 34px; height: 34px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--border-soft);
          background: transparent;
          color: var(--text-secondary); cursor: pointer; text-decoration: none;
          transition: all 0.15s; position: relative;
        }
        .header-icon-btn:hover {
          background: var(--surface-hover);
          color: var(--text-primary);
          border-color: var(--border-input);
        }
        .header-notif-badge {
          position: absolute; top: 6px; right: 6px;
          width: 7px; height: 7px; border-radius: 50%;
          background: #ef4444;
          border: 1.5px solid var(--surface-card);
          box-shadow: 0 0 0 1.5px rgba(239,68,68,0.3);
        }

        /* ── Notification panel ── */
        .notif-panel {
          position: absolute; top: calc(100% + 10px); right: 0;
          width: 340px;
          background: var(--surface-card);
          border: 1px solid var(--border-soft);
          border-radius: 16px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
          animation: slideDown 0.18s ease;
          overflow: hidden; z-index: 299;
        }
        .notif-header {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-muted);
          display: flex; align-items: center; justify-content: space-between;
        }
        .notif-title { font-weight: 700; font-size: 13.5px; color: var(--text-primary); }
        .notif-count-badge {
          font-size: 10px; font-weight: 700;
          padding: 2px 8px; border-radius: 99px;
          background: rgba(37,99,235,0.1); color: #2563eb;
        }
        .notif-mark-read {
          background: none; border: none; cursor: pointer; padding: 4px;
          border-radius: 6px; color: var(--text-muted);
          display: flex; transition: color 0.15s;
        }
        .notif-mark-read:hover { color: var(--text-secondary); }
        .notif-item {
          display: flex; align-items: flex-start; gap: 11px;
          padding: 12px 16px; cursor: pointer;
          transition: background 0.15s;
          border-bottom: 1px solid var(--border-muted);
        }
        .notif-item:last-child { border-bottom: none; }
        .notif-item:hover { background: var(--surface-hover); }
        .notif-item.unread { background: rgba(37,99,235,0.025); }
        .notif-icon-wrap {
          width: 32px; height: 32px; border-radius: 9px;
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        }
        .notif-item-title { font-size: 13px; font-weight: 700; color: var(--text-primary); }
        .notif-item-msg { font-size: 12px; color: var(--text-secondary); margin-top: 2px; line-height: 1.45; }
        .notif-item-time { font-size: 10.5px; color: var(--text-muted); margin-top: 4px; }
        .notif-dot { width: 7px; height: 7px; border-radius: 50%; background: #3b82f6; flex-shrink: 0; margin-top: 5px; }

        /* ── Profile button ── */
        .header-profile-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 4px 10px 4px 5px;
          border-radius: 10px;
          border: 1px solid var(--border-soft);
          background: transparent;
          cursor: pointer; transition: all 0.15s;
          font-family: var(--font-body);
        }
        .header-profile-btn:hover {
          background: var(--surface-hover);
          border-color: var(--border-input);
        }
        .header-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, #1d4ed8, #7c3aed);
          display: flex; align-items: center; justify-content: center;
          font-size: 10.5px; font-weight: 800; color: white; flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(37,99,235,0.3);
        }
        .header-profile-name {
          font-size: 13px; font-weight: 700; color: var(--text-primary);
        }

        /* ── Profile dropdown ── */
        .dropdown-panel {
          position: absolute; top: calc(100% + 10px); right: 0;
          width: 220px;
          background: var(--surface-card);
          border: 1px solid var(--border-soft);
          border-radius: 14px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
          animation: slideDown 0.18s ease; overflow: hidden; z-index: 299;
        }
        .dropdown-header {
          padding: 14px 16px 11px;
          border-bottom: 1px solid var(--border-muted);
        }
        .dropdown-username { font-weight: 700; font-size: 13.5px; color: var(--text-primary); }
        .dropdown-email { font-size: 11.5px; color: var(--text-muted); margin-top: 2px; }
        .dropdown-section { padding: 5px 0; }
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

        /* ── Workflow banner ── */
        .workflow-banner {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 28px; font-size: 13px; font-weight: 500;
          color: var(--text-secondary);
          background: linear-gradient(135deg, rgba(37,99,235,0.04), rgba(124,58,237,0.02));
          border-top: 1px solid rgba(37,99,235,0.08);
        }
        .workflow-banner-link {
          display: inline-flex; align-items: center; gap: 4px;
          color: var(--brand-primary); font-weight: 700; font-size: 13px;
          text-decoration: none; margin-left: auto;
          transition: gap 0.15s;
        }
        .workflow-banner-link:hover { gap: 7px; }

        /* ── Sign-out modal ── */
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
        .ah-modal-title { font-size: 17px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; }
        .ah-modal-text { color: var(--text-secondary); font-size: 13.5px; line-height: 1.6; margin-bottom: 22px; }
        .ah-modal-btns { display: flex; gap: 10px; }
        .ah-modal-cancel {
          flex: 1; padding: 11px; border-radius: 10px;
          border: 1.5px solid var(--border-soft); background: var(--surface-card);
          color: var(--text-secondary); font-weight: 600; font-size: 14px;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .ah-modal-cancel:hover { background: var(--surface-hover); }
        .ah-modal-confirm {
          flex: 1; padding: 11px; border-radius: 10px; border: none;
          background: #ef4444; color: white; font-weight: 700; font-size: 14px;
          cursor: pointer; font-family: inherit;
          box-shadow: 0 4px 14px rgba(239,68,68,0.3); transition: all 0.15s;
        }
        .ah-modal-confirm:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(239,68,68,0.4); }

        @media (max-width: 768px) {
          .app-header { padding: 0 16px 0 60px; height: 56px; }
          .header-profile-name { display: none; }
          .header-subtitle { display: none; }
          .workflow-banner { padding: 9px 16px; font-size: 12px; }
        }
      `}</style>

      <header className="app-header">
        {/* Left */}
        <div className="header-left">
          {/* Gradient left accent bar */}
          <div style={{
            width: 3, height: 32, borderRadius: 99, flexShrink: 0,
            background: "linear-gradient(180deg, #2563eb, #7c3aed)",
          }} />
          <div>
            <h1 className="header-title">{title}</h1>
            {subtitle && <p className="header-subtitle">{subtitle}</p>}
          </div>
        </div>

        {/* Right */}
        <div className="header-right">
          {actions && <div className="header-actions">{actions}</div>}

          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
              className="header-icon-btn"
              title="Notifications"
            >
              <Bell size={15} />
              {unreadCount > 0 && <span className="header-notif-badge" />}
            </button>

            {notifOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 298 }} onClick={() => setNotifOpen(false)} />
                <div className="notif-panel">
                  <div className="notif-header">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <p className="notif-title">Notifications</p>
                      {unreadCount > 0 && <span className="notif-count-badge">{unreadCount} new</span>}
                    </div>
                    <button
                      className="notif-mark-read"
                      onClick={(e) => { e.stopPropagation(); setNotifications(notifications.map((n) => ({ ...n, read: true }))); }}
                      title="Mark all as read"
                    >
                      <CheckCircle2 size={14} />
                    </button>
                  </div>
                  <div style={{ overflowY: "auto", maxHeight: 340 }}>
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`notif-item${!n.read ? " unread" : ""}`}
                        onClick={() => setNotifications(notifications.map((x) => x.id === n.id ? { ...x, read: true } : x))}
                      >
                        <div className="notif-icon-wrap" style={{ background: `${n.color}18` }}>
                          <n.icon size={14} color={n.color} />
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
                </div>
              </>
            )}
          </div>

          {/* Settings */}
          <Link href="/settings" className="header-icon-btn" title="Settings">
            <Settings size={15} />
          </Link>

          {/* Profile */}
          <div style={{ position: "relative" }}>
            <button
              className="header-profile-btn"
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            >
              <div className="header-avatar">{initials}</div>
              <span className="header-profile-name">{user?.name?.split(" ")[0] || "User"}</span>
              <ChevronDown size={12} style={{ color: "var(--text-muted)" }} />
            </button>

            {profileOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 298 }} onClick={() => setProfileOpen(false)} />
                <div className="dropdown-panel">
                  <div className="dropdown-header">
                    <p className="dropdown-username">{user?.name || "User"}</p>
                    <p className="dropdown-email">{user?.email || ""}</p>
                  </div>
                  <div className="dropdown-section">
                    <Link href="/profile" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                      <User size={14} style={{ color: "var(--text-muted)" }} /> Profile
                    </Link>
                    <Link href="/settings" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                      <Settings size={14} style={{ color: "var(--text-muted)" }} /> Settings
                    </Link>
                  </div>
                  <div className="dropdown-divider" />
                  <div className="dropdown-section">
                    <button
                      className="dropdown-item danger"
                      onClick={() => { setProfileOpen(false); setShowLogout(true); }}
                    >
                      <LogOut size={14} style={{ color: "var(--text-muted)" }} /> Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Workflow banner */}
      {workflowBanner && (
        <div className="workflow-banner">
          <Info size={13} style={{ flexShrink: 0, color: "var(--brand-primary)" }} />
          <span>{workflowBanner.message}</span>
          <Link href={workflowBanner.linkHref} className="workflow-banner-link">
            {workflowBanner.linkText} <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Sign-out modal */}
      {showLogout && (
        <div className="ah-modal-overlay" onClick={() => setShowLogout(false)}>
          <div className="ah-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ah-modal-icon">
              <LogOut size={22} color="#ef4444" />
            </div>
            <p className="ah-modal-title">Sign out?</p>
            <p className="ah-modal-text">You'll be redirected to the login page. Any unsaved changes will be lost.</p>
            <div className="ah-modal-btns">
              <button className="ah-modal-cancel" onClick={() => setShowLogout(false)}>Cancel</button>
              <button className="ah-modal-confirm" onClick={confirmSignout}>Sign out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppHeader;