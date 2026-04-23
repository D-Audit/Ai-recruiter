"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import { getAllJobs, deleteJob } from "../../services/jobService";
import { AppDispatch } from "../../store";
import toast from "react-hot-toast";
import {
  Briefcase, Plus, Trash2, Users, MapPin, Clock,
  Search, Eye, Sparkles, ChevronRight, Building2,
  TrendingUp, CircleDot, CheckCircle, XCircle, Filter,
} from "lucide-react";

export default function JobsPage() {
  const router  = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [jobs, setJobs]               = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState<"all"|"open"|"screening"|"closed">("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting]       = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.push("/"); return; }
    getAllJobs().then((d) => setJobs(d.jobs || [])).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  const filtered = jobs.filter((j) => {
    const matchSearch = !search || j.title?.toLowerCase().includes(search.toLowerCase()) || j.location?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || j.status === filter;
    return matchSearch && matchFilter;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteJob(deleteTarget.id);
      setJobs((prev) => prev.filter((j) => j._id !== deleteTarget.id));
      toast.success("Job deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Could not delete job");
    } finally {
      setDeleting(false);
    }
  };

  const statusConfig: Record<string, { bg: string; color: string; dot: string; label: string; icon: any }> = {
    open:      { bg: "rgba(22,163,74,0.1)",  color: "#15803d", dot: "#22c55e", label: "Open",      icon: CircleDot },
    screening: { bg: "rgba(37,99,235,0.1)",  color: "#1d4ed8", dot: "#3b82f6", label: "Screening", icon: TrendingUp },
    closed:    { bg: "rgba(100,116,139,0.1)",color: "#475569", dot: "#94a3b8", label: "Closed",    icon: XCircle },
  };

  const counts = {
    all: jobs.length,
    open: jobs.filter(j => j.status === "open").length,
    screening: jobs.filter(j => j.status === "screening").length,
    closed: jobs.filter(j => j.status === "closed").length,
  };

  return (
    <>
      <style>{`
        .jp-root { display:flex; font-family:var(--font-body); }
        .jp-main { margin-left:var(--sidebar-width); min-height:100vh; background:var(--surface-base); flex:1; display:flex; flex-direction:column; }
        .jp-body { padding:24px 32px 100px; flex:1; }

        /* ── Stats bar ── */
        .jp-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:22px; }
        .jp-stat {
          background:var(--surface-card); border:1px solid var(--border-soft);
          border-radius:14px; padding:16px 18px;
          box-shadow:var(--shadow-card); cursor:pointer;
          transition:all 0.15s; border-bottom:2px solid transparent;
          display:flex; align-items:center; gap:12px;
        }
        .jp-stat:hover { transform:translateY(-1px); box-shadow:var(--shadow-card-hover); }
        .jp-stat.active { border-bottom-color:var(--stat-accent,#2563eb); background:var(--surface-hover); }
        .jp-stat-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .jp-stat-val  { font-size:22px; font-weight:900; color:var(--text-primary); line-height:1; font-family:var(--font-display,'Syne',sans-serif); }
        .jp-stat-lbl  { font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.07em; margin-top:2px; }

        /* ── Toolbar ── */
        .jp-toolbar { display:flex; align-items:center; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
        .jp-search-wrap { position:relative; flex:1; min-width:220px; max-width:380px; }
        .jp-search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none; }
        .jp-search {
          width:100%; padding:11px 14px 11px 40px; border-radius:11px;
          border:1.5px solid var(--border-input); background:var(--surface-card);
          color:var(--text-primary); font-size:14px; font-family:var(--font-body); outline:none;
          box-shadow:var(--shadow-card); transition:all 0.15s;
        }
        .jp-search:focus { border-color:var(--brand-primary); box-shadow:0 0 0 3px rgba(37,99,235,0.1); }
        .jp-search::placeholder { color:var(--text-muted); }
        .jp-count { font-size:13px; color:var(--text-secondary); font-weight:600; margin-left:auto; }

        /* ── Jobs list ── */
        .jp-list { display:flex; flex-direction:column; gap:0; background:var(--surface-card); border:1.5px solid var(--border-soft); border-radius:18px; overflow:hidden; box-shadow:var(--shadow-card); }

        .jp-list-header {
          display:grid; grid-template-columns:2fr 1fr 1fr 100px 160px;
          padding:10px 20px; border-bottom:1px solid var(--border-muted);
          background:var(--surface-subtle);
        }
        .jp-list-header span { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-muted); }

        .jp-row {
          display:grid; grid-template-columns:2fr 1fr 1fr 100px 160px;
          padding:16px 20px; border-bottom:1px solid var(--border-muted);
          align-items:center; transition:background 0.13s; gap:8px;
          text-decoration:none;
        }
        .jp-row:last-child { border-bottom:none; }
        .jp-row:hover { background:var(--surface-hover); }

        .jp-row-title { font-size:14px; font-weight:800; color:var(--text-primary); margin-bottom:4px; letter-spacing:-0.01em; }
        .jp-row-meta  { display:flex; flex-wrap:wrap; gap:10px; }
        .jp-row-meta-item { display:flex; align-items:center; gap:4px; font-size:12px; color:var(--text-secondary); font-weight:500; }

        .jp-skills { display:flex; flex-wrap:wrap; gap:5px; }
        .jp-skill {
          padding:3px 9px; border-radius:6px; font-size:11.5px; font-weight:600;
          background:rgba(37,99,235,0.07); color:#2563eb;
          border:1px solid rgba(37,99,235,0.14);
        }
        .jp-skill-more { background:var(--surface-subtle); color:var(--text-muted); border-color:var(--border-soft); }

        .jp-cand-cell { display:flex; align-items:center; gap:7px; font-size:13px; font-weight:700; color:var(--text-primary); }
        .jp-cand-icon { width:28px; height:28px; border-radius:8px; background:rgba(124,58,237,0.1); display:flex; align-items:center; justify-content:center; }

        .jp-status-badge { display:inline-flex; align-items:center; gap:5px; padding:5px 11px; border-radius:99px; font-size:12px; font-weight:700; }
        .jp-status-dot   { width:6px; height:6px; border-radius:50%; flex-shrink:0; }

        /* Actions column */
        .jp-actions { display:flex; align-items:center; gap:6px; }
        .jp-btn-view {
          display:inline-flex; align-items:center; gap:4px;
          padding:6px 12px; border-radius:8px;
          background:rgba(37,99,235,0.08); color:#2563eb;
          font-size:12px; font-weight:700; text-decoration:none;
          border:1.5px solid rgba(37,99,235,0.15);
          transition:all 0.13s;
        }
        .jp-btn-view:hover { background:rgba(37,99,235,0.16); border-color:rgba(37,99,235,0.3); }
        .jp-btn-screen {
          display:inline-flex; align-items:center; gap:4px;
          padding:6px 12px; border-radius:8px;
          background:linear-gradient(135deg,#4f46e5,#7c3aed); color:white;
          font-size:12px; font-weight:700; text-decoration:none;
          box-shadow:0 2px 8px rgba(124,58,237,0.3);
          transition:all 0.13s;
        }
        .jp-btn-screen:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(124,58,237,0.4); }
        .jp-btn-delete {
          display:inline-flex; align-items:center; justify-content:center;
          width:30px; height:30px; border-radius:8px;
          border:1.5px solid transparent; background:transparent;
          color:var(--text-muted); cursor:pointer; transition:all 0.13s;
        }
        .jp-btn-delete:hover { background:rgba(239,68,68,0.08); color:#ef4444; border-color:rgba(239,68,68,0.2); }

        /* ── Empty state ── */
        .jp-empty {
          padding:72px 40px; text-align:center;
          display:flex; flex-direction:column; align-items:center; gap:12px;
        }
        .jp-empty-icon {
          width:72px; height:72px; border-radius:20px;
          background:linear-gradient(135deg,rgba(37,99,235,0.08),rgba(124,58,237,0.06));
          border:1.5px solid rgba(37,99,235,0.12);
          display:flex; align-items:center; justify-content:center; margin-bottom:4px;
        }

        /* ── Skeleton ── */
        .jp-skeleton-row { display:grid; grid-template-columns:2fr 1fr 1fr 100px 160px; padding:20px; gap:8px; border-bottom:1px solid var(--border-muted); }

        /* ── Delete modal ── */
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.55); backdrop-filter:blur(6px); z-index:300; display:flex; align-items:center; justify-content:center; padding:20px; animation:fadeIn 0.15s ease; }
        .modal-box { background:var(--surface-card); border:1.5px solid var(--border-soft); border-radius:20px; padding:28px; max-width:380px; width:100%; box-shadow:var(--shadow-lg); animation:scaleIn 0.15s ease; }

        @media(max-width:900px){
          .jp-list-header,.jp-row { grid-template-columns:1fr 80px 130px; }
          .jp-list-header span:nth-child(2),
          .jp-list-header span:nth-child(3),
          .jp-row>*:nth-child(2),
          .jp-row>*:nth-child(3) { display:none; }
        }
        @media(max-width:768px){ .jp-main{margin-left:0} .jp-body{padding:16px 14px 80px} }
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

            {/* Stats bar */}
            <div className="jp-stats">
              {([
                { key: "all",      label: "All Jobs",   color: "#2563eb", bg: "rgba(37,99,235,0.1)",  icon: Briefcase  },
                { key: "open",     label: "Open",       color: "#16a34a", bg: "rgba(22,163,74,0.1)",  icon: CircleDot  },
                { key: "screening",label: "Screening",  color: "#4f46e5", bg: "rgba(79,70,229,0.1)",  icon: TrendingUp },
                { key: "closed",   label: "Closed",     color: "#64748b", bg: "rgba(100,116,139,0.1)",icon: CheckCircle},
              ] as const).map((s) => (
                <div
                  key={s.key}
                  className={`jp-stat${filter === s.key ? " active" : ""}`}
                  style={{ ["--stat-accent" as string]: s.color }}
                  onClick={() => setFilter(s.key)}
                >
                  <div className="jp-stat-icon" style={{ background: s.bg }}>
                    <s.icon size={17} color={s.color} />
                  </div>
                  <div>
                    <p className="jp-stat-val">{loading ? "—" : counts[s.key]}</p>
                    <p className="jp-stat-lbl">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div className="jp-toolbar">
              <div className="jp-search-wrap">
                <span className="jp-search-icon"><Search size={15} /></span>
                <input className="jp-search" placeholder="Search by title or location…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              {!loading && (
                <p className="jp-count">{filtered.length} job{filtered.length !== 1 ? "s" : ""}</p>
              )}
            </div>

            {/* List */}
            <div className="jp-list">
              {/* Header */}
              <div className="jp-list-header">
                <span>Job Title</span>
                <span>Skills</span>
                <span>Candidates</span>
                <span>Status</span>
                <span>Actions</span>
              </div>

              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="jp-skeleton-row">
                    <div><div className="skeleton" style={{ height: 16, width: "60%", marginBottom: 8, borderRadius: 6 }} /><div className="skeleton" style={{ height: 12, width: "40%", borderRadius: 6 }} /></div>
                    <div className="skeleton" style={{ height: 24, width: 120, borderRadius: 6 }} />
                    <div className="skeleton" style={{ height: 24, width: 80, borderRadius: 6 }} />
                    <div className="skeleton" style={{ height: 28, width: 90, borderRadius: 99 }} />
                    <div className="skeleton" style={{ height: 30, width: 130, borderRadius: 8 }} />
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="jp-empty">
                  <div className="jp-empty-icon">
                    <Briefcase size={28} color="#2563eb" />
                  </div>
                  <p style={{ fontWeight: 800, fontSize: 18, color: "var(--text-primary)" }}>
                    {search || filter !== "all" ? "No jobs match your filters" : "No jobs yet"}
                  </p>
                  <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 320, lineHeight: 1.6, textAlign: "center" }}>
                    {search || filter !== "all" ? "Try adjusting your search or filter." : "Post your first job to start screening candidates with AI."}
                  </p>
                  {!search && filter === "all" && (
                    <Link href="/jobs/create" className="btn-primary" style={{ marginTop: 8 }}>
                      <Plus size={14} /> Post a Job
                    </Link>
                  )}
                </div>
              ) : (
                filtered.map((job) => {
                  const sc = statusConfig[job.status] || statusConfig.closed;
                  const StatusIcon = sc.icon;
                  return (
                    <div key={job._id} className="jp-row">
                      {/* Title + meta */}
                      <div>
                        <p className="jp-row-title">{job.title}</p>
                        <div className="jp-row-meta">
                          {job.location && <span className="jp-row-meta-item"><MapPin size={11} /> {job.location}</span>}
                          {job.jobType  && <span className="jp-row-meta-item"><Building2 size={11} /> {job.jobType}</span>}
                          {job.yearsOfExperience !== undefined && <span className="jp-row-meta-item"><Clock size={11} /> {job.yearsOfExperience}+ yrs</span>}
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="jp-skills">
                        {(job.requiredSkills || []).slice(0, 3).map((s: string) => (
                          <span key={s} className="jp-skill">{s}</span>
                        ))}
                        {(job.requiredSkills?.length ?? 0) > 3 && (
                          <span className="jp-skill jp-skill-more">+{job.requiredSkills.length - 3}</span>
                        )}
                      </div>

                      {/* Candidates */}
                      <div className="jp-cand-cell">
                        <div className="jp-cand-icon">
                          <Users size={13} color="#7c3aed" />
                        </div>
                        <span>{job.applicantsCount ?? 0}</span>
                        <span style={{ color: "var(--text-muted)", fontWeight: 500, fontSize: 12 }}>candidate{(job.applicantsCount ?? 0) !== 1 ? "s" : ""}</span>
                      </div>

                      {/* Status */}
                      <div>
                        <span className="jp-status-badge" style={{ background: sc.bg, color: sc.color }}>
                          <span className="jp-status-dot" style={{ background: sc.dot }} />
                          {sc.label}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="jp-actions">
                        <Link href={`/jobs/${job._id}`} className="jp-btn-view">
                          <Eye size={12} /> View
                        </Link>
                        {(job.applicantsCount ?? 0) > 0 && (
                          <Link href={`/screenings?jobId=${job._id}`} className="jp-btn-screen">
                            <Sparkles size={12} /> Screen
                          </Link>
                        )}
                        <button className="jp-btn-delete" onClick={() => setDeleteTarget({ id: job._id, title: job.title })} title="Delete job">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Delete modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Trash2 size={22} color="#ef4444" />
            </div>
            <p style={{ fontWeight: 800, fontSize: 18, color: "var(--text-primary)", marginBottom: 8 }}>Delete job?</p>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24 }}>
              "<strong>{deleteTarget.title}</strong>" and all screening data will be permanently removed.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: "#ef4444", color: "white", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14, boxShadow: "0 4px 14px rgba(239,68,68,0.3)" }}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}