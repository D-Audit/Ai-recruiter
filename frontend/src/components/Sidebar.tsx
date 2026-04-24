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

const NAV_BG       = "#0f1c3a";  // deep navy — matches reference image exactly
const NAV_BG_DARK  = "#0b1528";

const navItems = [
  { href: "/dashboard",  icon: LayoutDashboard, label: "Dashboard",  tag: null },
  { href: "/jobs",       icon: Briefcase,        label: "Jobs",        tag: null },
  { href: "/candidates", icon: Users,             label: "Candidates",  tag: null },
  { href: "/screenings", icon: ListChecks,        label: "Screenings",  tag: "AI" },
];

function DiamondLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 1L21 8.5L17 21H5L1 8.5L11 1Z" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M11 5L18 9.5L15 19H7L4 9.5L11 5Z" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M11 9L14.5 11.5L13 17H9L7.5 11.5L11 9Z" fill="white" />
    </svg>
  );
}

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
        /* ── Mobile trigger ── */
        .sb-trigger {
          display: none; position: fixed; top: 16px; left: 16px; z-index: 200;
          width: 40px; height: 40px; border-radius: 10px;
          background: ${NAV_BG}; border: 1px solid rgba(255,255,255,0.1);
          align-items: center; justify-content: center;
          cursor: pointer; color: #ffffff; transition: all 0.15s;
        }
        .sb-trigger:hover { background: #1a2d50; }

        .sb-overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(0,0,0,0.65);
          z-index: 149; animation: sbFadeIn 0.2s ease;
        }
        @keyframes sbFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes sbScaleIn { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }

        /* ── Shell ──
           Clean flat navy — no heavy box-shadow, no gradient blur,
           matches the reference image: solid colour, crisp border only */
        .sidebar {
          font-family: var(--font-body, 'Inter', system-ui);
          width: var(--sidebar-width, 260px);
          min-height: 100vh; position: fixed; left: 0; top: 0;
          display: flex; flex-direction: column; z-index: 150;
          background: ${NAV_BG};
          border-right: 1px solid rgba(255,255,255,0.07);
          /* NO heavy box-shadow — clean flat look like reference */
          box-shadow: none;
          transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
          overflow: hidden;
        }

        /* ── Logo ── */
        .sb-logo {
          padding: 22px 20px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex; align-items: center; gap: 12px;
        }
        .sb-logo-icon {
          width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 60%, #7c3aed 100%);
          display: flex; align-items: center; justify-content: center;
        }
        .sb-logo-name {
          font-size: 18px; font-weight: 700; color: #ffffff;
          letter-spacing: -0.3px; line-height: 1;
          font-family: var(--font-display, 'Inter', sans-serif);
        }
        .sb-logo-tag {
          font-size: 9.5px; font-weight: 600; letter-spacing: 1.6px;
          text-transform: uppercase; margin-top: 4px;
          color: rgba(255,255,255,0.38);
        }

        /* ── Section label ── */
        .sb-section-label {
          padding: 22px 20px 8px;
          font-size: 9.5px; font-weight: 700; color: rgba(255,255,255,0.28);
          text-transform: uppercase; letter-spacing: 2px;
        }

        /* ── Nav ── */
        .sb-nav {
          flex: 1; padding: 2px 10px 8px;
          display: flex; flex-direction: column; gap: 2px;
        }

        /* Nav links — clean white text, no border tricks */
        .sb-link {
          display: flex; align-items: center; gap: 13px;
          padding: 11px 12px; border-radius: 10px;
          text-decoration: none;
          font-size: 15px; font-weight: 500;
          color: rgba(255,255,255,0.65);
          transition: background 0.14s, color 0.14s;
          letter-spacing: -0.01em;
          position: relative;
        }
        .sb-link:hover {
          color: #ffffff;
          background: rgba(255,255,255,0.08);
        }
        /* Active: slightly lighter navy bg + white text + left bar */
        .sb-link.active {
          color: #ffffff;
          background: rgba(255,255,255,0.12);
          font-weight: 600;
        }
        .sb-link.active::before {
          content: '';
          position: absolute; left: 0; top: 20%; height: 60%;
          width: 3px; border-radius: 0 3px 3px 0;
          background: #4f9cf9;
        }

        /* Icon wrapper — same colour as text */
        .sb-icon {
          width: 32px; height: 32px; border-radius: 8px;
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          color: inherit;
        }
        .sb-link.active .sb-icon { color: #ffffff; }

        .sb-link-label { flex: 1; }

        /* AI badge */
        .sb-ai-tag {
          font-size: 9px; font-weight: 700; letter-spacing: 0.6px;
          padding: 2px 7px; border-radius: 5px;
          background: rgba(124,58,237,0.25);
          color: #c4b5fd; border: 1px solid rgba(124,58,237,0.3);
          text-transform: uppercase;
        }

        /* ── Divider ── */
        .sb-divider {
          margin: 8px 12px; height: 1px;
          background: rgba(255,255,255,0.07);
        }

        /* ── Footer ── */
        .sb-footer { padding: 8px 10px 22px; }

        /* User card */
        .sb-user {
          display: flex; align-items: center; gap: 11px;
          padding: 11px 12px; border-radius: 10px; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.05);
          transition: background 0.14s; margin-bottom: 4px;
          text-decoration: none;
        }
        .sb-user:hover { background: rgba(255,255,255,0.09); }
        .sb-avatar {
          width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: white;
        }
        .sb-user-name {
          font-size: 13.5px; font-weight: 600; color: #ffffff;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sb-user-email {
          font-size: 11px; color: rgba(255,255,255,0.38);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin-top: 2px;
        }

        /* Footer buttons */
        .sb-footer-btn {
          display: flex; align-items: center; gap: 11px;
          padding: 9px 12px; border-radius: 10px;
          border: none; background: transparent;
          font-family: inherit; font-size: 14.5px; font-weight: 500;
          width: 100%; text-align: left; cursor: pointer;
          transition: background 0.14s, color 0.14s; text-decoration: none;
          color: rgba(255,255,255,0.6);
        }
        .sb-footer-btn:hover { color: #ffffff; background: rgba(255,255,255,0.08); }
        .sb-footer-btn.signout:hover { color: #fca5a5; background: rgba(239,68,68,0.1); }

        /* ── Logout modal ── */
        .sb-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.65); backdrop-filter: blur(8px);
          z-index: 400; display: flex; align-items: center; justify-content: center;
          padding: 20px; animation: sbFadeIn 0.15s ease;
        }
        .sb-modal {
          background: var(--surface-card, #ffffff);
          border: 1px solid var(--border-soft, #e2e8f0);
          border-radius: 20px; padding: 28px; max-width: 360px; width: 100%;
          box-shadow: 0 24px 60px rgba(0,0,0,0.25); animation: sbScaleIn 0.18s ease;
        }
        .sb-modal-icon {
          width: 52px; height: 52px; border-radius: 14px;
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
          display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
        }
        .sb-modal-title { font-size: 18px; font-weight: 700; color: var(--text-primary,#0f172a); margin-bottom: 8px; }
        .sb-modal-text  { color: var(--text-secondary,#475569); font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
        .sb-modal-btns  { display: flex; gap: 10px; }
        .sb-modal-cancel {
          flex: 1; padding: 12px; border-radius: 11px;
          border: 1.5px solid var(--border-soft,#e2e8f0);
          background: var(--surface-card,#ffffff);
          color: var(--text-secondary,#475569); font-weight: 600; font-size: 14px;
          cursor: pointer; font-family: inherit; transition: background 0.15s;
        }
        .sb-modal-cancel:hover { background: var(--surface-hover,#f8fafc); }
        .sb-modal-confirm {
          flex: 1; padding: 12px; border-radius: 11px; border: none;
          background: #ef4444; color: white; font-weight: 700; font-size: 14px;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .sb-modal-confirm:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(239,68,68,0.38); }

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

        {/* ── Logo ── */}
        <div className="sb-logo">
          <div className="sb-logo-icon">
            <DiamondLogo />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="sb-logo-name">ScreenAI</p>
            <p className="sb-logo-tag">Talent Screening</p>
          </div>
          {isOpen && (
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4, borderRadius: 7 }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* ── Nav ── */}
        <p className="sb-section-label">Main Menu</p>
        <div className="sb-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`sb-link${isActive ? " active" : ""}`}>
                <span className="sb-icon"><item.icon size={18} /></span>
                <span className="sb-link-label">{item.label}</span>
                {item.tag && <span className="sb-ai-tag">{item.tag}</span>}
              </Link>
            );
          })}
        </div>

        <div className="sb-divider" />

        {/* ── Footer ── */}
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