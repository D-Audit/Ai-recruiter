"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../../../components/Sidebar";
import AppHeader from "../../../components/AppHeader";
import ScreeningResults from "../../../components/ScreeningResults";
import { getJob } from "../../../services/jobService";
import {
  triggerScreening, fetchResults, clearResults,
} from "../../../store/slices/screeningSlice";
import { saveJob } from "../../../store/slices/jobSlice";
import { AppDispatch, RootState } from "../../../store";
import toast from "react-hot-toast";
import {
  ArrowLeft, Brain, MapPin, Users, Pencil,
  Sparkles, ChevronRight, Briefcase, Clock, GraduationCap,
  CheckCircle2,
} from "lucide-react";

type JobRow = {
  _id: string; title: string; description?: string; location?: string;
  jobType?: string; status?: string; applicantsCount?: number; createdAt?: string;
  requiredSkills?: string[]; yearsOfExperience?: number; educationLevel?: string;
};

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { results, fromCache, loading: screeningLoading } = useSelector((s: RootState) => s.screening);

  const [job, setJob] = useState<JobRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [topN, setTopN] = useState<10 | 20 | "all">(20);
  const [editForm, setEditForm] = useState<Partial<JobRow>>({});

  // ── FIX: jobId must be a non-empty string before any dispatch
  const jobId = (id as string) || "";

  const loadJob = () => {
    if (!jobId) return;
    getJob(jobId)
      .then((d) => setJob(d.job))
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadJob(); }, [jobId]);

  useEffect(() => {
    // ── FIX: only fetch results when jobId is a valid non-empty string
    if (!jobId) return;
    dispatch(clearResults());
    dispatch(fetchResults(jobId)).unwrap().catch(() => {});
  }, [jobId, dispatch]);

  useEffect(() => {
    if (job) {
      setEditForm({
        title: job.title, description: job.description, location: job.location,
        jobType: job.jobType, yearsOfExperience: job.yearsOfExperience,
        educationLevel: job.educationLevel, requiredSkills: job.requiredSkills,
      });
    }
  }, [job, editOpen]);

  const statusMap: Record<string, { bg: string; color: string; label: string }> = {
    open:      { bg: "#dcfce7", color: "#16a34a", label: "Active" },
    screening: { bg: "#dbeafe", color: "#2563eb", label: "Screening" },
    closed:    { bg: "#f1f5f9", color: "#64748b", label: "Closed" },
  };

  // ── FIX: pass object { jobId } instead of plain string ──────────────────
  const runScreen = async () => {
    if (!jobId) { toast.error("Job ID is missing"); return; }
    try {
      await dispatch(triggerScreening({ jobId })).unwrap();
      toast.success("Screening complete");
      loadJob();
      router.push(`/screenings?jobId=${encodeURIComponent(jobId)}`);
    } catch (e: unknown) {
      toast.error(typeof e === "string" ? e : "Screening failed. Make sure candidates have been uploaded.");
    }
  };

  const saveEdit = async () => {
    if (!job) return;
    try {
      await dispatch(saveJob({
        id: job._id,
        data: {
          title: editForm.title, description: editForm.description,
          location: editForm.location, jobType: editForm.jobType,
          yearsOfExperience: editForm.yearsOfExperience,
          educationLevel: editForm.educationLevel,
          requiredSkills: editForm.requiredSkills,
        },
      })).unwrap();
      toast.success("Job updated");
      setEditOpen(false);
      loadJob();
    } catch (e: unknown) {
      toast.error(typeof e === "string" ? e : "Update failed");
    }
  };

  const st = job ? statusMap[job.status || "closed"] ?? statusMap.closed : statusMap.closed;

  // Workflow banner logic
  const hasApplicants = (job?.applicantsCount ?? 0) > 0;
  const hasResults    = !!results;
  const workflowBanner = !hasApplicants
    ? { message: "Job created! Next step: upload candidates for this position.", linkText: "Upload Candidates", linkHref: `/applicants?jobId=${jobId}` }
    : !hasResults
    ? { message: `${job?.applicantsCount} candidate${(job?.applicantsCount ?? 0) !== 1 ? "s" : ""} ready. Run AI screening to rank them.`, linkText: "View Screenings", linkHref: `/screenings?jobId=${jobId}` }
    : undefined;

  return (
    <>
      <style>{`
        .jd-root { display: flex; font-family: var(--font-body, system-ui); }
        .jd-main { margin-left: var(--sidebar-width, 260px); min-height: 100vh; background: var(--surface-base); flex: 1; display: flex; flex-direction: column; }
        .jd-body { padding: 28px 40px 120px; flex: 1; max-width: 960px; animation: fadeIn 0.28s ease; }
        .jd-back {
          display: inline-flex; align-items: center; gap: 6px; color: var(--text-muted);
          font-size: 13px; font-weight: 600; background: none; border: none; cursor: pointer;
          margin-bottom: 20px; padding: 0; transition: color var(--transition-fast);
        }
        .jd-back:hover { color: var(--text-primary); }
        .jd-card { background: var(--surface-card); border: 1.5px solid var(--border-soft); border-radius: 18px; padding: 28px; margin-bottom: 20px; box-shadow: var(--shadow-card); }
        .jd-title { font-size: 24px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.03em; }
        .jd-badge { padding: 5px 13px; border-radius: 99px; font-size: 12px; font-weight: 700; }
        .jd-meta { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-top: 20px; }
        .jd-meta-cell { padding: 12px 14px; background: var(--surface-hover); border-radius: 12px; border: 1px solid var(--border-muted); }
        .jd-meta-l { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); }
        .jd-meta-v { font-size: 14px; font-weight: 700; color: var(--text-primary); margin-top: 5px; display: flex; align-items: center; gap: 6px; }

        .jd-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .jd-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 10px; font-size: 13.5px; font-weight: 600; font-family: var(--font-body); cursor: pointer; transition: all var(--transition-fast); text-decoration: none; white-space: nowrap; }
        .jd-btn-outline { background: var(--surface-card); border: 1.5px solid var(--border-soft); color: var(--text-secondary); }
        .jd-btn-outline:hover { border-color: var(--brand-primary); color: var(--brand-primary); background: rgba(37,99,235,0.05); }

        /* FLOW 3D: Prominent screening CTA */
        .jd-screen-cta {
          width: 100%; padding: 18px 24px; border-radius: 16px; border: none;
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          color: white; font-size: 16px; font-weight: 800;
          cursor: pointer; font-family: var(--font-body);
          display: flex; align-items: center; justify-content: center; gap: 10px;
          box-shadow: 0 8px 24px rgba(124,58,237,0.35);
          transition: all var(--transition-fast);
          position: relative; overflow: hidden;
          margin-bottom: 20px;
        }
        .jd-screen-cta::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          background-size: 200% 100%;
          animation: shimmer 2.5s infinite;
        }
        .jd-screen-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(124,58,237,0.5); }
        .jd-screen-cta:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

        /* Workflow banner */
        .jd-banner {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
          padding: 14px 18px; border-radius: 12px; margin-bottom: 20px;
          background: rgba(37,99,235,0.06); border: 1.5px solid rgba(37,99,235,0.15);
          font-size: 13.5px; color: var(--text-secondary);
        }
        .jd-banner a { color: #2563eb; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
        .jd-banner a:hover { text-decoration: underline; }

        /* Modal */
        .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal-inner { background: var(--surface-card); border-radius: 18px; padding: 28px; width: 100%; max-width: 520px; border: 1.5px solid var(--border-soft); box-shadow: 0 24px 60px rgba(0,0,0,0.2); animation: scaleIn 0.18s ease; }
        .modal-title { font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 20px; }
        .modal-label { display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 6px; }
        .modal-input { width: 100%; padding: 10px 14px; border-radius: 10px; border: 1.5px solid var(--border-input); background: var(--surface-input); color: var(--text-primary); font-size: 14px; font-family: var(--font-body); outline: none; transition: border-color 0.15s; }
        .modal-input:focus { border-color: var(--brand-primary); }
        .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
        .modal-cancel { padding: 10px 20px; border-radius: 9px; border: 1.5px solid var(--border-soft); background: var(--surface-card); color: var(--text-secondary); font-weight: 600; font-size: 14px; cursor: pointer; font-family: var(--font-body); }
        .modal-save   { padding: 10px 22px; border-radius: 9px; border: none; background: linear-gradient(135deg,#2563eb,#7c3aed); color: white; font-weight: 700; font-size: 14px; cursor: pointer; font-family: var(--font-body); }

        @keyframes fadeIn    { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn   { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes shimmer   { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes spin      { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .jd-main { margin-left: 0; } .jd-body { padding: 18px 14px 100px; } }
      `}</style>

      <div className="jd-root">
        <Sidebar />
        <div className="jd-main">
          <AppHeader title="Job Details" subtitle="View and manage this position" />
          <div className="jd-body">
            <button className="jd-back" onClick={() => router.push("/jobs")}>
              <ArrowLeft size={14} /> Back to Jobs
            </button>

            {loading ? (
              <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)" }}>
                Loading…
              </div>
            ) : !job ? (
              <div className="empty-state">
                <div className="empty-icon"><Briefcase size={28} color="var(--text-muted)" /></div>
                <p style={{ fontWeight: 700, fontSize: 17, color: "var(--text-primary)" }}>Job not found</p>
                <Link href="/jobs" className="btn-primary" style={{ marginTop: 8 }}>Back to Jobs</Link>
              </div>
            ) : (
              <>
                {/* Workflow banner */}
                {workflowBanner && (
                  <div className="jd-banner">
                    <span>{workflowBanner.message}</span>
                    <Link href={workflowBanner.linkHref}>
                      {workflowBanner.linkText} <ChevronRight size={13} />
                    </Link>
                  </div>
                )}

                {/* Job card */}
                <div className="jd-card">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                      <h1 className="jd-title">{job.title}</h1>
                      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                        <span className="jd-badge" style={{ background: "#eff6ff", color: "#2563eb" }}>{job.jobType}</span>
                        <span className="jd-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                        {(job.applicantsCount ?? 0) > 0 && (
                          <span className="jd-badge" style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}>
                            <Users size={11} style={{ display: "inline", marginRight: 4 }} />
                            {job.applicantsCount} candidate{(job.applicantsCount ?? 0) !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="jd-actions">
                      <Link href={`/applicants?jobId=${job._id}`} className="jd-btn jd-btn-outline">
                        <Users size={15} /> Upload Candidates
                      </Link>
                      <button type="button" className="jd-btn jd-btn-outline" onClick={() => setEditOpen(true)}>
                        <Pencil size={15} /> Edit Job
                      </button>
                    </div>
                  </div>

                  {job.description && (
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 16 }}>
                      {job.description}
                    </p>
                  )}

                  <div className="jd-meta">
                    {[
                      { label: "Location",   value: job.location || "—",              icon: <MapPin size={13} color="var(--text-muted)" /> },
                      { label: "Experience", value: `${job.yearsOfExperience ?? 0}+ years`, icon: <Clock size={13} color="var(--text-muted)" /> },
                      { label: "Education",  value: job.educationLevel || "Any",       icon: <GraduationCap size={13} color="var(--text-muted)" /> },
                      { label: "Candidates", value: String(job.applicantsCount ?? 0),  icon: <Users size={13} color="var(--text-muted)" /> },
                    ].map((m) => (
                      <div key={m.label} className="jd-meta-cell">
                        <p className="jd-meta-l">{m.label}</p>
                        <p className="jd-meta-v">{m.icon} {m.value}</p>
                      </div>
                    ))}
                  </div>

                  {(job.requiredSkills?.length ?? 0) > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Required Skills</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {job.requiredSkills!.map((s) => (
                          <span key={s} style={{ padding: "4px 12px", borderRadius: 8, background: "rgba(37,99,235,0.08)", color: "#2563eb", fontSize: 12, fontWeight: 600, border: "1px solid rgba(37,99,235,0.15)" }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Screening CTA — shown when there are candidates */}
                {(job.applicantsCount ?? 0) > 0 && (
                  <button
                    type="button"
                    className="jd-screen-cta"
                    disabled={screeningLoading}
                    onClick={runScreen}
                  >
                    {screeningLoading ? (
                      <>
                        <span style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.75s linear infinite" }} />
                        Running AI Screening…
                      </>
                    ) : (
                      <>
                        <Brain size={20} />
                        Run AI Screening — Rank {job.applicantsCount} Candidate{(job.applicantsCount ?? 0) !== 1 ? "s" : ""}
                        <Sparkles size={16} style={{ opacity: 0.8 }} />
                      </>
                    )}
                  </button>
                )}

                {/* Existing results */}
                {results && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <CheckCircle2 size={17} color="#16a34a" />
                        <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Screening Results</span>
                        {fromCache && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "rgba(217,119,6,0.1)", color: "#d97706", fontWeight: 700 }}>Cached</span>}
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Show top</label>
                        <select value={topN} onChange={(e) => setTopN(e.target.value as any)} style={{ fontSize: 13, border: "1.5px solid var(--border-input)", borderRadius: 8, background: "var(--surface-card)", color: "var(--text-primary)", padding: "4px 8px", outline: "none" }}>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value="all">All</option>
                        </select>
                        <Link href={`/screenings?jobId=${job._id}`} style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                          Full view <ChevronRight size={13} />
                        </Link>
                      </div>
                    </div>
                    <ScreeningResults
                      jobId={jobId}
                      results={results}
                      fromCache={fromCache ?? false}
                      displayTopN={topN}
                      showRunButton
                      onRunScreening={runScreen}
                      loadingRun={screeningLoading}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editOpen && (
        <div className="modal-bg" onClick={() => setEditOpen(false)}>
          <div className="modal-inner" onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Edit Job</p>
            {[
              { label: "Title",    key: "title",    type: "text" },
              { label: "Location", key: "location", type: "text" },
            ].map((f) => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label className="modal-label">{f.label}</label>
                <input
                  className="modal-input"
                  type={f.type}
                  value={(editForm as any)[f.key] || ""}
                  onChange={(e) => setEditForm({ ...editForm, [f.key]: e.target.value })}
                />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label className="modal-label">Description</label>
              <textarea
                className="modal-input"
                rows={4}
                value={editForm.description || ""}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                style={{ resize: "vertical" }}
              />
            </div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setEditOpen(false)}>Cancel</button>
              <button className="modal-save" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}