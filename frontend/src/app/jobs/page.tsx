"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { fetchJobs, removeJob } from "../../store/slices/jobSlice";
import { AppDispatch, RootState } from "../../store";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import {
  Briefcase, Plus, Search, Trash2, MapPin,
  Users, AlertTriangle, X, Filter, ArrowRight,
  Clock, ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

const statusConfig: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  open:      { label: "Open",      bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
  screening: { label: "Screening", bg: "#eff6ff", color: "#2563eb", dot: "#3b82f6" },
  closed:    { label: "Closed",    bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8" },
};

export default function JobsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { jobs, loading } = useSelector((s: RootState) => s.jobs);
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [typeF, setTypeF] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.push("/"); return; }
    dispatch(fetchJobs());
  }, [dispatch, router]);

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    const matchQ = !q || j.title.toLowerCase().includes(q) || (j.location || "").toLowerCase().includes(q);
    const matchS = statusF === "all" || j.status === statusF;
    const matchT = typeF === "all" || j.jobType === typeF;
    return matchQ && matchS && matchT;
  });

  const jobTypes = Array.from(new Set(jobs.map((j) => j.jobType).filter(Boolean)));

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(removeJob(deleteTarget)).unwrap();
      toast.success("Job deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Could not delete job");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <style>{`
        .jp-root { display: flex; font-family: var(--font-body); }
        .jp-main { margin-left: var(--sidebar-width); min-height: 100vh; background: var(--surface-base); flex: 1; display: flex; flex-direction: column; }
        .jp-content { padding: 32px 40px 80px; flex: 1; animation: fadeIn 0.28s ease; }

        /* Toolbar */
        .jp-toolbar {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 24px; flex-wrap: wrap;
        }
        .jp-search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 360px; }
        .jp-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
        .jp-search {
          width: 100%; padding: 10px 14px 10px 38px;
          border-radius: 10px; border: 1.5px solid var(--border-soft);
          background: white; font-family: var(--font-body); font-size: 14px;
          color: var(--text-primary); outline: none; transition: all var(--transition-fast);
        }
        .jp-search:focus { border-color: var(--brand-primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .jp-search::placeholder { color: var(--text-muted); }

        .jp-filter-group { display: flex; align-items: center; gap: 8px; }
        .jp-select {
          padding: 9px 32px 9px 12px; border-radius: 10px;
          border: 1.5px solid var(--border-soft); background: white;
          font-family: var(--font-body); font-size: 13px; color: var(--text-primary);
          cursor: pointer; outline: none; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 10px center;
          transition: all var(--transition-fast);
        }
        .jp-select:focus { border-color: var(--brand-primary); }

        .jp-count { margin-left: auto; font-size: 13px; color: var(--text-muted); font-weight: 500; flex-shrink: 0; }

        /* Post job button */
        .jp-new {
          display: inline-flex; align-items: center; gap: 7px; padding: 10px 18px;
          border-radius: 10px; background: var(--brand-gradient); color: white;
          border: none; cursor: pointer; font-weight: 700; font-size: 13.5px;
          font-family: var(--font-body); text-decoration: none;
          box-shadow: var(--shadow-button); transition: all var(--transition-fast); flex-shrink: 0;
        }
        .jp-new:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.38); }

        /* Cards */
        .jp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }

        .jp-card {
          background: white; border-radius: 16px; padding: 22px;
          border: 1.5px solid var(--border-soft); box-shadow: var(--shadow-card);
          cursor: pointer; transition: all var(--transition-fast);
          position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 14px;
          text-decoration: none; color: inherit;
        }
        .jp-card:hover {
          box-shadow: var(--shadow-card-hover); border-color: #bfdbfe;
          transform: translateY(-2px);
        }
        .jp-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .jp-card-icon {
          width: 42px; height: 42px; border-radius: 11px;
          background: rgba(37,99,235,0.08); display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .jp-card-badges { display: flex; gap: 6px; align-items: center; }
        .jp-status-pill { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 99px; font-size: 11.5px; font-weight: 700; }
        .jp-status-dot { width: 5px; height: 5px; border-radius: 50%; }
        .jp-type-pill { padding: 4px 9px; border-radius: 99px; font-size: 11.5px; font-weight: 600; background: #f1f5f9; color: #475569; }

        .jp-card-title { font-weight: 700; font-size: 15.5px; color: var(--text-primary); line-height: 1.3; margin-bottom: 2px; }

        .jp-card-meta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .jp-meta-item { display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: var(--text-secondary); }

        .jp-card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid var(--border-muted); margin-top: auto; }
        .jp-ap-count { display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: var(--text-secondary); font-weight: 500; }
        .jp-view-btn {
          display: flex; align-items: center; gap: 5px;
          font-size: 12.5px; font-weight: 700; color: var(--brand-primary);
          transition: gap var(--transition-fast);
        }
        .jp-card:hover .jp-view-btn { gap: 8px; }

        /* Delete btn */
        .jp-del {
          position: absolute; top: 14px; right: 14px;
          width: 30px; height: 30px; border-radius: 8px;
          background: transparent; color: #cbd5e1; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: all var(--transition-fast);
        }
        .jp-card:hover .jp-del { opacity: 1; }
        .jp-del:hover { background: #fef2f2; color: #dc2626; }

        /* Skill tags */
        .jp-skills { display: flex; flex-wrap: wrap; gap: 5px; }
        .jp-skill { padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }

        /* Empty */
        .jp-empty {
          padding: 80px 40px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;
          background: white; border-radius: 16px; border: 1px solid var(--border-soft);
        }
        .jp-empty-icon { width: 64px; height: 64px; border-radius: 18px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }

        /* Modal */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
          z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px;
          animation: fadeIn 0.18s ease;
        }
        .modal-box {
          background: white; border-radius: 20px; padding: 32px; width: 100%; max-width: 380px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.2); animation: scaleIn 0.2s ease;
        }

        @media (max-width: 1024px) and (min-width: 769px) { .jp-main { margin-left: var(--sidebar-collapsed); } }
        @media (max-width: 768px) {
          .jp-main { margin-left: 0; }
          .jp-content { padding: 20px 16px 80px; }
          .jp-grid { grid-template-columns: 1fr; }
          .jp-filter-group { display: none; }
        }
      `}</style>

      <div className="jp-root">
        <Sidebar />
        <div className="jp-main">
          <AppHeader
            title="Jobs"
            subtitle={`${jobs.length} job${jobs.length !== 1 ? "s" : ""} in your workspace`}
          />
          <div className="jp-content">

            {/* Toolbar */}
            <div className="jp-toolbar">
              <div className="jp-search-wrap">
                <Search size={15} className="jp-search-icon" />
                <input
                  className="jp-search"
                  type="text"
                  placeholder="Search jobs or locations…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="jp-filter-group">
                <select className="jp-select" value={statusF} onChange={(e) => setStatusF(e.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="open">Open</option>
                  <option value="screening">Screening</option>
                  <option value="closed">Closed</option>
                </select>
                {jobTypes.length > 0 && (
                  <select className="jp-select" value={typeF} onChange={(e) => setTypeF(e.target.value)}>
                    <option value="all">All types</option>
                    {jobTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                )}
              </div>
              {(search || statusF !== "all" || typeF !== "all") && (
                <p className="jp-count">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
              )}
              <Link href="/jobs/create" className="jp-new" style={{ marginLeft: "auto" }}>
                <Plus size={15} strokeWidth={2.5} /> Post a Job
              </Link>
            </div>

            {/* Content */}
            {loading ? (
              <div className="jp-grid">
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{ background: "white", borderRadius: 16, padding: 22, border: "1px solid #e2e8f0", height: 180 }}>
                    <div className="skel" style={{ width: 42, height: 42, borderRadius: 11, marginBottom: 14 }} />
                    <div className="skel" style={{ width: "70%", height: 16, marginBottom: 8 }} />
                    <div className="skel" style={{ width: "45%", height: 12 }} />
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="jp-empty">
                <div className="jp-empty-icon"><Briefcase size={28} color="#94a3b8" /></div>
                <p style={{ fontWeight: 700, fontSize: 18, color: "var(--text-primary)" }}>No jobs posted yet</p>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 340, lineHeight: 1.6 }}>
                  Post your first job to start uploading candidates and running AI screenings.
                </p>
                <Link href="/jobs/create" className="jp-new" style={{ marginTop: 8 }}>
                  <Plus size={15} /> Post Your First Job
                </Link>
              </div>
            ) : filtered.length === 0 ? (
              <div className="jp-empty">
                <div className="jp-empty-icon"><Search size={28} color="#94a3b8" /></div>
                <p style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>No jobs match your filters</p>
                <button
                  onClick={() => { setSearch(""); setStatusF("all"); setTypeF("all"); }}
                  style={{ padding: "9px 18px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#64748b", fontFamily: "var(--font-body)" }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="jp-grid">
                {filtered.map((job) => {
                  const s = statusConfig[job.status] ?? statusConfig.closed;
                  return (
                    <div
                      key={job._id}
                      className="jp-card"
                      onClick={() => router.push(`/jobs/${job._id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter") router.push(`/jobs/${job._id}`); }}
                    >
                      <div className="jp-card-top">
                        <div className="jp-card-icon">
                          <Briefcase size={20} color="#2563eb" />
                        </div>
                        <div className="jp-card-badges">
                          <span className="jp-status-pill" style={{ background: s.bg, color: s.color }}>
                            <span className="jp-status-dot" style={{ background: s.dot }} />
                            {s.label}
                          </span>
                          {job.jobType && <span className="jp-type-pill">{job.jobType}</span>}
                        </div>
                      </div>

                      <div>
                        <p className="jp-card-title">{job.title}</p>
                        <div className="jp-card-meta">
                          {job.location && (
                            <span className="jp-meta-item">
                              <MapPin size={12} /> {job.location}
                            </span>
                          )}
                          {job.createdAt && (
                            <span className="jp-meta-item">
                              <Clock size={12} /> {new Date(job.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {job.requiredSkills?.length > 0 && (
                          <div className="jp-skills" style={{ marginTop: 10 }}>
                            {job.requiredSkills.slice(0, 4).map((sk: string) => (
                              <span key={sk} className="jp-skill">{sk}</span>
                            ))}
                            {job.requiredSkills.length > 4 && (
                              <span className="jp-skill">+{job.requiredSkills.length - 4}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="jp-card-footer">
                        <span className="jp-ap-count">
                          <Users size={13} />
                          {job.applicantsCount || 0} candidate{(job.applicantsCount || 0) !== 1 ? "s" : ""}
                        </span>
                        <span className="jp-view-btn">
                          View & Screen <ChevronRight size={14} />
                        </span>
                      </div>

                      <button
                        type="button"
                        className="jp-del"
                        aria-label="Delete job"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(job._id); }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 48, height: 48, borderRadius: 13, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <AlertTriangle size={22} color="#dc2626" />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 8, color: "var(--text-primary)" }}>Delete this job?</h3>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24, lineHeight: 1.55 }}>
              This will permanently remove the job and unlink all associated candidates from your workspace.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{ flex: 1, padding: 12, borderRadius: 11, border: "1.5px solid #e2e8f0", background: "white", cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "var(--font-body)", color: "#64748b" }}
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={handleDelete}
                style={{ flex: 1, padding: 12, borderRadius: 11, border: "none", background: "#dc2626", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)", opacity: deleting ? 0.7 : 1 }}
              >
                {deleting ? "Deleting…" : "Delete Job"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}