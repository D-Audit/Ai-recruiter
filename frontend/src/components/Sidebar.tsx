"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { LayoutDashboard, Briefcase, Users, LogOut, Brain } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/applicants/upload", icon: Users, label: "Applicants" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    router.push("/");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

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
          z-index: 100;
          border-right: 1px solid rgba(255,255,255,0.06);
          box-shadow: 4px 0 24px rgba(0,0,0,0.3);
        }

        /* Logo */
        .sidebar-logo {
          padding: 28px 24px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }

        .logo-wrapper {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .logo-icon {
          width: 42px;
          height: 42px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          box-shadow: 0 4px 14px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.15);
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }

        .logo-icon::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
          border-radius: inherit;
        }

        .logo-name {
          color: #f1f5f9;
          font-weight: 700;
          font-size: 17px;
          letter-spacing: -0.3px;
          line-height: 1.1;
        }

        .logo-tagline {
          color: #475569;
          font-size: 11.5px;
          font-weight: 500;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          margin-top: 3px;
        }

        /* Nav section label */
        .nav-section-label {
          padding: 20px 24px 8px;
          color: #334155;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }

        /* Nav */
        .sidebar-nav {
          flex: 1;
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 11px 14px;
          border-radius: 11px;
          text-decoration: none;
          font-weight: 500;
          font-size: 14.5px;
          color: #64748b;
          position: relative;
          transition: color 0.18s ease, background 0.18s ease;
          overflow: hidden;
        }

        .nav-link::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: rgba(255,255,255,0.04);
          opacity: 0;
          transition: opacity 0.18s ease;
        }

        .nav-link:hover {
          color: #cbd5e1;
        }

        .nav-link:hover::before {
          opacity: 1;
        }

        .nav-link.active {
          color: #93c5fd;
          background: linear-gradient(135deg, rgba(37,99,235,0.18), rgba(124,58,237,0.10));
          box-shadow:
            0 0 0 1px rgba(37,99,235,0.2),
            inset 0 1px 0 rgba(255,255,255,0.06);
        }

        .nav-link.active::after {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 60%;
          background: linear-gradient(180deg, #3b82f6, #7c3aed);
          border-radius: 0 4px 4px 0;
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          flex-shrink: 0;
          transition: background 0.18s ease;
        }

        .nav-link.active .nav-icon {
          background: rgba(37,99,235,0.2);
        }

        /* Divider */
        .sidebar-divider {
          margin: 8px 12px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
        }

        /* Footer */
        .sidebar-footer {
          padding: 12px 12px 20px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .user-badge {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 14px;
          margin-bottom: 4px;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1e3a5f, #2d1b6e);
          border: 1.5px solid rgba(255,255,255,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #93c5fd;
          flex-shrink: 0;
        }

        .user-info {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          color: #94a3b8;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          color: #475569;
          font-size: 11px;
          font-weight: 500;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 11px 14px;
          border-radius: 11px;
          width: 100%;
          background: transparent;
          color: #64748b;
          border: none;
          cursor: pointer;
          font-weight: 500;
          font-size: 14.5px;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.18s ease, background 0.18s ease;
          position: relative;
          overflow: hidden;
          text-align: left;
        }

        .logout-btn:hover {
          color: #f87171;
          background: rgba(248,113,113,0.08);
        }

        .logout-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          flex-shrink: 0;
          transition: background 0.18s ease;
        }

        .logout-btn:hover .logout-icon {
          background: rgba(248,113,113,0.12);
        }

        /* Version badge */
        .version-badge {
          margin: 8px 14px 0;
          padding: 6px 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .version-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 6px rgba(34,197,94,0.5);
          animation: pulse-dot 2.4s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .version-text {
          color: #334155;
          font-size: 10.5px;
          font-weight: 500;
        }
      `}</style>

      <aside className="sidebar">
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

          <button className="logout-btn" onClick={handleLogout}>
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
    </>
  );
}