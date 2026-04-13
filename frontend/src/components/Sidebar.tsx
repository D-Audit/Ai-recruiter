"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { RootState } from "../store";
import {
  LayoutDashboard, Briefcase, Users, LogOut, Brain,
  Menu, X, ListChecks, Sparkles, Settings, ChevronRight,
} from "lucide-react";
import { clearAssistantContext } from "../store/slices/screeningSlice";
import { useEffect, useState } from "react";
import { getMe } from "../services/authService";

const navItems = [
  { href: "/dashboard",  icon: LayoutDashboard, label: "Dashboard",  description: "Overview & stats" },
  { href: "/jobs",       icon: Briefcase,        label: "Jobs",        description: "Manage postings" },
  { href: "/applicants", icon: Users,             label: "Applicants",  description: "Upload candidates" },
  { href: "/screenings", icon: ListChecks,        label: "Screenings",  description: "AI results" },
];

export default function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const dispatch  = useDispatch();
  const { user }  = useSelector((state: RootState) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [me, setMe] = useState<any>(null);

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
          display: none; position: fixed; top: 14px; left: 14px; z-index: 200;
          width: 40px; height: 40px; border-radius: 10px; background: #0f172a;
          border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 16px rgba(0,0,0,0.3);
          align-items: center; justify-content: center; cursor: pointer;
          color: #94a3b8; transition: background 0.15s;
        }
        .sb-trigger:hover { background: #1e293b; color: #e2e8f0; }
        .sb-overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
          z-index: 149; animation: fadeIn 0.18s ease;
        }
        .sidebar {
          font-family: var(--font-body,system-ui);
          background: #0b1324;
          background-image:
            radial-gradient(ellipse at 0% 0%, rgba(37,99,235,0.12) 0%, transparent 55%),
            radial-gradient(ellipse at 100% 100%, rgba(124,58,237,0.08) 0%, transparent 55%);
          width: var(--sidebar-width,260px); min-height: 100vh;
          position: fixed; left: 0; top: 0;
          display: flex; flex-direction: column; z-index: 150;
          border-right: 1px solid rgba(255,255,255,0.05);
          box-shadow: 2px 0 24px rgba(0,0,0,0.3);
          transition: transform 0.25s;
        }
        .sb-logo { padding: 22px 18px 18px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; gap: 11px; }
        .sb-logo-icon {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          display: flex; align-items: center; justify-content: center; gap: 2px;
          box-shadow: 0 4px 12px rgba(37,99,235,0.4);
        }
        .sb-logo-name { font-family: var(--font-display,system-ui); font-size: 16px; font-weight: 800; color: #f1f5f9; letter-spacing: -0.3px; }
        .sb-logo-tag { font-size: 9.5px; color: #3d5a80; font-weight: 600; text-transform: uppercase; letter-spacing: 0.7px; margin-top: 1px; }
        .sb-section-label { padding: 20px 18px 6px; font-size: 9.5px; font-weight: 700; color: #243447; text-transform: uppercase; letter-spacing: 1.2px; }
        .sb-nav { flex: 1; padding: 4px 10px; display: flex; flex-direction: column; gap: 1px; }
        .sb-link {
          display: flex; align-items: center; gap: 11px; padding: 10px; border-radius: 10px;
          text-decoration: none; font-weight: 500; font-size: 14px; color: #4e6a82;
          transition: all 0.15s; position: relative; overflow: hidden;
        }
        .sb-link:hover { color: #c4d4e3; background: rgba(255,255,255,0.05); }
        .sb-link.active {
          color: #93c5fd;
          background: linear-gradient(135deg, rgba(37,99,235,0.18), rgba(124,58,237,0.1));
          border: 1px solid rgba(37,99,235,0.2); font-weight: 600;
        }
        .sb-link.active::before {
          content: ''; position: absolute; left: 0; top: 15%; height: 70%;
          width: 3px; border-radius: 0 3px 3px 0;
          background: linear-gradient(180deg, #60a5fa, #a78bfa);
        }
        .sb-icon { width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }
        .sb-link.active .sb-icon { background: rgba(37,99,235,0.2); }
        .sb-link-label { flex: 1; }
        .sb-divider { margin: 8px 10px; height: 1px; background: rgba(255,255,255,0.05); }
        .sb-footer { padding: 10px 10px 18px; }
        .sb-user {
          display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 10px;
          cursor: pointer; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.03);
          transition: all 0.15s; margin-bottom: 6px; text-decoration: none;
        }
        .sb-user:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.1); }
        .sb-avatar {
          width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #1a3a6b, #3b1d8a);
          border: 2px solid rgba(255,255,255,0.12);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: #93c5fd;
        }
        .sb-user-info { flex: 1; min-width: 0; }
        .sb-user-name { color: #e2e8f0; font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sb-user-company { color: #4e6a82; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
        .sb-user-chevron { color: #1e3a5f; flex-shrink: 0; }
        .sb-action-row { display: flex; gap: 4px; }
        .sb-settings-btn {
          display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 10px; flex: 1;
          background: transparent; color: #4e6a82; border: none; cursor: pointer;
          font-weight: 500; font-size: 13px; font-family: inherit;
          transition: all 0.15s; text-align: left; text-decoration: none;
        }
        .sb-settings-btn.active, .sb-settings-btn:hover { color: #c4d4e3; background: rgba(255,255,255,0.05); }

        /* ── LOGOUT BUTTON — fully visible ── */
        .sb-logout-btn {
          display: flex; align-items: center; gap: 8px; padding: 9px 12px;
          border-radius: 10px; background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.15);
          color: #f87171; cursor: pointer; font-weight: 600; font-size: 13px;
          font-family: inherit; transition: all 0.15s; white-space: nowrap;
        }
        .sb-logout-btn:hover { background: rgba(239,68,68,0.16); border-color: rgba(239,68,68,0.3); color: #fca5a5; }

        .sb-status {
          margin: 10px 0 0; padding: 7px 10px; border-radius: 8px;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
          display: flex; align-items: center; gap: 8px;
        }
        .sb-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px rgba(34,197,94,0.6); flex-shrink: 0; animation: pulse 2.5s ease-in-out infinite; }
        .sb-status-text { color: #2d4a6b; font-size: 10.5px; font-weight: 500; }
        .sb-close { display: none; position: absolute; top: 14px; right: 14px; width: 28px; height: 28px; border-radius: 8px; background: rgba(255,255,255,0.06); border: none; align-items: center; justify-content: center; cursor: pointer; color: #64748b; }

        /* Logout modal */
        .sb-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(6px);
          z-index: 300; display: flex; align-items: center; justify-content: center; padding: 20px;
          animation: fadeIn 0.18s ease;
        }
        .sb-modal { background: white; border-radius: 20px; padding: 32px; width: 100%; max-width: 380px; box-shadow: 0 30px 80px rgba(0,0,0,0.25); animation: scaleIn 0.2s ease; }
        .sb-modal-icon { width: 52px; height: 52px; border-radius: 14px; background: #fef2f2; border: 2px solid #fecaca; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
        .sb-modal-title { font-size: 19px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
        .sb-modal-text { color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
        .sb-modal-btns { display: flex; gap: 10px; }
        .sb-modal-cancel { flex: 1; padding: 12px; border-radius: 11px; border: 1.5px solid #e2e8f0; background: white; color: #64748b; font-weight: 600; font-size: 14px; cursor: pointer; font-family: inherit; }
        .sb-modal-cancel:hover { background: #f8fafc; }
        .sb-modal-confirm { flex: 1; padding: 12px; border-radius: 11px; border: none; background: linear-gradient(135deg,#ef4444,#dc2626); color: white; font-weight: 700; font-size: 14px; cursor: pointer; font-family: inherit; box-shadow: 0 4px 14px rgba(239,68,68,0.3); }
        .sb-modal-confirm:hover { transform: translateY(-1px); }

        /* Tablet */
        @media (max-width: 1024px) and (min-width: 769px) {
          .sidebar { width: var(--sidebar-collapsed,72px); }
          .sb-logo-name, .sb-logo-tag, .sb-section-label, .sb-link-label,
          .sb-user-info, .sb-user-chevron, .sb-status-text { display: none; }
          .sb-logo { justify-content: center; padding: 18px 0; }
          .sb-nav { align-items: center; padding: 4px 8px; }
          .sb-link { padding: 10px; justify-content: center; gap: 0; width: 40px; }
          .sb-icon { width: 32px; height: 32px; }
          .sb-user { justify-content: center; }
          .sb-action-row { flex-direction: column; align-items: center; }
          .sb-settings-btn { padding: 10px; justify-content: center; width: 40px; }
          .sb-settings-btn span { display: none; }
          .sb-logout-btn { padding: 10px; justify-content: center; width: 40px; }
          .sb-logout-btn span { display: none; }
          .sb-footer { padding: 8px 8px 16px; }
          .sb-status { justify-content: center; }
        }
        /* Mobile */
        @media (max-width: 768px) {
          .sb-trigger { display: flex; }
          .sidebar { transform: translateX(-100%); width: 260px; }
          .sidebar.open { transform: translateX(0); }
          .sb-overlay { display: block; }
          .sb-close { display: flex; }
        }
      `}</style>

      <button className="sb-trigger" onClick={() => setIsOpen(true)} aria-label="Open navigation">
        <Menu size={19} />
      </button>

      {isOpen && <div className="sb-overlay" onClick={() => setIsOpen(false)} />}

      <aside className={`sidebar${isOpen ? " open" : ""}`} role="navigation" aria-label="Main navigation">
        <button className="sb-close" onClick={() => setIsOpen(false)} aria-label="Close navigation">
          <X size={15} />
        </button>

        {/* Logo */}
        <div className="sb-logo">
          <div className="sb-logo-icon">
            <Brain size={16} color="white" />
            <Sparkles size={13} color="rgba(255,255,255,0.8)" />
          </div>
          <div>
            <p className="sb-logo-name">Umurava AI</p>
            <p className="sb-logo-tag">Recruiter Platform</p>
          </div>
        </div>

        <p className="sb-section-label">Main Menu</p>
        <nav className="sb-nav">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href + "/")) ||
              (item.href === "/applicants" && pathname.startsWith("/candidates"));
            return (
              <Link key={item.href} href={item.href} className={`sb-link${active ? " active" : ""}`}>
                <span className="sb-icon"><item.icon size={16} strokeWidth={active ? 2.5 : 2} /></span>
                <span className="sb-link-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sb-footer">
          <div className="sb-divider" />

          <Link href="/profile" className="sb-user">
            <div className="sb-avatar">{initials}</div>
            <div className="sb-user-info">
              <p className="sb-user-name">{displayUser?.name || "Recruiter"}</p>
              <p className="sb-user-company">{displayUser?.company || displayUser?.email || "—"}</p>
            </div>
            <ChevronRight size={14} className="sb-user-chevron" />
          </Link>

          <div className="sb-action-row">
            <Link href="/settings" className={`sb-settings-btn${pathname === "/settings" ? " active" : ""}`}>
              <Settings size={15} />
              <span>Settings</span>
            </Link>
            <button className="sb-logout-btn" onClick={() => setShowLogout(true)} title="Sign out" aria-label="Sign out">
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="sb-status">
            <span className="sb-status-dot" />
            <span className="sb-status-text">All systems operational</span>
          </div>
        </div>
      </aside>

      {showLogout && (
        <div className="sb-modal-overlay" onClick={() => setShowLogout(false)}>
          <div className="sb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sb-modal-icon"><LogOut size={22} color="#ef4444" /></div>
            <h2 className="sb-modal-title">Sign out?</h2>
            <p className="sb-modal-text">You'll need to sign back in to access your screening workspace and candidate data.</p>
            <div className="sb-modal-btns">
              <button className="sb-modal-cancel" onClick={() => setShowLogout(false)}>Stay</button>
              <button className="sb-modal-confirm" onClick={confirmLogout}>Sign out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}