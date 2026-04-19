"use client";

import { useState } from "react";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "../store";
import { logout } from "../store/slices/authSlice";
import { clearAssistantContext } from "../store/slices/screeningSlice";
import {
  Info, ArrowRight, Bell, Settings, ChevronDown, CheckCircle2,
  Users, Briefcase, Sparkles, User, LogOut,
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
      message: "5 new candidates were uploaded to Senior Frontend Developer position.",
      read: false, time: "1 hour ago", icon: Users, color: "#2563eb",
    },
    {
      id: 3, type: "job", title: "Job published successfully",
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
        .header-wrapper {
          position: sticky; top: 0; z-index: 100;
          background: var(--surface-card);
          border-bottom: 1px solid var(--border-muted);
        }
        .app-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 28px; height: 64px; gap: 16px;
          font-family: var(--font-body, system-ui);
        }
        .header-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
        .header-accent {
          width: 4px; height: 32px; border-radius: 2px; flex-shrink: 0;
          background: var(--brand-gradient);
        }
        .header-title-container { min-width: 0; }
        .header-title {
          font-size: 18px; font-weight: 800; color: var(--text-primary);
          letter-spacing: -0.02em; line-height: 1.2;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .header-subtitle { font-size: 12px; color: var(--text-muted); margin-top: 1px; }

        .header-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .header-actions { display: flex; align-items: center; gap: 8px; }

        .header-btn-sm {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--border-soft); background: var(--surface-card);
          color: var(--text-secondary); cursor: pointer; text-decoration: none;
          transition: all var(--transition-fast); position: relative;
        }
        .header-btn-sm:hover { background: var(--surface-hover); color: var(--text-primary); border-color: var(--border-input); }
        .notification-badge {
          position: absolute; top: 7px; right: 7px;
          width: 7px; height: 7px; border-radius: 50%;
          background: #ef4444; border: 1.5px solid var(--surface-card);
        }

        /* Notification panel */
        .notif-panel {
          position: absolute; top: calc(100% + 8px); right: 0;
          width: 340px; background: var(--surface-card);
          border: 1.5px solid var(--border-soft); border-radius: 16px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.12);
          animation: slideUp 0.18s ease;
          overflow: hidden;
        }
        .notif-header {
          padding: 14px 16px; border-bottom: 1px solid var(--border-muted);
          display: flex; align-items: center; justify-content: space-between;
        }
        .notif-title { font-weight: 700; font-size: 14px; color: var(--text-primary); }
        .notif-item {
          display: flex; align-items: flex-start; gap: 11px; padding: 12px 16px;
          cursor: pointer; transition: background var(--transition-fast);
          border-bottom: 1px solid var(--border-muted);
        }
        .notif-item:hover { background: var(--surface-hover); }
        .notif-item.unread { background: rgba(37,99,235,0.03); }
        .notif-icon-wrap {
          width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .notif-item-title { font-size: 13px; font-weight: 700; color: var(--text-primary); }
        .notif-item-msg { font-size: 12px; color: var(--text-secondary); margin-top: 2px; line-height: 1.4; }
        .notif-item-time { font-size: 11px; color: var(--text-muted); margin-top: 4px; }
        .notif-unread-dot { width: 7px; height: 7px; border-radius: 50%; background: #2563eb; flex-shrink: 0; margin-top: 4px; }

        /* Profile button and dropdown */
        .header-profile-btn {
          display: flex; align-items: center; gap: 8px; padding: 5px 10px 5px 6px;
          border-radius: 10px; border: 1px solid var(--border-soft);
          background: var(--surface-card); cursor: pointer;
          transition: all var(--transition-fast); font-family: var(--font-body);
        }
        .header-profile-btn:hover { background: var(--surface-hover); border-color: var(--border-input); }
        .header-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: var(--brand-gradient);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: white; flex-shrink: 0;
        }
        .header-profile-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }

        /* Dropdown */
        .dropdown-panel {
          position: absolute; top: calc(100% + 8px); right: 0;
          width: 220px; background: var(--surface-card);
          border: 1.5px solid var(--border-soft); border-radius: 14px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.12);
          animation: slideUp 0.18s ease; overflow: hidden;
        }
        .dropdown-item {
          display: flex; align-items: center; gap: 9px;
          padding: 9px 14px; font-size: 13.5px; font-weight: 500;
          color: var(--text-secondary); text-decoration: none;
          transition: all var(--transition-fast); cursor: pointer;
          border: none; background: none; width: 100%; font-family: var(--font-body);
          text-align: left;
        }
        .dropdown-item:hover { background: var(--surface-hover); color: var(--text-primary); }
        .dropdown-item.danger { color: #ef4444; }
        .dropdown-item.danger:hover { background: rgba(239,68,68,0.06); }
        .dropdown-divider { height: 1px; background: var(--border-muted); margin: 0; }

        /* Workflow banner */
        .workflow-banner {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 28px; font-size: 13px; font-weight: 500;
          background: rgba(37,99,235,0.06); border-bottom: 1px solid rgba(37,99,235,0.12);
          color: var(--text-secondary); flex-wrap: wrap;
          animation: slideUp 0.2s ease;
        }
        .workflow-banner-link {
          display: inline-flex; align-items: center; gap: 4px;
          font-weight: 700; color: var(--brand-primary); text-decoration: none;
          margin-left: auto; transition: gap var(--transition-fast);
          white-space: nowrap;
        }
        .workflow-banner-link:hover { gap: 7px; }

        /* Logout confirmation modal */
        .ah-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.65);
          backdrop-filter: blur(6px); z-index: 400;
          display: flex; align-items: center; justify-content: center; padding: 20px;
          animation: fadeIn 0.15s ease;
        }
        .ah-modal {
          background: var(--surface-card); border: 1.5px solid var(--border-soft);
          border-radius: 18px; padding: 28px; max-width: 380px; width: 100%;
          box-shadow: 0 24px 60px rgba(0,0,0,0.25); animation: scaleIn 0.15s ease;
        }
        .ah-modal-icon { width: 52px; height: 52px; border-radius: 14px; background: rgba(248,113,113,0.1); border: 1.5px solid rgba(248,113,113,0.2); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .ah-modal-title { font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; }
        .ah-modal-text { color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin-bottom: 22px; }
        .ah-modal-btns { display: flex; gap: 10px; }
        .ah-modal-cancel { flex: 1; padding: 11px; border-radius: 10px; border: 1.5px solid var(--border-soft); background: var(--surface-card); color: var(--text-secondary); font-weight: 600; font-size: 14px; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .ah-modal-cancel:hover { background: var(--surface-hover); }
        .ah-modal-confirm { flex: 1; padding: 11px; border-radius: 10px; border: none; background: #ef4444; color: white; font-weight: 700; font-size: 14px; cursor: pointer; font-family: inherit; box-shadow: 0 4px 14px rgba(239,68,68,0.3); transition: all 0.15s; }
        .ah-modal-confirm:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(239,68,68,0.4); }

        @media (max-width: 768px) {
          .app-header { padding: 0 16px 0 60px; }
          .header-profile-name { display: none; }
          .workflow-banner { padding: 10px 16px; }
        }
      `}</style>

      <header className="app-header">
        {/* Left: title */}
        <div className="header-left">
          <div className="header-accent" />
          <div className="header-title-container">
            <h1 className="header-title">{title}</h1>
            {subtitle && <p className="header-subtitle">{subtitle}</p>}
          </div>
        </div>

        {/* Right */}
        <div className="header-right">
          {actions && <div className="header-actions">{actions}</div>}

          {/* Notification bell */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
              className="header-btn-sm"
              title="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && <span className="notification-badge" />}
            </button>

            {notifOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 298 }} onClick={() => setNotifOpen(false)} />
                <div className="notif-panel" style={{ zIndex: 299 }}>
                  <div className="notif-header">
                    <p className="notif-title">Notifications</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {unreadCount > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "rgba(37,99,235,0.1)", color: "#2563eb" }}>
                          {unreadCount} new
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setNotifications(notifications.map((n) => ({ ...n, read: true }))); }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: "var(--text-muted)", display: "flex" }}
                        title="Mark all as read"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div style={{ overflowY: "auto", maxHeight: 360 }}>
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`notif-item${!n.read ? " unread" : ""}`}
                        onClick={() => setNotifications(notifications.map((x) => x.id === n.id ? { ...x, read: true } : x))}
                      >
                        <div className="notif-icon-wrap" style={{ background: `${n.color}18` }}>
                          <n.icon size={15} color={n.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="notif-item-title">{n.title}</p>
                          <p className="notif-item-msg">{n.message}</p>
                          <p className="notif-item-time">{n.time}</p>
                        </div>
                        {!n.read && <div className="notif-unread-dot" />}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Settings */}
          <Link href="/settings" className="header-btn-sm" title="Settings">
            <Settings size={16} />
          </Link>

          {/* Profile dropdown */}
          <div style={{ position: "relative" }}>
            <button
              className="header-profile-btn"
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            >
              <div className="header-avatar">{initials}</div>
              <span className="header-profile-name">{user?.name?.split(" ")[0] || "User"}</span>
              <ChevronDown size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            </button>

            {profileOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 298 }} onClick={() => setProfileOpen(false)} />
                <div className="dropdown-panel" style={{ zIndex: 299 }}>
                  <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--border-muted)" }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{user?.name || "User"}</p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{user?.email || ""}</p>
                  </div>
                  <div style={{ padding: "6px 0" }}>
                    <Link href="/profile" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                      <User size={15} style={{ color: "var(--text-muted)" }} /> Profile
                    </Link>
                    <Link href="/settings" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                      <Settings size={15} style={{ color: "var(--text-muted)" }} /> Settings
                    </Link>
                  </div>
                  <div className="dropdown-divider" />
                  <div style={{ padding: "6px 0 8px" }}>
                    {/* Opens confirmation modal — same pattern as Sidebar */}
                    <button
                      className="dropdown-item danger"
                      onClick={() => { setProfileOpen(false); setShowLogout(true); }}
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Workflow Banner */}
      {workflowBanner && (
        <div className="workflow-banner">
          <Info size={14} style={{ flexShrink: 0, color: "var(--brand-primary)" }} />
          <span>{workflowBanner.message}</span>
          <Link href={workflowBanner.linkHref} className="workflow-banner-link">
            {workflowBanner.linkText} <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* Sign-out confirmation modal — identical UX to Sidebar modal */}
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