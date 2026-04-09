"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchJobs } from "../../store/slices/jobSlice";
import { AppDispatch, RootState } from "../../store";
import Sidebar from "../../components/Sidebar";
import { Briefcase, Users, Brain, TrendingUp, Plus, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { jobs, loading } = useSelector((state: RootState) => state.jobs);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/"); return; }
    dispatch(fetchJobs());
  }, []);

  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicantsCount || 0), 0);
  const openJobs = jobs.filter((j) => j.status === "open").length;
  const screenedJobs = jobs.filter((j) => j.status === "screening").length;
  const avgApplicants = jobs.length > 0 ? totalApplicants / jobs.length : 0;
  const benchmarkApplicants = 20;

  const stats = [
    {
      label: "Total Jobs",
      value: jobs.length,
      icon: Briefcase,
      color: "#2563eb",
      bg: "rgba(37,99,235,0.08)",
      percent: 100,
      percentLabel: "All jobs",
    },
    {
      label: "Total Applicants",
      value: totalApplicants,
      icon: Users,
      color: "#7c3aed",
      bg: "rgba(124,58,237,0.08)",
      percent: Math.min((avgApplicants / benchmarkApplicants) * 100, 100),
      percentLabel: `${avgApplicants.toFixed(1)} avg per job`,
    },
    {
      label: "Open Positions",
      value: openJobs,
      icon: TrendingUp,
      color: "#059669",
      bg: "rgba(5,150,105,0.08)",
      percent: jobs.length > 0 ? (openJobs / jobs.length) * 100 : 0,
      percentLabel: `${jobs.length > 0 ? Math.round((openJobs / jobs.length) * 100) : 0}% of jobs`,
    },
    {
      label: "AI Screened",
      value: screenedJobs,
      icon: Brain,
      color: "#d97706",
      bg: "rgba(217,119,6,0.08)",
      percent: jobs.length > 0 ? (screenedJobs / jobs.length) * 100 : 0,
      percentLabel: `${jobs.length > 0 ? Math.round((screenedJobs / jobs.length) * 100) : 0}% of jobs`,
    },
  ];

  const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
    open: { bg: "#dcfce7", color: "#16a34a", label: "Open" },
    screening: { bg: "#dbeafe", color: "#2563eb", label: "Screening" },
    closed: { bg: "#f1f5f9", color: "#64748b", label: "Closed" },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');

        .dash-root { display: flex; font-family: 'DM Sans', sans-serif; }

        .dash-main {
          margin-left: 260px;
          min-height: 100vh;
          padding: 36px 40px;
          background: #f1f5f9;
          flex: 1;
          background-image: radial-gradient(ellipse at 80% 0%, rgba(37,99,235,0.05) 0%, transparent 50%);
        }

        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 36px;
        }

        .dash-greeting {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
          line-height: 1.2;
        }

        .dash-subtitle {
          color: #64748b;
          margin-top: 5px;
          font-size: 14.5px;
          font-weight: 500;
        }

        .dash-create-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 22px;
          border-radius: 12px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          border: none;
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 14px rgba(37,99,235,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          letter-spacing: -0.1px;
        }

        .dash-create-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37,99,235,0.38), inset 0 1px 0 rgba(255,255,255,0.15);
        }

        .dash-create-btn:active { transform: translateY(0); }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          margin-bottom: 28px;
        }

        .stat-card {
          background: white;
          border-radius: 18px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          position: relative;
          overflow: hidden;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }

        .stat-card::after {
          content: '';
          position: absolute;
          top: 0; right: 0;
          width: 80px; height: 80px;
          border-radius: 50%;
          background: var(--stat-bg);
          transform: translate(20px, -20px);
          opacity: 0.6;
        }

        .stat-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 18px;
        }

        .stat-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--stat-bg);
        }

        .stat-value {
          font-size: 34px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -1.5px;
          line-height: 1;
        }

        .stat-label {
          color: #64748b;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 0.1px;
        }

        .stat-bar-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 14px;
        }

        .stat-bar {
          flex: 1;
          height: 4px;
          border-radius: 99px;
          background: #f1f5f9;
          overflow: hidden;
        }

        .stat-bar-fill {
          height: 100%;
          border-radius: 99px;
          background: var(--stat-color);
          opacity: 0.6;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .stat-percent-label {
          margin-left: 10px;
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          white-space: nowrap;
        }

        .jobs-card {
          background: white;
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          overflow: hidden;
        }

        .jobs-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 22px 28px;
          border-bottom: 1px solid #f1f5f9;
        }

        .jobs-card-title {
          font-size: 17px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.3px;
        }

        .view-all-link {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #2563eb;
          font-weight: 600;
          font-size: 13.5px;
          text-decoration: none;
          padding: 6px 12px;
          border-radius: 8px;
          background: #eff6ff;
          transition: background 0.15s ease;
        }

        .view-all-link:hover { background: #dbeafe; }

        .jobs-table-head {
          display: grid;
          grid-template-columns: 1fr 140px 110px 90px;
          padding: 10px 28px;
          background: #f8fafc;
          border-bottom: 1px solid #f1f5f9;
        }

        .jobs-table-head span {
          font-size: 11.5px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .job-row {
          display: grid;
          grid-template-columns: 1fr 140px 110px 90px;
          align-items: center;
          padding: 16px 28px;
          border-bottom: 1px solid #f8fafc;
          transition: background 0.15s ease;
        }

        .job-row:last-child { border-bottom: none; }
        .job-row:hover { background: #fafbff; }

        .job-title {
          font-weight: 700;
          color: #0f172a;
          font-size: 14.5px;
          letter-spacing: -0.1px;
        }

        .job-meta {
          color: #94a3b8;
          font-size: 12.5px;
          margin-top: 3px;
          font-weight: 500;
        }

        .applicant-count {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #475569;
          font-size: 13.5px;
          font-weight: 600;
        }

        .applicant-count-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #cbd5e1;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 11px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1px;
        }

        .status-badge::before {
          content: '';
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.7;
        }

        .view-btn {
          padding: 7px 16px;
          border-radius: 8px;
          border: 1.5px solid #e2e8f0;
          background: white;
          color: #2563eb;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.15s ease;
          letter-spacing: -0.1px;
        }

        .view-btn:hover {
          border-color: #2563eb;
          background: #eff6ff;
        }

        .empty-state {
          padding: 60px 48px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .empty-icon-wrap {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }

        .empty-title { color: #1e293b; font-weight: 700; font-size: 16px; }
        .empty-sub { color: #94a3b8; font-size: 13.5px; font-weight: 500; }

        .empty-btn {
          margin-top: 10px;
          padding: 10px 22px;
          border-radius: 10px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          border: none;
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 12px rgba(37,99,235,0.25);
          transition: transform 0.15s ease;
        }

        .empty-btn:hover { transform: translateY(-1px); }

        .loading-state {
          padding: 60px;
          text-align: center;
          color: #94a3b8;
          font-weight: 500;
          font-size: 14px;
        }

        .loading-dots::after {
          content: '';
          animation: dots 1.2s steps(3, end) infinite;
        }

        @keyframes dots {
          0%   { content: ''; }
          33%  { content: '.'; }
          66%  { content: '..'; }
          100% { content: '...'; }
        }

        @media (max-width: 1200px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="dash-root">
        <Sidebar />
        <main className="dash-main">
          <div className="dash-header">
            <div>
              <h1 className="dash-greeting">
                Welcome back{user?.name ? `, ${user.name}` : ""}! 👋
              </h1>
              <p className="dash-subtitle">Here is your recruitment overview</p>
            </div>
            <Link href="/jobs/create">
              <button className="dash-create-btn">
                <Plus size={17} strokeWidth={2.5} />
                Create New Job
              </button>
            </Link>
          </div>

          <div className="stats-grid">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="stat-card"
                style={{ "--stat-bg": stat.bg, "--stat-color": stat.color } as React.CSSProperties}
              >
                <div className="stat-top">
                  <div className="stat-icon-wrap">
                    <stat.icon size={20} color={stat.color} strokeWidth={2} />
                  </div>
                  <span className="stat-value">{stat.value}</span>
                </div>
                <p className="stat-label">{stat.label}</p>
                <div className="stat-bar-row">
                  <div className="stat-bar">
                    <div
                      className="stat-bar-fill"
                      style={{ width: `${stat.percent}%` }}
                    />
                  </div>
                  <span className="stat-percent-label">{stat.percentLabel}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="jobs-card">
            <div className="jobs-card-header">
              <h2 className="jobs-card-title">Recent Jobs</h2>
              <Link href="/jobs" className="view-all-link">
                View all <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
            </div>

            {loading ? (
              <div className="loading-state">
                <span className="loading-dots">Loading</span>
              </div>
            ) : jobs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon-wrap">
                  <Brain size={32} color="#cbd5e1" strokeWidth={1.5} />
                </div>
                <p className="empty-title">No jobs yet</p>
                <p className="empty-sub">Create your first job to get started</p>
                <Link href="/jobs/create">
                  <button className="empty-btn">Create Job</button>
                </Link>
              </div>
            ) : (
              <>
                <div className="jobs-table-head">
                  <span>Job</span>
                  <span>Location</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>
                {jobs.slice(0, 5).map((job) => {
                  const s = statusConfig[job.status] ?? statusConfig.closed;
                  return (
                    <div key={job._id} className="job-row">
                      <div>
                        <p className="job-title">{job.title}</p>
                        <p className="job-meta">
                          <span className="applicant-count">
                            <span className="applicant-count-dot" />
                            {job.applicantsCount || 0} applicants
                          </span>
                        </p>
                      </div>
                      <span style={{ color: "#475569", fontSize: "13.5px", fontWeight: 500 }}>
                        {job.location}
                      </span>
                      <span
                        className="status-badge"
                        style={{ background: s.bg, color: s.color }}
                      >
                        {s.label}
                      </span>
                      <Link href={`/jobs/${job._id}`}>
                        <button className="view-btn">View</button>
                      </Link>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}