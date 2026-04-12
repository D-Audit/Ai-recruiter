"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import { Plus, LayoutDashboard, Settings } from "lucide-react";
import { RootState } from "../store";

type Props = {
  title: string;
  subtitle?: string;
};

export default function AppHeader({ title, subtitle }: Props) {
  const { user } = useSelector((s: RootState) => s.auth);
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "HR";

  return (
    <>
      <style>{`
        .app-hdr {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 40px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .app-hdr-text { flex: 1; min-width: 0; }
        .app-hdr-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .app-hdr-sub { font-size: 13px; color: #64748b; margin-top: 2px; font-weight: 500; }
        .app-hdr-dash {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          text-decoration: none;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          flex-shrink: 0;
          transition: color 0.15s, border-color 0.15s, background 0.15s;
        }
        .app-hdr-dash:hover { color: #2563eb; border-color: #bfdbfe; background: #eff6ff; }
        .app-hdr-post {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 18px;
          border-radius: 10px;
          background: #2563eb;
          color: white;
          border: none;
          cursor: pointer;
          font-weight: 700;
          font-size: 13.5px;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .app-hdr-post:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(37, 99, 235, 0.36); }
        .app-hdr-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
          text-decoration: none;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .app-hdr-avatar:hover { transform: scale(1.04); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35); }
        .app-hdr-settings {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          flex-shrink: 0;
          text-decoration: none;
          transition: color 0.15s, border-color 0.15s, background 0.15s, transform 0.15s;
        }
        .app-hdr-settings:hover {
          color: #2563eb;
          border-color: #bfdbfe;
          background: #eff6ff;
          transform: translateY(-1px);
        }
        .app-hdr-user-group { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        @media (max-width: 768px) {
          .app-hdr { padding: 12px 20px; flex-wrap: wrap; }
          .app-hdr-dash span:last-child { display: none; }
        }
      `}</style>
      <header className="app-hdr">
        <div className="app-hdr-text">
          <h1 className="app-hdr-title">{title}</h1>
          {subtitle ? <p className="app-hdr-sub">{subtitle}</p> : null}
        </div>
        <Link href="/dashboard" className="app-hdr-dash" title="Dashboard">
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </Link>
        <Link href="/jobs" className="app-hdr-dash" title="All jobs">
          <span>Jobs</span>
        </Link>
        <Link href="/jobs/create" className="app-hdr-post">
          <Plus size={16} strokeWidth={2.5} /> Post a Job
        </Link>
        <div className="app-hdr-user-group">
          <Link href="/settings" className="app-hdr-settings" title="Settings" aria-label="Settings">
            <Settings size={18} strokeWidth={2} />
          </Link>
          <Link href="/profile" className="app-hdr-avatar" title="Your profile">
            {initials}
          </Link>
        </div>
      </header>
    </>
  );
}
