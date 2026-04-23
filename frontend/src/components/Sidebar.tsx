"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { RootState } from "../store";
import {
  LayoutDashboard, Briefcase, Users, LogOut,
  Menu, X, ListChecks, Settings,
} from "lucide-react";
import { clearAssistantContext } from "../store/slices/screeningSlice";
import { useEffect, useState } from "react";
import { getMe } from "../services/authService";
import AnimatedLogo from "./AnimatedLogo";

const navItems = [
  { href: "/dashboard",  icon: LayoutDashboard, label: "Dashboard",  tag: null },
  { href: "/jobs",       icon: Briefcase,        label: "Jobs",        tag: null },
  { href: "/candidates", icon: Users,             label: "Candidates",  tag: null },
  { href: "/screenings", icon: ListChecks,        label: "Screenings",  tag: "AI" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isOpen,     setIsOpen]     = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [me,         setMe]         = useState<any>(null);

  useEffect(() => { setIsOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);
  useEffect(() => { getMe().then((d) => setMe(d.user)).catch(() => {}); }, []);

  const displayUser = me || user;
  const initials = displayUser?.name
    ? displayUser.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "HR";

  const confirmLogout = () => {
    dispatch(logout());
    dispatch(clearAssistantContext());
    router.push("/");
  };

  return (
    <>
      <style>{`
        .sb-trigger {
          display: none; position: fixed; top: 16px; left: 16px; z-index: 200;
          width: 40px; height: 40px; border-radius: 10px;
          background: #f7f7f8; border: 1px solid var(--border-soft);
          box-shadow: 0 8px 20px rgba(16,24,40,0.12);
          align-items: center; justify-content: center;
          cursor: pointer; color: #94a3b8; transition: all 0.15s;
        }
        .sb-trigger:hover { background: var(--surface-hover); color: var(--text-primary); }

        .sb-overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);
          z-index: 149; animation: fadeIn 0.2s ease;
        }

        /* ── Shell ── */
        .sidebar {
          font-family: var(--font-body, system-ui);
          width: var(--sidebar-width, 260px);
          min-height: 100vh; position: fixed; left: 0; top: 0;
          display: flex; flex-direction: column; z-index: 150;
          background: #f7f7f8;
          border-right: 1px solid var(--border-soft);
          box-shadow: none;
          transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
          overflow: hidden;
        }
        .sidebar::before {
          content: '';
          position: absolute; top: -80px; left: -80px;
          width: 300px; height: 300px; border-radius: 50%;
          background: none;
          pointer-events: none;
        }
        .sidebar::after {
          content: '';
          position: absolute; bottom: -80px; right: -80px;
          width: 240px; height: 240px; border-radius: 50%;
          background: none;
          pointer-events: none;
        }

        /* ── Logo ── */
        .sb-logo {
          padding: 18px 14px 14px;
          border-bottom: 1px solid var(--border-muted);
          display: flex; align-items: center; gap: 12px;
          position: relative; z-index: 1;
        }

        /* ── Section label ── */
        .sb-section-label {
          padding: 20px 20px 8px;
          font-size: 9.5px; font-weight: 700; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: 2px;
          position: relative; z-index: 1;
        }

        /* ── Nav ── */
        .sb-nav {
          flex: 1; padding: 2px 10px 8px;
          display: flex; flex-direction: column; gap: 3px;
          position: relative; z-index: 1;
        }

        .sb-link {
          display: flex; align-items: center; gap: 11px;
          padding: 10px 12px; border-radius: 11px;
          text-decoration: none; font-weight: 500;
          font-size: 14.5px; color: var(--text-secondary);
          transition: all 0.18s; position: relative;
          border: 1px solid transparent;
          letter-spacing: -0.01em;
        }
        .sb-link:hover {
          color: var(--text-primary);
          background: var(--surface-hover);
          border-color: var(--border-muted);
        }
        .sb-link.active {
          color: #1d4ed8;
          background: rgba(37,99,235,0.08);
          border-color: rgba(37,99,235,0.22);
          font-weight: 700;
        }
        .sb-link.active::before {
          content: '';
          position: absolute; left: -1px; top: 18%; height: 64%;
          width: 3px; border-radius: 0 3px 3px 0;
          background: linear-gradient(180deg, #60a5fa, #818cf8);
        }

        .sb-icon {
          width: 34px; height: 34px; border-radius: 9px;
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          transition: all 0.18s; color: inherit;
        }
        .sb-link.active .sb-icon {
          background: rgba(59,130,246,0.18);
          color: #2563eb;
        }
        .sb-link-label { flex: 1; }
        .sb-ai-tag {
          font-size: 9px; font-weight: 800; letter-spacing: 0.8px;
          padding: 2px 7px; border-radius: 5px;
          background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(37,99,235,0.14));
          color: #5b21b6; border: 1px solid rgba(124,58,237,0.24);
          text-transform: uppercase;
        }

        /* ── Divider ── */
        .sb-divider {
          margin: 6px 10px;
          height: 1px;
          background: var(--border-muted);
          position: relative; z-index: 1;
        }

        /* ── Footer ── */
        .sb-footer {
          padding: 8px 10px 20px;
          position: relative; z-index: 1;
        }

        /* User card */
        .sb-user {
          display: flex; align-items: center; gap: 11px;
          padding: 11px 12px; border-radius: 12px;
          cursor: pointer;
          border: 1px solid var(--border-soft);
          background: #ffffff;
          transition: all 0.15s; margin-bottom: 4px;
          text-decoration: none;
        }
        .sb-user:hover {
          background: var(--surface-hover);
          border-color: var(--border-input);
        }
        .sb-avatar {
          width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #1d4ed8, #7c3aed);
          display: flex; align-items: center; justify-content: center;
          font-size: 12.5px; font-weight: 800; color: white;
          box-shadow: 0 2px 10px rgba(37,99,235,0.35);
        }
        .sb-user-name {
          font-size: 13.5px; font-weight: 700; color: var(--text-primary);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sb-user-email {
          font-size: 11px; color: var(--text-muted);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin-top: 2px;
        }

        /* Footer buttons */
        .sb-footer-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 10px;
          border: none; background: transparent;
          font-family: inherit; font-size: 14px; font-weight: 600;
          width: 100%; text-align: left; cursor: pointer;
          transition: all 0.15s; text-decoration: none;
          letter-spacing: -0.01em;
        }
        .sb-footer-btn.settings {
          color: var(--text-secondary);
        }
        .sb-footer-btn.settings:hover {
          color: var(--text-primary); background: var(--surface-hover);
        }
        .sb-footer-btn.signout {
          color: var(--text-secondary);
        }
        .sb-footer-btn.signout:hover {
          color: #fca5a5; background: rgba(239,68,68,0.08);
        }

        /* Logout modal */
        .sb-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
          z-index: 400; display: flex; align-items: center; justify-content: center;
          padding: 20px; animation: fadeIn 0.15s ease;
        }
        .sb-modal {
          background: var(--surface-card); border: 1px solid var(--border-soft);
          border-radius: 20px; padding: 28px; max-width: 360px; width: 100%;
          box-shadow: 0 24px 60px rgba(0,0,0,0.3); animation: scaleIn 0.18s ease;
        }
        .sb-modal-icon {
          width: 52px; height: 52px; border-radius: 14px;
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.18);
          display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
        }
        .sb-modal-title { font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; }
        .sb-modal-text  { color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
        .sb-modal-btns  { display: flex; gap: 10px; }
        .sb-modal-cancel {
          flex: 1; padding: 12px; border-radius: 11px;
          border: 1.5px solid var(--border-soft); background: var(--surface-card);
          color: var(--text-secondary); font-weight: 600; font-size: 14px;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .sb-modal-cancel:hover { background: var(--surface-hover); }
        .sb-modal-confirm {
          flex: 1; padding: 12px; border-radius: 11px; border: none;
          background: #ef4444; color: white; font-weight: 700; font-size: 14px;
          cursor: pointer; font-family: inherit;
          box-shadow: 0 4px 14px rgba(239,68,68,0.3); transition: all 0.15s;
        }
        .sb-modal-confirm:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(239,68,68,0.4); }

        @media (max-width: 768px) {
          .sb-trigger { display: flex; }
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); }
          .sb-overlay { display: block; }
        }
      `}</style>

      <button className="sb-trigger" onClick={() => setIsOpen(true)} aria-label="Open menu">
        <Menu size={20} />
      </button>

      {isOpen && <div className="sb-overlay" onClick={() => setIsOpen(false)} />}

      <nav className={`sidebar${isOpen ? " open" : ""}`}>
        {/* Logo */}
        <div className="sb-logo">
          <AnimatedLogo size="sm" dark={false} />
          {isOpen && (
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4, borderRadius: 7 }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Nav */}
        <p className="sb-section-label">Main Menu</p>
        <div className="sb-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`sb-link${isActive ? " active" : ""}`}>
                <span className="sb-icon"><item.icon size={17} /></span>
                <span className="sb-link-label">{item.label}</span>
                {item.tag && <span className="sb-ai-tag">{item.tag}</span>}
              </Link>
            );
          })}
        </div>

        <div className="sb-divider" />

        {/* Footer */}
        <div className="sb-footer">
          <Link href="/profile" className="sb-user">
            <div className="sb-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="sb-user-name">{displayUser?.name || "User"}</p>
              <p className="sb-user-email">{displayUser?.email || ""}</p>
            </div>
          </Link>

          <Link href="/settings" className="sb-footer-btn settings">
            <Settings size={16} /> Settings
          </Link>

          <button className="sb-footer-btn signout" onClick={() => setShowLogout(true)}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </nav>

      {showLogout && (
        <div className="sb-modal-overlay" onClick={() => setShowLogout(false)}>
          <div className="sb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sb-modal-icon"><LogOut size={22} color="#ef4444" /></div>
            <p className="sb-modal-title">Sign out?</p>
            <p className="sb-modal-text">You'll be redirected to the login page. Any unsaved changes will be lost.</p>
            <div className="sb-modal-btns">
              <button className="sb-modal-cancel" onClick={() => setShowLogout(false)}>Cancel</button>
              <button className="sb-modal-confirm" onClick={confirmLogout}>Sign out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}