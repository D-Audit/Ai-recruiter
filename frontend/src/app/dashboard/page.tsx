"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { fetchJobs } from "../../store/slices/jobSlice";
import { AppDispatch, RootState } from "../../store";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import {
  Briefcase, Users, Brain, Plus, ArrowRight,
  Upload, ListChecks, TrendingUp, Zap, ChevronRight,
  Clock, CheckCircle2, Circle,
} from "lucide-react";

const statusConfig: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  open:      { label: "Open",      bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
  screening: { label: "Screening", bg: "#eff6ff", color: "#2563eb", dot: "#3b82f6" },
  closed:    { label: "Closed",    bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8" },
};

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { jobs, loading } = useSelector((s: RootState) => s.jobs);
  const { user } = useSelector((s: RootState) => s.auth);
  const { results: screeningResults } = useSelector((s: RootState) => s.screening);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.push("/"); return; }
    dispatch(fetchJobs());
  }, [dispatch, router]);

  const firstName = user?.name?.split(" ")[0] || "there";
  const activeJobs = jobs.filter((j) => j.status === "open").length;
  const totalApplicants = jobs.reduce((s, j) => s + (j.applicantsCount || 0), 0);
  const screeningsRun = jobs.filter((j) => j.status === "screening").length;
  const avgAi = screeningResults?.rankedCandidates?.length
    ? Math.round(screeningResults.rankedCandidates.reduce((s, c) => s + c.score, 0) / screeningResults.rankedCandidates.length)
    : null;

  const stats = [
    {
      label: "Active Jobs",
      value: activeJobs,
      total: jobs.length,
      icon: Briefcase,
      color: "#2563eb",
      bg: "rgba(37,99,235,0.08)",
      trend: jobs.length > 0 ? `${jobs.length} total` : "No jobs yet",
      link: "/jobs",
    },
    {
      label: "Total Candidates",
      value: totalApplicants,
      icon: Users,
      color: "#7c3aed",
      bg: "rgba(124,58,237,0.08)",
      trend: "across all jobs",
      link: "/applicants",
    },
    {
      label: "AI Screenings",
      value: screeningsRun,
      icon: Brain,
      color: "#0891b2",
      bg: "rgba(8,145,178,0.08)",
      trend: "jobs screened",
      link: "/screenings",
    },
    {
      label: "Avg AI Score",
      value: avgAi !== null ? `${avgAi}` : "—",
      icon: TrendingUp,
      color: "#d97706",
      bg: "rgba(217,119,6,0.08)",
      trend: avgAi !== null ? "out of 100" : "Run a screening",
      link: "/screenings",
    },
  ];

  const quickActions = [
    {
      label: "Post a New Job",
      desc: "Create a job with required skills",
      icon: Plus,
      color: "#2563eb",
      bg: "rgba(37,99,235,0.08)",
      href: "/jobs/create",
    },
    {
      label: "Upload Candidates",
      desc: "CSV, PDF, URL, or manual entry",
      icon: Upload,
      color: "#7c3aed",
      bg: "rgba(124,58,237,0.08)",
      href: "/applicants",
    },
    {
      label: "Run AI Screening",
      desc: "Rank candidates for any job",
      icon: Zap,
      color: "#0891b2",
      bg: "rgba(8,145,178,0.08)",
      href: "/jobs",
    },
    {
      label: "View All Results",
      desc: "Browse all screening reports",
      icon: ListChecks,
      color: "#16a34a",
      bg: "rgba(22,163,74,0.08)",
      href: "/screenings",
    },
  ];

  return (
    <>
      <style>{`
        .dash-root { display: flex; font-family: var(--font-body); }
        .dash-main { margin-left: var(--sidebar-width); min-height: 100vh; background: var(--surface-base); flex: 1; display: flex; flex-direction: column; }
        .dash-content { padding: 32px 40px 80px; flex: 1; animation: fadeIn 0.28s ease; }

        /* Welcome banner */
        .dash-banner {
          border-radius: 20px; padding: 32px 36px;
          background: #0b1324;
          background-image:
            radial-gradient(ellipse at 0% 100%, rgba(37,99,235,0.2) 0%, transparent 50%),
            radial-gradient(ellipse at 100% 0%, rgba(124,58,237,0.15) 0%, transparent 50%);
          border: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: space-between;
          gap: 24px; margin-bottom: 28px; overflow: hidden; position: relative;
        }
        .dash-banner::before {
          content: ''; position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 22px 22px;
        }
        .dash-banner-inner { position: relative; z-index: 1; }
        .dash-banner-date { color: rgba(255,255,255,0.4); font-size: 12px; font-weight: 500; margin-bottom: 6px; letter-spacing: 0.03em; }
        .dash-banner-title {
          font-size: clamp(20px, 2.5vw, 28px); font-weight: 800; color: white;
          letter-spacing: -0.03em; margin-bottom: 8px; line-height: 1.15;
        }
        .dash-banner-sub { color: rgba(255,255,255,0.55); font-size: 14px; margin-bottom: 22px; line-height: 1.5; }
        .dash-banner-btns { display: flex; gap: 10px; flex-wrap: wrap; }
        .wb-primary {
          display: inline-flex; align-items: center; gap: 7px; padding: 10px 20px;
          border-radius: 10px; border: none; cursor: pointer; font-weight: 700; font-size: 13.5px;
          font-family: var(--font-body); text-decoration: none;
          background: #2563eb; color: white; box-shadow: 0 4px 14px rgba(37,99,235,0.5);
          transition: all var(--transition-fast);
        }
        .wb-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.6); }
        .wb-secondary {
          display: inline-flex; align-items: center; gap: 7px; padding: 10px 20px;
          border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 13.5px;
          font-family: var(--font-body); text-decoration: none;
          background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.85);
          border: 1px solid rgba(255,255,255,0.15);
          transition: all var(--transition-fast);
        }
        .wb-secondary:hover { background: rgba(255,255,255,0.14); }
        .dash-banner-graphic {
          position: relative; z-index: 1; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          width: 96px; height: 96px; border-radius: 24px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
        }

        /* Stats grid */
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px; }
        .stat-card {
          background: white; border-radius: 16px; padding: 20px 22px;
          border: 1px solid var(--border-soft); box-shadow: var(--shadow-card);
          text-decoration: none; display: block; transition: all var(--transition-fast);
          position: relative; overflow: hidden;
        }
        .stat-card:hover { box-shadow: var(--shadow-card-hover); transform: translateY(-2px); border-color: #dbeafe; }
        .stat-card::after {
          content: ''; position: absolute; top: 0; right: 0; width: 60px; height: 60px;
          border-radius: 0 16px 0 60px;
          background: var(--card-accent-bg, rgba(37,99,235,0.04));
        }
        .stat-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .stat-icon-wrap {
          width: 40px; height: 40px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .stat-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; background: #f1f5f9; color: #64748b; }
        .stat-value { font-size: 32px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.04em; line-height: 1; margin-bottom: 4px; }
        .stat-label { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
        .stat-trend { font-size: 11.5px; color: var(--text-muted); margin-top: 6px; font-weight: 500; }

        /* Quick actions */
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .section-label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
        .quick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
        .quick-card {
          background: white; border-radius: 14px; padding: 18px;
          border: 1.5px solid var(--border-soft); text-decoration: none;
          display: flex; flex-direction: column; gap: 12px;
          transition: all var(--transition-fast); position: relative; overflow: hidden;
        }
        .quick-card:hover { box-shadow: var(--shadow-card-hover); border-color: #dbeafe; transform: translateY(-2px); }
        .quick-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .quick-label { font-weight: 700; font-size: 13.5px; color: var(--text-primary); line-height: 1.3; }
        .quick-desc { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
        .quick-arrow { color: var(--text-muted); align-self: flex-end; transition: transform var(--transition-fast); }
        .quick-card:hover .quick-arrow { transform: translateX(3px); color: var(--brand-primary); }

        /* Jobs table */
        .jobs-section { background: white; border-radius: 16px; border: 1px solid var(--border-soft); overflow: hidden; box-shadow: var(--shadow-card); }
        .jobs-section-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 24px; border-bottom: 1px solid var(--border-muted);
        }
        .jobs-section-title { font-size: 15px; font-weight: 700; color: var(--text-primary); }
        .view-all-link {
          display: flex; align-items: center; gap: 4px;
          color: var(--brand-primary); font-size: 13px; font-weight: 600; text-decoration: none;
          transition: gap var(--transition-fast);
        }
        .view-all-link:hover { gap: 7px; }

        .job-row {
          display: grid; grid-template-columns: 1fr 110px 100px 120px;
          align-items: center; padding: 14px 24px;
          border-bottom: 1px solid var(--border-muted);
          transition: background var(--transition-fast);
        }
        .job-row:last-child { border-bottom: none; }
        .job-row:hover { background: #fafbff; }
        .job-title { font-weight: 600; color: var(--text-primary); font-size: 14px; }
        .job-meta { font-size: 12px; color: var(--text-muted); margin-top: 2px; display: flex; align-items: center; gap: 6px; }
        .job-location { font-size: 13px; color: var(--text-secondary); }

        .status-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
        .status-pill { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 99px; font-size: 12px; font-weight: 600; }

        .screen-btn {
          padding: 7px 14px; border-radius: 9px; border: 1.5px solid #bfdbfe;
          background: #eff6ff; color: #2563eb; font-size: 12.5px; font-weight: 700;
          cursor: pointer; font-family: var(--font-body); text-decoration: none;
          display: inline-flex; align-items: center; gap: 5px;
          transition: all var(--transition-fast);
        }
        .screen-btn:hover { background: #2563eb; color: white; border-color: #2563eb; }

        .dash-empty {
          padding: 56px 40px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;
        }
        .dash-empty-icon {
          width: 60px; height: 60px; border-radius: 16px; background: #f1f5f9;
          display: flex; align-items: center; justify-content: center; margin-bottom: 4px;
        }

        /* Skeleton */
        .job-row-skeleton { padding: 16px 24px; border-bottom: 1px solid var(--border-muted); display: flex; gap: 16px; align-items: center; }
        .skel { border-radius: 6px; background: linear-gradient(90deg, #f1f5f9 25%, #e8edf3 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }

        @media (max-width: 1200px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .quick-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 1024px) and (min-width: 769px) {
          .dash-main { margin-left: var(--sidebar-collapsed); }
        }
        @media (max-width: 768px) {
          .dash-main { margin-left: 0; }
          .dash-content { padding: 20px 16px 80px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .quick-grid { grid-template-columns: 1fr; }
          .job-row { grid-template-columns: 1fr auto; gap: 8px; }
          .job-location, .job-row > :nth-child(3) { display: none; }
          .dash-banner { flex-direction: column; }
          .dash-banner-graphic { display: none; }
        }
      `}</style>

      <div className="dash-root">
        <Sidebar />
        <div className="dash-main">
          <AppHeader title="Dashboard" subtitle={formatDate()} />
          <div className="dash-content">

            {/* Welcome Banner */}
            <div className="dash-banner">
              <div className="dash-banner-inner">
                <p className="dash-banner-date">{formatDate()}</p>
                <h1 className="dash-banner-title">
                  {getGreeting()}, {firstName}! 👋
                </h1>
                <p className="dash-banner-sub">
                  {jobs.length === 0
                    ? "Welcome to Umurava AI. Start by posting your first job."
                    : `You have ${activeJobs} active job${activeJobs !== 1 ? "s" : ""} and ${totalApplicants} candidate${totalApplicants !== 1 ? "s" : ""} ready to screen.`
                  }
                </p>
                <div className="dash-banner-btns">
                  <Link href="/jobs/create" className="wb-primary">
                    <Plus size={15} strokeWidth={2.5} /> Post a Job
                  </Link>
                  {jobs.length > 0 && (
                    <Link href="/jobs" className="wb-secondary">
                      View Jobs <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              </div>
              <div className="dash-banner-graphic">
                <Brain size={44} color="rgba(255,255,255,0.18)" />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              {stats.map((s, i) => (
                <Link
                  key={s.label}
                  href={s.link}
                  className="stat-card"
                  style={{ "--card-accent-bg": s.bg } as React.CSSProperties}
                >
                  <div className="stat-top">
                    <div className="stat-icon-wrap" style={{ background: s.bg }}>
                      <s.icon size={19} color={s.color} strokeWidth={2} />
                    </div>
                  </div>
                  <div className="stat-value">{loading ? "—" : s.value}</div>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-trend">{s.trend}</div>
                </Link>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="section-header">
              <p className="section-label">Quick Actions</p>
            </div>
            <div className="quick-grid">
              {quickActions.map((qa) => (
                <Link key={qa.href} href={qa.href} className="quick-card">
                  <div className="quick-icon" style={{ background: qa.bg }}>
                    <qa.icon size={18} color={qa.color} />
                  </div>
                  <div>
                    <p className="quick-label">{qa.label}</p>
                    <p className="quick-desc">{qa.desc}</p>
                  </div>
                  <ArrowRight size={15} className="quick-arrow" />
                </Link>
              ))}
            </div>

            {/* Recent Jobs */}
            <div className="section-header">
              <p className="section-label">Recent Jobs</p>
              <Link href="/jobs" className="view-all-link">
                View all <ChevronRight size={14} />
              </Link>
            </div>

            <div className="jobs-section">
              {loading ? (
                <>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="job-row-skeleton">
                      <div className="skel" style={{ width: 180, height: 14 }} />
                      <div className="skel" style={{ width: 80, height: 14, marginLeft: "auto" }} />
                      <div className="skel" style={{ width: 64, height: 24, borderRadius: 99 }} />
                      <div className="skel" style={{ width: 80, height: 30, borderRadius: 9 }} />
                    </div>
                  ))}
                </>
              ) : jobs.length === 0 ? (
                <div className="dash-empty">
                  <div className="dash-empty-icon">
                    <Briefcase size={28} color="#94a3b8" />
                  </div>
                  <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 16 }}>No jobs posted yet</p>
                  <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 320, lineHeight: 1.6 }}>
                    Post your first job to start screening candidates with AI.
                  </p>
                  <Link href="/jobs/create" className="screen-btn" style={{ marginTop: 4 }}>
                    <Plus size={14} /> Post Your First Job
                  </Link>
                </div>
              ) : (
                jobs.slice(0, 5).map((job) => {
                  const s = statusConfig[job.status] ?? statusConfig.closed;
                  return (
                    <div key={job._id} className="job-row">
                      <div>
                        <p className="job-title">{job.title}</p>
                        <div className="job-meta">
                          <Users size={11} />
                          {job.applicantsCount || 0} candidate{(job.applicantsCount || 0) !== 1 ? "s" : ""}
                          {job.location && (
                            <>
                              <span style={{ color: "#e2e8f0" }}>·</span>
                              {job.location}
                            </>
                          )}
                        </div>
                      </div>
                      <span className="job-location">{job.location || "—"}</span>
                      <span className="status-pill" style={{ background: s.bg, color: s.color }}>
                        <span className="status-dot" style={{ background: s.dot }} />
                        {s.label}
                      </span>
                      <Link href={`/jobs/${job._id}`} className="screen-btn">
                        Screen <ArrowRight size={12} />
                      </Link>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}