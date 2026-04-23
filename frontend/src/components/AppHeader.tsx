"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "../store";
import { logout } from "../store/slices/authSlice";
import { clearAssistantContext } from "../store/slices/screeningSlice";
import { getAllJobs } from "../services/jobService";
import {
  Sun, Moon,
  Bell, Settings, ChevronDown, CheckCircle2,
  Users, Briefcase, Sparkles, User, LogOut, ArrowRight, Info,
} from "lucide-react";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  workflowBanner?: { message: string; linkText: string; linkHref: string };
  actions?: React.ReactNode;
}

type HeaderNotification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  time: string;
  icon: any;
  color: string;
  createdAt: number;
};

const READ_NOTIFS_KEY = "notif_read_ids_v1";
const CLEARED_AT_KEY = "notif_cleared_at_v1";

const timeAgo = (value?: string) => {
  if (!value) return "recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const AppHeader: React.FC<AppHeaderProps> = ({ title, subtitle, workflowBanner, actions }) => {
  const { user }   = useSelector((s: RootState) => s.auth);
  const dispatch   = useDispatch();
  const router     = useRouter();
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogout,  setShowLogout]  = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);

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

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        const res = await getAllJobs();
        const jobs = (res.jobs || []) as any[];
        if (!mounted) return;

        const openJobs = jobs.filter((j) => j.status === "open");
        const screeningJobs = jobs.filter((j) => j.status === "screening");
        const jobsWithCandidates = jobs.filter((j) => (j.applicantsCount || 0) > 0);
        const latestJobTime = Math.max(
          ...jobs.map((j) => new Date(j.updatedAt || j.createdAt || 0).getTime()),
          0
        );
        const newest = [...jobs].sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        )[0];
        const mostCandidates = [...jobsWithCandidates].sort(
          (a, b) => (b.applicantsCount || 0) - (a.applicantsCount || 0)
        )[0];

        const live: HeaderNotification[] = [
          {
            id: "open-jobs",
            title: "Open positions",
            message:
              openJobs.length > 0
                ? `${openJobs.length} job${openJobs.length > 1 ? "s are" : " is"} actively receiving candidates.`
                : "No open jobs right now. Publish a role to attract applicants.",
            read: openJobs.length === 0,
            time: "live",
            icon: Briefcase,
            color: "#2563eb",
            createdAt: latestJobTime,
          },
          {
            id: "screening",
            title: "Screening pipeline",
            message:
              screeningJobs.length > 0
                ? `${screeningJobs.length} job${screeningJobs.length > 1 ? "s are" : " is"} in AI screening stage.`
                : "No active AI screening in progress yet.",
            read: screeningJobs.length === 0,
            time: "live",
            icon: Sparkles,
            color: "#7c3aed",
            createdAt: latestJobTime,
          },
        ];

        if (newest) {
          live.push({
            id: `newest-${newest._id}`,
            title: "Latest job posted",
            message: `${newest.title} was added to your hiring pipeline.`,
            read: false,
            time: timeAgo(newest.createdAt),
            icon: Briefcase,
            color: "#16a34a",
            createdAt: new Date(newest.createdAt || Date.now()).getTime(),
          });
        }

        if (mostCandidates) {
          live.push({
            id: `candidates-${mostCandidates._id}`,
            title: "Highest candidate volume",
            message: `${mostCandidates.title} has ${mostCandidates.applicantsCount} candidate${mostCandidates.applicantsCount > 1 ? "s" : ""}.`,
            read: false,
            time: timeAgo(mostCandidates.updatedAt || mostCandidates.createdAt),
            icon: Users,
            color: "#0891b2",
            createdAt: new Date(mostCandidates.updatedAt || mostCandidates.createdAt || Date.now()).getTime(),
          });
        }

        const clearedAtRaw = localStorage.getItem(CLEARED_AT_KEY);
        const clearedAt = clearedAtRaw ? new Date(clearedAtRaw).getTime() : 0;
        const readIds = new Set(
          JSON.parse(localStorage.getItem(READ_NOTIFS_KEY) || "[]") as string[]
        );

        const filtered = live
          .filter((n) => (clearedAt ? n.createdAt > clearedAt : true))
          .map((n) => (readIds.has(n.id) ? { ...n, read: true } : n));

        setNotifications(filtered);
      } catch {
        if (!mounted) return;
        setNotifications([
          {
            id: "fallback",
            title: "Activity unavailable",
            message: "We could not fetch recent activity. Refresh in a moment.",
            read: true,
            time: "now",
            icon: Info,
            color: "#64748b",
            createdAt: Date.now(),
          },
        ]);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  useEffect(() => {
    const saved = (localStorage.getItem("theme") || "light") as "light" | "dark";
    const normalized = saved === "dark" ? "dark" : "light";
    setTheme(normalized);
    document.documentElement.classList.toggle("dark", normalized === "dark");
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: "light" | "dark" = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  };

  const markOneAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    const prevIds = JSON.parse(localStorage.getItem(READ_NOTIFS_KEY) || "[]") as string[];
    const next = Array.from(new Set([...prevIds, id]));
    localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify(next));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify(notifications.map((n) => n.id)));
  };

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.setItem(CLEARED_AT_KEY, new Date().toISOString());
    localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify([]));
  };

  return (
    <div className="header-wrapper">
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Header shell ── */
        .header-wrapper {
          position: sticky; top: 0; z-index: 100;
          --ah-text: #0d1525;
          --ah-sub: #64748b;
          --ah-icon: #64748b;
          --ah-dd-bg: #ffffff;
          --ah-dd-text: #0d1525;
          --ah-btn-bg: #ffffff;
          --ah-btn-border: #d7deea;
          background: var(--surface-primary, #f7f7f8);
          border-bottom: 1px solid var(--border-soft);
          box-shadow: none;
        }
        .dark .header-wrapper {
          --ah-text: #f1f5f9;
          --ah-sub: #94a3b8;
          --ah-icon: #94a3b8;
          --ah-dd-bg: #1e293b;
          --ah-dd-text: #f1f5f9;
          --ah-btn-bg: #0f172a;
          --ah-btn-border: rgba(255,255,255,0.12);
          background: #0f1623;
          border-bottom-color: rgba(255,255,255,0.07);
        }
        .dark .app-header { color: #e2e8f0; }
        /* removed top accent line */
        .header-wrapper::before {
          display: none;
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
          font-size: 20px; font-weight: 700; color: var(--ah-text);
          letter-spacing: -0.04em; line-height: 1.15;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          font-family: var(--font-display, sans-serif);
        }
        .header-subtitle {
          font-size: 12.5px; color: var(--ah-sub); margin-top: 2px;
          white-space: nowrap; font-weight: 500;
        }

        /* Right controls */
        .header-right   { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .header-actions { display: flex; align-items: center; gap: 8px; margin-right: 4px; }

        /* Icon buttons */
        .header-icon-btn {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--ah-btn-border);
          background: var(--ah-btn-bg);
          color: var(--ah-icon); cursor: pointer; text-decoration: none;
          transition: all 0.15s; position: relative;
        }
        .header-icon-btn:hover {
          background: var(--surface-hover);
          color: var(--ah-text);
          border-color: var(--ah-btn-border);
        }
        .header-notif-badge {
          position: absolute; top: 7px; right: 7px;
          width: 7px; height: 7px; border-radius: 50%;
          background: #ef4444; border: 1.5px solid #ffffff;
        }

        /* Notification panel */
        .notif-panel {
          position: absolute; top: calc(100% + 10px); right: 0;
          width: 340px; background: var(--ah-dd-bg);
          border: 1px solid var(--border-soft); border-radius: 16px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1);
          animation: slideDown 0.18s ease; overflow: hidden; z-index: 299;
        }
        .notif-header {
          padding: 14px 16px; border-bottom: 1px solid var(--border-muted);
          display: flex; align-items: center; justify-content: space-between;
        }
        .notif-actions { display: flex; align-items: center; gap: 8px; }
        .notif-action-btn {
          border: none; background: transparent; color: var(--brand-primary);
          font-size: 11.5px; font-weight: 700; cursor: pointer; padding: 0;
        }
        .notif-action-btn:hover { text-decoration: underline; }
        .notif-title { font-weight: 700; font-size: 14px; color: var(--ah-dd-text); }
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
        .notif-item-title { font-size: 13px; font-weight: 700; color: var(--ah-dd-text); }
        .notif-item-msg   { font-size: 12px; color: var(--ah-sub); margin-top: 2px; line-height: 1.45; }
        .notif-item-time  { font-size: 10.5px; color: var(--ah-sub); margin-top: 4px; }
        .notif-dot { width: 7px; height: 7px; border-radius: 50%; background: #3b82f6; flex-shrink: 0; margin-top: 5px; }

        /* Profile button */
        .header-profile-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 5px 12px 5px 5px; border-radius: 11px;
          border: 1px solid var(--ah-btn-border);
          background: var(--ah-btn-bg);
          cursor: pointer; transition: all 0.15s; font-family: var(--font-body);
        }
        .header-profile-btn:hover {
          background: var(--surface-hover);
          border-color: var(--border-input);
        }
        .header-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: linear-gradient(135deg, #1d4ed8, #7c3aed);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; color: white; flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(37,99,235,0.35);
        }
        .header-profile-name { font-size: 13.5px; font-weight: 700; color: var(--ah-text); }

        /* Profile dropdown */
        .dropdown-panel {
          position: absolute; top: calc(100% + 10px); right: 0;
          width: 220px; background: var(--ah-dd-bg);
          border: 1px solid var(--border-soft); border-radius: 14px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1);
          animation: slideDown 0.18s ease; overflow: hidden; z-index: 299;
        }
        .dropdown-header { padding: 14px 16px 11px; border-bottom: 1px solid var(--border-muted); }
        .dropdown-username { font-weight: 700; font-size: 13.5px; color: var(--ah-dd-text); }
        .dropdown-email    { font-size: 11.5px; color: var(--ah-sub); margin-top: 2px; }
        .dropdown-section  { padding: 5px 0; }
        .dropdown-item {
          display: flex; align-items: center; gap: 9px;
          padding: 9px 14px; font-size: 13.5px; font-weight: 500;
          color: var(--ah-sub); text-decoration: none;
          transition: all 0.12s; cursor: pointer;
          border: none; background: none; width: 100%;
          font-family: var(--font-body); text-align: left;
        }
        .dropdown-item:hover { background: var(--surface-hover); color: var(--ah-dd-text); }
        .dropdown-item.danger:hover { background: rgba(239,68,68,0.06); color: #ef4444; }
        .dropdown-divider { height: 1px; background: var(--border-muted); margin: 2px 0; }

        /* Workflow banner */
        .workflow-banner {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 28px; font-size: 13px; font-weight: 500;
          color: var(--text-secondary);
          background: #ffffff;
          border-top: 1px solid var(--border-muted);
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

          <button
            className="header-icon-btn"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>

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
                  <div className="notif-actions">
                    {unreadCount > 0 && <span className="notif-count-badge">{unreadCount} new</span>}
                    {notifications.length > 0 && (
                      <>
                        <button className="notif-action-btn" onClick={markAllAsRead}>Mark all read</button>
                        <button className="notif-action-btn" onClick={clearNotifications}>Clear</button>
                      </>
                    )}
                  </div>
                </div>
                {notifications.length === 0 && (
                  <div style={{ padding: "14px 16px", fontSize: 12.5, color: "var(--text-muted)" }}>No notifications</div>
                )}
                {notifications.map((n) => (
                  <div key={n.id} className={`notif-item${n.read ? "" : " unread"}`} onClick={() => markOneAsRead(n.id)}>
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