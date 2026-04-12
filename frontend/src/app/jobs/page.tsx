"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchJobs, removeJob } from "../../store/slices/jobSlice";
import { AppDispatch, RootState } from "../../store";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import toast from "react-hot-toast";
import {
  Plus,
  MapPin,
  Users,
  Trash2,
  Briefcase,
  AlertTriangle,
  X,
} from "lucide-react";

export default function JobsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { jobs, loading } = useSelector((state: RootState) => state.jobs);
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState<
    "all" | "open" | "screening" | "closed"
  >("all");
  const [typeF, setTypeF] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchJobs());
  }, [dispatch]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return jobs.filter((j) => {
      if (statusF !== "all" && j.status !== statusF) return false;
      if (typeF !== "all" && j.jobType !== typeF) return false;
      if (!q) return true;
      return (
        j.title?.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q) ||
        j.requiredSkills?.some((s: string) => s.toLowerCase().includes(q))
      );
    });
  }, [jobs, search, statusF, typeF]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await dispatch(removeJob(deleteTarget));
    toast.success("Job deleted");
    setDeleteTarget(null);
    setDeleting(false);
  };

  const statusLabel: Record<string, string> = {
    open: "Active",
    screening: "Screening",
    closed: "Closed",
  };

  const statusStyle: Record<string, { bg: string; color: string }> = {
    open: { bg: "#dcfce7", color: "#16a34a" },
    screening: { bg: "#dbeafe", color: "#2563eb" },
    closed: { bg: "#f1f5f9", color: "#64748b" },
  };

  return (
    <>
      <style>{`
        .jp-root { display: flex; font-family: system-ui, sans-serif; }
        .jp-main { margin-left: 260px; min-height: 100vh; background: #f8fafc; flex: 1; display: flex; flex-direction: column; }
        .jp-body { padding: 28px 40px 48px; flex: 1; }
        .jp-toolbar { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 22px; align-items: center; }
        .jp-search {
          flex: 1; min-width: 200px; display: flex; align-items: center; gap: 10px;
          background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0 14px; height: 44px;
        }
        .jp-search input { border: none; outline: none; flex: 1; font-size: 14px; background: transparent; }
        .jp-select {
          height: 44px; padding: 0 12px; border-radius: 12px; border: 1px solid #e2e8f0;
          background: white; font-size: 14px; color: #334155; font-weight: 500;
        }
        .jp-new {
          display: inline-flex; align-items: center; gap: 8px; padding: 0 20px; height: 44px;
          border-radius: 12px; background: #2563eb; color: white; font-weight: 700; font-size: 14px;
          text-decoration: none; box-shadow: 0 4px 14px rgba(37,99,235,0.28);
        }
        .jp-list { display: flex; flex-direction: column; gap: 14px; }
        .jp-card {
          background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px 24px;
          display: flex; align-items: center; gap: 20px; cursor: pointer;
          transition: box-shadow 0.2s, border-color 0.2s;
        }
        .jp-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.06); border-color: #cbd5e1; }
        .jp-icon {
          width: 52px; height: 52px; border-radius: 14px;
          background: linear-gradient(135deg, rgba(37,99,235,0.12), rgba(124,58,237,0.1));
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .jp-mid { flex: 1; min-width: 0; }
        .jp-title { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
        .jp-meta { display: flex; flex-wrap: wrap; gap: 14px; font-size: 13px; color: #64748b; align-items: center; }
        .jp-badges { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
        .jp-badge {
          font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px;
        }
        .jp-ap { background: #f1f5f9; color: #475569; }
        .jp-del {
          width: 42px; height: 42px; border-radius: 11px; border: 1px solid #fee2e2;
          background: white; color: #ef4444; display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
        }
        .jp-del:hover { background: #fef2f2; }
        .jp-empty {
          text-align: center; padding: 80px 40px; background: white; border-radius: 16px; border: 1px solid #e2e8f0;
        }
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 200;
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .modal-box { background: white; border-radius: 16px; padding: 32px; max-width: 420px; width: 100%; }
        @media (max-width: 768px) { .jp-main { margin-left: 0; } .jp-body { padding: 20px; } .jp-card { flex-wrap: wrap; } }
      `}</style>

      <div className="jp-root">
        <Sidebar />
        <div className="jp-main">
          <AppHeader title="All Jobs" subtitle={`${jobs.length} position${jobs.length !== 1 ? "s" : ""}`} />
          <div className="jp-body">
            <div className="jp-toolbar">
              <div className="jp-search">
                <span style={{ color: "#94a3b8" }}>⌕</span>
                <input
                  placeholder="Search jobs…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: "#94a3b8",
                    }}
                  >
                    <X size={16} />
                  </button>
                ) : null}
              </div>
              <select
                className="jp-select"
                value={statusF}
                onChange={(e) => setStatusF(e.target.value as typeof statusF)}
              >
                <option value="all">Status: All</option>
                <option value="open">Active</option>
                <option value="screening">Screening</option>
                <option value="closed">Closed</option>
              </select>
              <select
                className="jp-select"
                value={typeF}
                onChange={(e) => setTypeF(e.target.value)}
              >
                <option value="all">Type: All</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Remote">Remote</option>
              </select>
              <Link href="/jobs/create" className="jp-new">
                <Plus size={18} /> Post New Job
              </Link>
            </div>

            {loading ? (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: 48 }}>
                Loading…
              </p>
            ) : jobs.length === 0 ? (
              <div className="jp-empty">
                <Briefcase
                  size={40}
                  color="#cbd5e1"
                  style={{ margin: "0 auto 16px" }}
                />
                <p style={{ fontWeight: 700, color: "#0f172a", fontSize: 18, marginBottom: 8 }}>
                  No jobs posted yet
                </p>
                <Link href="/jobs/create" className="jp-new" style={{ marginTop: 16, display: "inline-flex" }}>
                  <Plus size={18} /> Post Your First Job
                </Link>
              </div>
            ) : filtered.length === 0 ? (
              <div className="jp-empty">
                <p style={{ fontWeight: 600, color: "#64748b" }}>No jobs match filters</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusF("all");
                    setTypeF("all");
                  }}
                  style={{
                    marginTop: 12,
                    padding: "8px 16px",
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="jp-list">
                {filtered.map((job) => {
                  const st = statusStyle[job.status] ?? statusStyle.closed;
                  return (
                    <div key={job._id} className="jp-card" role="button" tabIndex={0}
                      onClick={() => router.push(`/jobs/${job._id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") router.push(`/jobs/${job._id}`);
                      }}
                    >
                      <div className="jp-icon">
                        <Briefcase size={24} color="#2563eb" />
                      </div>
                      <div className="jp-mid">
                        <p className="jp-title">{job.title}</p>
                        <div className="jp-meta">
                          {job.location ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <MapPin size={14} /> {job.location}
                            </span>
                          ) : null}
                          <span>
                            {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                          <span
                            className="jp-badge"
                            style={{ background: "#eff6ff", color: "#2563eb" }}
                          >
                            {job.jobType}
                          </span>
                        </div>
                        <div className="jp-badges" style={{ marginTop: 10 }}>
                          <span className="jp-badge" style={{ background: st.bg, color: st.color }}>
                            {statusLabel[job.status] || job.status}
                          </span>
                          <span className="jp-badge jp-ap">
                            <Users size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                            {job.applicantsCount || 0} applicants
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="jp-del"
                        aria-label="Delete job"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(job._id);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {deleteTarget ? (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "#fef2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <AlertTriangle size={26} color="#dc2626" />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
              Delete job?
            </h3>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24, lineHeight: 1.55 }}>
              This removes the job and related applicant links from your workspace.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 11,
                  border: "1px solid #e2e8f0",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 11,
                  border: "none",
                  background: "#dc2626",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {deleting ? "…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
