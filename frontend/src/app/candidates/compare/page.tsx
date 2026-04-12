"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import { compareCandidates } from "../../../services/screeningService";
import toast from "react-hot-toast";
import { Trophy, ArrowLeft } from "lucide-react";

// ────────────────────────────────────────────────────────────
//  Inner component (uses useSearchParams — must be in Suspense)
// ────────────────────────────────────────────────────────────
function CompareContent() {
  const sp     = useSearchParams();
  const router = useRouter();
  const jobId  = sp.get("jobId") || "";
  const ids    = sp.get("ids")?.split(",") || [];

  const [result,  setResult]  = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId || ids.length < 2) { setLoading(false); return; }
    compareCandidates(jobId, ids)
      .then((d) => setResult(d.data))
      .catch(() => toast.error("Comparison failed"))
      .finally(() => setLoading(false));
  }, []);

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
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        .cp-root { display:flex; font-family:'DM Sans',sans-serif; }
        .cp-main { margin-left:260px; min-height:100vh; padding:36px 40px; background:#f1f5f9; flex:1; }
        .back-btn { display:inline-flex; align-items:center; gap:7px; color:#64748b; font-size:13.5px; font-weight:600; background:none; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; margin-bottom:24px; padding:0; transition:color 0.15s; }
        .back-btn:hover { color:#1e293b; }
        .cp-title { font-family:'Sora',sans-serif; font-size:26px; font-weight:800; color:#0f172a; letter-spacing:-0.5px; margin-bottom:4px; }
        .cp-sub { color:#64748b; font-size:14px; font-weight:500; margin-bottom:28px; }

        .winner-banner { background:linear-gradient(135deg,#f59e0b,#d97706); border-radius:16px; padding:22px 28px; margin-bottom:22px; display:flex; align-items:center; gap:18px; color:white; box-shadow:0 6px 20px rgba(245,158,11,0.3); }
        .winner-title { font-family:'Sora',sans-serif; font-size:18px; font-weight:800; margin-bottom:4px; }
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

        .state-card { background:white; border-radius:18px; border:1px solid #e2e8f0; padding:72px 40px; text-align:center; }

        @keyframes spin { to { transform:rotate(360deg); } }
        .spinner-lg { width:52px; height:52px; border:4px solid #e9d5ff; border-top-color:#7c3aed; border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 18px; }
      `}</style>

      <div className="cp-root">
        <Sidebar />
        <main className="cp-main">
          <button className="back-btn" onClick={() => router.back()}>
            <ArrowLeft size={15} /> Back to Results
          </button>

          <h1 className="cp-title">Candidate Comparison</h1>
          <p className="cp-sub">Side-by-side AI analysis</p>

          {loading && (
            <div className="state-card">
              <div className="spinner-lg" />
              <p style={{ color: "#64748b", fontWeight: 600 }}>AI is comparing candidates…</p>
            </div>
          )}

          {!loading && !result && (
            <div className="state-card">
              <p style={{ color: "#64748b", fontWeight: 600 }}>No comparison data found.</p>
              <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 6 }}>Go back and select at least 2 candidates.</p>
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
                  {result.comparison?.map((c: any, i: number) => (
                    <div
                      key={i}
                      className="table-head-candidate"
                      style={{
                        background: c.candidateId === result.winner ? "#fffbeb" : "transparent",
                        color: c.candidateId === result.winner ? "#d97706" : "#0f172a",
                      }}
                    >
                      {c.fullName || `Candidate ${i + 1}`}
                      {c.candidateId === result.winner && " 🏆"}
                    </div>
                  ))}
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
    </>
  );
}

// ────────────────────────────────────────────────────────────
//  Page export — wraps content in Suspense (required by Next.js
//  whenever useSearchParams is used in a child component)
// ────────────────────────────────────────────────────────────
export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f1f5f9" }}>
          <div style={{ width: 52, height: 52, border: "4px solid #e9d5ff", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}