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
  ListChecks, Briefcase, Upload, Download,
  Sparkles, Users, Brain, ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";

function downloadScreeningCSV(results: any, jobTitle: string) {
  const headers = ["Rank", "Name", "Email", "Score", "Recommendation", "Confidence", "Skills Matched", "Skills Missing", "Strengths", "Gaps"];
  const rows = (results.rankedCandidates || []).map((r: CandidateResult, i: number) => {
    const c = typeof r.candidateId === "object" ? r.candidateId as any : {};
    const name = c ? `${c.firstName || ""} ${c.lastName || ""}`.trim() : `Candidate ${i + 1}`;
    return [r.rank, name, c?.email || "", r.score, r.recommendation, r.confidence, (r.skillsMatched || []).join("; "), (r.skillsMissing || []).join("; "), (r.strengths || "").replace(/"/g, "'"), (r.gaps || "").replace(/"/g, "'")];
  });
  const csvContent = [headers, ...rows].map((row) => row.map((v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `screening-${jobTitle.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ScreeningsInner() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { results, loading: loadingRes, error: err } = useSelector((s: RootState) => s.screening);

  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobId, setJobId] = useState(searchParams.get("jobId") || "");
  const [topN, setTopN] = useState<10 | 20 | "all">(() => {
    const n = searchParams.get("topN");
    if (n === "10") return 10;
    if (n === "20") return 20;
    return "all";
  });

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.push("/"); return; }
    getAllJobs()
      .then((d) => setJobs(d.jobs || []))
      .catch(() => {})
      .finally(() => setJobsLoading(false));
  }, [router]);

  // Load existing results when a jobId is in the URL on mount
  useEffect(() => {
    const qJobId = searchParams.get("jobId");
    if (qJobId) {
      setJobId(qJobId);
      dispatch(fetchResults(qJobId));
    }
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
      toast.success("AI screening complete! Redirecting to results…");
      router.push(`/screenings/${encodeURIComponent(jobId)}`);
    } catch (e: unknown) {
      toast.error(typeof e === "string" ? e : "Screening failed. Make sure candidates are uploaded.");
    }
  };

  const selectedJob = jobs.find((j) => j._id === jobId);
  const hasApplicants = (selectedJob?.applicantsCount ?? 0) > 0;

  return (
    <>
      <style>{`
        .sc-root { display: flex; font-family: var(--font-body, system-ui); }
        .sc-main { margin-left: var(--sidebar-width); min-height: 100vh; background: var(--surface-base); flex: 1; display: flex; flex-direction: column; }
        .sc-content { padding: 28px 36px 80px; flex: 1; max-width: 1100px; animation: fadeIn 0.28s ease; }

        .sc-selector {
          background: var(--surface-card); border-radius: 18px;
          border: 1.5px solid var(--border-soft); padding: 24px 28px;
          margin-bottom: 24px; box-shadow: var(--shadow-card);
        }
        .sc-selector-title { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
        .sc-selector-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 18px; line-height: 1.5; }
        .sc-select-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .sc-select-wrap { position: relative; flex: 1; min-width: 200px; max-width: 460px; }
        .sc-select-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
        .sc-select {
          width: 100%; padding: 11px 36px 11px 38px; border-radius: 11px;
          border: 1.5px solid var(--border-input); background: var(--surface-input);
          font-family: var(--font-body); font-size: 14px; color: var(--text-primary);
          cursor: pointer; outline: none; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 12px center;
          transition: all var(--transition-fast);
        }
        .sc-select:focus { border-color: var(--brand-primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }

        /* Load results button */
        .sc-load-btn {
          padding: 11px 22px; border-radius: 11px; border: 1.5px solid var(--border-soft);
          background: var(--surface-card); color: var(--text-secondary);
          font-weight: 700; font-size: 14px; font-family: var(--font-body);
          cursor: pointer; display: flex; align-items: center; gap: 7px; white-space: nowrap;
          transition: all var(--transition-fast);
        }
        .sc-load-btn:hover { border-color: var(--brand-primary); color: var(--brand-primary); background: rgba(37,99,235,0.04); }
        .sc-load-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Run AI Screening button — prominent */
        .sc-run-btn {
          padding: 11px 22px; border-radius: 11px; border: none;
          background: linear-gradient(135deg, #7c3aed, #2563eb); color: white;
          font-weight: 700; font-size: 14px; font-family: var(--font-body);
          cursor: pointer; box-shadow: var(--shadow-button);
          display: flex; align-items: center; gap: 7px; white-space: nowrap;
          transition: all var(--transition-fast); position: relative; overflow: hidden;
        }
        .sc-run-btn::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200% 100%; animation: shimmer 2.5s infinite;
        }
        .sc-run-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,58,237,0.45); }
        .sc-run-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
        .sc-run-btn:disabled::before { animation: none; }

        .sc-job-info { margin-top: 14px; padding: 11px 14px; border-radius: 10px; background: rgba(22,163,74,0.07); border: 1px solid rgba(22,163,74,0.2); display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 13px; color: var(--text-secondary); }

        /* No-candidates warning */
        .sc-no-cand-warn { margin-top: 12px; padding: 10px 14px; border-radius: 10px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); display: flex; align-items: center; gap: 8px; font-size: 13px; color: #92400e; font-weight: 500; flex-wrap: wrap; }

        .sc-results-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
        .sc-results-title { font-size: 16px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
        .sc-results-controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .sc-topn-select { font-size: 13px; border: 1.5px solid var(--border-input); border-radius: 8px; background: var(--surface-card); color: var(--text-primary); padding: "4px 8px"; outline: none; }
        .sc-csv-btn { display: flex; align-items: center; gap: 7px; padding: 9px 18px; border-radius: 10px; border: 1.5px solid var(--border-soft); background: var(--surface-card); color: var(--text-secondary); font-weight: 700; font-size: 13px; cursor: pointer; font-family: var(--font-body); transition: all var(--transition-fast); }
        .sc-csv-btn:hover { border-color: #16a34a; color: #16a34a; background: rgba(22,163,74,0.06); }

        .sc-empty {
          background: var(--surface-card); border-radius: 18px;
          border: 1.5px solid var(--border-soft); padding: 72px 40px;
          text-align: center; display: flex; flex-direction: column;
          align-items: center; gap: 12px; box-shadow: var(--shadow-card);
        }
        .sc-empty-icon { width: 72px; height: 72px; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }

        @media (max-width: 768px) { .sc-main { margin-left: 0; } .sc-content { padding: 20px 16px 80px; } .sc-select-row { flex-direction: column; align-items: stretch; } }
      `}</style>

      <div className="sc-root">
        <Sidebar />
        <div className="sc-main">
          <AppHeader title="Screenings" subtitle="AI-powered candidate ranking by job" />
          <div className="sc-content">

            {/* Job selector */}
            <div className="sc-selector">
              <p className="sc-selector-title">
                <ListChecks size={17} color="#2563eb" /> Select a Job to Screen
              </p>
              <p className="sc-selector-sub">
                Choose a job posting, then <strong>Run AI Screening</strong> to rank candidates — or <strong>Load Results</strong> to view a previous screening.
              </p>
              <div className="sc-select-row">
                <div className="sc-select-wrap">
                  <span className="sc-select-icon"><Briefcase size={15} /></span>
                  <select className="sc-select" value={jobId} onChange={(e) => setJobId(e.target.value)} disabled={jobsLoading}>
                    <option value="">{jobsLoading ? "Loading jobs…" : "Choose a job…"}</option>
                    {jobs.map((j) => <option key={j._id} value={j._id}>{j.title} {j.applicantsCount ? `(${j.applicantsCount} candidates)` : ""}</option>)}
                  </select>
                </div>

                {/* Top N — pick BEFORE running */}
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"0 4px" }}>
                  <label style={{ fontSize:12.5, color:"var(--text-muted)", fontWeight:700, whiteSpace:"nowrap" }}>Show top</label>
                  <select
                    value={topN}
                    onChange={(e) => setTopN(e.target.value as any)}
                    style={{ fontSize:13, border:"1.5px solid var(--border-input)", borderRadius:8, background:"var(--surface-card)", color:"var(--text-primary)", padding:"6px 10px", outline:"none", cursor:"pointer" }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value="all">All</option>
                  </select>
                </div>

                {/* Run AI Screening — primary action */}
                <button
                  className="sc-run-btn"
                  onClick={handleRunScreening}
                  disabled={!jobId || loadingRes || !hasApplicants}
                  title={!hasApplicants && jobId ? "Upload candidates first before running AI screening" : ""}
                >
                  <Brain size={15} />
                  {loadingRes ? "Running…" : "Run AI Screening"}
                </button>

              </div>

              {/* Warning when job has no candidates */}
              {jobId && !hasApplicants && !jobsLoading && (
                <div className="sc-no-cand-warn">
                  <Users size={14} color="#d97706" />
                  <span>This job has no candidates yet.</span>
                  <Link href={`/applicants?jobId=${jobId}`} style={{ fontWeight: 700, color: "#2563eb", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                    <Upload size={13} /> Upload candidates first <ArrowRight size={12} />
                  </Link>
                </div>
              )}

              {selectedJob && results && (
                <div className="sc-job-info">
                  <Briefcase size={14} color="#16a34a" />
                  <strong>{selectedJob.title}</strong>
                  <span>·</span>
                  <span>{results.totalApplicants} screened · {results.shortlistedCount} shortlisted</span>
                </div>
              )}
            </div>

            {/* Loading */}
            {loadingRes && <LoadingSpinner label="Running AI screening…" />}

            {/* Error */}
            {err && !loadingRes && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "rgba(220,38,38,0.07)", border: "1.5px solid rgba(220,38,38,0.2)", borderRadius: 13, padding: "16px 18px", color: "#dc2626", fontSize: 14 }}>
                {typeof err === "string" ? err : "Could not load screening results for this job."}
              </div>
            )}

            {/* Empty state */}
            {!loadingRes && !results && !err && (
              <div className="sc-empty">
                <div className="sc-empty-icon" style={{ background: "rgba(124,58,237,0.08)" }}>
                  <Brain size={32} color="#7c3aed" />
                </div>
                <p style={{ fontWeight: 800, fontSize: 20, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  No screening results yet
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: 14, maxWidth: 400, lineHeight: 1.65, textAlign: "center" }}>
                  Select a job that has candidates uploaded, then click <strong>Run AI Screening</strong> to get a ranked shortlist with scores, strengths and gaps.
                </p>
                <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  <Link href="/jobs" className="btn-primary">
                    <Briefcase size={14} /> Go to Jobs <ArrowRight size={13} />
                  </Link>
                  <Link href="/applicants" className="btn-secondary">
                    <Upload size={14} /> Upload Candidates
                  </Link>
                </div>
                <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, maxWidth: 460, width: "100%" }}>
                  {[
                    { icon: <Briefcase size={16} color="#2563eb" />, step: "1", label: "Post a Job" },
                    { icon: <Users size={16} color="#7c3aed" />, step: "2", label: "Upload Candidates" },
                    { icon: <Sparkles size={16} color="#0891b2" />, step: "3", label: "Run AI Screening" },
                  ].map((s) => (
                    <div key={s.step} style={{ background: "var(--surface-hover)", borderRadius: 12, padding: "14px 12px", border: "1.5px solid var(--border-muted)", textAlign: "center" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--surface-card)", border: "1.5px solid var(--border-soft)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                        {s.icon}
                      </div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Step {s.step}</p>
                      <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>{s.label}</p>
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
                    <Sparkles size={17} color="#7c3aed" />
                    {selectedJob?.title || "Screening"} — AI Results
                  </p>
                  <div className="sc-results-controls">
                    {/* Top N selector */}
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Show top</label>
                      <select
                        value={topN}
                        onChange={(e) => setTopN(e.target.value as any)}
                        style={{ fontSize: 13, border: "1.5px solid var(--border-input)", borderRadius: 8, background: "var(--surface-card)", color: "var(--text-primary)", padding: "4px 8px", outline: "none" }}
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value="all">All</option>
                      </select>
                    </div>
                    <button className="sc-csv-btn" onClick={() => downloadScreeningCSV(results, selectedJob?.title || "results")}>
                      <Download size={14} /> Download Results
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