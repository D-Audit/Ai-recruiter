"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import { getAllJobs } from "../../services/jobService";
import { RootState } from "../../store";
import {
  Briefcase, Users, Brain, Plus, ArrowRight,
  Sparkles, TrendingUp, ListChecks, Activity,
  Zap, BarChart3, ChevronRight,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useSelector((s: RootState) => s.auth);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.push("/"); return; }
    getAllJobs()
      .then((d) => setJobs(d.jobs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const totalCandidates = jobs.reduce((s, j) => s + (j.applicantsCount || 0), 0);
  const openJobs        = jobs.filter((j) => j.status === "open").length;
  const screeningJobs   = jobs.filter((j) => j.status === "screening").length;
  const recentJobs      = [...jobs].slice(0, 5);
  const firstName       = user?.name?.split(" ")[0] || "Recruiter";

  const stats = [
    { label: "Total Jobs",       value: jobs.length,      icon: Briefcase,   color: "#2563eb", bg: "rgba(37,99,235,0.1)",   trend: "+2 this week" },
    { label: "Open Positions",   value: openJobs,         icon: TrendingUp,  color: "#16a34a", bg: "rgba(22,163,74,0.1)",   trend: "Accepting apps" },
    { label: "Total Candidates", value: totalCandidates,  icon: Users,       color: "#7c3aed", bg: "rgba(124,58,237,0.1)",  trend: "Across all jobs" },
    { label: "AI Screenings",    value: screeningJobs,    icon: Brain,       color: "#0891b2", bg: "rgba(8,145,178,0.1)",   trend: "Active now" },
  ];

  const quickActions = [
    { href: "/jobs/create",  icon: Plus,       color: "#2563eb", bg: "rgba(37,99,235,0.1)",  title: "Post a New Job",      desc: "Define role, skills & requirements" },
    { href: "/applicants",   icon: Users,      color: "#7c3aed", bg: "rgba(124,58,237,0.1)", title: "Upload Candidates",   desc: "CSV, PDF, DOCX or manual entry" },
    { href: "/screenings",   icon: Brain,      color: "#0891b2", bg: "rgba(8,145,178,0.1)",  title: "View AI Screenings",  desc: "See ranked candidate results" },
    { href: "/candidates",   icon: ListChecks, color: "#16a34a", bg: "rgba(22,163,74,0.1)",  title: "Browse Candidates",   desc: "Explore the full talent pool" },
  ];

  const statusStyle: Record<string, { bg: string; color: string; label: string; dot: string }> = {
    open:      { bg: "#dcfce7", color: "#15803d", label: "Open",      dot: "#16a34a" },
    screening: { bg: "#dbeafe", color: "#1d4ed8", label: "Screening", dot: "#2563eb" },
    closed:    { bg: "#f1f5f9", color: "#475569", label: "Closed",    dot: "#94a3b8" },
  };

  return (
    <>
      <style>{`
        /* ── Root ── */
        .db-root { display: flex; font-family: var(--font-body, system-ui); }
        .db-main { margin-left: var(--sidebar-width, 260px); min-height: 100vh; background: #f0f4f8; flex: 1; }

        /* ── Body ── */
        .db-body { padding: 32px 36px 80px; }

        /* ── Greeting ── */
        .db-greet {
          margin-bottom: 32px;
          opacity: 0; transform: translateY(14px);
          animation: dbUp 0.5s cubic-bezier(.16,1,.3,1) 0.05s forwards;
        }
        .db-greet-title {
          font-family: var(--font-display, sans-serif);
          font-size: 26px; font-weight: 800; color: #0f172a;
          letter-spacing: -0.5px; line-height: 1.2;
        }
        .db-greet-sub { font-size: 14px; color: #64748b; margin-top: 5px; }

        /* ── Stats ── */
        .db-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 16px; margin-bottom: 28px;
          opacity: 0; transform: translateY(14px);
          animation: dbUp 0.5s cubic-bezier(.16,1,.3,1) 0.12s forwards;
        }
        .db-stat {
          background: #ffffff; border-radius: 18px;
          padding: 22px 24px; border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
          transition: all 0.2s cubic-bezier(.16,1,.3,1);
          cursor: default; position: relative; overflow: hidden;
        }
        .db-stat::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 3px; border-radius: 0 0 18px 18px;
          background: var(--stat-color, #2563eb); opacity: 0;
          transition: opacity 0.2s;
        }
        .db-stat:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.09); }
        .db-stat:hover::after { opacity: 1; }
        .db-stat-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .db-stat-ico { width: 44px; height: 44px; border-radius: 13px; display: flex; align-items: center; justify-content: center; }
        .db-stat-trend { font-size: 11px; font-weight: 600; color: #94a3b8; }
        .db-stat-val {
          font-family: var(--font-display, sans-serif);
          font-size: 34px; font-weight: 800; color: #0f172a;
          letter-spacing: -1.5px; line-height: 1;
        }
        .db-stat-label { font-size: 12px; font-weight: 600; color: #64748b; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.06em; }

        /* ── Hero banner ── */
        .db-hero {
          border-radius: 20px;
          background: linear-gradient(135deg, #1535b8 0%, #2952e3 45%, #5b21b6 100%);
          padding: 0; margin-bottom: 28px;
          display: grid; grid-template-columns: 1fr auto;
          align-items: center; gap: 24px;
          overflow: hidden; position: relative;
          opacity: 0; transform: translateY(14px);
          animation: dbUp 0.5s cubic-bezier(.16,1,.3,1) 0.2s forwards;
          min-height: 120px;
        }
        .db-hero::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse at 80% 50%, rgba(255,255,255,0.08) 0%, transparent 55%);
        }
        .db-hero-dots {
          position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .db-hero-left { padding: 28px 32px; display: flex; align-items: center; gap: 20px; position: relative; z-index: 1; }
        .db-hero-icon {
          width: 56px; height: 56px; border-radius: 16px;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          animation: heroPulse 3s ease-in-out infinite;
        }
        @keyframes heroPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.15); }
          50%       { box-shadow: 0 0 0 8px rgba(255,255,255,0); }
        }
        .db-hero-title {
          font-family: var(--font-display, sans-serif);
          font-size: 20px; font-weight: 800; color: #ffffff;
          letter-spacing: -0.3px; margin-bottom: 5px;
        }
        .db-hero-sub { font-size: 13.5px; color: rgba(255,255,255,0.65); line-height: 1.6; max-width: 520px; }
        .db-hero-right { padding: 28px 32px 28px 0; position: relative; z-index: 1; flex-shrink: 0; }
        .db-hero-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 24px; border-radius: 12px; border: none;
          background: #ffffff; color: #2952e3;
          font-family: var(--font-display, sans-serif);
          font-weight: 700; font-size: 14px; letter-spacing: -0.1px;
          cursor: pointer; text-decoration: none;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          transition: all 0.18s cubic-bezier(.16,1,.3,1);
          white-space: nowrap;
        }
        .db-hero-btn:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 8px 24px rgba(0,0,0,0.22); }

        /* ── Two-col layout ── */
        .db-cols { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }

        /* ── Cards ── */
        .db-card {
          background: #ffffff; border-radius: 18px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          overflow: hidden;
          opacity: 0; transform: translateY(14px);
          animation: dbUp 0.5s cubic-bezier(.16,1,.3,1) 0.28s forwards;
        }
        .db-card-2 { animation-delay: 0.34s; }
        .db-card-head {
          padding: 18px 22px; border-bottom: 1px solid #f1f5f9;
          display: flex; align-items: center; justify-content: space-between;
        }
        .db-card-label {
          font-size: 14px; font-weight: 700; color: #0f172a;
          display: flex; align-items: center; gap: 8px;
        }
        .db-card-link {
          font-size: 12.5px; font-weight: 600; color: #2563eb;
          text-decoration: none; display: flex; align-items: center; gap: 3px;
          transition: gap 0.15s;
        }
        .db-card-link:hover { gap: 6px; }

        /* ── Job rows ── */
        .db-job {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 22px; text-decoration: none;
          border-bottom: 1px solid #f8fafc;
          transition: background 0.15s;
        }
        .db-job:last-child { border-bottom: none; }
        .db-job:hover { background: #f8fafc; }
        .db-job-ico {
          width: 38px; height: 38px; border-radius: 10px;
          background: rgba(37,99,235,0.07);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .db-job-name { font-size: 13.5px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .db-job-meta { font-size: 12px; color: #94a3b8; margin-top: 2px; }
        .db-job-badge { padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; flex-shrink: 0; display: flex; align-items: center; gap: 5px; }
        .db-job-dot { width: 6px; height: 6px; border-radius: 50%; }

        /* ── Empty state ── */
        .db-empty { padding: 52px 24px; text-align: center; }
        .db-empty-ico { width: 56px; height: 56px; border-radius: 16px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; }
        .db-empty-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
        .db-empty-sub { font-size: 13px; color: #64748b; line-height: 1.6; max-width: 260px; margin: 0 auto 18px; }
        .db-empty-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 20px; border-radius: 10px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white; font-weight: 700; font-size: 13.5px;
          text-decoration: none; transition: all 0.15s;
          box-shadow: 0 4px 14px rgba(37,99,235,0.28);
        }
        .db-empty-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.38); }

        /* ── Quick actions ── */
        .db-actions { display: flex; flex-direction: column; gap: 10px; padding: 14px; }
        .db-action {
          display: flex; align-items: center; gap: 13px;
          padding: 13px 14px; border-radius: 12px;
          background: #f8fafc; border: 1px solid #f1f5f9;
          text-decoration: none; transition: all 0.18s;
        }
        .db-action:hover {
          background: #ffffff; border-color: #e2e8f0;
          transform: translateX(3px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }
        .db-action-ico { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .db-action-title { font-size: 13px; font-weight: 700; color: #0f172a; }
        .db-action-desc { font-size: 11.5px; color: #94a3b8; margin-top: 1px; }

        /* ── Activity strip ── */
        .db-activity {
          margin-top: 20px;
          opacity: 0; transform: translateY(14px);
          animation: dbUp 0.5s cubic-bezier(.16,1,.3,1) 0.38s forwards;
        }
        .db-activity-inner {
          background: #ffffff; border-radius: 18px;
          border: 1px solid #e2e8f0;
          padding: 18px 22px;
          display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
        }
        .db-activity-chip {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px; border-radius: 10px;
          background: #f8fafc; border: 1px solid #f1f5f9;
          font-size: 12.5px; font-weight: 600; color: #475569;
        }

        /* ── Animations ── */
        @keyframes dbUp {
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Responsive ── */
        @media (max-width: 1200px) {
          .db-stats { grid-template-columns: repeat(2, 1fr); }
          .db-cols  { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .db-main  { margin-left: 0; }
          .db-body  { padding: 20px 16px 80px; }
          .db-stats { grid-template-columns: 1fr 1fr; }
          .db-hero  { grid-template-columns: 1fr; }
          .db-hero-right { padding: 0 24px 24px; }
        }
      `}</style>

      <div className="db-root">
        <Sidebar />
        <div className="db-main">
          <AppHeader title="Dashboard" subtitle="Umurava AI — Talent Screening Platform" />

          <div className="db-body">

            {/* Greeting */}
            <div className="db-greet">
              <h1 className="db-greet-title">Welcome back, {firstName} 👋</h1>
              <p className="db-greet-sub">Here&apos;s what&apos;s happening with your talent pipeline today.</p>
            </div>

            {/* Stats */}
            <div className="db-stats">
              {stats.map((s, i) => (
                <div key={s.label} className="db-stat" style={{ "--stat-color": s.color, animationDelay: `${0.1 + i * 0.06}s` } as any}>
                  <div className="db-stat-top">
                    <div className="db-stat-ico" style={{ background: s.bg }}>
                      <s.icon size={20} color={s.color} />
                    </div>
                    <span className="db-stat-trend">{s.trend}</span>
                  </div>
                  <div className="db-stat-val">{loading ? "—" : s.value}</div>
                  <div className="db-stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Hero Banner */}
            <div className="db-hero">
              <div className="db-hero-dots" />
              <div className="db-hero-left">
                <div className="db-hero-icon">
                  <Sparkles size={26} color="white" />
                </div>
                <div>
                  <p className="db-hero-title">Umurava AI — Intelligent Talent Screening</p>
                  <p className="db-hero-sub">
                    Post a job, upload candidates, and let our AI rank them in seconds. Bias-aware scoring powered by Gemini.
                  </p>
                </div>
              </div>
              <div className="db-hero-right">
                <Link href="/jobs/create" className="db-hero-btn">
                  <Plus size={15} /> Post a Job
                </Link>
              </div>
            </div>

            {/* Main two-col */}
            <div className="db-cols">

              {/* Recent Jobs */}
              <div className="db-card">
                <div className="db-card-head">
                  <span className="db-card-label">
                    <Briefcase size={15} color="#2563eb" /> Recent Jobs
                  </span>
                  <Link href="/jobs" className="db-card-link">
                    View all <ChevronRight size={13} />
                  </Link>
                </div>

                {loading ? (
                  <div style={{ padding: "40px 22px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                    Loading…
                  </div>
                ) : recentJobs.length === 0 ? (
                  <div className="db-empty">
                    <div className="db-empty-ico"><Briefcase size={22} color="#94a3b8" /></div>
                    <p className="db-empty-title">No jobs yet</p>
                    <p className="db-empty-sub">Create your first job posting to start screening candidates with AI.</p>
                    <Link href="/jobs/create" className="db-empty-btn">
                      <Plus size={14} /> Post a Job
                    </Link>
                  </div>
                ) : (
                  recentJobs.map((job) => {
                    const st = statusStyle[job.status] || statusStyle.closed;
                    return (
                      <Link key={job._id} href={`/jobs/${job._id}`} className="db-job">
                        <div className="db-job-ico">
                          <Briefcase size={16} color="#2563eb" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="db-job-name">{job.title}</p>
                          <p className="db-job-meta">{job.applicantsCount || 0} candidates · {job.location || "Remote"}</p>
                        </div>
                        <span className="db-job-badge" style={{ background: st.bg, color: st.color }}>
                          <span className="db-job-dot" style={{ background: st.dot }} />
                          {st.label}
                        </span>
                      </Link>
                    );
                  })
                )}
              </div>

              {/* Quick Actions */}
              <div className="db-card db-card-2">
                <div className="db-card-head">
                  <span className="db-card-label">
                    <Zap size={15} color="#f59e0b" /> Quick Actions
                  </span>
                </div>
                <div className="db-actions">
                  {quickActions.map((a) => (
                    <Link key={a.href} href={a.href} className="db-action">
                      <div className="db-action-ico" style={{ background: a.bg }}>
                        <a.icon size={17} color={a.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p className="db-action-title">{a.title}</p>
                        <p className="db-action-desc">{a.desc}</p>
                      </div>
                      <ChevronRight size={14} color="#cbd5e1" />
                    </Link>
                  ))}
                </div>
              </div>

            </div>

            {/* Activity strip */}
            <div className="db-activity">
              <div className="db-activity-inner">
                <Activity size={15} color="#2563eb" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Platform Status</span>
                {[
                  { ico: BarChart3, label: "AI Screening", val: "Online", color: "#16a34a" },
                  { ico: Sparkles,  label: "Gemini AI",    val: "Active",  color: "#7c3aed" },
                  { ico: Users,     label: "Candidates",   val: `${totalCandidates} total`, color: "#0891b2" },
                  { ico: Briefcase, label: "Jobs",         val: `${jobs.length} posted`,    color: "#2563eb" },
                ].map((chip) => (
                  <div key={chip.label} className="db-activity-chip">
                    <chip.ico size={13} color={chip.color} />
                    <span style={{ color: "#94a3b8" }}>{chip.label}:</span>
                    <span style={{ color: chip.color }}>{loading ? "…" : chip.val}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}