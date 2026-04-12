"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { RootState } from "../store";
import {
  LayoutDashboard, Briefcase, Users, LogOut, Brain,
  Menu, X, ListChecks, Sparkles, Settings,
} from "lucide-react";
import { clearAssistantContext } from "../store/slices/screeningSlice";
import { useEffect, useState } from "react";
import { getMe } from "../services/authService";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/applicants", icon: Users, label: "Applicants" },
  { href: "/screenings", icon: ListChecks, label: "Screenings" },
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

  useEffect(() => {
    getMe().then((d) => setMe(d.user)).catch(() => {});
  }, []);

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
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');

        .sb-trigger {
          display: none; position: fixed; top: 16px; left: 16px; z-index: 200;
          width: 42px; height: 42px; border-radius: 12px; background: #0a1628;
          border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 16px rgba(0,0,0,0.3);
          align-items: center; justify-content: center; cursor: pointer;
          color: #94a3b8; transition: background 0.18s ease;
        }
        .sb-trigger:hover { background: #111f3a; color: #e2e8f0; }

        .sb-overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(0,0,0,0.55); backdrop-filter: blur(3px);
          z-index: 149; animation: sbFadeIn 0.2s ease;
        }
        @keyframes sbFadeIn { from { opacity: 0; } to { opacity: 1; } }

        .sidebar {
          font-family: 'DM Sans', sans-serif;
          background: #0f172a;
          background-image:
            radial-gradient(ellipse at 20% 10%, rgba(37,99,235,0.1) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 90%, rgba(124,58,237,0.07) 0%, transparent 60%);
          width: 260px; min-height: 100vh;
          position: fixed; left: 0; top: 0;
          display: flex; flex-direction: column; z-index: 150;
          border-right: 1px solid rgba(255,255,255,0.06);
          box-shadow: 4px 0 32px rgba(0,0,0,0.4);
          transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sb-logo {
          padding: 24px 20px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex; align-items: center; gap: 12px;
        }
        .sb-logo-icon {
          width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(37,99,235,0.4);
        }
        .sb-logo-name { font-family: 'Sora', sans-serif; font-size: 17px; font-weight: 800; color: #f1f5f9; letter-spacing: -0.3px; }
        .sb-logo-tag { font-size: 10px; color: #475569; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }

        .sb-section-label {
          padding: 16px 20px 6px; font-size: 10px; font-weight: 700;
          color: #2d4a6b; text-transform: uppercase; letter-spacing: 1px;
        }

        .sb-nav { flex: 1; padding: 6px 12px; display: flex; flex-direction: column; gap: 2px; }

        .sb-link {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 12px; border-radius: 10px;
          text-decoration: none; font-weight: 500; font-size: 14px;
          color: #64748b; transition: all 0.18s ease; position: relative;
        }
        .sb-link:hover { color: #cbd5e1; background: #1e293b; }
        .sb-link.active {
          color: #93c5fd;
          background: linear-gradient(135deg, rgba(37,99,235,0.2), rgba(124,58,237,0.12));
          box-shadow: 0 0 0 1px rgba(37,99,235,0.25), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .sb-link.active::before {
          content: ''; position: absolute; left: 0; top: 20%; height: 60%;
          width: 3px; border-radius: 0 4px 4px 0;
          background: linear-gradient(180deg, #3b82f6, #7c3aed);
        }
        .sb-icon {
          width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .sb-link.active .sb-icon { background: rgba(37,99,235,0.25); }

        .sb-divider { margin: 8px 12px; height: 1px; background: rgba(255,255,255,0.06); }

        .sb-footer { padding: 12px 12px 20px; }

        .sb-user {
          display: flex; align-items: center; gap: 10px;
          padding: 12px; border-radius: 12px; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          transition: background 0.18s ease;
          margin-bottom: 4px;
        }
        .sb-user:hover { background: rgba(255,255,255,0.06); }
        .sb-avatar {
          width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #1e3a5f, #2d1b6e);
          border: 2px solid rgba(255,255,255,0.12);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: #93c5fd;
        }
        .sb-user-info { flex: 1; min-width: 0; }
        .sb-user-name { color: #e2e8f0; font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sb-user-email { color: #475569; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .sb-logout-btn {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: 10px; width: 100%;
          background: transparent; color: #64748b; border: none; cursor: pointer;
          font-weight: 500; font-size: 14px; font-family: 'DM Sans', sans-serif;
          transition: all 0.18s ease; text-align: left;
        }
        .sb-logout-btn:hover { color: #f87171; background: rgba(248,113,113,0.08); }

        .sb-status { margin: 8px 12px 0; padding: 6px 10px; border-radius: 8px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: space-between; }
        .sb-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e;
          box-shadow: 0 0 6px rgba(34,197,94,0.5); animation: sbPulse 2.4s ease-in-out infinite; }
        @keyframes sbPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .sb-status-text { color: #334155; font-size: 10.5px; font-weight: 500; }

        .sb-close {
          display: none; position: absolute; top: 16px; right: 16px;
          width: 30px; height: 30px; border-radius: 8px; background: rgba(255,255,255,0.06);
          border: none; align-items: center; justify-content: center; cursor: pointer; color: #64748b;
        }

        /* Logout confirm */
        .sb-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);
          z-index: 300; display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .sb-modal {
          background: white; border-radius: 20px; padding: 32px; width: 100%; max-width: 380px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.3); animation: sbFadeIn 0.2s ease;
        }
        .sb-modal-icon { width: 56px; height: 56px; border-radius: 14px; background: #fef2f2;
          border: 2px solid #fecaca; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
        .sb-modal-title { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 10px; }
        .sb-modal-text { color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 28px; }
        .sb-modal-btns { display: flex; gap: 12px; }
        .sb-modal-cancel { flex: 1; padding: 12px; border-radius: 11px; border: 1.5px solid #e2e8f0;
          background: white; color: #64748b; font-weight: 600; font-size: 14px; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .sb-modal-confirm { flex: 1; padding: 12px; border-radius: 11px; border: none;
          background: linear-gradient(135deg, #ef4444, #dc2626); color: white; font-weight: 700;
          font-size: 14px; cursor: pointer; font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 14px rgba(239,68,68,0.35); }

        @media (max-width: 1024px) and (min-width: 769px) {
          .sidebar { width: 72px; }
          .sb-logo-name, .sb-logo-tag, .sb-section-label,
          .sb-link span, .sb-user-info, .sb-logout-btn span:last-child,
          .sb-status-text { display: none; }
          .sb-logo { justify-content: center; }
          .sb-nav { align-items: center; }
          .sb-link { padding: 12px; justify-content: center; gap: 0; border-radius: 12px; }
          .sb-icon { width: 36px; height: 36px; }
          .sb-user { justify-content: center; }
          .sb-logout-btn { justify-content: center; padding: 12px 0; }
          .sb-footer { padding: 12px 8px 20px; }
        }

        @media (max-width: 768px) {
          .sb-trigger { display: flex; }
          .sidebar { transform: translateX(-100%); width: 260px; }
          .sidebar.open { transform: translateX(0); }
          .sb-overlay { display: block; }
          .sb-close { display: flex; }
        }
      `}</style>

      <button className="sb-trigger" onClick={() => setIsOpen(true)} aria-label="Open menu">
        <Menu size={20} />
      </button>

      {isOpen && <div className="sb-overlay" onClick={() => setIsOpen(false)} />}

      <aside className={`sidebar${isOpen ? " open" : ""}`}>
        <button className="sb-close" onClick={() => setIsOpen(false)}>
          <X size={16} />
        </button>

        {/* Logo */}
        <div className="sb-logo">
          <div className="sb-logo-icon" style={{ gap: 4 }}>
            <Brain size={18} color="white" />
            <Sparkles size={16} color="white" />
          </div>
          <div>
            <p className="sb-logo-name">Umurava AI</p>
            <p className="sb-logo-tag">Recruiter</p>
          </div>
        </div>

        {/* Nav */}
        <p className="sb-section-label">Navigation</p>
        <nav className="sb-nav">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
            return (
              <Link key={item.href} href={item.href} className={`sb-link ${active ? "active" : ""}`}>
                <span className="sb-icon">
                  <item.icon size={17} />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sb-footer">
          <div className="sb-divider" />

          {/* User profile → profile page */}
          <Link href="/profile" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="sb-user" style={{ cursor: "pointer" }}>
              <div className="sb-avatar">{initials}</div>
              <div className="sb-user-info">
                <p className="sb-user-name">{displayUser?.name || "Recruiter"}</p>
                <p className="sb-user-email">{displayUser?.email || "..."}</p>
              </div>
            </div>
          </Link>

          <Link
            href="/settings"
            className={`sb-link${pathname === "/settings" ? " active" : ""}`}
            style={{ marginBottom: 4, textDecoration: "none" }}
          >
            <span className="sb-icon">
              <Settings size={17} />
            </span>
            <span>Settings</span>
          </Link>

          <button className="sb-logout-btn" onClick={() => setShowLogout(true)}>
            <span className="sb-icon"><LogOut size={17} /></span>
            <span>Logout</span>
          </button>

          <div className="sb-status">
            <span className="sb-status-text">System Online</span>
            <span className="sb-status-dot" />
          </div>
        </div>
      </aside>

      {/* Logout modal */}
      {showLogout && (
        <div className="sb-modal-overlay" onClick={() => setShowLogout(false)}>
          <div className="sb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sb-modal-icon">
              <LogOut size={26} color="#ef4444" />
            </div>
            <h3 className="sb-modal-title">Confirm Logout</h3>
            <p className="sb-modal-text">
              Are you sure you want to logout? You will need to sign in again to access your dashboard.
            </p>
            <div className="sb-modal-btns">
              <button className="sb-modal-cancel" onClick={() => setShowLogout(false)}>Cancel</button>
              <button className="sb-modal-confirm" onClick={confirmLogout}>Yes, Logout</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}