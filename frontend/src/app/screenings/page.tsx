"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import ScreeningResults from "../../components/ScreeningResults";
import { getAllJobs } from "../../services/jobService";
import { getResults } from "../../services/screeningService";
import type { Job, ScreeningResult } from "../../types";
import { ListChecks } from "lucide-react";

function ScreeningsInner() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobId, setJobId] = useState("");
  const [results, setResults] = useState<ScreeningResult | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingRes, setLoadingRes] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    getAllJobs()
      .then((d) => setJobs(d.jobs || []))
      .finally(() => setLoadingJobs(false));
  }, [router]);

  const loadResults = async () => {
    if (!jobId) return;
    setLoadingRes(true);
    setErr(null);
    setResults(null);
    try {
      const res = await getResults(jobId);
      setResults(res.data as ScreeningResult);
    } catch {
      setErr("No screening results for this job yet.");
    } finally {
      setLoadingRes(false);
    }
  };

  return (
    <>
      <style>{`
        .sc-root { display: flex; font-family: system-ui, sans-serif; }
        .sc-main { margin-left: 260px; min-height: 100vh; background: #f8fafc; flex: 1; display: flex; flex-direction: column; }
        .sc-body { padding: 28px 40px 80px; flex: 1; max-width: 960px; }
        .sc-toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 24px; }
        .sc-select { height: 44px; min-width: 260px; padding: 0 12px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 14px; background: white; }
        .sc-load {
          height: 44px; padding: 0 20px; border-radius: 12px; border: none; background: #2563eb; color: white; font-weight: 700; font-size: 14px; cursor: pointer;
        }
        .sc-load:disabled { opacity: 0.6; cursor: not-allowed; }
        .sc-empty {
          text-align: center; padding: 72px 40px; background: white; border-radius: 16px; border: 1px solid #e2e8f0;
        }
        @media (max-width: 768px) { .sc-main { margin-left: 0; } }
      `}</style>
      <div className="sc-root">
        <Sidebar />
        <div className="sc-main">
          <AppHeader
            title="Screening Results"
            subtitle="AI-ranked candidates by job"
          />
          <div className="sc-body">
            <div className="sc-toolbar">
              <select
                className="sc-select"
                value={jobId}
                onChange={(e) => {
                  setJobId(e.target.value);
                  setResults(null);
                  setErr(null);
                }}
                disabled={loadingJobs}
              >
                <option value="">Select a job position</option>
                {jobs.map((j) => (
                  <option key={j._id} value={j._id}>
                    {j.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="sc-load"
                disabled={!jobId || loadingRes}
                onClick={loadResults}
              >
                {loadingRes ? "Loading…" : "Load Results"}
              </button>
            </div>

            {err && !loadingRes ? (
              <div className="sc-empty">
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <ListChecks size={28} color="#cbd5e1" />
                </div>
                <p style={{ fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                  No screening runs yet
                </p>
                <p style={{ color: "#64748b", fontSize: 14, maxWidth: 360, margin: "0 auto 20px" }}>
                  Run your first screening from a job page, then load results here.
                </p>
                <Link
                  href="/jobs"
                  style={{
                    display: "inline-block",
                    padding: "10px 22px",
                    borderRadius: 11,
                    background: "#2563eb",
                    color: "white",
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: "none",
                  }}
                >
                  Go to Jobs
                </Link>
              </div>
            ) : null}

            {results && jobId ? (
              <ScreeningResults
                jobId={jobId}
                results={results}
                fromCache={false}
                displayTopN="all"
              />
            ) : null}

            {!results && !err && !loadingRes && jobId ? (
              <p style={{ color: "#94a3b8", fontSize: 14 }}>
                Choose a job and click Load Results.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

export default function ScreeningsPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f8fafc",
            color: "#94a3b8",
          }}
        >
          Loading…
        </div>
      }
    >
      <ScreeningsInner />
    </Suspense>
  );
}
