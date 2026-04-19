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
import { Brain, Briefcase, Upload, ArrowRight, Sparkles } from "lucide-react";

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
    if (!token) { router.push("/"); return; }
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
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
    return () => { cancelled = true; };
  }, [id, router]);

  return (
    <>
      <style>{`
        .sj-root { display: flex; font-family: var(--font-body, system-ui); }
        .sj-main { margin-left: var(--sidebar-width); min-height: 100vh; background: var(--surface-base); flex: 1; display: flex; flex-direction: column; }
        .sj-body { padding: 28px 40px 100px; flex: 1; max-width: 1000px; animation: fadeIn 0.28s ease; }
        .sj-empty {
          background: var(--surface-card); border: 1.5px solid var(--border-soft);
          border-radius: 18px; padding: 72px 40px; text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          box-shadow: var(--shadow-card);
        }
        @media (max-width: 768px) { .sj-main { margin-left: 0; } .sj-body { padding: 20px 16px 80px; } }
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
              <div style={{ padding: 64, textAlign: "center" }}>
                <div style={{ width: 40, height: 40, border: "3px solid var(--border-soft)", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.75s linear infinite", margin: "0 auto 14px" }} />
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading screening results…</p>
              </div>
            ) : (error === "no-results" || !results) ? (
              /* FLOW 3C: Beautiful empty state with clear CTAs */
              <div className="sj-empty">
                <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(124,58,237,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                  <Brain size={32} color="#7c3aed" />
                </div>
                <p style={{ fontWeight: 800, fontSize: 20, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  No screening results yet
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: 14, maxWidth: 380, lineHeight: 1.65, textAlign: "center" }}>
                  Select a job that has candidates uploaded, then run AI screening to get a ranked shortlist.
                </p>
                <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  <Link href={id ? `/jobs/${id}` : "/jobs"} className="btn-primary">
                    <Sparkles size={14} /> Run Screening <ArrowRight size={13} />
                  </Link>
                  <Link href="/applicants" className="btn-secondary">
                    <Upload size={14} /> Upload Candidates
                  </Link>
                </div>
                <Link href="/jobs" style={{ marginTop: 16, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                  <Briefcase size={13} /> View all jobs
                </Link>
              </div>
            ) : (
              <>
                {/* Results header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Sparkles size={18} color="#7c3aed" />
                      <p style={{ fontWeight: 800, fontSize: 18, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                        {results.totalApplicants} candidates screened
                      </p>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>
                      {results.shortlistedCount} shortlisted · Screened {new Date(results.screenedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <Link href={id ? `/jobs/${id}` : "/jobs"} style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-primary)", textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
                    <Briefcase size={13} /> Back to Job
                  </Link>
                </div>
                <ScreeningResults jobId={id} results={results} fromCache={false} displayTopN="all" />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}