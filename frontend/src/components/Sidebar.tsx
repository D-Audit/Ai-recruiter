"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { RootState } from "../store";
import { useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Brain,
  LogOut,
  X,
  AlertTriangle,
} from "lucide-react";

const navItems = [
  { href: "/dashboard",         icon: LayoutDashboard, label: "Dashboard"  },
  { href: "/jobs",               icon: Briefcase,       label: "Jobs"       },
  { href: "/applicants/upload",  icon: Users,           label: "Applicants" },
];

export default function Sidebar() {
  const pathname   = usePathname();
  const router     = useRouter();
  const dispatch   = useDispatch();
  const { user }   = useSelector((state: RootState) => state.auth);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    router.push("/");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "RU";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .sidebar {
          width: 260px;
          min-height: 100vh;
          background: #0f172a;
          position: fixed;
          left: 0; top: 0;
          display: flex;
          flex-direction: column;
          z-index: 100;
          border-right: 1px solid rgba(255,255,255,0.04);
        }

        .sidebar::before {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 280px;
          background: radial-gradient(ellipse at bottom left, rgba(37,99,235,0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .sidebar-logo {
          padding: 24px 20px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .logo-icon {
          width: 38px; height: 38px;
          border-radius: 11px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(37,99,235,0.35);
          flex-shrink: 0;
        }

        .logo-text { font-family: 'Sora', sans-serif; }
        .logo-name { font-size: 16px; font-weight: 700; color: #fff; letter-spacing: -0.3px; }
        .logo-sub  { font-size: 10.5px; color: rgba(255,255,255,0.35); font-weight: 500; letter-spacing: 0.05em; margin-top: 1px; text-transform: uppercase; }

        .sidebar-nav {
          flex: 1;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          position: relative;
          z-index: 1;
        }

        .nav-section-label {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255,255,255,0.22);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 12px 8px 6px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 600;
          font-size: 13.5px;
          transition: all 0.18s ease;
          position: relative;
          color: rgba(255,255,255,0.45);
          font-family: 'DM Sans', sans-serif;
        }

        .nav-link:hover {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.85);
        }

        .nav-link.active {
          background: rgba(37,99,235,0.18);
          color: #60a5fa;
        }

        .nav-link.active::before {
          content: '';
          position: absolute;
          left: 0; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 60%;
          background: #2563eb;
          border-radius: 0 3px 3px 0;
        }

        .nav-icon-wrap {
          width: 30px; height: 30px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.05);
          flex-shrink: 0;
          transition: background 0.18s;
        }

        .nav-link.active .nav-icon-wrap {
          background: rgba(37,99,235,0.25);
        }

        .nav-link:hover .nav-icon-wrap {
          background: rgba(255,255,255,0.08);
        }

        .sidebar-bottom {
          padding: 12px;
          border-top: 1px solid rgba(255,255,255,0.06);
          position: relative;
          z-index: 1;
        }

        .user-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 10px;
          border-radius: 11px;
          background: rgba(255,255,255,0.04);
          margin-bottom: 8px;
        }

        .user-avatar {
          width: 34px; height: 34px;
          border-radius: 9px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: #fff;
          flex-shrink: 0;
        }

        .user-name  { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.8); line-height: 1.2; }
        .user-role  { font-size: 11px; color: rgba(255,255,255,0.3); font-weight: 500; }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          width: 100%;
          background: transparent;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.35);
          font-size: 13.5px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.18s;
        }

        .logout-btn:hover {
          background: rgba(239,68,68,0.1);
          color: #f87171;
        }

        /* Logout Modal */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.15s ease;
        }

        .modal-box {
          background: #fff;
          border-radius: 20px;
          padding: 32px;
          width: 380px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.18);
          animation: slideUp 0.2s ease;
        }

        .modal-icon-wrap {
          width: 52px; height: 52px;
          border-radius: 14px;
          background: #fff7ed;
          border: 1.5px solid #fed7aa;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 18px;
        }

        .modal-title {
          font-family: 'Sora', sans-serif;
          font-size: 19px; font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
          letter-spacing: -0.3px;
        }

        .modal-text {
          color: #64748b; font-size: 13.5px; line-height: 1.6;
          margin-bottom: 28px;
        }

        .modal-actions { display: flex; gap: 10px; }

        .modal-cancel {
          flex: 1; padding: 12px;
          border-radius: 11px;
          border: 1.5px solid #e2e8f0;
          background: white;
          font-weight: 600; font-size: 14px;
          color: #64748b;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }
        .modal-cancel:hover { border-color: #cbd5e1; background: #f8fafc; }

        .modal-confirm {
          flex: 1; padding: 12px;
          border-radius: 11px;
          border: none;
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: white;
          font-weight: 700; font-size: 14px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 12px rgba(220,38,38,0.25);
          transition: all 0.15s;
        }
        .modal-confirm:hover { box-shadow: 0 6px 18px rgba(220,38,38,0.35); transform: translateY(-1px); }

        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Brain size={20} color="white" />
          </div>
          <div className="logo-text">
            <p className="logo-name">Umurava</p>
            <p className="logo-sub">AI Screening</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <p className="nav-section-label">Menu</p>
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} className={`nav-link ${active ? "active" : ""}`}>
                <div className="nav-icon-wrap">
                  <item.icon size={15} strokeWidth={2} />
                </div>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: user + logout */}
        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div>
              <p className="user-name">{user?.name || "Recruiter"}</p>
              <p className="user-role">HR Manager</p>
            </div>
          </div>
          <button className="logout-btn" onClick={() => setShowLogoutModal(true)}>
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrap">
              <AlertTriangle size={24} color="#f97316" />
            </div>
            <h3 className="modal-title">Sign out?</h3>
            <p className="modal-text">
              You will be returned to the login screen. Any unsaved changes will be lost.
            </p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowLogoutModal(false)}>
                Stay
              </button>
              <button className="modal-confirm" onClick={handleLogout}>
                Yes, sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}