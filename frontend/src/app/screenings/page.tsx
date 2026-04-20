"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import ScreeningResults from "../../components/ScreeningResults";
import { getAllJobs } from "../../services/jobService";
import { triggerScreening, fetchResults, clearResults } from "../../store/slices/screeningSlice";
import { AppDispatch, RootState } from "../../store";
import LoadingSpinner from "../../components/LoadingSpinner";
import type { CandidateResult } from "../../types";
import {
  ListChecks, Briefcase, Download, Sparkles, Users,
  Brain, ArrowRight, RefreshCw, MapPin, Clock,
  ChevronRight, Search, Upload, CheckCircle2, AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

/* ── CSV export — unchanged ─────────────────────────────────────────────── */
function downloadScreeningCSV(results: any, jobTitle: string) {
  const headers = ["Rank","Name","Email","Score","Recommendation","Confidence","Skills Matched","Skills Missing","Strengths","Gaps"];
  const rows = (results.rankedCandidates || []).map((r: CandidateResult, i: number) => {
    const c = typeof r.candidateId === "object" ? r.candidateId as any : {};
    const name = c ? `${c.firstName||""} ${c.lastName||""}`.trim() : `Candidate ${i+1}`;
    return [r.rank,name,c?.email||"",r.score,r.recommendation,r.confidence,
      (r.skillsMatched||[]).join("; "),(r.skillsMissing||[]).join("; "),
      (r.strengths||"").replace(/"/g,"'"),(r.gaps||"").replace(/"/g,"'")];
  });
  const csv = [headers,...rows].map(row=>row.map((v:any)=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv],{type:"text/csv;charset=utf-8;"});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href=url; a.download=`screening-${jobTitle.replace(/\s+/g,"-").toLowerCase()}-${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

const STATUS_CFG: Record<string,{bg:string;color:string;dot:string;label:string}> = {
  open:      {bg:"#dcfce7",color:"#15803d",dot:"#22c55e",label:"Open"},
  screening: {bg:"#dbeafe",color:"#1d4ed8",dot:"#3b82f6",label:"Screening"},
  closed:    {bg:"#f1f5f9",color:"#475569",dot:"#94a3b8",label:"Closed"},
};

function ScreeningsInner() {
  const dispatch     = useDispatch<AppDispatch>();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { results, loading: loadingRes, error: err, fromCache } = useSelector((s: RootState) => s.screening);

  const [jobs,         setJobs]         = useState<any[]>([]);
  const [jobsLoading,  setJobsLoading]  = useState(true);
  const [selectedJobId,setSelectedJobId]= useState(searchParams.get("jobId") || "");
  const [resultsLoaded,setResultsLoaded]= useState(false);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState("");

  /* initial load */
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.push("/"); return; }
    getAllJobs()
      .then(d => setJobs(d.jobs || []))
      .catch(() => {})
      .finally(() => setJobsLoading(false));
  }, [router]);

  /* if url has jobId on mount, pre-select but do NOT auto-load */
  useEffect(() => {
    const qJobId = searchParams.get("jobId");
    if (qJobId) setSelectedJobId(qJobId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* when job changes, reset results */
  const handleJobChange = (jobId: string) => {
    setSelectedJobId(jobId);
    setResultsLoaded(false);
    dispatch(clearResults());
    router.replace(jobId ? `/screenings?jobId=${encodeURIComponent(jobId)}` : "/screenings", { scroll: false });
  };

  /* MAIN ACTION: Load Results (same as candidates page pattern) */
  const handleLoadResults = async () => {
    if (!selectedJobId) return;
    setLoading(true);
    setResultsLoaded(false);
    dispatch(clearResults());
    try {
      await dispatch(fetchResults(selectedJobId)).unwrap();
      setResultsLoaded(true);
    } catch {
      toast.error("No screening results found. Run AI screening from the job page first.");
      setResultsLoaded(false);
    } finally {
      setLoading(false);
    }
  };

 
  const handleRerun = async () => {
    if (!selectedJobId) return;
    toast("Re-running AI screening…", { icon:"🔄", duration:3000, style:{background:"#eff6ff",color:"#1e40af",fontWeight:600} });
    try {
      await dispatch(triggerScreening(selectedJobId)).unwrap();
      toast.success("Re-screening complete — results updated!");
    } catch (e: unknown) {
      toast.error(typeof e === "string" ? e : "Re-screening failed.");
    }
  };

  const selectedJob = jobs.find(j => j._id === selectedJobId);
  const hasCands    = (selectedJob?.applicantsCount ?? 0) > 0;
  const filtered    = jobs.filter(j =>
    !search ||
    j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.location?.toLowerCase().includes(search.toLowerCase())
  );

  const statsFromResults = results ? {
    total:       results.totalApplicants ?? 0,
    shortlisted: results.shortlistedCount ?? 0,
    topScore:    results.rankedCandidates?.[0]?.score ?? 0,
    avgScore:    results.rankedCandidates?.length
      ? Math.round(results.rankedCandidates.reduce((s:number,c:CandidateResult)=>s+c.score,0)/results.rankedCandidates.length)
      : 0,
  } : null;

  return (
    <>
      <style>{`
        /* ── Scoped styles: sc- prefix ── */
        .sc-root { display:flex; font-family:var(--font-body,system-ui); }
        .sc-main { margin-left:var(--sidebar-width,260px); min-height:100vh; background:var(--surface-base,#f8fafc); flex:1; display:flex; flex-direction:column; }
        .sc-body  { padding:0 32px 80px; flex:1; animation:fadeIn .24s ease; }

        /* ── Hero ── */
        .sc-hero { padding:24px 0 20px; border-bottom:1px solid var(--border-muted,#f1f5f9); margin-bottom:24px; display:flex; align-items:flex-end; justify-content:space-between; gap:12px; flex-wrap:wrap; }
        .sc-hero-title { font-size:22px; font-weight:800; color:var(--text-primary,#0f172a); letter-spacing:-.025em; margin-bottom:3px; }
        .sc-hero-sub   { font-size:13.5px; color:var(--text-muted,#94a3b8); }

        /* ── Selector card — identical pattern to Candidates page ── */
        .sc-selector {
          background:var(--surface-card,#fff);
          border:1px solid var(--border-soft,#e2e8f0);
          border-radius:20px; padding:22px 24px; margin-bottom:20px;
          box-shadow:0 1px 3px rgba(0,0,0,.06);
          animation:fadeIn .24s ease;
        }
        .sc-selector-head   { display:flex; align-items:center; gap:10px; margin-bottom:5px; }
        .sc-selector-icon   { width:36px; height:36px; border-radius:10px; background:rgba(37,99,235,.09); display:flex; align-items:center; justify-content:center; }
        .sc-selector-title  { font-size:15px; font-weight:800; color:var(--text-primary,#0f172a); }
        .sc-selector-sub    { font-size:13px; color:var(--text-muted,#94a3b8); margin-bottom:16px; line-height:1.5; }
        .sc-selector-row    { display:flex; gap:10px; align-items:stretch; flex-wrap:wrap; }

        .sc-select-wrap { position:relative; flex:1; min-width:220px; max-width:500px; }
        .sc-select-ico  { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:var(--text-muted,#94a3b8); pointer-events:none; }
        .sc-select {
          width:100%; padding:11px 36px 11px 40px; border-radius:12px;
          border:1.5px solid var(--border-input,#e2e8f0); background:var(--surface-input,#f8fafc);
          font-family:inherit; font-size:14px; font-weight:600; color:var(--text-primary,#0f172a);
          cursor:pointer; outline:none; appearance:none;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:right 13px center;
          transition:border-color .15s,box-shadow .15s;
        }
        .sc-select:focus { border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.1); }

        .sc-load-btn {
          padding:11px 22px; border-radius:12px; border:none;
          background:linear-gradient(135deg,#2563eb,#7c3aed); color:#fff;
          font-weight:700; font-size:14px; font-family:inherit; cursor:pointer;
          display:flex; align-items:center; gap:7px; white-space:nowrap;
          box-shadow:0 4px 14px rgba(37,99,235,.25); transition:all .18s ease;
          flex-shrink:0;
        }
        .sc-load-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 24px rgba(37,99,235,.38); }
        .sc-load-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; box-shadow:none; }

        /* Selected job info strip */
        .sc-job-strip {
          margin-top:13px; padding:11px 15px; border-radius:11px;
          background:rgba(37,99,235,.05); border:1px solid rgba(37,99,235,.12);
          display:flex; align-items:center; gap:12px; flex-wrap:wrap;
        }
        .sc-job-strip-item { display:flex; align-items:center; gap:5px; font-size:12.5px; color:var(--text-secondary,#334155); font-weight:500; }
        .sc-job-strip-badge { padding:2px 9px; border-radius:99px; font-size:11px; font-weight:700; }

        /* No candidates warning */
        .sc-no-cands-warn {
          margin-top:13px; padding:12px 16px; border-radius:11px;
          background:rgba(245,158,11,.07); border:1px solid rgba(245,158,11,.2);
          display:flex; align-items:center; gap:10px; flex-wrap:wrap; font-size:13px;
          color:#92400e;
        }

        /* ── Stats mini row ── */
        .sc-stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:16px; animation:fadeIn .3s ease; }
        .sc-stat-mini {
          background:var(--surface-card,#fff); border:1px solid var(--border-soft,#e2e8f0);
          border-radius:14px; padding:14px 16px; text-align:center;
          box-shadow:0 1px 3px rgba(0,0,0,.05);
        }
        .sc-stat-mini-val { font-size:22px; font-weight:800; color:var(--text-primary,#0f172a); letter-spacing:-.04em; line-height:1; }
        .sc-stat-mini-lbl { font-size:11px; color:var(--text-muted,#94a3b8); font-weight:600; margin-top:3px; text-transform:uppercase; letter-spacing:.04em; }

        /* ── Results panel ── */
        .sc-results-panel {
          background:var(--surface-card,#fff); border:1px solid var(--border-soft,#e2e8f0);
          border-radius:20px; box-shadow:0 1px 3px rgba(0,0,0,.06); overflow:hidden;
          animation:fadeIn .3s ease;
        }
        .sc-results-context {
          padding:11px 20px; background:rgba(22,163,74,.05); border-bottom:1px solid rgba(22,163,74,.1);
          display:flex; align-items:center; gap:10px; flex-wrap:wrap; font-size:13px; color:var(--text-secondary,#334155);
        }
        .sc-results-hd {
          padding:16px 20px; border-bottom:1px solid var(--border-muted,#f1f5f9);
          display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;
        }
        .sc-results-title { font-size:15px; font-weight:800; color:var(--text-primary,#0f172a); display:flex; align-items:center; gap:8px; }
        .sc-results-controls { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .sc-results-body { padding:4px; }

        .sc-btn-outline {
          display:inline-flex; align-items:center; gap:6px; padding:8px 15px; border-radius:10px;
          font-size:12.5px; font-weight:700; cursor:pointer; font-family:inherit; white-space:nowrap;
          border:1px solid rgba(37,99,235,.2); background:rgba(37,99,235,.05); color:#2563eb;
          transition:all .15s ease;
        }
        .sc-btn-outline:hover:not(:disabled) { background:rgba(37,99,235,.1); border-color:rgba(37,99,235,.38); }
        .sc-btn-outline:disabled { opacity:.5; cursor:not-allowed; }

        .sc-btn-ghost {
          display:inline-flex; align-items:center; gap:6px; padding:8px 15px; border-radius:10px;
          font-size:12.5px; font-weight:700; cursor:pointer; font-family:inherit; white-space:nowrap;
          border:1px solid var(--border-soft,#e2e8f0); background:var(--surface-card,#fff); color:var(--text-secondary,#334155);
          transition:all .15s ease;
        }
        .sc-btn-ghost:hover { border-color:#16a34a; color:#16a34a; background:rgba(22,163,74,.05); }

        .sc-cache-tag { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:99px; background:rgba(245,158,11,.08); border:1px solid rgba(245,158,11,.2); font-size:11px; font-weight:700; color:#92400e; }

        /* ── Prompt (nothing selected yet) ── */
        .sc-prompt {
          background:var(--surface-card,#fff); border:1.5px dashed var(--border-soft,#e2e8f0);
          border-radius:20px; padding:72px 40px; text-align:center;
          display:flex; flex-direction:column; align-items:center; gap:14px;
          animation:fadeIn .24s ease;
        }

        /* ── Error state ── */
        .sc-error {
          background:rgba(220,38,38,.05); border:1px solid rgba(220,38,38,.15);
          border-radius:14px; padding:16px 20px;
          display:flex; align-items:flex-start; gap:11px;
          animation:fadeIn .24s ease;
        }

        /* ── Skel ── */
        .sc-skel { height:14px; border-radius:99px; background:linear-gradient(90deg,#f1f5f9 25%,#e8edf3 50%,#f1f5f9 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }

        @keyframes sc-spin { to{transform:rotate(360deg)} }

        @media(max-width:1100px){ .sc-stats-row{grid-template-columns:repeat(2,1fr)} }
        @media(max-width:768px){
          .sc-main{margin-left:0}
          .sc-body{padding:0 14px 80px}
          .sc-stats-row{grid-template-columns:1fr 1fr}
        }
        @media(max-width:480px){ .sc-stats-row{grid-template-columns:1fr} }
      `}</style>

      <div className="sc-root">
        <Sidebar />
        <div className="sc-main">
          <AppHeader
            title="Screenings"
            subtitle="AI-powered candidate ranking"
            actions={
              results && selectedJobId ? (
                <div style={{ display:"flex", gap:8 }}>
                  <button className="sc-btn-outline" onClick={handleRerun} disabled={loadingRes || loading}>
                    <RefreshCw size={13} style={{ animation: (loadingRes||loading) ? "sc-spin 1s linear infinite" : "none" }} />
                    Re-run
                  </button>
                  <button className="sc-btn-ghost" onClick={() => downloadScreeningCSV(results, selectedJob?.title || "results")}>
                    <Download size={13} /> Export CSV
                  </button>
                </div>
              ) : undefined
            }
          />

          <div className="sc-body">

            {/* ── Page hero ── */}
            <div className="sc-hero">
              <div>
                <h1 className="sc-hero-title">AI Screenings</h1>
                <p className="sc-hero-sub">Select a job and load its Gemini AI screening results</p>
              </div>
            </div>

            {/* ══ SELECTOR CARD — same UX as Candidates page ══ */}
            <div className="sc-selector">
              <div className="sc-selector-head">
                <div className="sc-selector-icon">
                  <ListChecks size={17} color="#2563eb" />
                </div>
                <p className="sc-selector-title">Select a Job</p>
              </div>
              <p className="sc-selector-sub">
                Choose a job posting to view its AI screening results, then click "Load Results".
              </p>

              <div className="sc-selector-row">
                {/* Job dropdown */}
                <div className="sc-select-wrap">
                  <span className="sc-select-ico"><Briefcase size={15} /></span>
                  <select
                    className="sc-select"
                    value={selectedJobId}
                    onChange={e => handleJobChange(e.target.value)}
                    disabled={jobsLoading}
                  >
                    <option value="">
                      {jobsLoading ? "Loading jobs…" : "— Choose a job posting —"}
                    </option>
                    {jobs.map(j => (
                      <option key={j._id} value={j._id}>
                        {j.title}{j.location ? ` · ${j.location}` : ""} ({j.applicantsCount||0} candidates)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Load Results button */}
                <button
                  className="sc-load-btn"
                  onClick={handleLoadResults}
                  disabled={!selectedJobId || !hasCands || loading}
                >
                  {loading ? (
                    <>
                      <span style={{ display:"inline-block", width:14, height:14, border:"2px solid rgba(255,255,255,.35)", borderTopColor:"#fff", borderRadius:"50%", animation:"sc-spin 0.8s linear infinite" }} />
                      Loading…
                    </>
                  ) : (
                    <><ListChecks size={15} /> Load Results</>
                  )}
                </button>
              </div>

              {/* Selected job info strip */}
              {selectedJob && (
                <>
                  <div className="sc-job-strip">
                    <Briefcase size={13} color="#2563eb" />
                    <strong style={{ fontSize:13, color:"var(--text-primary,#0f172a)" }}>{selectedJob.title}</strong>
                    {selectedJob.location && (
                      <span className="sc-job-strip-item"><MapPin size={11} /> {selectedJob.location}</span>
                    )}
                    {selectedJob.yearsOfExperience !== undefined && (
                      <span className="sc-job-strip-item"><Clock size={11} /> {selectedJob.yearsOfExperience}+ yrs exp</span>
                    )}
                    <span className="sc-job-strip-item"><Users size={11} /> {selectedJob.applicantsCount||0} candidates</span>
                    <span
                      className="sc-job-strip-badge"
                      style={{
                        background: STATUS_CFG[selectedJob.status]?.bg || "#f1f5f9",
                        color:      STATUS_CFG[selectedJob.status]?.color || "#475569",
                      }}
                    >
                      {STATUS_CFG[selectedJob.status]?.label || selectedJob.status}
                    </span>
                    <Link
                      href={`/jobs/${selectedJob._id}`}
                      style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:4, fontSize:12.5, fontWeight:700, color:"var(--brand-primary,#2563eb)", textDecoration:"none" }}
                    >
                      View job <ChevronRight size={12} />
                    </Link>
                  </div>

                  {/* No candidates warning */}
                  {!hasCands && (
                    <div className="sc-no-cands-warn">
                      <AlertCircle size={15} color="#d97706" style={{ flexShrink:0 }} />
                      <span>This job has no candidates yet. Upload candidates first before running AI screening.</span>
                      <Link
                        href={`/applicants?jobId=${selectedJob._id}`}
                        style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5, fontWeight:700, color:"#92400e", textDecoration:"none", whiteSpace:"nowrap", fontSize:12.5 }}
                      >
                        <Upload size={12} /> Upload Candidates
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ══ CONTENT BELOW SELECTOR ══ */}

            {/* Nothing selected */}
            {!selectedJobId && !jobsLoading && (
              <div className="sc-prompt">
                <div style={{ width:68, height:68, borderRadius:20, background:"rgba(37,99,235,.07)", border:"1.5px dashed rgba(37,99,235,.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Brain size={30} color="#2563eb" />
                </div>
                <p style={{ fontWeight:800, fontSize:17, color:"var(--text-primary,#0f172a)" }}>Select a job to get started</p>
                <p style={{ color:"var(--text-muted,#94a3b8)", fontSize:13.5, maxWidth:320, lineHeight:1.6 }}>
                  Choose a job from the dropdown above and click <strong>Load Results</strong> to view its AI-ranked candidates.
                </p>
                {jobs.length === 0 && (
                  <Link
                    href="/jobs/create"
                    style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 20px", borderRadius:12, background:"linear-gradient(135deg,#2563eb,#7c3aed)", color:"#fff", fontSize:13.5, fontWeight:700, textDecoration:"none", boxShadow:"0 4px 14px rgba(37,99,235,.25)", marginTop:4 }}
                  >
                    <Briefcase size={14} /> Post Your First Job <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            )}

            {/* Loading spinner */}
            {loading && (
              <div style={{ background:"var(--surface-card,#fff)", border:"1px solid var(--border-soft,#e2e8f0)", borderRadius:20, padding:"56px 32px", textAlign:"center", boxShadow:"0 1px 3px rgba(0,0,0,.06)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, color:"var(--text-muted,#94a3b8)", fontSize:14, fontWeight:600 }}>
                  <Brain size={20} color="#2563eb" style={{ animation:"sc-spin 2s linear infinite" }} />
                  Loading AI screening results for &ldquo;{selectedJob?.title}&rdquo;…
                </div>
              </div>
            )}

            {/* Error */}
            {!loading && err && (
              <div className="sc-error">
                <AlertCircle size={17} color="#dc2626" style={{ flexShrink:0, marginTop:1 }} />
                <div>
                  <p style={{ fontWeight:700, fontSize:13.5, color:"#dc2626", marginBottom:4 }}>No results found</p>
                  <p style={{ fontSize:13, color:"#b91c1c", lineHeight:1.5 }}>
                    {typeof err === "string" ? err : "Run AI screening from the job page first, then load results here."}
                  </p>
                  {selectedJob && (
                    <Link href={`/jobs/${selectedJobId}`} style={{ display:"inline-flex", alignItems:"center", gap:5, marginTop:10, fontSize:13, fontWeight:700, color:"#dc2626", textDecoration:"none" }}>
                      Go to job page <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Results */}
            {!loading && resultsLoaded && results && selectedJobId && (
              <>
                {/* Summary stats */}
                {statsFromResults && (
                  <div className="sc-stats-row">
                    {[
                      { label:"Screened",    val: String(statsFromResults.total),       color:"var(--text-primary,#0f172a)" },
                      { label:"Shortlisted", val: String(statsFromResults.shortlisted), color:"#7c3aed" },
                      { label:"Top Score",   val: `${statsFromResults.topScore}`,       color:"#16a34a" },
                      { label:"Avg Score",   val: `${statsFromResults.avgScore}`,       color:"#2563eb" },
                    ].map(s => (
                      <div key={s.label} className="sc-stat-mini">
                        <p className="sc-stat-mini-val" style={{ color: s.color }}>{s.val}</p>
                        <p className="sc-stat-mini-lbl">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Results card */}
                <div className="sc-results-panel">
                  <div className="sc-results-context">
                    <CheckCircle2 size={13} color="#16a34a" />
                    <strong>{selectedJob?.title || "Selected job"}</strong>
                    <span>·</span>
                    <span>{statsFromResults?.total} candidates screened</span>
                    <span>·</span>
                    <span style={{ color:"#7c3aed", fontWeight:700 }}>{statsFromResults?.shortlisted} shortlisted</span>
                    {fromCache && <span className="sc-cache-tag">⚡ Cached</span>}
                  </div>

                  <div className="sc-results-hd">
                    <p className="sc-results-title">
                      <Sparkles size={16} color="#7c3aed" />
                      AI Screening Results
                    </p>
                    <div className="sc-results-controls">
                      <button className="sc-btn-outline" onClick={handleRerun} disabled={loadingRes||loading}>
                        <RefreshCw size={12} /> Re-run Screening
                      </button>
                      <button className="sc-btn-ghost" onClick={() => downloadScreeningCSV(results, selectedJob?.title||"results")}>
                        <Download size={13} /> Download CSV
                      </button>
                    </div>
                  </div>

                  <div className="sc-results-body">
                    <ScreeningResults
                      jobId={selectedJobId}
                      results={results}
                      fromCache={fromCache}
                      displayTopN="all"
                    />
                  </div>
                </div>
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