"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { RootState } from "../store";
import {
  LayoutDashboard, Briefcase, Users, LogOut,
  Menu, X, ListChecks, Settings, ChevronRight,
} from "lucide-react";
import AnimatedLogo from "./AnimatedLogo";
import { clearAssistantContext } from "../store/slices/screeningSlice";
import { useEffect, useState } from "react";
import { getMe } from "../services/authService";

// FIX 1: Removed "Upload" nav item — upload is accessed contextually from Jobs/Applicants flow
const navItems = [
  { href: "/dashboard",  icon: LayoutDashboard, label: "Dashboard",  description: "Overview & stats" },
  { href: "/jobs",       icon: Briefcase,        label: "Jobs",        description: "Manage postings" },
  { href: "/candidates", icon: Users,             label: "Candidates",  description: "Browse candidates" },
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
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: white;
        }
        .sb-user-info { flex: 1; min-width: 0; }
        .sb-user-name { font-size: 13px; font-weight: 600; color: #c4d4e3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sb-user-email { font-size: 11px; color: #4e6a82; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sb-logout-btn {
          display: flex; align-items: center; gap: 9px; padding: 9px 10px; border-radius: 9px;
          border: none; background: transparent; color: #4e6a82; cursor: pointer;
          font-family: inherit; font-size: 13px; font-weight: 500; width: 100%; text-align: left;
          transition: all 0.15s;
        }
        .sb-logout-btn:hover { color: #f87171; background: rgba(248,113,113,0.08); }
        .sb-settings-btn {
          display: flex; align-items: center; gap: 9px; padding: 9px 10px; border-radius: 9px;
          text-decoration: none; color: #4e6a82; font-size: 13px; font-weight: 500;
          transition: all 0.15s;
        }
        .sb-settings-btn:hover { color: #c4d4e3; background: rgba(255,255,255,0.05); }

        /* FIX 3: Logout modal z-index 400 so it always renders on top */
        .sb-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.65);
          backdrop-filter: blur(6px); z-index: 400;
          display: flex; align-items: center; justify-content: center; padding: 20px;
          animation: fadeIn 0.15s ease;
        }
        .sb-modal {
          background: var(--surface-card); border: 1.5px solid var(--border-soft);
          border-radius: 18px; padding: 28px; max-width: 380px; width: 100%;
          box-shadow: 0 24px 60px rgba(0,0,0,0.25); animation: scaleIn 0.15s ease;
        }
        .sb-modal-icon { width: 52px; height: 52px; border-radius: 14px; background: rgba(248,113,113,0.1); border: 1.5px solid rgba(248,113,113,0.2); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .sb-modal-title { font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; }
        .sb-modal-text { color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin-bottom: 22px; }
        .sb-modal-btns { display: flex; gap: 10px; }
        .sb-modal-cancel { flex: 1; padding: 11px; border-radius: 10px; border: 1.5px solid var(--border-soft); background: var(--surface-card); color: var(--text-secondary); font-weight: 600; font-size: 14px; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .sb-modal-cancel:hover { background: var(--surface-hover); }
        .sb-modal-confirm { flex: 1; padding: 11px; border-radius: 10px; border: none; background: #ef4444; color: white; font-weight: 700; font-size: 14px; cursor: pointer; font-family: inherit; box-shadow: 0 4px 14px rgba(239,68,68,0.3); transition: all 0.15s; }
        .sb-modal-confirm:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(239,68,68,0.4); }

        @media (max-width: 768px) {
          .sb-trigger { display: flex; }
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); }
          .sb-overlay { display: block; }
        }
      `}</style>

      {/* Mobile trigger */}
      <button className="sb-trigger" onClick={() => setIsOpen(true)} aria-label="Open menu">
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {isOpen && <div className="sb-overlay" onClick={() => setIsOpen(false)} />}

      <nav className={`sidebar${isOpen ? " open" : ""}`}>
        <div className="sb-logo">
          <AnimatedLogo size="sm" dark={true} />
          {isOpen && (
            <button
              onClick={() => setIsOpen(false)}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "#4e6a82", cursor: "pointer", padding: 4, borderRadius: 7 }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Nav — only 4 items: Dashboard, Jobs, Candidates, Screenings */}
        <p className="sb-section-label">Main Menu</p>
        <div className="sb-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sb-link${isActive ? " active" : ""}`}
              >
                <span className="sb-icon">
                  <item.icon size={17} />
                </span>
                <span className="sb-link-label">{item.label}</span>
                {isActive && <ChevronRight size={14} style={{ opacity: 0.5 }} />}
              </Link>
            );
          })}
        </div>

        <div className="sb-divider" />

        {/* Footer */}
        <div className="sb-footer">
          <Link href="/profile" className="sb-user">
            <div className="sb-avatar">{initials}</div>
            <div className="sb-user-info">
              <p className="sb-user-name">{displayUser?.name || "User"}</p>
              <p className="sb-user-email">{displayUser?.email || ""}</p>
            </div>
          </Link>

          <Link href="/settings" className="sb-settings-btn">
            <Settings size={16} /> Settings
          </Link>

          {/* FIX 3: Sign out opens confirmation modal — confirmLogout called only after confirmation */}
          <button className="sb-logout-btn" onClick={() => setShowLogout(true)}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </nav>

      {/* FIX 3: Logout confirmation modal — must confirm before signing out */}
      {showLogout && (
        <div className="sb-modal-overlay" onClick={() => setShowLogout(false)}>
          <div className="sb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sb-modal-icon">
              <LogOut size={22} color="#ef4444" />
            </div>
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