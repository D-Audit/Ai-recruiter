"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchJobs } from "../../store/slices/jobSlice";
import { AppDispatch, RootState } from "../../store";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import { getMe } from "../../services/authService";
import { getResults } from "../../services/screeningService";
import {
  Briefcase,
  Users,
  Brain,
  Plus,
  ArrowRight,
  ListChecks,
  Upload,
} from "lucide-react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { jobs, loading } = useSelector((state: RootState) => state.jobs);
  const { user } = useSelector((state: RootState) => state.auth);
  const [me, setMe] = useState<{ name?: string; email?: string } | null>(null);
  const [avgAi, setAvgAi] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    dispatch(fetchJobs());
    getMe().then((d) => setMe(d.user)).catch(() => {});
  }, [dispatch, router]);

  useEffect(() => {
    const screened = jobs.filter((j) => j.status === "screening");
    if (screened.length === 0) {
      setAvgAi(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const scores: number[] = [];
      await Promise.all(
        screened.map(async (j) => {
          try {
            const res = await getResults(j._id);
            const ranked = res.data?.rankedCandidates || [];
            ranked.forEach((r: { score?: number }) => {
              if (typeof r.score === "number") scores.push(r.score);
            });
          } catch {
            /* no results */
          }
        })
      );
      if (!cancelled && scores.length) {
        setAvgAi(
          Math.round(
            scores.reduce((a, b) => a + b, 0) / scores.length
          )
        );
      } else if (!cancelled) setAvgAi(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [jobs]);

  const displayUser = me || user;
  const firstName = displayUser?.name?.split(" ")[0] || "Recruiter";

  const totalApplicants = jobs.reduce(
    (sum, j) => sum + (j.applicantsCount || 0),
    0
  );
  const activeJobs = jobs.filter((j) => j.status === "open").length;
  const screeningsRun = jobs.filter((j) => j.status === "screening").length;

  const statusConfig: Record<
    string,
    { bg: string; color: string; label: string }
  > = {
    open: { bg: "#dcfce7", color: "#16a34a", label: "Active" },
    screening: { bg: "#dbeafe", color: "#2563eb", label: "Screening" },
    closed: { bg: "#f1f5f9", color: "#64748b", label: "Closed" },
  };

  return (
    <>
      <style>{`
        .dash-root { display: flex; font-family: system-ui, -apple-system, sans-serif; }
        .dash-main { margin-left: 260px; min-height: 100vh; background: #f8fafc; flex: 1; display: flex; flex-direction: column; }
        .dash-content { padding: 36px 40px; flex: 1; }
        .dash-welcome {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #1e293b 100%);
          border-radius: 16px; padding: 28px 32px; margin-bottom: 28px;
          display: flex; align-items: center; justify-content: space-between;
          position: relative; overflow: hidden;
          box-shadow: 0 8px 32px rgba(15, 23, 42, 0.35);
        }
        .dash-welcome::before {
          content: ''; position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 22px 22px;
        }
        .dash-welcome-inner { position: relative; z-index: 1; }
        .dash-welcome-date { color: rgba(255,255,255,0.55); font-size: 13px; font-weight: 500; margin-bottom: 8px; }
        .dash-welcome-heading { font-size: 28px; font-weight: 700; color: white; margin-bottom: 8px; letter-spacing: -0.02em; }
        .dash-welcome-sub { color: rgba(255,255,255,0.65); font-size: 14px; margin-bottom: 20px; line-height: 1.5; }
        .dash-welcome-btns { display: flex; gap: 12px; flex-wrap: wrap; }
        .wb-p {
          display: inline-flex; align-items: center; gap: 7px; padding: 10px 20px; border-radius: 10px;
          border: none; cursor: pointer; font-weight: 700; font-size: 14px;
        }
        .wb-pri { background: #2563eb; color: white; box-shadow: 0 4px 14px rgba(37,99,235,0.4); }
        .wb-sec { background: rgba(255,255,255,0.12); color: white; border: 1px solid rgba(255,255,255,0.2); }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
        .stat-card {
          background: white; border-radius: 16px; padding: 22px;
          border: 1px solid #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .stat-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .stat-icon-wrap { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .stat-value { font-size: 30px; font-weight: 800; color: #0f172a; letter-spacing: -0.03em; line-height: 1; }
        .stat-label { color: #64748b; font-weight: 600; font-size: 13px; }
        .quick-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; }
        .quick-action-card {
          background: white; border-radius: 16px; padding: 20px;
          border: 1px solid #e2e8f0; cursor: pointer; text-decoration: none;
          display: flex; align-items: center; gap: 14px;
          transition: box-shadow 0.18s, border-color 0.18s;
        }
        .quick-action-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.06); border-color: #bfdbfe; }
        .quick-action-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .quick-action-title { font-weight: 700; color: #0f172a; font-size: 14px; }
        .quick-action-sub { color: #64748b; font-size: 12px; margin-top: 2px; }
        .jobs-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
        .jobs-card-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
        .jobs-card-title { font-size: 16px; font-weight: 700; color: #0f172a; }
        .view-all-link { color: #2563eb; font-weight: 600; font-size: 13px; text-decoration: none; }
        .job-row { display: grid; grid-template-columns: 1fr 120px 110px 100px; align-items: center; padding: 14px 24px; border-bottom: 1px solid #f8fafc; }
        .job-row:last-child { border-bottom: none; }
        .job-row:hover { background: #fafbff; }
        .status-badge { display: inline-flex; padding: 4px 11px; border-radius: 20px; font-size: 12px; font-weight: 700; }
        .screen-btn {
          padding: 7px 14px; border-radius: 10px; border: none; background: #2563eb; color: white;
          font-size: 13px; font-weight: 700; cursor: pointer;
        }
        .empty-state { padding: 56px; text-align: center; color: #64748b; }
        @media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 900px) { .quick-actions { grid-template-columns: 1fr; } }
        @media (max-width: 768px) {
          .dash-main { margin-left: 0; }
          .dash-content { padding: 20px; }
          .job-row { grid-template-columns: 1fr; gap: 8px; }
        }
      `}</style>

      <div className="dash-root">
        <Sidebar />
        <div className="dash-main">
          <AppHeader title="Dashboard" />
          <div className="dash-content">
            <div className="dash-welcome">
              <div className="dash-welcome-inner">
                <p className="dash-welcome-date">{formatDate()}</p>
                <h1 className="dash-welcome-heading">
                  {getGreeting()}, {firstName}! 👋
                </h1>
                <p className="dash-welcome-sub">
                  You have{" "}
                  <strong style={{ color: "white" }}>
                    {activeJobs} active job{activeJobs !== 1 ? "s" : ""}
                  </strong>
                  .
                </p>
                <div className="dash-welcome-btns">
                  <Link href="/jobs/create">
                    <button type="button" className="wb-p wb-pri">
                      <Plus size={16} /> Post a Job
                    </button>
                  </Link>
                  <Link href="/jobs">
                    <button type="button" className="wb-p wb-sec">
                      View Jobs <ArrowRight size={14} />
                    </button>
                  </Link>
                </div>
              </div>
              <Brain
                size={72}
                color="rgba(255,255,255,0.12)"
                style={{ position: "relative", zIndex: 1 }}
              />
            </div>

            <div className="stats-grid">
              {[
                {
                  label: "Total Jobs",
                  value: jobs.length,
                  icon: Briefcase,
                  c: "#2563eb",
                  bg: "rgba(37,99,235,0.1)",
                },
                {
                  label: "Total Applicants",
                  value: totalApplicants,
                  icon: Users,
                  c: "#7c3aed",
                  bg: "rgba(124,58,237,0.1)",
                },
                {
                  label: "Screenings Run",
                  value: screeningsRun,
                  icon: ListChecks,
                  c: "#2563eb",
                  bg: "rgba(37,99,235,0.1)",
                },
                {
                  label: "Avg AI Score",
                  value: avgAi === null ? "—" : String(avgAi),
                  icon: Brain,
                  c: "#d97706",
                  bg: "rgba(217,119,6,0.12)",
                },
              ].map((s) => (
                <div key={s.label} className="stat-card">
                  <div className="stat-top">
                    <div
                      className="stat-icon-wrap"
                      style={{ background: s.bg }}
                    >
                      <s.icon size={20} color={s.c} strokeWidth={2} />
                    </div>
                    <span className="stat-value">{s.value}</span>
                  </div>
                  <p className="stat-label">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="quick-actions">
              <Link href="/applicants" className="quick-action-card">
                <div
                  className="quick-action-icon"
                  style={{ background: "rgba(124,58,237,0.1)" }}
                >
                  <Upload size={20} color="#7c3aed" />
                </div>
                <div>
                  <p className="quick-action-title">Upload Candidates</p>
                  <p className="quick-action-sub">Platform, manual, or files</p>
                </div>
                <ArrowRight
                  size={16}
                  color="#cbd5e1"
                  style={{ marginLeft: "auto" }}
                />
              </Link>
              <Link href="/jobs" className="quick-action-card">
                <div
                  className="quick-action-icon"
                  style={{ background: "rgba(37,99,235,0.1)" }}
                >
                  <Brain size={20} color="#2563eb" />
                </div>
                <div>
                  <p className="quick-action-title">Run AI Screening</p>
                  <p className="quick-action-sub">From any job page</p>
                </div>
                <ArrowRight
                  size={16}
                  color="#cbd5e1"
                  style={{ marginLeft: "auto" }}
                />
              </Link>
              <Link href="/screenings" className="quick-action-card">
                <div
                  className="quick-action-icon"
                  style={{ background: "rgba(22,163,74,0.1)" }}
                >
                  <ListChecks size={20} color="#16a34a" />
                </div>
                <div>
                  <p className="quick-action-title">View Results</p>
                  <p className="quick-action-sub">Screenings by job</p>
                </div>
                <ArrowRight
                  size={16}
                  color="#cbd5e1"
                  style={{ marginLeft: "auto" }}
                />
              </Link>
            </div>

            <div className="jobs-card">
              <div className="jobs-card-header">
                <h2 className="jobs-card-title">Recent Jobs</h2>
                <Link href="/jobs" className="view-all-link">
                  View all →
                </Link>
              </div>

              {loading ? (
                <div className="empty-state">Loading your jobs…</div>
              ) : jobs.length === 0 ? (
                <div className="empty-state">
                  <p style={{ fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
                    No jobs posted yet
                  </p>
                  <Link href="/jobs/create">
                    <button
                      type="button"
                      className="screen-btn"
                      style={{ marginTop: 8 }}
                    >
                      Post Your First Job
                    </button>
                  </Link>
                </div>
              ) : (
                jobs.slice(0, 5).map((job) => {
                  const s =
                    statusConfig[job.status] ?? statusConfig.closed;
                  return (
                    <div key={job._id} className="job-row">
                      <div>
                        <p
                          style={{
                            fontWeight: 700,
                            color: "#0f172a",
                            fontSize: 14,
                          }}
                        >
                          {job.title}
                        </p>
                        <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
                          {job.applicantsCount || 0} applicants
                        </p>
                      </div>
                      <span style={{ color: "#475569", fontSize: 13 }}>
                        {job.location}
                      </span>
                      <span
                        className="status-badge"
                        style={{ background: s.bg, color: s.color }}
                      >
                        {s.label}
                      </span>
                      <Link href={`/jobs/${job._id}`}>
                        <button type="button" className="screen-btn">
                          Screen →
                        </button>
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
