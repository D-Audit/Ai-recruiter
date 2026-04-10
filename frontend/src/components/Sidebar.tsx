"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { LayoutDashboard, Briefcase, Users, LogOut, Brain, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/applicants/upload", icon: Users, label: "Applicants" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    dispatch(logout());
    router.push("/");
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        /* ── Hamburger trigger (mobile only) ── */
        .sidebar-trigger {
          display: none;
          position: fixed;
          top: 16px;
          left: 16px;
          z-index: 200;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #0a1628;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #94a3b8;
          transition: background 0.18s ease, color 0.18s ease;
        }
        .sidebar-trigger:hover { background: #111f3a; color: #e2e8f0; }

        /* ── Overlay (mobile only) ── */
        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(3px);
          z-index: 149;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }

        /* ── Sidebar shell ── */
        .sidebar {
          font-family: 'DM Sans', sans-serif;
          background: #0a1628;
          background-image:
            radial-gradient(ellipse at 20% 10%, rgba(37,99,235,0.08) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 80%, rgba(124,58,237,0.06) 0%, transparent 60%);
          width: 260px;
          min-height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          display: flex;
          flex-direction: column;
          z-index: 150;
          border-right: 1px solid rgba(255,255,255,0.06);
          box-shadow: 4px 0 24px rgba(0,0,0,0.3);
          transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ── Logo ── */
        .sidebar-logo {
          padding: 28px 24px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .logo-wrapper { display: flex; align-items: center; gap: 14px; }
        .logo-icon {
          width: 42px; height: 42px; border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          box-shadow: 0 4px 14px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.15);
          flex-shrink: 0; position: relative; overflow: hidden;
        }
        .logo-icon::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
          border-radius: inherit;
        }
        .logo-name { color: #f1f5f9; font-weight: 700; font-size: 17px; letter-spacing: -0.3px; line-height: 1.1; }
        .logo-tagline { color: #475569; font-size: 11.5px; font-weight: 500; letter-spacing: 0.4px; text-transform: uppercase; margin-top: 3px; }

        /* Close button inside sidebar (mobile) */
        .sidebar-close {
          display: none;
          position: absolute;
          top: 16px;
          right: 16px;
          width: 32px; height: 32px;
          border-radius: 8px;
          background: rgba(255,255,255,0.06);
          border: none;
          align-items: center; justify-content: center;
          cursor: pointer;
          color: #64748b;
          transition: background 0.18s ease, color 0.18s ease;
        }
        .sidebar-close:hover { background: rgba(255,255,255,0.1); color: #94a3b8; }

        /* ── Nav ── */
        .nav-section-label {
          padding: 20px 24px 8px;
          color: #334155; font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.8px; text-transform: uppercase;
        }
        .sidebar-nav {
          flex: 1; padding: 8px 12px;
          display: flex; flex-direction: column; gap: 2px;
        }
        .nav-link {
          display: flex; align-items: center; gap: 13px;
          padding: 11px 14px; border-radius: 11px;
          text-decoration: none; font-weight: 500; font-size: 14.5px;
          color: #64748b; position: relative; transition: color 0.18s ease, background 0.18s ease;
          overflow: hidden;
        }
        .nav-link::before {
          content: ''; position: absolute; inset: 0; border-radius: inherit;
          background: rgba(255,255,255,0.04); opacity: 0; transition: opacity 0.18s ease;
        }
        .nav-link:hover { color: #cbd5e1; }
        .nav-link:hover::before { opacity: 1; }
        .nav-link.active {
          color: #93c5fd;
          background: linear-gradient(135deg, rgba(37,99,235,0.18), rgba(124,58,237,0.10));
          box-shadow: 0 0 0 1px rgba(37,99,235,0.2), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .nav-link.active::after {
          content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          width: 3px; height: 60%;
          background: linear-gradient(180deg, #3b82f6, #7c3aed);
          border-radius: 0 4px 4px 0;
        }
        .nav-icon {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
          transition: background 0.18s ease;
        }
        .nav-link.active .nav-icon { background: rgba(37,99,235,0.2); }

        /* ── Footer ── */
        .sidebar-divider {
          margin: 8px 12px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
        }
        .sidebar-footer { padding: 12px 12px 20px; border-top: 1px solid rgba(255,255,255,0.06); }
        .user-badge { display: flex; align-items: center; gap: 11px; padding: 10px 14px; margin-bottom: 4px; }
        .user-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, #1e3a5f, #2d1b6e);
          border: 1.5px solid rgba(255,255,255,0.12);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: #93c5fd; flex-shrink: 0;
        }
        .user-info { flex: 1; min-width: 0; }
        .user-name { color: #94a3b8; font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-role { color: #475569; font-size: 11px; font-weight: 500; }
        .logout-btn {
          display: flex; align-items: center; gap: 13px;
          padding: 11px 14px; border-radius: 11px;
          width: 100%; background: transparent; color: #64748b;
          border: none; cursor: pointer; font-weight: 500; font-size: 14.5px;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.18s ease, background 0.18s ease;
          position: relative; overflow: hidden; text-align: left;
        }
        .logout-btn:hover { color: #f87171; background: rgba(248,113,113,0.08); }
        .logout-icon {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
          transition: background 0.18s ease;
        }
        .logout-btn:hover .logout-icon { background: rgba(248,113,113,0.12); }
        .version-badge {
          margin: 8px 14px 0; padding: 6px 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px; display: flex; align-items: center; justify-content: space-between;
        }
        .version-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.5);
          animation: pulse-dot 2.4s ease-in-out infinite;
        }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .version-text { color: #334155; font-size: 10.5px; font-weight: 500; }

        /* ── Logout Confirmation Modal - Title now clearly visible ── */
        .logout-modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.72);
          backdrop-filter: blur(8px);
          z-index: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .logout-modal-content {
          background: white;
          border-radius: 20px;
          padding: 36px 32px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.35);
          position: relative;
          animation: fadeIn 0.25s ease;
        }
        .logout-modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 6px;
          border-radius: 8px;
        }
        .logout-modal-close:hover {
          color: #475569;
          background: #f8fafc;
        }
        .logout-modal-icon {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          background: #fef2f2;
          border: 2px solid #fecaca;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }
        .logout-modal-title {
          font-family: 'Sora', sans-serif;
          font-size: 21px;
          font-weight: 800;
          color: #0f172a !important;
          margin-bottom: 12px;
          line-height: 1.3;
          letter-spacing: -0.4px;
        }
        .logout-modal-text {
          color: #64748b;
          font-size: 14.8px;
          line-height: 1.65;
          margin-bottom: 32px;
        }
        .logout-modal-actions {
          display: flex;
          gap: 14px;
        }
        .logout-modal-btn {
          flex: 1;
          padding: 14px 20px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14.8px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s ease;
        }
        .logout-modal-cancel {
          border: 1.5px solid #e2e8f0;
          background: white;
          color: #64748b;
        }
        .logout-modal-cancel:hover {
          background: #f8fafc;
        }
        .logout-modal-confirm {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          border: none;
          box-shadow: 0 4px 16px rgba(239,68,68,0.35);
        }
        .logout-modal-confirm:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(239,68,68,0.45);
        }
        .logout-modal-confirm:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }

        /* ── Responsive breakpoints ── */

        /* Tablet: collapse to icon-only rail */
        @media (max-width: 1024px) and (min-width: 769px) {
          .sidebar { width: 72px; }
          .logo-name, .logo-tagline, .nav-section-label,
          .nav-link span:last-child, .user-info,
          .logout-btn span:last-child, .version-badge { display: none; }
          .logo-wrapper { justify-content: center; }
          .sidebar-logo { padding: 24px 16px; }
          .sidebar-nav { padding: 8px 8px; align-items: center; }
          .nav-link { padding: 12px; justify-content: center; gap: 0; border-radius: 12px; }
          .nav-icon { width: 36px; height: 36px; }
          .user-badge { justify-content: center; padding: 10px 0; }
          .logout-btn { justify-content: center; padding: 12px 0; }
          .logout-icon { width: 36px; height: 36px; }
          .sidebar-footer { padding: 12px 8px 20px; }
          .sidebar-divider { margin: 8px 4px; }
        }

        /* Mobile: hidden off-canvas drawer */
        @media (max-width: 768px) {
          .sidebar-trigger { display: flex; }
          .sidebar { transform: translateX(-100%); width: 260px; }
          .sidebar.is-open { transform: translateX(0); }
          .sidebar-overlay { display: block; }
          .sidebar-close { display: flex; }
        }
      `}</style>

      {/* Mobile hamburger button */}
      <button className="sidebar-trigger" onClick={() => setIsOpen(true)} aria-label="Open menu">
        <Menu size={20} />
      </button>

      {/* Backdrop overlay */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`sidebar${isOpen ? " is-open" : ""}`}>
        {/* Mobile close button */}
        <button className="sidebar-close" onClick={() => setIsOpen(false)} aria-label="Close menu">
          <X size={16} />
        </button>

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-wrapper">
            <div className="logo-icon">
              <Brain size={20} color="white" />
            </div>
            <div>
              <p className="logo-name">Umurava</p>
              <p className="logo-tagline">AI Screening</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <p className="nav-section-label">Menu</p>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${active ? "active" : ""}`}
              >
                <span className="nav-icon">
                  <item.icon size={17} />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-divider" />
          <div className="user-badge">
            <div className="user-avatar">HR</div>
            <div className="user-info">
              <p className="user-name">HR Manager</p>
              <p className="user-role">Administrator</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogoutClick}>
            <span className="logout-icon">
              <LogOut size={17} />
            </span>
            <span>Logout</span>
          </button>
          <div className="version-badge">
            <span className="version-text">System Online</span>
            <span className="version-dot" />
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal - Title is now clearly visible */}
      {showLogoutConfirm && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <button className="logout-modal-close" onClick={cancelLogout}>
              <X size={20} />
            </button>

            <div className="logout-modal-icon">
              <LogOut size={28} color="#ef4444" />
            </div>

            <h3 className="logout-modal-title">Confirm Logout</h3>
            
            <p className="logout-modal-text">
              Are you sure you want to logout? You will need to sign in again to access the dashboard.
            </p>

            <div className="logout-modal-actions">
              <button className="logout-modal-btn logout-modal-cancel" onClick={cancelLogout}>
                Cancel
              </button>
              <button 
                className="logout-modal-btn logout-modal-confirm" 
                onClick={confirmLogout}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}