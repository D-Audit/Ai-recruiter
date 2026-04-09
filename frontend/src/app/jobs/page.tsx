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
  Search, Briefcase, AlertTriangle, X, ChevronRight,
} from "lucide-react";

export default function JobsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { jobs, loading } = useSelector((state: RootState) => state.jobs);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { dispatch(fetchJobs()); }, []);

  const filtered = jobs.filter((j) =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.location?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await dispatch(removeJob(deleteTarget));
    toast.success("Job deleted");
    setDeleteTarget(null);
    setDeleting(false);
  };

  const statusMap: Record<string, { bg: string; color: string; dot: string }> = {
    open:      { bg: "#dcfce7", color: "#16a34a", dot: "#22c55e" },
    screening: { bg: "#dbeafe", color: "#2563eb", dot: "#3b82f6" },
    closed:    { bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8" },
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
          margin-bottom: 28px;
          gap: 16px;
        }

        .jobs-title {
          font-family: 'Sora', sans-serif;
          font-size: 26px; font-weight: 800;
          color: #0f172a; letter-spacing: -0.5px;
        }

        .jobs-sub { color: #64748b; font-size: 14px; font-weight: 500; margin-top: 4px; }

        .jobs-actions { display: flex; gap: 12px; align-items: center; }

        .search-wrap {
          display: flex; align-items: center; gap: 10px;
          background: white; border: 1.5px solid #e2e8f0;
          border-radius: 11px; padding: 0 14px;
          height: 44px; width: 260px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .search-wrap:focus-within {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
        }
        .search-input {
          border: none; outline: none; background: transparent;
          font-size: 13.5px; color: #1e293b; width: 100%;
          font-family: 'DM Sans', sans-serif;
        }
        .search-input::placeholder { color: #94a3b8; }

        .create-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 0 20px; height: 44px;
          border-radius: 11px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white; border: none; cursor: pointer;
          font-weight: 700; font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 14px rgba(37,99,235,0.28);
          transition: transform 0.15s, box-shadow 0.15s;
          white-space: nowrap;
        }
        .create-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.36); }

        /* Jobs list */
        .jobs-list { display: flex; flex-direction: column; gap: 12px; }

        .job-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 22px 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s;
        }
        .job-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          border-color: #cbd5e1;
        }

        .job-icon-wrap {
          width: 48px; height: 48px; border-radius: 13px;
          background: linear-gradient(135deg, rgba(37,99,235,0.1), rgba(124,58,237,0.1));
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .job-body { flex: 1; min-width: 0; }

        .job-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
        .job-title  { font-weight: 700; font-size: 15.5px; color: #0f172a; letter-spacing: -0.2px; }

        .status-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 20px;
          font-size: 11.5px; font-weight: 700;
        }
        .status-dot { width: 5px; height: 5px; border-radius: 50%; }

        .job-desc {
          color: #64748b; font-size: 13px; line-height: 1.5;
          margin-bottom: 10px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }

        .job-skills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
        .skill-chip {
          padding: 3px 10px; border-radius: 7px;
          background: #eff6ff; color: #2563eb;
          font-size: 11.5px; font-weight: 600;
        }

        .job-meta { display: flex; gap: 16px; }
        .job-meta-item {
          display: flex; align-items: center; gap: 5px;
          color: #94a3b8; font-size: 12.5px; font-weight: 500;
        }

        .job-actions { display: flex; gap: 8px; flex-shrink: 0; }

        .action-btn-screen {
          display: flex; align-items: center; gap: 6px;
          padding: 9px 16px; border-radius: 10px;
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          color: white; border: none; cursor: pointer;
          font-size: 13px; font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
          box-shadow: 0 3px 10px rgba(124,58,237,0.25);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .action-btn-screen:hover { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(124,58,237,0.35); }

        .action-btn-view {
          display: flex; align-items: center; gap: 5px;
          padding: 9px 14px; border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: white; color: #475569;
          cursor: pointer; font-size: 13px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }
        .action-btn-view:hover { border-color: #2563eb; color: #2563eb; background: #eff6ff; }

        .action-btn-delete {
          display: flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 10px;
          border: 1.5px solid #fee2e2;
          background: white; color: #ef4444;
          cursor: pointer; transition: all 0.15s;
        }
        .action-btn-delete:hover { background: #fef2f2; border-color: #fca5a5; }

        /* Empty / Loading */
        .state-card {
          background: white; border-radius: 18px;
          border: 1px solid #e2e8f0;
          padding: 72px 40px;
          text-align: center;
        }
        .state-icon { width: 68px; height: 68px; border-radius: 18px; background: #f8fafc; border: 1.5px solid #e2e8f0; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
        .state-title { font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 6px; }
        .state-sub   { color: #94a3b8; font-size: 13.5px; }
        .state-btn   { margin-top: 20px; display: inline-flex; align-items: center; gap: 8px; padding: 11px 22px; border-radius: 11px; background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; border: none; cursor: pointer; font-weight: 700; font-size: 14px; font-family: 'DM Sans', sans-serif; box-shadow: 0 4px 12px rgba(37,99,235,0.25); }

        /* Delete modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.15s ease; }
        .modal-box { background: white; border-radius: 20px; padding: 32px; width: 400px; box-shadow: 0 24px 64px rgba(0,0,0,0.16); animation: slideUp 0.2s ease; }
        .modal-close { position: absolute; top: 16px; right: 16px; background: none; border: none; cursor: pointer; color: #94a3b8; }
        .modal-icon-wrap { width: 52px; height: 52px; border-radius: 14px; background: #fef2f2; border: 1.5px solid #fecaca; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .modal-title { font-family: 'Sora', sans-serif; font-size: 19px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
        .modal-text  { color: #64748b; font-size: 13.5px; line-height: 1.6; margin-bottom: 24px; }
        .modal-actions { display: flex; gap: 10px; }
        .modal-cancel  { flex: 1; padding: 12px; border-radius: 11px; border: 1.5px solid #e2e8f0; background: white; font-weight: 600; font-size: 14px; color: #64748b; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .modal-cancel:hover { background: #f8fafc; }
        .modal-delete  { flex: 1; padding: 12px; border-radius: 11px; border: none; background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; font-weight: 700; font-size: 14px; cursor: pointer; font-family: 'DM Sans', sans-serif; box-shadow: 0 4px 12px rgba(220,38,38,0.25); transition: all 0.15s; }
        .modal-delete:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(220,38,38,0.35); }
        .modal-delete:disabled { opacity: 0.7; cursor: not-allowed; }

        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      <div className="jobs-root">
        <Sidebar />
        <main className="jobs-main">

          {/* Top bar */}
          <div className="jobs-topbar">
            <div>
              <h1 className="jobs-title">Jobs</h1>
              <p className="jobs-sub">{jobs.length} total position{jobs.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="jobs-actions">
              <div className="search-wrap">
                <Search size={15} color="#94a3b8" />
                <input
                  className="search-input"
                  placeholder="Search jobs or location…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Link href="/jobs/create">
                <button className="create-btn">
                  <Plus size={17} strokeWidth={2.5} />
                  New Job
                </button>
              </Link>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="state-card">
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading jobs…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="state-card">
              <div className="state-icon">
                <Briefcase size={30} color="#cbd5e1" strokeWidth={1.5} />
              </div>
              <p className="state-title">{search ? "No jobs match your search" : "No jobs yet"}</p>
              <p className="state-sub">{search ? "Try a different keyword" : "Create your first job posting to get started"}</p>
              {!search && (
                <Link href="/jobs/create">
                  <button className="state-btn">
                    <Plus size={16} /> Create Job
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="jobs-list">
              {filtered.map((job) => {
                const s = statusMap[job.status] ?? statusMap.closed;
                return (
                  <div key={job._id} className="job-card">
                    <div className="job-icon-wrap">
                      <Briefcase size={22} color="#2563eb" strokeWidth={1.5} />
                    </div>

                    <div className="job-body">
                      <div className="job-header">
                        <span className="job-title">{job.title}</span>
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
                          {job.requiredSkills.slice(0, 5).map((sk: string) => (
                            <span key={sk} className="skill-chip">{sk}</span>
                          ))}
                          {job.requiredSkills.length > 5 && (
                            <span className="skill-chip" style={{ background: "#f1f5f9", color: "#64748b" }}>
                              +{job.requiredSkills.length - 5}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="job-meta">
                        {job.location && (
                          <span className="job-meta-item">
                            <MapPin size={12} /> {job.location}
                          </span>
                        )}
                        <span className="job-meta-item">
                          <Users size={12} /> {job.applicantsCount || 0} applicant{job.applicantsCount !== 1 ? "s" : ""}
                        </span>
                        {job.yearsOfExperience !== undefined && (
                          <span className="job-meta-item">
                            {job.yearsOfExperience}+ yrs exp
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="job-actions">
                      <Link href={`/screening/${job._id}`}>
                        <button className="action-btn-screen">
                          <Brain size={14} /> Screen
                        </button>
                      </Link>
                      <Link href={`/jobs/${job._id}`}>
                        <button className="action-btn-view">
                          View <ChevronRight size={13} />
                        </button>
                      </Link>
                      <button
                        className="action-btn-delete"
                        onClick={() => setDeleteTarget(job._id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box" style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setDeleteTarget(null)}>
              <X size={18} />
            </button>
            <div className="modal-icon-wrap">
              <AlertTriangle size={24} color="#dc2626" />
            </div>
            <h3 className="modal-title">Delete this job?</h3>
            <p className="modal-text">
              This will permanently remove the job posting and all associated applicants. This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="modal-delete" disabled={deleting} onClick={handleDelete}>
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}