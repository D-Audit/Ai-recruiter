"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import ScreeningResults from "../../components/ScreeningResults";
import { getAllJobs } from "../../services/jobService";
import { fetchResults } from "../../store/slices/screeningSlice";
import { AppDispatch, RootState } from "../../store";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  ListChecks, ChevronDown, AlertCircle, Briefcase,
  ArrowRight, Clock, Users, Brain,
} from "lucide-react";

function ScreeningsInner() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { results, loading: loadingRes, error: err } = useSelector((s: RootState) => s.screening);

  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobId, setJobId] = useState(searchParams.get("jobId") || "");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.push("/"); return; }
    getAllJobs()
      .then((d) => setJobs(d.jobs || []))
      .catch(() => {})
      .finally(() => setJobsLoading(false));
  }, [router]);

  const handleLoad = () => {
    if (!jobId) return;
    dispatch(fetchResults(jobId));
    router.replace(`/screenings?jobId=${encodeURIComponent(jobId)}`, { scroll: false });
  };

  const selectedJob = jobs.find((j) => j._id === jobId);

  return (
    <>
      <style>{`
        .sc-root { display: flex; font-family: var(--font-body); }
        .sc-main { margin-left: var(--sidebar-width); min-height: 100vh; background: var(--surface-base); flex: 1; display: flex; flex-direction: column; }
        .sc-content { padding: 32px 40px 80px; flex: 1; animation: fadeIn 0.28s ease; max-width: 1100px; }

        /* Select card */
        .sc-selector {
          background: white; border-radius: 16px; border: 1.5px solid var(--border-soft);
          padding: 28px; margin-bottom: 24px; box-shadow: var(--shadow-card);
        }
        .sc-selector-title { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
        .sc-selector-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; }
        .sc-select-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .sc-select-wrap { position: relative; flex: 1; min-width: 200px; max-width: 440px; }
        .sc-select-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
        .sc-select {
          width: 100%; padding: 11px 36px 11px 38px;
          border-radius: 11px; border: 1.5px solid var(--border-soft);
          background: #fafbfc; font-family: var(--font-body); font-size: 14px;
          color: var(--text-primary); cursor: pointer; outline: none; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 12px center;
          transition: all var(--transition-fast);
        }
        .sc-select:focus { border-color: var(--brand-primary); background-color: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }

        .sc-load-btn {
          padding: 11px 24px; border-radius: 11px; border: none;
          background: var(--brand-gradient); color: white; font-weight: 700; font-size: 14px;
          font-family: var(--font-body); cursor: pointer; box-shadow: var(--shadow-button);
          display: flex; align-items: center; gap: 7px; white-space: nowrap;
          transition: all var(--transition-fast);
        }
        .sc-load-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.38); }
        .sc-load-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }

        /* Selected job info */
        .sc-job-info {
          margin-top: 16px; padding: 14px 16px; border-radius: 10px;
          background: #f8fafc; border: 1px solid #e2e8f0;
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
        }
        .sc-job-meta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .sc-job-meta-item { display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: var(--text-secondary); }

        /* Empty & Error */
        .sc-empty {
          background: white; border-radius: 16px; border: 1px solid var(--border-soft);
          padding: 72px 40px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;
        }
        .sc-empty-icon { width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }

        /* Error */
        .sc-error {
          display: flex; align-items: flex-start; gap: 12px;
          background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 12px;
          padding: 16px 20px; color: #dc2626; font-size: 14px; font-weight: 500;
        }

        /* Jobs quick-link grid */
        .sc-jobs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; margin-top: 16px; }
        .sc-job-chip {
          display: flex; align-items: center; gap: 10px; padding: 12px 14px;
          border-radius: 11px; border: 1.5px solid var(--border-soft); background: white;
          cursor: pointer; font-family: var(--font-body); text-align: left;
          transition: all var(--transition-fast);
        }
        .sc-job-chip:hover { border-color: #bfdbfe; background: #eff6ff; }
        .sc-job-chip-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
        .sc-job-chip-meta { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

        @media (max-width: 1024px) and (min-width: 769px) { .sc-main { margin-left: var(--sidebar-collapsed); } }
        @media (max-width: 768px) {
          .sc-main { margin-left: 0; }
          .sc-content { padding: 20px 16px 80px; }
          .sc-select-row { flex-direction: column; align-items: stretch; }
          .sc-select-wrap { max-width: none; }
          .sc-load-btn { justify-content: center; }
        }
      `}</style>

      <div className="sc-root">
        <Sidebar />
        <div className="sc-main">
          <AppHeader
            title="Screenings"
            subtitle="View AI-powered screening results by job"
          />
          <div className="sc-content">

            {/* Selector card */}
            <div className="sc-selector">
              <p className="sc-selector-title">
                <ListChecks size={18} color="#2563eb" />
                Select a Job to View Results
              </p>
              <p className="sc-selector-sub">
                Choose a job to load its latest AI screening report with ranked candidates.
              </p>

              <div className="sc-select-row">
                <div className="sc-select-wrap">
                  <Briefcase size={15} className="sc-select-icon" />
                  <select
                    className="sc-select"
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                  >
                    <option value="">— Choose a job —</option>
                    {jobsLoading ? (
                      <option disabled>Loading jobs…</option>
                    ) : jobs.map((j) => (
                      <option key={j._id} value={j._id}>
                        {j.title}{j.location ? ` · ${j.location}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="sc-load-btn"
                  onClick={handleLoad}
                  disabled={!jobId || loadingRes}
                >
                  <Brain size={16} />
                  {loadingRes ? "Loading…" : "Load Results"}
                </button>
              </div>

              {selectedJob && (
                <div className="sc-job-info">
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 6 }}>
                      {selectedJob.title}
                    </p>
                    <div className="sc-job-meta">
                      <span className="sc-job-meta-item">
                        <Users size={12} /> {selectedJob.applicantsCount || 0} candidates
                      </span>
                      {selectedJob.location && (
                        <span className="sc-job-meta-item">📍 {selectedJob.location}</span>
                      )}
                      <span className="sc-job-meta-item">
                        <Clock size={12} /> {new Date(selectedJob.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/jobs/${selectedJob._id}`}
                    style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "#2563eb", textDecoration: "none" }}
                  >
                    Open Job Hub <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </div>

            {/* Error */}
            {err && !loadingRes && (
              <div className="sc-error">
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontWeight: 700, marginBottom: 4 }}>No results found</p>
                  <p style={{ fontSize: 13, lineHeight: 1.5 }}>
                    {err.includes("404") || err.includes("not found")
                      ? "This job hasn't been screened yet. Go to the job page and click \"Screen Candidates\"."
                      : err
                    }
                  </p>
                  {selectedJob && (
                    <Link
                      href={`/jobs/${selectedJob._id}`}
                      style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, fontSize: 13, fontWeight: 700, color: "#2563eb", textDecoration: "none" }}
                    >
                      Go to Job Hub <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Loading */}
            {loadingRes && <LoadingSpinner label="Loading screening results…" />}

            {/* Results */}
            {results && jobId && !loadingRes ? (
              <ScreeningResults
                jobId={jobId}
                results={results}
                fromCache={false}
                displayTopN="all"
              />
            ) : null}

            {/* Empty: no job selected, show job list */}
            {!results && !err && !loadingRes && !jobId && jobs.length > 0 ? (
              <div>
                <p className="section-label" style={{ marginBottom: 12 }}>All Jobs — click to load screening</p>
                <div className="sc-jobs-grid">
                  {jobs.map((j) => (
                    <button
                      key={j._id}
                      className="sc-job-chip"
                      onClick={() => { setJobId(j._id); }}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(37,99,235,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Briefcase size={15} color="#2563eb" />
                      </div>
                      <div>
                        <p className="sc-job-chip-title">{j.title}</p>
                        <p className="sc-job-chip-meta">{j.applicantsCount || 0} candidates{j.location ? ` · ${j.location}` : ""}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {!results && !err && !loadingRes && !jobId && jobs.length === 0 && !jobsLoading ? (
              <div className="sc-empty">
                <div className="sc-empty-icon" style={{ background: "#f1f5f9" }}>
                  <ListChecks size={28} color="#94a3b8" />
                </div>
                <p style={{ fontWeight: 700, fontSize: 18, color: "var(--text-primary)" }}>No jobs to screen yet</p>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 360, lineHeight: 1.6 }}>
                  Post a job first, then upload candidates and run AI screening from the job page.
                </p>
                <Link href="/jobs/create" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 10, background: "#2563eb", color: "white", fontWeight: 700, fontSize: 14, textDecoration: "none", marginTop: 4 }}>
                  Post a Job
                </Link>
              </div>
            ) : null}

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