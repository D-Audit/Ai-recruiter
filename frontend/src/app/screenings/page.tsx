"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import ScreeningResults from "../../components/ScreeningResults";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getAllJobs } from "../../services/jobService";
import { triggerScreening, fetchResults } from "../../store/slices/screeningSlice";
import { AppDispatch, RootState } from "../../store";
import type { CandidateResult } from "../../types";
import { Briefcase, Sparkles, Download, RefreshCw, AlertCircle, Clock, Brain } from "lucide-react";
import toast from "react-hot-toast";

function downloadCSV(results: any, jobTitle: string) {
  const headers = ["Rank","Name","Email","Score","Recommendation","Confidence","Skills Matched","Skills Missing","Strengths","Gaps"];
  const rows = (results.rankedCandidates || []).map((r: CandidateResult, i: number) => {
    const c = typeof r.candidateId === "object" ? r.candidateId as any : {};
    const name = c ? `${c.firstName||""} ${c.lastName||""}`.trim() : `Candidate ${i+1}`;
    return [r.rank, name, c?.email||"", r.score, r.recommendation, r.confidence,
      (r.skillsMatched||[]).join("; "), (r.skillsMissing||[]).join("; "),
      (r.strengths||"").replace(/"/g,"'"), (r.gaps||"").replace(/"/g,"'")];
  });
  const csv = [headers,...rows]
    .map(row => row.map((v:any) => `"${String(v??"").replace(/"/g,'""')}"`).join(","))
    .join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type:"text/csv;charset=utf-8;" }));
  a.download = `screening-${jobTitle.replace(/\s+/g,"-").toLowerCase()}-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated loading card shown while AI screening is running.
// Shows elapsed time so the recruiter knows it's still working.
// ─────────────────────────────────────────────────────────────────────────────
function ScreeningLoadingCard({ candidateCount }: { candidateCount?: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const steps = [
    { label: "Fetching candidates from database",   done: elapsed >= 2  },
    { label: "Building AI prompt with job details", done: elapsed >= 5  },
    { label: "Sending to Gemini AI for scoring",    done: elapsed >= 10 },
    { label: "Processing AI response & ranking",    done: elapsed >= 40 },
    { label: "Saving results to database",          done: elapsed >= 55 },
  ];

  const estimatedSeconds = Math.max(30, (candidateCount || 10) * 2);
  const pct = Math.min(95, Math.round((elapsed / estimatedSeconds) * 100));

  return (
    <div style={{
      background: "var(--surface-card)",
      border: "1.5px solid rgba(124,58,237,0.25)",
      borderRadius: 18,
      padding: "32px 36px",
      boxShadow: "0 4px 24px rgba(124,58,237,0.1)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: "linear-gradient(135deg,rgba(124,58,237,0.15),rgba(37,99,235,0.1))",
          border: "1.5px solid rgba(124,58,237,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Brain size={24} color="#7c3aed" style={{ animation: "sc-pulse 1.5s ease-in-out infinite" }} />
        </div>
        <div>
          <p style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
            Gemini AI is screening candidates…
          </p>
          <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>
            This takes <strong>30–120 seconds</strong> depending on how many candidates you have.
            {candidateCount ? ` Processing ${candidateCount} candidate${candidateCount !== 1 ? "s" : ""}.` : ""}
          </p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <Clock size={14} color="var(--text-muted)" />
          <span style={{ fontSize: 13.5, color: "var(--text-muted)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {elapsed}s
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)" }}>Progress</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#7c3aed" }}>{pct}%</span>
        </div>
        <div style={{ height: 8, borderRadius: 99, background: "var(--border-muted)", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 99,
            background: "linear-gradient(90deg,#2563eb,#7c3aed)",
            width: `${pct}%`,
            transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
          }} />
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: step.done ? "#dcfce7" : "var(--surface-hover)",
              border: `1.5px solid ${step.done ? "#86efac" : "var(--border-soft)"}`,
              transition: "all 0.3s",
              fontSize: 11, fontWeight: 800,
              color: step.done ? "#15803d" : "var(--text-muted)",
            }}>
              {step.done ? "✓" : i + 1}
            </div>
            <span style={{
              fontSize: 13.5, fontWeight: step.done ? 600 : 500,
              color: step.done ? "var(--text-primary)" : "var(--text-muted)",
              transition: "color 0.3s",
            }}>
              {step.label}
            </span>
            {!step.done && elapsed > i * 8 && (
              <span style={{ fontSize: 11, color: "#7c3aed", marginLeft: "auto", animation: "sc-fadeblink 1.2s ease-in-out infinite" }}>
                processing…
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Note */}
      <div style={{ marginTop: 22, padding: "12px 16px", borderRadius: 10, background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.12)" }}>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          <strong>Don&apos;t close this page.</strong> If you accidentally navigate away,
          come back and click <strong>Load Results</strong> — the screening may have finished in the background.
        </p>
      </div>

      <style>{`
        @keyframes sc-pulse { 0%,100% { opacity:0.7; transform:scale(1); } 50% { opacity:1; transform:scale(1.08); } }
        @keyframes sc-fadeblink { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Error card — shows the real error with context-specific guidance
// ─────────────────────────────────────────────────────────────────────────────
function ScreeningErrorCard({
  error,
  onRetry,
  onLoadExisting,
  retrying,
}: {
  error: string;
  onRetry: () => void;
  onLoadExisting: () => void;
  retrying: boolean;
}) {
  const isQuota   = error.toLowerCase().includes("quota") || error.toLowerCase().includes("rate limit") || error.toLowerCase().includes("429");
  const isTimeout = error.toLowerCase().includes("timeout") || error.toLowerCase().includes("taking longer");
  const isNetwork = error.toLowerCase().includes("network") || error.toLowerCase().includes("reach the server");
  const isNoApplicants = error.toLowerCase().includes("no applicants");

  const icon = isQuota ? "⏳" : isTimeout ? "⏱️" : isNetwork ? "📡" : isNoApplicants ? "👤" : "⚠️";

  return (
    <div style={{
      background: "var(--surface-card)",
      border: "1.5px solid rgba(220,38,38,0.2)",
      borderRadius: 18,
      padding: "28px 32px",
      boxShadow: "0 2px 12px rgba(220,38,38,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 13,
          background: "rgba(220,38,38,0.07)",
          border: "1.5px solid rgba(220,38,38,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: "#b91c1c", marginBottom: 6 }}>
            {isQuota      ? "AI Quota Limit Reached"
             : isTimeout  ? "AI Screening is Taking Long"
             : isNetwork  ? "Cannot Reach Server"
             : isNoApplicants ? "No Candidates to Screen"
             : "Screening Failed"}
          </p>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{error}</p>
        </div>
      </div>

      {/* Guidance based on error type */}
      {isQuota && (
        <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <p style={{ fontSize: 13.5, color: "#92400e", lineHeight: 1.7, fontWeight: 500 }}>
            <strong>What to do:</strong> Your Gemini free-tier quota resets every minute (15 requests/min) or daily (1500/day).
            Wait 1–2 minutes then try again. If it keeps happening, check your quota at{" "}
            <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color: "#d97706", fontWeight: 700 }}>
              aistudio.google.com
            </a>.
          </p>
        </div>
      )}
      {isTimeout && (
        <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 10, background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)" }}>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.7, fontWeight: 500 }}>
            <strong>The backend may still be processing.</strong> Click <strong>Load Results</strong> below to check if the screening finished in the background.
            If nothing appears, wait 30 seconds and try <strong>Run Again</strong>.
          </p>
        </div>
      )}
      {isNoApplicants && (
        <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 10, background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)" }}>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.7, fontWeight: 500 }}>
            Go to the <strong>Upload Candidates</strong> page, select this job, and add at least one candidate before running screening.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {isTimeout && (
          <button
            onClick={onLoadExisting}
            style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 7 }}
          >
            <Sparkles size={15} /> Load Results
          </button>
        )}
        {!isNoApplicants && (
          <button
            onClick={onRetry}
            disabled={retrying}
            style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid rgba(37,99,235,0.3)", background: "rgba(37,99,235,0.06)", color: "#2563eb", fontWeight: 700, fontSize: 14, cursor: retrying ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 7, opacity: retrying ? 0.6 : 1 }}
          >
            <RefreshCw size={14} style={{ animation: retrying ? "sc-spin 0.8s linear infinite" : "none" }} />
            {retrying ? "Retrying…" : "Try Again"}
          </button>
        )}
      </div>

      <style>{`@keyframes sc-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Inner component ───────────────────────────────────────── */
function ScreeningsInner() {
  const dispatch     = useDispatch<AppDispatch>();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { results, loading: loadingRes, error: err } = useSelector((s: RootState) => s.screening);

  const [jobs,           setJobs]           = useState<any[]>([]);
  const [loadingJobs,    setLoadingJobs]     = useState(true);
  const [selectedJobId,  setSelectedJobId]   = useState(searchParams.get("jobId") || "");
  const [resultsLoaded,  setResultsLoaded]   = useState(false);
  const [topN,           setTopN]            = useState<10|20|"all">("all");
  const [isRunning,      setIsRunning]       = useState(false);   // true ONLY while AI screening runs
  const [retrying,       setRetrying]        = useState(false);

  /* Load jobs list once */
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.push("/"); return; }
    getAllJobs()
      .then(d => setJobs(d.jobs || []))
      .catch(() => {})
      .finally(() => setLoadingJobs(false));
  }, [router]);

  /* Auto-load results if redirected from upload page with autoload=1 */
  useEffect(() => {
    const autoload = searchParams.get("autoload");
    const qJobId   = searchParams.get("jobId");
    if (autoload === "1" && qJobId) {
      setSelectedJobId(qJobId);
      dispatch(fetchResults(qJobId))
        .then(() => setResultsLoaded(true))
        .catch(() => {});
      router.replace(`/screenings?jobId=${encodeURIComponent(qJobId)}`, { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJobChange = (jobId: string) => {
    setSelectedJobId(jobId);
    setResultsLoaded(false);
    setIsRunning(false);
    if (jobId) router.replace(`/screenings?jobId=${encodeURIComponent(jobId)}`, { scroll: false });
    else       router.replace("/screenings", { scroll: false });
  };

  /* Load Results button — fast DB read only */
  const handleLoadResults = useCallback(async () => {
    if (!selectedJobId) return;
    try {
      await dispatch(fetchResults(selectedJobId));
      setResultsLoaded(true);
      router.replace(`/screenings?jobId=${encodeURIComponent(selectedJobId)}`, { scroll: false });
    } catch {
      toast.error("Could not load results for this job.");
    }
  }, [selectedJobId, dispatch, router]);

  /* Run AI Screening — shows loading card with progress, real errors */
  const handleRerun = useCallback(async () => {
    if (!selectedJobId) return;
    setIsRunning(true);
    try {
      await dispatch(triggerScreening({ jobId: selectedJobId, forceRerun: true, topN })).unwrap();
      setResultsLoaded(true);
      setIsRunning(false);
      toast.success("AI screening complete!");
    } catch (e: unknown) {
      setIsRunning(false);
      // Error is already in Redux state — ScreeningErrorCard reads it from there
      const msg = typeof e === "string" ? e : (e as Error)?.message || "Screening failed";
      console.error("Screening error:", msg);
    }
  }, [selectedJobId, dispatch, topN]);

  /* Retry after error */
  const handleRetry = useCallback(async () => {
    setRetrying(true);
    await handleRerun();
    setRetrying(false);
  }, [handleRerun]);

  const selectedJob = jobs.find(j => j._id === selectedJobId);
  const candidateCount = selectedJob?.applicantsCount || 0;

  // Show AI loading card when screening is actively running
  const showAILoading = isRunning || (loadingRes && resultsLoaded === false);

  /* ─── JSX ──────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        .sc-root { display: flex; font-family: var(--font-body, system-ui); }
        .sc-main { margin-left: var(--sidebar-width); min-height: 100vh; background: var(--surface-base); flex: 1; display: flex; flex-direction: column; }
        .sc-body  { padding: 28px 40px 100px; flex: 1; animation: fadeIn 0.28s ease; }
        .sc-selector { background: var(--surface-card); border: 1.5px solid var(--border-soft); border-radius: 18px; padding: 24px 28px; margin-bottom: 20px; box-shadow: var(--shadow-card); }
        .sc-selector-title { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
        .sc-selector-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 18px; line-height: 1.5; }
        .sc-select-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .sc-select-wrap { position: relative; flex: 1; min-width: 220px; max-width: 440px; }
        .sc-select-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
        .sc-select { width: 100%; padding: 11px 36px 11px 38px; border-radius: 11px; border: 1.5px solid var(--border-input); background: var(--surface-input); font-family: var(--font-body); font-size: 14px; color: var(--text-primary); cursor: pointer; outline: none; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; transition: all var(--transition-fast); }
        .sc-select:focus { border-color: var(--brand-primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .sc-load-btn { padding: 11px 22px; border-radius: 11px; border: none; background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; font-weight: 700; font-size: 14px; font-family: var(--font-body); cursor: pointer; box-shadow: var(--shadow-button); display: flex; align-items: center; gap: 7px; white-space: nowrap; transition: all var(--transition-fast); }
        .sc-load-btn:hover    { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.4); }
        .sc-load-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }
        .sc-job-info { margin-top: 14px; padding: 11px 14px; border-radius: 10px; background: rgba(37,99,235,0.06); border: 1px solid rgba(37,99,235,0.12); display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 13px; color: var(--text-secondary); }
        .sc-results-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
        .sc-results-title { font-size: 16px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
        .sc-results-sub { font-size: 13px; color: var(--text-muted); margin-top: 3px; font-weight: 500; }
        .sc-results-ctrls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .sc-topn-select { font-size: 13px; font-weight: 600; border: 1.5px solid var(--border-input); border-radius: 9px; background: var(--surface-card); color: var(--text-primary); padding: 7px 10px; outline: none; font-family: var(--font-body); cursor: pointer; transition: border-color var(--transition-fast); }
        .sc-topn-select:focus { border-color: var(--brand-primary); }
        .sc-rerun-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 9px; border: 1.5px solid rgba(124,58,237,0.25); background: rgba(124,58,237,0.06); color: #7c3aed; font-weight: 700; font-size: 13px; font-family: var(--font-body); cursor: pointer; transition: all var(--transition-fast); }
        .sc-rerun-btn:hover    { background: rgba(124,58,237,0.12); border-color: #7c3aed; }
        .sc-rerun-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .sc-csv-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 9px; border: 1.5px solid var(--border-soft); background: var(--surface-card); color: var(--text-secondary); font-weight: 700; font-size: 13px; font-family: var(--font-body); cursor: pointer; transition: all var(--transition-fast); }
        .sc-csv-btn:hover { border-color: #16a34a; color: #16a34a; background: rgba(22,163,74,0.06); }
        @media (max-width: 768px) { .sc-main { margin-left: 0; } .sc-body { padding: 20px 16px 80px; } .sc-select-row { flex-direction: column; align-items: stretch; } }
      `}</style>

      <div className="sc-root">
        <Sidebar />
        <div className="sc-main">
          <AppHeader title="Screenings" subtitle="AI-powered candidate ranking by job" />
          <div className="sc-body">

            {/* ── SELECTOR CARD ── */}
            <div className="sc-selector">
              <p className="sc-selector-title">
                <Briefcase size={17} color="#2563eb" /> Select a Job
              </p>
              <p className="sc-selector-sub">
                Choose a job, then click <strong>Load Results</strong> to view AI screening results.
                To run a fresh screening, click <strong>Re-run</strong> after loading results.
              </p>

              <div className="sc-select-row">
                <div className="sc-select-wrap">
                  <span className="sc-select-icon"><Briefcase size={15} /></span>
                  <select
                    className="sc-select"
                    value={selectedJobId}
                    onChange={e => handleJobChange(e.target.value)}
                    disabled={loadingJobs || isRunning}
                  >
                    <option value="">{loadingJobs ? "Loading jobs…" : "Choose a job…"}</option>
                    {jobs.map(j => (
                      <option key={j._id} value={j._id}>
                        {j.title}{j.applicantsCount ? ` (${j.applicantsCount} candidates)` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="sc-load-btn"
                  onClick={handleLoadResults}
                  disabled={!selectedJobId || loadingRes || isRunning}
                >
                  <Sparkles size={15} />
                  {loadingRes && !isRunning ? "Loading…" : "Load Results"}
                </button>
              </div>

              {selectedJob && resultsLoaded && results && (
                <div className="sc-job-info">
                  <Briefcase size={14} color="#2563eb" />
                  <strong>{selectedJob.title}</strong>
                  <span>·</span>
                  <span>
                    <strong style={{ color: "var(--text-primary)" }}>{results.totalApplicants}</strong> screened
                  </span>
                  <span>·</span>
                  <span style={{ color: "#16a34a", fontWeight: 700 }}>
                    {results.shortlistedCount} shortlisted
                  </span>
                </div>
              )}
            </div>

            {/* ── AI SCREENING IN PROGRESS — animated card ── */}
            {showAILoading && (
              <ScreeningLoadingCard candidateCount={candidateCount} />
            )}

            {/* ── ERROR — clear message with guidance ── */}
            {err && !loadingRes && !isRunning && (
              <ScreeningErrorCard
                error={typeof err === "string" ? err : "Screening failed. Please try again."}
                onRetry={handleRetry}
                onLoadExisting={handleLoadResults}
                retrying={retrying}
              />
            )}

            {/* ── NORMAL LOADING (just fetching saved results) ── */}
            {loadingRes && !isRunning && (
              <LoadingSpinner label="Loading screening results…" />
            )}

            {/* ── EMPTY: no job selected ── */}
            {!loadingRes && !isRunning && !resultsLoaded && !err && !selectedJobId && (
              <div className="empty-state" style={{ background:"var(--surface-card)", border:"1.5px solid var(--border-soft)", borderRadius:18 }}>
                <div className="empty-icon" style={{ background:"rgba(124,58,237,0.07)" }}>
                  <Sparkles size={28} color="#7c3aed" />
                </div>
                <p style={{ fontWeight:700, fontSize:17, color:"var(--text-primary)" }}>Select a job above</p>
                <p style={{ color:"var(--text-muted)", fontSize:14, maxWidth:320, textAlign:"center", lineHeight:1.6 }}>
                  Choose a job from the dropdown, then click <strong>Load Results</strong>.
                </p>
              </div>
            )}

            {/* ── EMPTY: job selected but not yet loaded ── */}
            {!loadingRes && !isRunning && !resultsLoaded && !err && selectedJobId && (
              <div className="empty-state" style={{ background:"var(--surface-card)", border:"1.5px solid var(--border-soft)", borderRadius:18 }}>
                <div className="empty-icon" style={{ background:"rgba(124,58,237,0.07)" }}>
                  <Sparkles size={28} color="#7c3aed" />
                </div>
                <p style={{ fontWeight:700, fontSize:17, color:"var(--text-primary)" }}>
                  {selectedJob?.title || "Job"} selected
                </p>
                <p style={{ color:"var(--text-muted)", fontSize:14, maxWidth:320, textAlign:"center", lineHeight:1.6 }}>
                  Click <strong>Load Results</strong> to view AI screening for this position.
                </p>
              </div>
            )}

            {/* ── RESULTS ── */}
            {!loadingRes && !isRunning && resultsLoaded && results && (
              <>
                <div className="sc-results-head">
                  <div>
                    <p className="sc-results-title">
                      <Sparkles size={17} color="#7c3aed" />
                      {selectedJob?.title || "Screening"} — AI Results
                    </p>
                    <p className="sc-results-sub">
                      {results.totalApplicants} screened · {results.shortlistedCount} shortlisted · ranked by AI match score
                    </p>
                  </div>

                  <div className="sc-results-ctrls">
                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                      <label style={{ fontSize:12.5, color:"var(--text-muted)", fontWeight:600 }}>Show</label>
                      <select
                        value={topN}
                        onChange={e => setTopN(e.target.value as 10|20|"all")}
                        className="sc-topn-select"
                      >
                        <option value={10}>Top 10</option>
                        <option value={20}>Top 20</option>
                        <option value="all">All</option>
                      </select>
                    </div>

                    <button
                      className="sc-rerun-btn"
                      onClick={handleRerun}
                      disabled={isRunning || loadingRes}
                      title="Run a fresh AI screening for this job"
                    >
                      <RefreshCw size={13} /> Re-run
                    </button>

                    <button
                      className="sc-csv-btn"
                      onClick={() => downloadCSV(results, selectedJob?.title || "results")}
                    >
                      <Download size={13} /> Export CSV
                    </button>
                  </div>
                </div>

                <ScreeningResults
                  jobId={selectedJobId}
                  results={results}
                  fromCache={false}
                  displayTopN={topN}
                />
              </>
            )}

            {/* ── EMPTY: loaded but no results ── */}
            {!loadingRes && !isRunning && resultsLoaded && !results && !err && (
              <div className="empty-state" style={{ background:"var(--surface-card)", border:"1.5px solid var(--border-soft)", borderRadius:18 }}>
                <div className="empty-icon">
                  <Sparkles size={28} color="var(--text-muted)" />
                </div>
                <p style={{ fontWeight:700, fontSize:17, color:"var(--text-primary)" }}>No results yet</p>
                <p style={{ color:"var(--text-muted)", fontSize:14, maxWidth:320, textAlign:"center", lineHeight:1.6 }}>
                  No screening has been run for this job yet. Upload candidates first, then click <strong>Re-run</strong>.
                </p>
              </div>
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