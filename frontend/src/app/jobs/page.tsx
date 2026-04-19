"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import { getAllJobs } from "../../services/jobService";
import { deleteJob } from "../../services/jobService";  // ← FIX: was "../../store/slices/jobSlice" (doesn't export deleteJob)
import { AppDispatch, RootState } from "../../store";
import toast from "react-hot-toast";
import {
  Briefcase, Plus, Trash2, Users, MapPin, Clock,
  Search, ChevronRight, Eye, Sparkles,
} from "lucide-react";

export default function JobsPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.push("/"); return; }
    getAllJobs()
      .then((d) => setJobs(d.jobs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = jobs.filter((j) =>
    !search || j.title?.toLowerCase().includes(search.toLowerCase()) || j.location?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteJob(deleteTarget.id);   // ← now calls service directly (no dispatch needed)
      setJobs((prev) => prev.filter((j) => j._id !== deleteTarget.id));
      toast.success("Job deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Could not delete job");
    } finally {
      setDeleting(false);
    }
  };

  const statusConfig: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    open:      { bg: "#dcfce7", color: "#16a34a", dot: "#22c55e", label: "Open" },
    screening: { bg: "#dbeafe", color: "#2563eb", dot: "#3b82f6", label: "Screening" },
    closed:    { bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8", label: "Closed" },
  };

  return (
    <>
      <style>{`
        .jp-root { display: flex; font-family: var(--font-body, system-ui); }
        .jp-main { margin-left: var(--sidebar-width); min-height: 100vh; background: var(--surface-base); flex: 1; display: flex; flex-direction: column; }
        .jp-body { padding: 28px 40px 100px; flex: 1; animation: fadeIn 0.28s ease; }

        .jp-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
        .jp-search-wrap { flex: 1; min-width: 220px; max-width: 340px; position: relative; }
        .jp-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
        .jp-search {
          width: 100%; padding: 10px 14px 10px 38px; border-radius: 11px;
          border: 1.5px solid var(--border-input); background: var(--surface-card);
          color: var(--text-primary); font-size: 14px; font-family: var(--font-body); outline: none;
          transition: all var(--transition-fast);
        }
        .jp-search:focus { border-color: var(--brand-primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .jp-search::placeholder { color: var(--text-muted); }

        .jp-count { font-size: 13px; color: var(--text-muted); font-weight: 600; }

        /* Job cards grid */
        .jp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
        .jp-card {
          background: var(--surface-card); border: 1.5px solid var(--border-soft);
          border-radius: 18px; padding: 22px 24px; box-shadow: var(--shadow-card);
          display: flex; flex-direction: column; gap: 14px;
          transition: all var(--transition-fast); position: relative;
        }
        .jp-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-card-hover); border-color: rgba(37,99,235,0.2); }

        .jp-card-title { font-size: 16px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; line-height: 1.3; }
        .jp-card-meta { display: flex; flex-wrap: wrap; gap: 10px; }
        .jp-card-meta-item { display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: var(--text-muted); font-weight: 500; }
        .jp-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .jp-status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 99px; font-size: 11.5px; font-weight: 700; }

        .jp-skills { display: flex; flex-wrap: wrap; gap: 5px; }
        .jp-skill { padding: 3px 9px; border-radius: 6px; font-size: 11.5px; font-weight: 600; background: rgba(37,99,235,0.06); color: #2563eb; border: 1px solid rgba(37,99,235,0.12); }

        .jp-card-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-top: 12px; border-top: 1px solid var(--border-muted); margin-top: auto; }
        .jp-view-link { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 700; color: var(--brand-primary); text-decoration: none; transition: gap var(--transition-fast); }
        .jp-view-link:hover { gap: 8px; }
        .jp-delete-btn { display: flex; align-items: center; gap: 5px; padding: 6px 10px; border-radius: 8px; border: 1px solid transparent; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer; transition: all var(--transition-fast); font-family: var(--font-body); }
        .jp-delete-btn:hover { background: rgba(239,68,68,0.08); color: #ef4444; border-color: rgba(239,68,68,0.15); }

        .jp-screen-link { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 8px; border: 1.5px solid rgba(37,99,235,0.2); background: rgba(37,99,235,0.06); color: #2563eb; font-size: 12px; font-weight: 700; text-decoration: none; transition: all var(--transition-fast); }
        .jp-screen-link:hover { background: rgba(37,99,235,0.12); border-color: rgba(37,99,235,0.3); }

        /* Delete modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.15s ease; }
        .modal-box { background: var(--surface-card); border: 1.5px solid var(--border-soft); border-radius: 18px; padding: 28px; max-width: 380px; width: 100%; box-shadow: 0 24px 60px rgba(0,0,0,0.2); animation: scaleIn 0.15s ease; }

        @media (max-width: 768px) { .jp-main { margin-left: 0; } .jp-body { padding: 20px 16px 80px; } .jp-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="jp-root">
        <Sidebar />
        <div className="jp-main">
          <AppHeader
            title="Jobs"
            subtitle="Manage your job postings and run AI screenings"
            actions={
              <Link href="/jobs/create" className="btn-primary" style={{ fontSize: 13, padding: "9px 18px" }}>
                <Plus size={15} /> Post a Job
              </Link>
            }
          />
          <div className="jp-body">
            <div className="jp-toolbar">
              <div className="jp-search-wrap">
                <span className="jp-search-icon"><Search size={15} /></span>
                <input className="jp-search" placeholder="Search jobs…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              {!loading && (
                <p className="jp-count">
                  {filtered.length} job{filtered.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {loading ? (
              <div className="jp-grid">
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ background: "var(--surface-card)", border: "1.5px solid var(--border-soft)", borderRadius: 18, padding: 24, height: 200 }}>
                    <div className="skeleton" style={{ height: 18, width: "70%", marginBottom: 12, borderRadius: 8 }} />
                    <div className="skeleton" style={{ height: 13, width: "50%", marginBottom: 8, borderRadius: 6 }} />
                    <div className="skeleton" style={{ height: 13, width: "40%", borderRadius: 6 }} />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state" style={{ background: "var(--surface-card)", border: "1.5px solid var(--border-soft)", borderRadius: 18, padding: "64px 40px" }}>
                <div className="empty-icon">
                  <Briefcase size={28} color="var(--text-muted)" />
                </div>
                <p style={{ fontWeight: 700, fontSize: 17, color: "var(--text-primary)" }}>
                  {search ? "No jobs match your search" : "No jobs yet"}
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: 14, maxWidth: 320, textAlign: "center", lineHeight: 1.6 }}>
                  {search ? "Try a different search term." : "Post your first job to start screening candidates with AI."}
                </p>
                {!search && (
                  <Link href="/jobs/create" className="btn-primary" style={{ marginTop: 10 }}>
                    <Plus size={14} /> Post a Job
                  </Link>
                )}
              </div>
            ) : (
              <div className="jp-grid">
                {filtered.map((job) => {
                  const sc = statusConfig[job.status] || statusConfig.closed;
                  return (
                    <div key={job._id} className="jp-card">
                      <div>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                          <h3 className="jp-card-title">{job.title}</h3>
                          <span className="jp-status-badge" style={{ background: sc.bg, color: sc.color, flexShrink: 0 }}>
                            <span className="jp-status-dot" style={{ background: sc.dot }} />
                            {sc.label}
                          </span>
                        </div>
                        <div className="jp-card-meta">
                          {job.location && <span className="jp-card-meta-item"><MapPin size={12} /> {job.location}</span>}
                          {job.jobType && <span className="jp-card-meta-item"><Briefcase size={12} /> {job.jobType}</span>}
                          {job.yearsOfExperience !== undefined && <span className="jp-card-meta-item"><Clock size={12} /> {job.yearsOfExperience}+ yrs</span>}
                        </div>
                      </div>

                      {(job.requiredSkills?.length ?? 0) > 0 && (
                        <div className="jp-skills">
                          {job.requiredSkills.slice(0, 4).map((s: string) => (
                            <span key={s} className="jp-skill">{s}</span>
                          ))}
                          {job.requiredSkills.length > 4 && (
                            <span className="jp-skill" style={{ background: "var(--surface-hover)", color: "var(--text-muted)", borderColor: "var(--border-soft)" }}>
                              +{job.requiredSkills.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Users size={13} style={{ color: "var(--text-muted)" }} />
                        <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>
                          {job.applicantsCount ?? 0} candidate{(job.applicantsCount ?? 0) !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="jp-card-footer">
                        <div style={{ display: "flex", gap: 8 }}>
                          <Link href={`/jobs/${job._id}`} className="jp-view-link">
                            <Eye size={13} /> View <ChevronRight size={12} />
                          </Link>
                          {(job.applicantsCount ?? 0) > 0 && (
                            <Link href={`/screenings?jobId=${job._id}`} className="jp-screen-link">
                              <Sparkles size={12} /> Screen
                            </Link>
                          )}
                        </div>
                        <button className="jp-delete-btn" onClick={() => setDeleteTarget({ id: job._id, title: job.title })}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 48, height: 48, borderRadius: 13, background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Trash2 size={20} color="#ef4444" />
            </div>
            <p style={{ fontWeight: 800, fontSize: 17, color: "var(--text-primary)", marginBottom: 8 }}>Delete job?</p>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 22 }}>
              &quot;<strong>{deleteTarget.title}</strong>&quot; and all its screening data will be permanently removed.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: 11, borderRadius: 10, border: "1.5px solid var(--border-soft)", background: "var(--surface-card)", color: "var(--text-secondary)", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: 11, borderRadius: 10, border: "none", background: "#ef4444", color: "white", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}