"use client";
import { Suspense, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import AppHeader from "../../../components/AppHeader";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { compareCandidates } from "../../../services/screeningService";
import toast from "react-hot-toast";
import { Trophy, ArrowLeft } from "lucide-react";

// ────────────────────────────────────────────────────────────
//  Inner component (uses useSearchParams — must be in Suspense)
// ────────────────────────────────────────────────────────────
function CompareContent() {
  const sp = useSearchParams();
  const jobId = sp.get("jobId") || "";
  const ids = sp.get("ids")?.split(",").filter(Boolean) || [];
  const backHref = jobId ? `/screenings/${jobId}` : "/screenings";

  const mutedLink: CSSProperties = {
    color: "#64748b",
    fontWeight: 600,
    fontSize: 13,
    textDecoration: "none",
  };

  const [result,  setResult]  = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId || ids.length < 2) { setLoading(false); return; }
    compareCandidates(jobId, ids.filter(Boolean))
      .then((d) => setResult(d.data))
      .catch(() => toast.error("Comparison failed"))
      .finally(() => setLoading(false));
  }, [jobId, ids.join(",")]);

  const verdictMap: Record<string, { bg: string; color: string }> = {
    "Strong Fit":   { bg: "#dcfce7", color: "#16a34a" },
    "Good Fit":     { bg: "#dbeafe", color: "#2563eb" },
    "Moderate Fit": { bg: "#fef9c3", color: "#a16207" },
    "Weak Fit":     { bg: "#fee2e2", color: "#dc2626" },
  };

  const rows = [
    { label: "Match Score", render: (c: any) => (
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: c.score >= 70 ? "#16a34a" : c.score >= 50 ? "#d97706" : "#dc2626" }}>{c.score}</span>
        <span style={{ color: "#94a3b8", fontSize: 12 }}>/100</span>
      </div>
    ), bg: "white" },
    { label: "Verdict", render: (c: any) => (
      <div style={{ textAlign: "center" }}>
        <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12.5, fontWeight: 700, ...(verdictMap[c.verdict] ?? { bg: "#f1f5f9", color: "#64748b" }) }}>{c.verdict}</span>
      </div>
    ), bg: "#f8fafc" },
    { label: "Top Strength", render: (c: any) => <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.55 }}>{c.topStrength}</p>, bg: "white" },
    { label: "Main Gap",     render: (c: any) => <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.55 }}>{c.biggestGap}</p>,  bg: "#f8fafc" },
  ];

  const cols = result?.comparison?.length || 2;
  const grid = `180px repeat(${cols}, 1fr)`;

  return (
    <>
      <style>{`
        
        .cp-root { display:flex; font-family:var(--font-body,system-ui); }
        .cp-shell { margin-left:260px; flex:1; display:flex; flex-direction:column; min-height:100vh; background:#f1f5f9; }
        .cp-main { padding:24px 40px 40px; flex:1; }

        .winner-banner { background:linear-gradient(135deg,#f59e0b,#d97706); border-radius:16px; padding:22px 28px; margin-bottom:22px; display:flex; align-items:center; gap:18px; color:white; box-shadow:0 6px 20px rgba(245,158,11,0.3); }
        .winner-title { font-family:var(--font-display,system-ui); font-size:18px; font-weight:800; margin-bottom:4px; }
        .winner-reason { font-size:13.5px; opacity:0.85; line-height:1.55; }

        .compare-table { background:white; border-radius:18px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.04); margin-bottom:20px; }
        .table-head-row { border-bottom:1px solid #e2e8f0; }
        .table-head-cell { padding:16px 18px; font-size:12px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.07em; }
        .table-head-candidate { padding:16px 18px; text-align:center; font-weight:700; font-size:14.5px; border-left:1px solid #e2e8f0; }
        .table-row { border-bottom:1px solid #e2e8f0; }
        .table-row:last-child { border-bottom:none; }
        .row-label { padding:16px 18px; font-weight:600; font-size:13.5px; color:#374151; }
        .row-cell  { padding:14px 18px; border-left:1px solid #e2e8f0; }

        .bias-note { background:#fffbeb; border:1px solid #fde68a; border-radius:12px; padding:14px 18px; }

        .state-card { background:white; border-radius:18px; border:1px solid #e2e8f0; padding:56px 40px; text-align:center; }
      `}</style>

      <div className="cp-root">
        <Sidebar />
        <div className="cp-shell">
          <AppHeader
            title="Candidate comparison"
            subtitle={
              jobId
                ? "Side-by-side AI analysis for this role"
                : "Open from screening results — the URL should include ?jobId= and &ids=candidateId1,candidateId2"
            }
          />
          <main className="cp-main">
          <nav
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 10,
              marginBottom: 24,
            }}
          >
            <Link href={backHref} style={{ ...mutedLink, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <ArrowLeft size={14} /> Screening results
            </Link>
            <span style={{ color: "#cbd5e1" }}>·</span>
            {jobId ? (
              <>
                <Link href={`/jobs/${jobId}`} style={mutedLink}>
                  Job hub
                </Link>
                <span style={{ color: "#cbd5e1" }}>·</span>
              </>
            ) : null}
            <Link href="/jobs" style={mutedLink}>
              All jobs
            </Link>
            <span style={{ color: "#cbd5e1" }}>·</span>
            <Link href="/screenings" style={mutedLink}>
              Screenings
            </Link>
            <span style={{ color: "#cbd5e1" }}>·</span>
            <Link href="/dashboard" style={mutedLink}>
              Dashboard
            </Link>
          </nav>

          {loading && <LoadingSpinner label="AI is comparing candidates…" />}

          {!loading && !result && (
            <div className="state-card">
              <p style={{ color: "#64748b", fontWeight: 600, marginBottom: 8 }}>
                {!jobId
                  ? "Missing job in the URL. Comparison needs a jobId query parameter."
                  : ids.length < 2
                    ? "Select at least two candidates on the screening results page, then use Compare."
                    : "No comparison data returned. Try again from screening results."}
              </p>
              <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>
                Use the links below to get back into the flow.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
                <Link
                  href={backHref}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: "1px solid #bfdbfe",
                    background: "#eff6ff",
                    color: "#2563eb",
                    fontWeight: 600,
                    fontSize: 13,
                    textDecoration: "none",
                  }}
                >
                  ← Screening results
                </Link>
                <Link
                  href="/jobs"
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    color: "#475569",
                    fontWeight: 600,
                    fontSize: 13,
                    textDecoration: "none",
                  }}
                >
                  All jobs
                </Link>
                <Link
                  href="/dashboard"
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    color: "#475569",
                    fontWeight: 600,
                    fontSize: 13,
                    textDecoration: "none",
                  }}
                >
                  Dashboard
                </Link>
              </div>
            </div>
          )}

          {!loading && result && (
            <>
              <div className="winner-banner">
                <Trophy size={38} />
                <div>
                  <p className="winner-title">Recommended Candidate</p>
                  <p className="winner-reason">{result.winnerReason}</p>
                </div>
              </div>

              <div className="compare-table">
                {/* Header row */}
                <div className="table-head-row" style={{ display: "grid", gridTemplateColumns: grid }}>
                  <div className="table-head-cell">Category</div>
                  {result.comparison?.map((c: any, i: number) => {
                    const isWinner = c.candidateId === result.winner;
                    return (
                    <div
                      key={i}
                      className="table-head-candidate"
                      style={{
                        background: isWinner ? "#fffbeb" : "transparent",
                        color: isWinner ? "#d97706" : "#0f172a",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        {isWinner ? <Trophy size={18} color="#d97706" aria-hidden /> : null}
                        {c.fullName || `Candidate ${i + 1}`}
                      </span>
                    </div>
                  );})}
                </div>

                {/* Data rows */}
                {rows.map((row) => (
                  <div
                    key={row.label}
                    className="table-row"
                    style={{ display: "grid", gridTemplateColumns: grid, background: row.bg }}
                  >
                    <div className="row-label">{row.label}</div>
                    {result.comparison?.map((c: any, i: number) => (
                      <div key={i} className="row-cell">
                        {row.render(c)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="bias-note">
                <p style={{ color: "#92400e", fontSize: 13, lineHeight: 1.6 }}>
                  ⚠️ {result.biasNotice || "AI comparison is a decision-support tool. Final hiring decisions must be made by qualified human recruiters."}
                </p>
              </div>
            </>
          )}
          </main>
        </div>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────
//  Page export — wraps content in Suspense (required by Next.js
//  whenever useSearchParams is used in a child component)
// ────────────────────────────────────────────────────────────
export default function ComparePage() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage label="Loading comparison…" />}>
      <CompareContent />
    </Suspense>
  );
}