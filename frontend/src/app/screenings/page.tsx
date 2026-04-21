"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import ScreeningResults from "../../components/ScreeningResults";
import { getAllJobs } from "../../services/jobService";
import { triggerScreening, fetchResults } from "../../store/slices/screeningSlice";
import { AppDispatch, RootState } from "../../store";
import LoadingSpinner from "../../components/LoadingSpinner";
import type { CandidateResult } from "../../types";
import {
  ListChecks, Briefcase, BarChart2, Upload, Download,
  Sparkles, Users, Brain, ArrowRight, Play, AlertTriangle,
  CheckCircle, Clock, Zap,
} from "lucide-react";
import toast from "react-hot-toast";

function downloadScreeningCSV(results: any, jobTitle: string) {
  const headers = ["Rank","Name","Email","Score","Recommendation","Confidence","Skills Matched","Skills Missing","Strengths","Gaps"];
  const rows = (results.rankedCandidates || []).map((r: CandidateResult, i: number) => {
    const c = typeof r.candidateId === "object" ? r.candidateId as any : {};
    const name = c ? `${c.firstName || ""} ${c.lastName || ""}`.trim() : `Candidate ${i + 1}`;
    return [r.rank, name, c?.email || "", r.score, r.recommendation, r.confidence, (r.skillsMatched || []).join("; "), (r.skillsMissing || []).join("; "), (r.strengths || "").replace(/"/g, "'"), (r.gaps || "").replace(/"/g, "'")];
  });
  const csv = [headers, ...rows].map((row) => row.map((v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `screening-${jobTitle.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

function ScreeningsInner() {
  const dispatch = useDispatch<AppDispatch>();
  const router   = useRouter();
  const searchParams = useSearchParams();
  const { results, loading: loadingRes, error: err } = useSelector((s: RootState) => s.screening);

  const [jobs, setJobs]           = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobId, setJobId]         = useState(searchParams.get("jobId") || "");
  const [topN, setTopN]           = useState<10 | 20 | "all">("all");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.push("/"); return; }
    getAllJobs().then((d) => setJobs(d.jobs || [])).catch(() => {}).finally(() => setJobsLoading(false));
  }, [router]);

  useEffect(() => {
    const qJobId = searchParams.get("jobId");
    if (qJobId) { setJobId(qJobId); dispatch(fetchResults(qJobId)); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoad = () => {
    if (!jobId) return;
    dispatch(fetchResults(jobId));
    router.replace(`/screenings?jobId=${encodeURIComponent(jobId)}`, { scroll: false });
  };

  const handleRunScreening = async () => {
    if (!jobId) return;
    try {
      await dispatch(triggerScreening(jobId)).unwrap();
      toast.success("AI screening complete!");
      router.replace(`/screenings?jobId=${encodeURIComponent(jobId)}`, { scroll: false });
    } catch (e: unknown) {
      toast.error(typeof e === "string" ? e : "Screening failed. Make sure candidates are uploaded.");
    }
  };

  const selectedJob  = jobs.find((j) => j._id === jobId);
  const hasApplicants = (selectedJob?.applicantsCount ?? 0) > 0;

  return (
    <>
      <style>{`
        .sc-root    { display:flex; font-family:var(--font-body); }
        .sc-main    { margin-left:var(--sidebar-width); min-height:100vh; background:var(--surface-base); flex:1; display:flex; flex-direction:column; }
        .sc-content { padding:24px 32px 80px; flex:1; max-width:1100px; }

        /* ── Control card ── */
        .sc-control {
          background:var(--surface-card); border:1.5px solid var(--border-soft);
          border-radius:18px; padding:22px 26px; margin-bottom:20px;
          box-shadow:var(--shadow-card);
          border-left:4px solid #7c3aed;
        }
        .sc-control-top { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:16px; }
        .sc-control-title { font-size:16px; font-weight:800; color:var(--text-primary); display:flex; align-items:center; gap:8px; }
        .sc-control-sub   { font-size:13px; color:var(--text-secondary); margin-top:3px; line-height:1.5; }

        /* How it works steps */
        .sc-steps { display:flex; gap:8px; margin-bottom:18px; flex-wrap:wrap; }
        .sc-step {
          display:flex; align-items:center; gap:8px;
          padding:8px 14px; border-radius:10px;
          background:var(--surface-subtle); border:1px solid var(--border-muted);
          font-size:12.5px; font-weight:600; color:var(--text-secondary);
        }
        .sc-step-num {
          width:20px; height:20px; border-radius:50%;
          background:var(--brand-gradient); color:white;
          font-size:10px; font-weight:800; display:flex; align-items:center; justify-content:center;
          flex-shrink:0;
        }
        .sc-step-arrow { color:var(--text-muted); }

        /* Select row */
        .sc-select-row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
        .sc-select-wrap { position:relative; flex:1; min-width:220px; max-width:480px; }
        .sc-select-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none; }
        .sc-select {
          width:100%; padding:12px 36px 12px 40px; border-radius:11px;
          border:1.5px solid var(--border-input); background:var(--surface-input);
          font-family:var(--font-body); font-size:14px; color:var(--text-primary);
          cursor:pointer; outline:none; appearance:none;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:right 12px center;
          box-shadow:var(--shadow-card); transition:all 0.15s;
        }
        .sc-select:focus { border-color:var(--brand-primary); box-shadow:0 0 0 3px rgba(37,99,235,0.1); }

        /* Primary run button */
        .sc-run-btn {
          padding:12px 24px; border-radius:11px; border:none;
          background:linear-gradient(135deg,#7c3aed,#4f46e5,#2563eb); color:white;
          font-weight:800; font-size:14px; font-family:var(--font-body);
          cursor:pointer; box-shadow:0 4px 18px rgba(124,58,237,0.4);
          display:flex; align-items:center; gap:8px; white-space:nowrap;
          transition:all 0.15s; position:relative; overflow:hidden; letter-spacing:-0.01em;
        }
        .sc-run-btn::before { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent); background-size:200% 100%; animation:shimmer 2.5s infinite; }
        .sc-run-btn:hover { transform:translateY(-1px); box-shadow:0 6px 24px rgba(124,58,237,0.5); }
        .sc-run-btn:disabled { opacity:0.55; cursor:not-allowed; transform:none; box-shadow:none; }
        .sc-run-btn:disabled::before { animation:none; }

        /* Secondary load button */
        .sc-load-btn {
          padding:12px 20px; border-radius:11px;
          border:1.5px solid var(--border-soft); background:var(--surface-card);
          color:var(--text-secondary); font-weight:700; font-size:14px;
          font-family:var(--font-body); cursor:pointer;
          display:flex; align-items:center; gap:7px; white-space:nowrap;
          transition:all 0.15s;
        }
        .sc-load-btn:hover { border-color:var(--brand-primary); color:var(--brand-primary); background:rgba(37,99,235,0.04); }
        .sc-load-btn:disabled { opacity:0.5; cursor:not-allowed; }

        /* Banners */
        .sc-no-cand-banner {
          margin-top:14px; padding:12px 16px; border-radius:11px;
          background:rgba(234,179,8,0.08); border:1.5px solid rgba(234,179,8,0.25);
          display:flex; align-items:center; gap:10px; flex-wrap:wrap;
          font-size:13.5px; color:#92400e; font-weight:600;
        }
        .sc-success-banner {
          margin-top:14px; padding:12px 16px; border-radius:11px;
          background:rgba(22,163,74,0.08); border:1px solid rgba(22,163,74,0.2);
          display:flex; align-items:center; gap:10px; flex-wrap:wrap;
          font-size:13.5px; color:var(--text-secondary); font-weight:500;
        }

        /* Results header */
        .sc-results-header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px; flex-wrap:wrap; }
        .sc-results-title  { font-size:16px; font-weight:800; color:var(--text-primary); display:flex; align-items:center; gap:8px; }
        .sc-results-ctrls  { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .sc-topn-select {
          font-size:13px; border:1.5px solid var(--border-input); border-radius:9px;
          background:var(--surface-card); color:var(--text-primary);
          padding:6px 10px; outline:none; font-family:var(--font-body);
          font-weight:600; cursor:pointer;
        }
        .sc-csv-btn {
          display:flex; align-items:center; gap:7px; padding:8px 16px;
          border-radius:9px; border:1.5px solid var(--border-soft);
          background:var(--surface-card); color:var(--text-secondary);
          font-weight:700; font-size:13px; cursor:pointer; font-family:var(--font-body);
          transition:all 0.15s;
        }
        .sc-csv-btn:hover { border-color:#16a34a; color:#16a34a; background:rgba(22,163,74,0.06); }
        .sc-rerun-btn {
          display:flex; align-items:center; gap:6px; padding:8px 14px;
          border-radius:9px; border:none;
          background:rgba(124,58,237,0.1); color:#7c3aed;
          font-weight:700; font-size:13px; cursor:pointer; font-family:var(--font-body);
          transition:all 0.15s;
        }
        .sc-rerun-btn:hover { background:rgba(124,58,237,0.18); }

        /* Empty state */
        .sc-empty {
          background:var(--surface-card); border-radius:18px;
          border:1.5px solid var(--border-soft); padding:64px 40px;
          text-align:center; display:flex; flex-direction:column;
          align-items:center; gap:12px; box-shadow:var(--shadow-card);
        }
        .sc-empty-icon { width:76px; height:76px; border-radius:22px; display:flex; align-items:center; justify-content:center; margin-bottom:4px; }
        .sc-workflow-steps { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; max-width:480px; width:100%; margin-top:20px; }
        .sc-workflow-step {
          background:var(--surface-subtle); border:1.5px solid var(--border-muted);
          border-radius:14px; padding:16px 12px; text-align:center;
          transition:all 0.15s;
        }
        .sc-workflow-step:hover { border-color:var(--brand-primary); transform:translateY(-2px); }
        .sc-workflow-step-icon { width:38px; height:38px; border-radius:11px; background:var(--surface-card); border:1.5px solid var(--border-soft); display:flex; align-items:center; justify-content:center; margin:0 auto 8px; }

        /* Error */
        .sc-error { display:flex; align-items:flex-start; gap:12px; background:rgba(220,38,38,0.07); border:1.5px solid rgba(220,38,38,0.2); border-radius:13px; padding:16px 18px; color:#dc2626; font-size:14px; }

        @media(max-width:768px){ .sc-main{margin-left:0} .sc-content{padding:16px 14px 80px} .sc-select-row{flex-direction:column; align-items:stretch} .sc-steps{display:none} }
      `}</style>

      <div className="sc-root">
        <Sidebar />
        <div className="sc-main">
          <AppHeader title="Screenings" subtitle="AI-powered candidate ranking with Gemini" />
          <div className="sc-content">

            {/* Control card */}
            <div className="sc-control">
              <div className="sc-control-top">
                <div>
                  <p className="sc-control-title">
                    <Brain size={18} color="#7c3aed" /> AI Candidate Screening
                  </p>
                  <p className="sc-control-sub">
                    Select a job and run Gemini-powered screening to instantly rank and score all candidates.
                  </p>
                </div>
              </div>

              {/* How it works */}
              <div className="sc-steps">
                {[
                  { num: "1", icon: <Briefcase size={13} color="#2563eb" />, label: "Select a job" },
                  { num: "→", icon: null, label: null },
                  { num: "2", icon: <Upload size={13} color="#7c3aed" />, label: "Ensure candidates are uploaded" },
                  { num: "→", icon: null, label: null },
                  { num: "3", icon: <Zap size={13} color="#0891b2" />, label: "Run AI Screening" },
                ].map((s, i) =>
                  s.label ? (
                    <div key={i} className="sc-step">
                      <span className="sc-step-num">{s.num}</span>
                      {s.icon}
                      <span>{s.label}</span>
                    </div>
                  ) : (
                    <span key={i} className="sc-step-arrow" style={{ display: "flex", alignItems: "center" }}>→</span>
                  )
                )}
              </div>

              {/* Job selector + actions */}
              <div className="sc-select-row">
                <div className="sc-select-wrap">
                  <span className="sc-select-icon"><Briefcase size={15} /></span>
                  <select className="sc-select" value={jobId} onChange={(e) => setJobId(e.target.value)} disabled={jobsLoading}>
                    <option value="">{jobsLoading ? "Loading jobs…" : "Select a job posting…"}</option>
                    {jobs.map((j) => (
                      <option key={j._id} value={j._id}>
                        {j.title}{j.applicantsCount ? ` — ${j.applicantsCount} candidates` : " — 0 candidates"}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="sc-run-btn"
                  onClick={handleRunScreening}
                  disabled={!jobId || loadingRes || !hasApplicants}
                  title={!hasApplicants && jobId ? "Upload candidates first" : ""}
                >
                  <Brain size={15} />
                  {loadingRes ? "Running AI…" : "Run AI Screening"}
                </button>

                <button className="sc-load-btn" onClick={handleLoad} disabled={!jobId || loadingRes}>
                  <BarChart2 size={15} />
                  Load Results
                </button>
              </div>

              {/* Warnings / success banners */}
              {jobId && !hasApplicants && !jobsLoading && (
                <div className="sc-no-cand-banner">
                  <AlertTriangle size={16} color="#d97706" />
                  <span>This job has no candidates uploaded yet.</span>
                  <Link href={`/applicants?jobId=${jobId}`} style={{ display: "flex", alignItems: "center", gap: 5, fontWeight: 800, color: "#2563eb", textDecoration: "none", padding: "4px 12px", borderRadius: 7, background: "rgba(37,99,235,0.1)", marginLeft: "auto", fontSize: 13 }}>
                    <Upload size={13} /> Upload Candidates <ArrowRight size={12} />
                  </Link>
                </div>
              )}

              {selectedJob && results && (
                <div className="sc-success-banner">
                  <CheckCircle size={15} color="#16a34a" />
                  <strong style={{ color: "var(--text-primary)" }}>{selectedJob.title}</strong>
                  <span>·</span>
                  <span><strong style={{ color: "var(--text-primary)" }}>{results.totalApplicants}</strong> screened</span>
                  <span>·</span>
                  <span><strong style={{ color: "#16a34a" }}>{results.shortlistedCount}</strong> shortlisted</span>
                </div>
              )}
            </div>

            {/* Loading */}
            {loadingRes && <LoadingSpinner label="Running AI screening with Gemini…" />}

            {/* Error */}
            {err && !loadingRes && (
              <div className="sc-error">
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{typeof err === "string" ? err : "Could not load screening results. Please try again."}</span>
              </div>
            )}

            {/* Empty state */}
            {!loadingRes && !results && !err && (
              <div className="sc-empty">
                <div className="sc-empty-icon" style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(37,99,235,0.08))", border: "1.5px solid rgba(124,58,237,0.15)" }}>
                  <Brain size={32} color="#7c3aed" />
                </div>
                <p style={{ fontWeight: 900, fontSize: 22, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
                  Ready to screen candidates
                </p>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 420, lineHeight: 1.65, textAlign: "center" }}>
                  Select a job above and click <strong>Run AI Screening</strong> to get an instant ranked shortlist with scores, strengths, and skill gaps powered by Gemini.
                </p>
                <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  <Link href="/jobs" className="btn-primary">
                    <Briefcase size={14} /> Go to Jobs <ArrowRight size={13} />
                  </Link>
                  <Link href="/applicants" className="btn-secondary">
                    <Upload size={14} /> Upload Candidates
                  </Link>
                </div>
                <div className="sc-workflow-steps">
                  {[
                    { icon: <Briefcase size={16} color="#2563eb" />, step: "1", label: "Post a Job", color: "#2563eb" },
                    { icon: <Users size={16} color="#7c3aed" />,     step: "2", label: "Upload CVs",  color: "#7c3aed" },
                    { icon: <Sparkles size={16} color="#0891b2" />,  step: "3", label: "Run Screening", color: "#0891b2" },
                  ].map((s) => (
                    <div key={s.step} className="sc-workflow-step">
                      <div className="sc-workflow-step-icon">{s.icon}</div>
                      <p style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Step {s.step}</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginTop: 3 }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {!loadingRes && results && (
              <>
                <div className="sc-results-header">
                  <p className="sc-results-title">
                    <Sparkles size={18} color="#7c3aed" />
                    {selectedJob?.title || "Screening"} — AI Results
                  </p>
                  <div className="sc-results-ctrls">
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <label style={{ fontSize: 12.5, color: "var(--text-secondary)", fontWeight: 600 }}>Show top</label>
                      <select value={topN} onChange={(e) => setTopN(e.target.value as any)} className="sc-topn-select">
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value="all">All</option>
                      </select>
                    </div>
                    <button className="sc-rerun-btn" onClick={handleRunScreening} disabled={loadingRes}>
                      <Play size={13} /> Re-run
                    </button>
                    <button className="sc-csv-btn" onClick={() => downloadScreeningCSV(results, selectedJob?.title || "results")}>
                      <Download size={14} /> Export CSV
                    </button>
                  </div>
                </div>
                <ScreeningResults jobId={jobId} results={results} fromCache={false} displayTopN={topN} />
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

export default function ScreeningsPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage label="Loading screenings…" />}>
      <ScreeningsInner />
    </Suspense>
  );
}
