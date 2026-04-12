"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { fetchJobs, removeJob } from "../../store/slices/jobSlice";
import { AppDispatch, RootState } from "../../store";
import Sidebar from "../../components/Sidebar";
import toast from "react-hot-toast";
import {
  Plus, MapPin, Users, Trash2, Brain,
  Search, Briefcase, AlertTriangle, X, ChevronRight, SearchX,
} from "lucide-react";

export default function JobsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { jobs, loading } = useSelector((state: RootState) => state.jobs);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { dispatch(fetchJobs()); }, [dispatch]);

  useEffect(() => {
    const id = "jobs-page-keyframes";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes jobs-fadeIn  { from { opacity: 0; } to { opacity: 1; } }
      @keyframes jobs-slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes jobs-popIn   { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
    `;
    document.head.appendChild(style);
  }, []);

  // Search across title, location, skills, and status
  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      j.title?.toLowerCase().includes(q) ||
      j.location?.toLowerCase().includes(q) ||
      j.status?.toLowerCase().includes(q) ||
      j.requiredSkills?.some((s: string) => s.toLowerCase().includes(q))
    );
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await dispatch(removeJob(deleteTarget));
    toast.success("Job deleted successfully");
    setDeleteTarget(null);
    setDeleting(false);
  };

  const statusMap: Record<string, { bg: string; color: string; dot: string }> = {
    open:      { bg: "#dcfce7", color: "#16a34a", dot: "#22c55e" },
    screening: { bg: "#dbeafe", color: "#2563eb", dot: "#3b82f6" },
    closed:    { bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8" },
  };

  // Highlight matched text in a string
  const highlight = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} style={{ background: "#fef08a", color: "#854d0e", borderRadius: "3px", padding: "0 2px" }}>{part}</mark>
        : part
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

        .jobs-root { display: flex; font-family: 'DM Sans', sans-serif; }

        .jobs-main {
          margin-left: 260px;
          min-height: 100vh;
          padding: 36px 40px;
          background: #f1f5f9;
          flex: 1;
          background-image: radial-gradient(ellipse at 100% 0%, rgba(37,99,235,0.04) 0%, transparent 60%);
        }

        .jobs-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          gap: 20px;
        }

        .jobs-title {
          font-family: 'Sora', sans-serif;
          font-size: 28px; font-weight: 800;
          color: #0f172a; letter-spacing: -0.6px;
        }

        .jobs-sub { color: #64748b; font-size: 14.5px; font-weight: 500; margin-top: 4px; }

        .jobs-actions { display: flex; gap: 12px; align-items: center; flex-shrink: 0; }

        /* ── Search bar ── */
        .search-wrap {
          display: flex; align-items: center; gap: 10px;
          background: white; border: 1.5px solid #e2e8f0;
          border-radius: 12px; padding: 0 16px;
          height: 46px; width: 300px;
          transition: all 0.2s ease;
          position: relative;
        }
        .search-wrap:focus-within {
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37,99,235,0.08);
        }
        .search-input {
          border: none; outline: none; background: transparent;
          font-size: 14px; color: #1e293b; width: 100%;
          font-family: 'DM Sans', sans-serif;
        }
        .search-input::placeholder { color: #94a3b8; }

        .search-clear {
          background: none; border: none; cursor: pointer;
          color: #94a3b8; display: flex; align-items: center;
          padding: 2px; border-radius: 4px; flex-shrink: 0;
          transition: color 0.15s;
        }
        .search-clear:hover { color: #475569; }

        /* Search result pill */
        .search-result-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px;
          background: #eff6ff; border: 1px solid #bfdbfe;
          border-radius: 100px; color: #1d4ed8;
          font-size: 12.5px; font-weight: 600;
          margin-bottom: 16px;
          animation: jobs-fadeIn 0.2s ease;
        }

        .create-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 0 22px; height: 46px;
          border-radius: 12px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white; border: none; cursor: pointer;
          font-weight: 700; font-size: 14.5px;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 16px rgba(37,99,235,0.3);
          transition: all 0.2s ease; white-space: nowrap;
        }
        .create-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(37,99,235,0.4); }

        /* ── Job list ── */
        .jobs-list { display: flex; flex-direction: column; gap: 14px; }

        .job-card {
          background: white; border-radius: 18px;
          border: 1px solid #e2e8f0; padding: 24px;
          display: flex; align-items: center; gap: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          transition: all 0.2s ease;
          animation: jobs-fadeIn 0.25s ease;
        }
        .job-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.1);
          border-color: #cbd5e1;
        }

        .job-icon-wrap {
          width: 52px; height: 52px; border-radius: 14px;
          background: linear-gradient(135deg, rgba(37,99,235,0.1), rgba(124,58,237,0.1));
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .job-body { flex: 1; min-width: 0; }

        .job-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; flex-wrap: wrap; }
        .job-title  { font-weight: 700; font-size: 16px; color: #0f172a; letter-spacing: -0.3px; }

        .status-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 12px; border-radius: 9999px;
          font-size: 12px; font-weight: 700;
        }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; }

        .job-desc {
          color: #64748b; font-size: 13.5px; line-height: 1.55;
          margin-bottom: 12px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .job-skills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
        .skill-chip {
          padding: 4px 11px; border-radius: 8px;
          background: #eff6ff; color: #2563eb;
          font-size: 12px; font-weight: 600;
        }
        .skill-chip.matched {
          background: #fef9c3; color: #854d0e; border: 1px solid #fde68a;
        }

        .job-meta { display: flex; gap: 18px; flex-wrap: wrap; color: #64748b; font-size: 13px; }
        .job-meta-item { display: flex; align-items: center; gap: 6px; }

        .job-actions { display: flex; gap: 10px; flex-shrink: 0; align-items: center; }

        .action-btn-screen {
          display: flex; align-items: center; gap: 7px;
          padding: 10px 18px; border-radius: 11px;
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          color: white; border: none; cursor: pointer;
          font-size: 13.5px; font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 12px rgba(124,58,237,0.3);
          transition: all 0.2s;
        }
        .action-btn-screen:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(124,58,237,0.4); }

        .action-btn-view {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 16px; border-radius: 11px;
          border: 1.5px solid #e2e8f0;
          background: white; color: #475569;
          cursor: pointer; font-size: 13.5px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
        }
        .action-btn-view:hover { border-color: #2563eb; color: #2563eb; background: #eff6ff; }

        .action-btn-delete {
          width: 42px; height: 42px; border-radius: 11px;
          border: 1.5px solid #fee2e2;
          background: white; color: #ef4444;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
        }
        .action-btn-delete:hover { background: #fef2f2; border-color: #fca5a5; }

        /* ── Empty states ── */
        .state-box {
          background: white; border-radius: 20px;
          border: 1px solid #e2e8f0;
          padding: 80px 48px;
          display: flex; flex-direction: column;
          align-items: center; text-align: center;
          animation: jobs-popIn 0.25s ease;
        }

        .state-icon-wrap {
          width: 80px; height: 80px; border-radius: 22px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 24px;
        }

        .state-title {
          font-family: 'Sora', sans-serif;
          font-size: 20px; font-weight: 800;
          color: #0f172a; margin-bottom: 10px;
          letter-spacing: -0.4px;
        }

        .state-sub {
          color: #94a3b8; font-size: 14.5px;
          line-height: 1.6; max-width: 360px;
          margin-bottom: 28px;
        }

        /* Query echo inside empty state */
        .state-query {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 6px 14px;
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 8px; color: #475569;
          font-size: 13px; font-weight: 600;
          margin-bottom: 28px; font-style: italic;
        }

        /* Suggestions row */
        .state-suggestions {
          display: flex; flex-wrap: wrap; gap: 8px;
          justify-content: center; margin-bottom: 32px;
        }
        .state-suggestion-chip {
          padding: 6px 14px; border-radius: 100px;
          background: #f1f5f9; border: 1px solid #e2e8f0;
          color: #475569; font-size: 12.5px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .state-suggestion-chip:hover { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }

        .state-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 24px; border-radius: 12px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white; border: none; cursor: pointer;
          font-weight: 700; font-size: 14.5px;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 14px rgba(37,99,235,0.28);
          transition: all 0.2s;
        }
        .state-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(37,99,235,0.38); }

        .state-btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 24px; border-radius: 12px;
          background: white; border: 1.5px solid #e2e8f0;
          color: #475569; cursor: pointer;
          font-weight: 600; font-size: 14.5px;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
        }
        .state-btn-secondary:hover { background: #f8fafc; border-color: #cbd5e1; }

        /* ── Modal ── */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.68);
          backdrop-filter: blur(6px);
          z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }

        .modal-box {
          background: white; border-radius: 20px; padding: 36px 32px;
          width: 100%; max-width: 440px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.28);
          position: relative;
          animation: jobs-slideUp 0.25s ease;
        }

        .modal-close {
          position: absolute; top: 20px; right: 20px;
          background: none; border: none; cursor: pointer; color: #94a3b8;
          padding: 6px; border-radius: 8px; transition: all 0.15s;
        }
        .modal-close:hover { color: #475569; background: #f8fafc; }

        .modal-icon-wrap {
          width: 60px; height: 60px; border-radius: 16px;
          background: #fef2f2; border: 2px solid #fecaca;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 24px;
        }

        .modal-title {
          font-family: 'Sora', sans-serif; font-size: 21px;
          font-weight: 800; color: #0f172a;
          margin-bottom: 12px; letter-spacing: -0.4px;
        }

        .modal-text { color: #64748b; font-size: 14px; line-height: 1.65; margin-bottom: 32px; }

        .modal-actions { display: flex; gap: 14px; }

        .modal-cancel {
          flex: 1; padding: 14px; border-radius: 12px;
          border: 1.5px solid #e2e8f0; background: white;
          color: #64748b; font-weight: 600; font-size: 14px;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: background 0.15s;
        }
        .modal-cancel:hover { background: #f8fafc; }

        .modal-delete {
          flex: 1; padding: 14px; border-radius: 12px; border: none;
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: white; font-weight: 700; font-size: 14px;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 16px rgba(220,38,38,0.35);
          transition: all 0.2s;
        }
        .modal-delete:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(220,38,38,0.45); }
        .modal-delete:disabled { opacity: 0.75; cursor: not-allowed; }

        /* ── Responsive ── */
        @media (max-width: 1024px) and (min-width: 769px) {
          .jobs-main   { margin-left: 72px; padding: 32px 28px; }
          .search-wrap { width: 240px; }
        }

        @media (max-width: 900px) {
          .jobs-topbar  { flex-direction: column; align-items: stretch; gap: 16px; }
          .jobs-actions { width: 100%; }
          .search-wrap  { flex: 1; width: auto; }
        }

        @media (max-width: 768px) {
          .jobs-main { margin-left: 0; padding: 80px 20px 40px; }
          .job-card  { flex-direction: column; align-items: flex-start; padding: 20px; gap: 16px; }
          .job-body  { width: 100%; }
          .job-actions { width: 100%; justify-content: flex-end; }
          .action-btn-screen, .action-btn-view { flex: 1; justify-content: center; }
          .state-box { padding: 60px 28px; }
        }

        @media (max-width: 480px) {
          .jobs-main  { padding: 76px 16px 32px; }
          .jobs-title { font-size: 24px; }
          .create-btn-label { display: none; }
          .create-btn { padding: 0 16px; }
          .view-label { display: none; }
          .action-btn-view { padding: 10px 12px; }
          .modal-box  { padding: 28px 20px; }
          .state-box  { padding: 48px 20px; }
        }
      `}</style>

      <div className="jobs-root">
        <Sidebar />
        <main className="jobs-main">

          {/* Top bar */}
          <div className="jobs-topbar">
            <div>
              <h1 className="jobs-title">Jobs</h1>
              <p className="jobs-sub">
                {jobs.length} total position{jobs.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="jobs-actions">
              <div className="search-wrap">
                <Search size={16} color="#94a3b8" />
                <input
                  className="search-input"
                  placeholder="Search by title, skill, location…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button className="search-clear" onClick={() => setSearch("")} aria-label="Clear search">
                    <X size={15} />
                  </button>
                )}
              </div>
              <Link href="/jobs/create">
                <button className="create-btn">
                  <Plus size={18} strokeWidth={2.5} />
                  <span className="create-btn-label">New Job</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Result count pill when searching */}
          {search && !loading && (
            <div className="search-result-pill">
              <Search size={12} />
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &quot;{search}&quot;
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="state-box">
              <p style={{ color: "#94a3b8", fontSize: "15px" }}>Loading jobs…</p>
            </div>

          ) : jobs.length === 0 ? (
            /* ── No jobs at all ── */
            <div className="state-box">
              <div className="state-icon-wrap" style={{ background: "#f1f5f9", border: "1.5px solid #e2e8f0" }}>
                <Briefcase size={36} color="#cbd5e1" strokeWidth={1.4} />
              </div>
              <p className="state-title">No jobs yet</p>
              <p className="state-sub">
                Start by creating your first job posting. Once added, you can screen applicants using AI.
              </p>
              <Link href="/jobs/create">
                <button className="state-btn-primary">
                  <Plus size={17} /> Create First Job
                </button>
              </Link>
            </div>

          ) : filtered.length === 0 ? (
            /* ── Search returned nothing ── */
            <div className="state-box">
              <div className="state-icon-wrap" style={{ background: "#fef9c3", border: "1.5px solid #fde68a" }}>
                <SearchX size={36} color="#ca8a04" strokeWidth={1.5} />
              </div>

              <p className="state-title">No jobs match your search</p>

              <div className="state-query">
                <Search size={13} /> &quot;{search}&quot;
              </div>

              <p className="state-sub">
                We searched titles, skills, locations, and status but found nothing. Try one of these instead:
              </p>

              {/* Clickable suggestions from existing job titles */}
              {jobs.length > 0 && (
                <div className="state-suggestions">
                  {jobs.slice(0, 5).map((j) => (
                    <button
                      key={j._id}
                      className="state-suggestion-chip"
                      onClick={() => setSearch(j.title)}
                    >
                      {j.title}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
                <button className="state-btn-secondary" onClick={() => setSearch("")}>
                  <X size={15} /> Clear Search
                </button>
                <Link href="/jobs/create">
                  <button className="state-btn-primary">
                    <Plus size={15} /> New Job
                  </button>
                </Link>
              </div>
            </div>

          ) : (
            /* ── Job cards ── */
            <div className="jobs-list">
              {filtered.map((job) => {
                const s = statusMap[job.status] ?? statusMap.closed;
                const q = search.trim();
                return (
                  <div key={job._id} className="job-card">
                    <div className="job-icon-wrap">
                      <Briefcase size={24} color="#2563eb" strokeWidth={1.6} />
                    </div>

                    <div className="job-body">
                      <div className="job-header">
                        <span className="job-title">{highlight(job.title, q)}</span>
                        <span className="status-badge" style={{ background: s.bg, color: s.color }}>
                          <span className="status-dot" style={{ background: s.dot }} />
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                      </div>

                      {job.description && (
                        <p className="job-desc">{job.description}</p>
                      )}

                      {job.requiredSkills?.length > 0 && (
                        <div className="job-skills">
                          {job.requiredSkills.slice(0, 4).map((sk: string) => (
                            <span
                              key={sk}
                              className={`skill-chip${q && sk.toLowerCase().includes(q.toLowerCase()) ? " matched" : ""}`}
                            >
                              {highlight(sk, q)}
                            </span>
                          ))}
                          {job.requiredSkills.length > 4 && (
                            <span className="skill-chip" style={{ background: "#f1f5f9", color: "#64748b" }}>
                              +{job.requiredSkills.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="job-meta">
                        {job.location && (
                          <span className="job-meta-item">
                            <MapPin size={14} /> {highlight(job.location, q)}
                          </span>
                        )}
                        <span className="job-meta-item">
                          <Users size={14} /> {job.applicantsCount || 0} applicant{job.applicantsCount !== 1 ? "s" : ""}
                        </span>
                        {job.yearsOfExperience !== undefined && (
                          <span className="job-meta-item">{job.yearsOfExperience}+ yrs exp</span>
                        )}
                      </div>
                    </div>

                    <div className="job-actions">
                      <Link href={`/screening/${job._id}`} style={{ display: "contents" }}>
                        <button className="action-btn-screen">
                          <Brain size={15} /> Screen
                        </button>
                      </Link>
                      <Link href={`/jobs/${job._id}`} style={{ display: "contents" }}>
                        <button className="action-btn-view">
                          <span className="view-label">View</span>
                          <ChevronRight size={14} />
                        </button>
                      </Link>
                      <button
                        className="action-btn-delete"
                        onClick={() => setDeleteTarget(job._id)}
                        aria-label="Delete job"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setDeleteTarget(null)}>
              <X size={20} />
            </button>
            <div className="modal-icon-wrap">
              <AlertTriangle size={28} color="#dc2626" />
            </div>
            <h3 className="modal-title">Delete this job posting?</h3>
            <p className="modal-text">
              This action will permanently delete the job and <strong>all associated applicant data</strong>. This cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="modal-delete" disabled={deleting} onClick={handleDelete}>
                {deleting ? "Deleting..." : "Yes, Delete Job"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}