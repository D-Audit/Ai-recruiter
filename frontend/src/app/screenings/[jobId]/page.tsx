"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import AppHeader from "../../../components/AppHeader";
import ScreeningResults from "../../../components/ScreeningResults";
import { getJob } from "../../../services/jobService";
import { getResults } from "../../../services/screeningService";
import type { Job, ScreeningResult } from "../../../types";
import { ListChecks } from "lucide-react";

export default function ScreeningJobPage() {
  const { jobId } = useParams();
  const router = useRouter();
  const id = jobId as string;
  const [job, setJob] = useState<Job | null>(null);
  const [results, setResults] = useState<ScreeningResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [jr, sr] = await Promise.all([
          getJob(id).catch(() => ({ job: null })),
          getResults(id).catch(() => ({ data: null })),
        ]);
        if (cancelled) return;
        setJob(jr.job || null);
        if (sr.data) setResults(sr.data as ScreeningResult);
        else setError("no-results");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  return (
    <>
      <style>{`
        .sj-root { display: flex; font-family: system-ui, sans-serif; }
        .sj-main { margin-left: 260px; min-height: 100vh; background: #f8fafc; flex: 1; display: flex; flex-direction: column; }
        .sj-body { padding: 28px 40px 100px; flex: 1; max-width: 960px; }
        .sj-empty {
          text-align: center; padding: 72px 40px; background: white; border-radius: 16px; border: 1px solid #e2e8f0;
        }
        @media (max-width: 768px) { .sj-main { margin-left: 0; } }
      `}</style>
      <div className="sj-root">
        <Sidebar />
        <div className="sj-main">
          <AppHeader
            title={job?.title || "Screening results"}
            subtitle="AI-ranked candidates"
          />
          <div className="sj-body">
            {loading ? (
              <p style={{ color: "#94a3b8", padding: 48 }}>Loading…</p>
            ) : error === "no-results" || !results ? (
              <div className="sj-empty">
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
                <p
                  style={{
                    color: "#64748b",
                    fontSize: 14,
                    maxWidth: 380,
                    margin: "0 auto 20px",
                    lineHeight: 1.55,
                  }}
                >
                  Run your first screening from the job page for this position.
                </p>
                <Link
                  href={id ? `/jobs/${id}` : "/jobs"}
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
                  Go to Job
                </Link>
                {" · "}
                <Link
                  href="/jobs"
                  style={{ color: "#2563eb", fontWeight: 600, fontSize: 14 }}
                >
                  All jobs
                </Link>
              </div>
            ) : (
              <ScreeningResults
                jobId={id}
                results={results}
                fromCache={false}
                displayTopN="all"
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
