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
import { Briefcase, Sparkles, Download, RefreshCw } from "lucide-react";
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

/* ─── Inner component ───────────────────────────────────────── */
function ScreeningsInner() {
  const dispatch     = useDispatch<AppDispatch>();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { results, loading: loadingRes, error: err } = useSelector((s: RootState) => s.screening);

  const [jobs, setJobs]             = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState(searchParams.get("jobId") || "");
  const [resultsLoaded, setResultsLoaded] = useState(false);
  const [topN, setTopN]             = useState<10|20|"all">("all");

  /* Load jobs list once */
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.push("/"); return; }
    getAllJobs()
      .then(d => setJobs(d.jobs || []))
      .catch(() => {})
      .finally(() => setLoadingJobs(false));
  }, [router]);

  /* When job changes in dropdown — reset, don't auto-load */
  const handleJobChange = (jobId: string) => {
    setSelectedJobId(jobId);
    setResultsLoaded(false);
    if (jobId) router.replace(`/screenings?jobId=${encodeURIComponent(jobId)}`, { scroll: false });
    else       router.replace("/screenings", { scroll: false });
  };

  /* Load Results — only when button clicked (mirrors Load Applicants) */
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

  /* Re-run — triggers fresh AI screening */
  const handleRerun = useCallback(async () => {
    if (!selectedJobId) return;
    try {
      await dispatch(triggerScreening(selectedJobId)).unwrap();
      setResultsLoaded(true);
      toast.success("AI screening complete!");
    } catch (e: unknown) {
      toast.error(typeof e === "string" ? e : "Screening failed. Make sure candidates are uploaded.");
    }
  }, [selectedJobId, dispatch]);

  const selectedJob = jobs.find(j => j._id === selectedJobId);

  /* ─── JSX ──────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        /* ── Root layout — identical to candidates ── */
        .sc-root { display: flex; font-family: var(--font-body, system-ui); }
        .sc-main { margin-left: var(--sidebar-width); min-height: 100vh; background: var(--surface-base); flex: 1; display: flex; flex-direction: column; }
        .sc-body  { padding: 28px 40px 100px; flex: 1; animation: fadeIn 0.28s ease; }

        /* ── Selector card — exact same as .cnd-selector ── */
        .sc-selector {
          background: var(--surface-card);
          border: 1.5px solid var(--border-soft);
          border-radius: 18px;
          padding: 24px 28px;
          margin-bottom: 20px;
          box-shadow: var(--shadow-card);
        }
        .sc-selector-title {
          font-size: 15px; font-weight: 700; color: var(--text-primary);
          margin-bottom: 4px; display: flex; align-items: center; gap: 8px;
        }
        .sc-selector-sub {
          font-size: 13px; color: var(--text-muted);
          margin-bottom: 18px; line-height: 1.5;
        }
        .sc-select-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .sc-select-wrap { position: relative; flex: 1; min-width: 220px; max-width: 440px; }
        .sc-select-icon {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          color: var(--text-muted); pointer-events: none;
        }
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

        /* ── Load Results button — exact same as .cnd-load-btn ── */
        .sc-load-btn {
          padding: 11px 22px; border-radius: 11px; border: none;
          background: linear-gradient(135deg, #2563eb, #7c3aed); color: white;
          font-weight: 700; font-size: 14px; font-family: var(--font-body);
          cursor: pointer; box-shadow: var(--shadow-button);
          display: flex; align-items: center; gap: 7px; white-space: nowrap;
          transition: all var(--transition-fast);
        }
        .sc-load-btn:hover    { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.4); }
        .sc-load-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }

        /* ── Job info strip — same as .cnd-job-info ── */
        .sc-job-info {
          margin-top: 14px; padding: 11px 14px; border-radius: 10px;
          background: rgba(37,99,235,0.06); border: 1px solid rgba(37,99,235,0.12);
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          font-size: 13px; color: var(--text-secondary);
        }

        /* ── Results controls row ── */
        .sc-results-head {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; margin-bottom: 18px; flex-wrap: wrap;
        }
        .sc-results-title {
          font-size: 16px; font-weight: 700; color: var(--text-primary);
          display: flex; align-items: center; gap: 8px;
        }
        .sc-results-sub {
          font-size: 13px; color: var(--text-muted); margin-top: 3px; font-weight: 500;
        }
        .sc-results-ctrls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

        .sc-topn-select {
          font-size: 13px; font-weight: 600; border: 1.5px solid var(--border-input);
          border-radius: 9px; background: var(--surface-card); color: var(--text-primary);
          padding: 7px 10px; outline: none; font-family: var(--font-body); cursor: pointer;
          transition: border-color var(--transition-fast);
        }
        .sc-topn-select:focus { border-color: var(--brand-primary); }

        .sc-rerun-btn {
          display: flex; align-items: center; gap: 6px; padding: 8px 14px;
          border-radius: 9px; border: 1.5px solid rgba(124,58,237,0.25);
          background: rgba(124,58,237,0.06); color: #7c3aed;
          font-weight: 700; font-size: 13px; font-family: var(--font-body);
          cursor: pointer; transition: all var(--transition-fast);
        }
        .sc-rerun-btn:hover    { background: rgba(124,58,237,0.12); border-color: #7c3aed; }
        .sc-rerun-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .sc-csv-btn {
          display: flex; align-items: center; gap: 6px; padding: 8px 14px;
          border-radius: 9px; border: 1.5px solid var(--border-soft);
          background: var(--surface-card); color: var(--text-secondary);
          font-weight: 700; font-size: 13px; font-family: var(--font-body);
          cursor: pointer; transition: all var(--transition-fast);
        }
        .sc-csv-btn:hover { border-color: #16a34a; color: #16a34a; background: rgba(22,163,74,0.06); }

        @media (max-width: 768px) {
          .sc-main { margin-left: 0; }
          .sc-body  { padding: 20px 16px 80px; }
          .sc-select-row { flex-direction: column; align-items: stretch; }
        }
      `}</style>

      <div className="sc-root">
        <Sidebar />
        <div className="sc-main">
          <AppHeader
            title="Screenings"
            subtitle="AI-powered candidate ranking by job"
          />
          <div className="sc-body">

            {/* ── SELECTOR CARD — mirrors candidates exactly ── */}
            <div className="sc-selector">
              <p className="sc-selector-title">
                <Briefcase size={17} color="#2563eb" /> Select a Job
              </p>
              <p className="sc-selector-sub">
                Choose a job, then click <strong>Load Results</strong> to view the AI screening for that position.
              </p>

              <div className="sc-select-row">
                <div className="sc-select-wrap">
                  <span className="sc-select-icon"><Briefcase size={15} /></span>
                  <select
                    className="sc-select"
                    value={selectedJobId}
                    onChange={e => handleJobChange(e.target.value)}
                    disabled={loadingJobs}
                  >
                    <option value="">{loadingJobs ? "Loading jobs…" : "Choose a job…"}</option>
                    {jobs.map(j => (
                      <option key={j._id} value={j._id}>
                        {j.title}{j.applicantsCount ? ` (${j.applicantsCount} candidates)` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Load Results — the ONE button, mirrors "Load Applicants" */}
                <button
                  className="sc-load-btn"
                  onClick={handleLoadResults}
                  disabled={!selectedJobId || loadingRes}
                >
                  <Sparkles size={15} />
                  {loadingRes ? "Loading…" : "Load Results"}
                </button>
              </div>

              {/* Info strip — shown after results are loaded */}
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

            {/* ── LOADING ── */}
            {loadingRes && <LoadingSpinner label="Loading screening results…" />}

            {/* ── ERROR ── */}
            {err && !loadingRes && (
              <div style={{ display:"flex", gap:12, background:"rgba(220,38,38,0.07)", border:"1.5px solid rgba(220,38,38,0.2)", borderRadius:14, padding:"16px 20px", color:"#b91c1c", fontSize:14, fontWeight:600 }}>
                {typeof err === "string" ? err : "No screening results found. Run AI Screening from the job page first."}
              </div>
            )}

            {/* ── EMPTY: no job selected ── */}
            {!loadingRes && !resultsLoaded && !err && !selectedJobId && (
              <div className="empty-state" style={{ background:"var(--surface-card)", border:"1.5px solid var(--border-soft)", borderRadius:18 }}>
                <div className="empty-icon" style={{ background:"rgba(124,58,237,0.07)" }}>
                  <Sparkles size={28} color="#7c3aed" />
                </div>
                <p style={{ fontWeight:700, fontSize:17, color:"var(--text-primary)" }}>Select a job above</p>
                <p style={{ color:"var(--text-muted)", fontSize:14, maxWidth:320, textAlign:"center", lineHeight:1.6 }}>
                  Choose a job from the dropdown, then click <strong>Load Results</strong> to view the AI screening for that position.
                </p>
              </div>
            )}

            {/* ── EMPTY: job selected but not yet loaded ── */}
            {!loadingRes && !resultsLoaded && !err && selectedJobId && (
              <div className="empty-state" style={{ background:"var(--surface-card)", border:"1.5px solid var(--border-soft)", borderRadius:18 }}>
                <div className="empty-icon" style={{ background:"rgba(124,58,237,0.07)" }}>
                  <Sparkles size={28} color="#7c3aed" />
                </div>
                <p style={{ fontWeight:700, fontSize:17, color:"var(--text-primary)" }}>
                  {selectedJob?.title || "Job"} selected
                </p>
                <p style={{ color:"var(--text-muted)", fontSize:14, maxWidth:320, textAlign:"center", lineHeight:1.6 }}>
                  Click <strong>Load Results</strong> to view the AI screening for this position.
                </p>
              </div>
            )}

            {/* ── RESULTS ── */}
            {!loadingRes && resultsLoaded && results && (
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
                    {/* Top N */}
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

                    {/* Re-run */}
                    <button
                      className="sc-rerun-btn"
                      onClick={handleRerun}
                      disabled={loadingRes}
                      title="Run a fresh AI screening for this job"
                    >
                      <RefreshCw size={13} /> Re-run
                    </button>

                    {/* Export CSV */}
                    <button
                      className="sc-csv-btn"
                      onClick={() => downloadCSV(results, selectedJob?.title || "results")}
                    >
                      <Download size={13} /> Export CSV
                    </button>
                  </div>
                </div>

                {/* ScreeningResults receives jobId so compare nav works */}
                <ScreeningResults
                  jobId={selectedJobId}
                  results={results}
                  fromCache={false}
                  displayTopN={topN}
                />
              </>
            )}

            {/* ── EMPTY: loaded but no results ── */}
            {!loadingRes && resultsLoaded && !results && !err && (
              <div className="empty-state" style={{ background:"var(--surface-card)", border:"1.5px solid var(--border-soft)", borderRadius:18 }}>
                <div className="empty-icon">
                  <Sparkles size={28} color="var(--text-muted)" />
                </div>
                <p style={{ fontWeight:700, fontSize:17, color:"var(--text-primary)" }}>No results yet</p>
                <p style={{ color:"var(--text-muted)", fontSize:14, maxWidth:320, textAlign:"center", lineHeight:1.6 }}>
                  No screening has been run for this job yet. Go to the job page and click <strong>Run AI Screening</strong>.
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