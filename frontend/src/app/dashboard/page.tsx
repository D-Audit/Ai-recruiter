"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import { getAllJobs } from "../../services/jobService";
import { RootState, AppDispatch } from "../../store";
import {
  Briefcase, Users, Brain, Plus, ArrowRight,
  Sparkles, TrendingUp, Clock, CheckCircle2, ListChecks,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((s: RootState) => s.auth);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.push("/"); return; }
    getAllJobs()
      .then((d) => setJobs(d.jobs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const totalCandidates = jobs.reduce((s, j) => s + (j.applicantsCount || 0), 0);
  const openJobs = jobs.filter((j) => j.status === "open").length;
  const screeningJobs = jobs.filter((j) => j.status === "screening").length;
  const recentJobs = [...jobs].slice(0, 5);

  const { restoring } = useSelector((s: RootState) => s.auth);
  const firstName = user?.name?.split(" ")[0] || (restoring ? "…" : "there");

  return (
    <>
      <style>{`
        .dash-root { display: flex; font-family: var(--font-body); }
        .dash-main { margin-left: var(--sidebar-width); min-height: 100vh; background: var(--surface-base); flex: 1; display: flex; flex-direction: column; }
        .dash-body { padding: 28px 40px 100px; flex: 1; animation: fadeIn 0.28s ease; }

        /* Greeting */
        .dash-greeting { margin-bottom: 28px; }
        .dash-greeting-title { font-size: 24px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; }
        .dash-greeting-sub { font-size: 14px; color: var(--text-muted); margin-top: 4px; }

        /* Stats grid */
        .dash-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px; }
        .dash-stat-card {
          background: var(--surface-card); border: 1.5px solid var(--border-soft);
          border-radius: 16px; padding: 20px 22px; box-shadow: var(--shadow-card);
          transition: all var(--transition-fast); cursor: default;
        }
        .dash-stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-card-hover); }
        .dash-stat-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
        .dash-stat-value { font-size: 28px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.04em; line-height: 1; }
        .dash-stat-label { font-size: 12px; color: var(--text-muted); font-weight: 600; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.06em; }

        /* Quick actions */
        .dash-section-title { font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
        .dash-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 28px; }
        .dash-action-card {
          background: var(--surface-card); border: 1.5px solid var(--border-soft);
          border-radius: 16px; padding: 22px; box-shadow: var(--shadow-card);
          text-decoration: none; transition: all var(--transition-fast);
          display: flex; flex-direction: column; gap: 10px;
        }
        .dash-action-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-card-hover); border-color: rgba(37,99,235,0.2); }
        .dash-action-icon { width: 44px; height: 44px; border-radius: 13px; display: flex; align-items: center; justify-content: center; }
        .dash-action-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .dash-action-desc { font-size: 12px; color: var(--text-muted); line-height: 1.5; }
        .dash-action-arrow { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: var(--brand-primary); margin-top: 4px; }

        /* Recent jobs */
        .dash-job-row {
          display: flex; align-items: center; gap: 14px; padding: 14px;
          border-radius: 12px; text-decoration: none;
          transition: background var(--transition-fast);
        }
        .dash-job-row:hover { background: var(--surface-hover); }
        .dash-job-icon { width: 38px; height: 38px; border-radius: 10px; background: rgba(37,99,235,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .dash-job-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .dash-job-meta { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
        .dash-job-badge { padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; flex-shrink: 0; }

        /* AI Banner */
        .dash-ai-banner {
          background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #7c3aed 100%);
          border-radius: 18px; padding: 28px 32px;
          display: flex; align-items: center; gap: 24px;
          margin-bottom: 28px; position: relative; overflow: hidden;
        }
        .dash-ai-banner::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse at 70% 50%, rgba(255,255,255,0.08) 0%, transparent 60%);
        }
        .dash-ai-banner-icon { width: 56px; height: 56px; border-radius: 16px; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .dash-ai-banner-title { font-size: 18px; font-weight: 800; color: white; margin-bottom: 4px; letter-spacing: -0.02em; }
        .dash-ai-banner-sub { font-size: 13px; color: rgba(255,255,255,0.7); line-height: 1.5; }
        .dash-ai-banner-btn {
          margin-left: auto; flex-shrink: 0; padding: 11px 22px;
          border-radius: 12px; border: none; background: white;
          color: #2563eb; font-weight: 700; font-size: 14px;
          cursor: pointer; font-family: var(--font-body);
          display: inline-flex; align-items: center; gap: 7px;
          transition: all var(--transition-fast); text-decoration: none;
        }
        .dash-ai-banner-btn:hover { transform: scale(1.03); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }

        .dash-card {
          background: var(--surface-card); border: 1.5px solid var(--border-soft);
          border-radius: 18px; box-shadow: var(--shadow-card); overflow: hidden;
        }
        .dash-card-header { padding: 18px 20px; border-bottom: 1px solid var(--border-muted); display: flex; align-items: center; justify-content: space-between; }
        .dash-card-body { padding: 8px 8px; }

        .dash-two-col { display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start; }

        @media (max-width: 1100px) {
          .dash-stats { grid-template-columns: repeat(2, 1fr); }
          .dash-actions { grid-template-columns: 1fr 1fr; }
          .dash-two-col { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .dash-main { margin-left: 0; }
          .dash-body { padding: 20px 16px 80px; }
          .dash-stats { grid-template-columns: 1fr 1fr; }
          .dash-actions { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="dash-root">
        <Sidebar />
        <div className="dash-main">
          <AppHeader
            title="Dashboard"
            subtitle="Umurava AI — Talent Screening Platform"
          />
          <div className="dash-body">

            {/* Greeting */}
            <div className="dash-greeting">
              <h1 className="dash-greeting-title">
                Welcome back, {firstName} 👋
              </h1>
              <p className="dash-greeting-sub">
                Here's what's happening with your talent pipeline today.
              </p>
            </div>

            {/* Stats */}
            <div className="dash-stats">
              {[
                {
                  label: "Total Jobs",
                  value: loading ? "—" : jobs.length,
                  icon: Briefcase,
                  iconBg: "rgba(37,99,235,0.08)",
                  iconColor: "#2563eb",
                },
                {
                  label: "Open Positions",
                  value: loading ? "—" : openJobs,
                  icon: TrendingUp,
                  iconBg: "rgba(22,163,74,0.08)",
                  iconColor: "#16a34a",
                },
                {
                  label: "Total Candidates",
                  value: loading ? "—" : totalCandidates,
                  icon: Users,
                  iconBg: "rgba(124,58,237,0.08)",
                  iconColor: "#7c3aed",
                },
                {
                  label: "Screening Active",
                  value: loading ? "—" : screeningJobs,
                  icon: Brain,
                  iconBg: "rgba(8,145,178,0.08)",
                  iconColor: "#0891b2",
                },
              ].map((s) => (
                <div key={s.label} className="dash-stat-card">
                  <div className="dash-stat-icon" style={{ background: s.iconBg }}>
                    <s.icon size={20} color={s.iconColor} />
                  </div>
                  <div className="dash-stat-value">{s.value}</div>
                  <div className="dash-stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* AI Banner */}
            <div className="dash-ai-banner">
              <div className="dash-ai-banner-icon">
                <Sparkles size={26} color="white" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="dash-ai-banner-title">Umurava AI — Intelligent Talent Screening</p>
                <p className="dash-ai-banner-sub">
                  Post a job, upload candidates, and let our AI rank them in seconds. Bias-aware scoring powered by Gemini.
                </p>
              </div>
              <Link href="/jobs/create" className="dash-ai-banner-btn">
                <Plus size={15} /> Post a Job
              </Link>
            </div>

            <div className="dash-two-col">
              {/* Recent Jobs */}
              <div>
                <div className="dash-card">
                  <div className="dash-card-header">
                    <span className="dash-section-title" style={{ margin: 0 }}>
                      <Briefcase size={16} color="var(--brand-primary)" /> Recent Jobs
                    </span>
                    <Link
                      href="/jobs"
                      style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-primary)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
                    >
                      View all <ArrowRight size={13} />
                    </Link>
                  </div>
                  <div className="dash-card-body">
                    {loading ? (
                      <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>
                    ) : recentJobs.length === 0 ? (
                      <div className="empty-state" style={{ padding: "48px 24px" }}>
                        <div className="empty-icon">
                          <Briefcase size={24} color="var(--text-muted)" />
                        </div>
                        <p style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>No jobs yet</p>
                        <p style={{ color: "var(--text-muted)", fontSize: 13, maxWidth: 280, textAlign: "center" }}>
                          Create your first job posting to start screening candidates with AI.
                        </p>
                        <Link href="/jobs/create" className="btn-primary" style={{ marginTop: 10 }}>
                          <Plus size={14} /> Post a Job
                        </Link>
                      </div>
                    ) : (
                      recentJobs.map((job) => {
                        const stMap: Record<string, { bg: string; color: string; label: string }> = {
                          open: { bg: "#dcfce7", color: "#16a34a", label: "Open" },
                          screening: { bg: "#dbeafe", color: "#2563eb", label: "Screening" },
                          closed: { bg: "#f1f5f9", color: "#64748b", label: "Closed" },
                        };
                        const st = stMap[job.status] || stMap.closed;
                        return (
                          <Link key={job._id} href={`/jobs/${job._id}`} className="dash-job-row">
                            <div className="dash-job-icon">
                              <Briefcase size={17} color="#2563eb" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p className="dash-job-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {job.title}
                              </p>
                              <p className="dash-job-meta">
                                {job.applicantsCount || 0} candidates · {job.location || "Remote"}
                              </p>
                            </div>
                            <span className="dash-job-badge" style={{ background: st.bg, color: st.color }}>
                              {st.label}
                            </span>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <p className="dash-section-title">
                  <Sparkles size={15} color="var(--brand-primary)" /> Quick Actions
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    {
                      href: "/jobs/create",
                      icon: Plus,
                      iconBg: "rgba(37,99,235,0.1)",
                      iconColor: "#2563eb",
                      title: "Post a New Job",
                      desc: "Define role, skills, and requirements",
                    },
                    {
                      href: "/applicants",
                      icon: Users,
                      iconBg: "rgba(124,58,237,0.1)",
                      iconColor: "#7c3aed",
                      title: "Upload Candidates",
                      desc: "CSV, PDF, DOCX or manual entry",
                    },
                    {
                      href: "/screenings",
                      icon: Brain,
                      iconBg: "rgba(8,145,178,0.1)",
                      iconColor: "#0891b2",
                      title: "View Screenings",
                      desc: "See AI-ranked candidate results",
                    },
                    {
                      href: "/candidates",
                      icon: ListChecks,
                      iconBg: "rgba(22,163,74,0.1)",
                      iconColor: "#16a34a",
                      title: "Browse Candidates",
                      desc: "Explore the talent pool",
                    },
                  ].map((a) => (
                    <Link key={a.href} href={a.href} className="dash-action-card">
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="dash-action-icon" style={{ background: a.iconBg }}>
                          <a.icon size={19} color={a.iconColor} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p className="dash-action-title">{a.title}</p>
                          <p className="dash-action-desc">{a.desc}</p>
                        </div>
                        <ArrowRight size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}