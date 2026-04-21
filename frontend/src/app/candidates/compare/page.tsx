"use client";
import { Suspense, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import AppHeader from "../../../components/AppHeader";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { compareCandidates } from "../../../services/screeningService";
import toast from "react-hot-toast";
import { Trophy, ArrowLeft, CheckCircle2, AlertTriangle, TrendingUp, XCircle, Users } from "lucide-react";

function CompareContent() {
  const sp      = useSearchParams();
  const jobId   = sp.get("jobId") || "";
  const ids     = sp.get("ids")?.split(",").filter(Boolean) || [];
  const backHref = jobId ? `/screenings?jobId=${jobId}` : "/screenings";

  const [result,  setResult]  = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId || ids.length < 2) { setLoading(false); return; }
    compareCandidates(jobId, ids.filter(Boolean))
      .then((d) => setResult(d.data))
      .catch(() => toast.error("Comparison failed"))
      .finally(() => setLoading(false));
  }, [jobId, ids.join(",")]);

  const verdictConfig = (verdict: string) => {
    if (verdict === "Strong Fit")   return { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0", icon: CheckCircle2 };
    if (verdict === "Good Fit")     return { bg: "#dbeafe", color: "#2563eb", border: "#bfdbfe", icon: TrendingUp };
    if (verdict === "Moderate Fit") return { bg: "#fef9c3", color: "#a16207", border: "#fde68a", icon: AlertTriangle };
    return { bg: "#fee2e2", color: "#dc2626", border: "#fecaca", icon: XCircle };
  };

  const scoreColor = (s: number) => s >= 70 ? "#15803d" : s >= 50 ? "#d97706" : "#dc2626";
  const scoreBg    = (s: number) => s >= 70 ? "#f0fdf4" : s >= 50 ? "#fffbeb" : "#fef2f2";

  return (
    <>
      <style>{`
        .cp-root  { display: flex; font-family: var(--font-body, system-ui); }
        .cp-shell { margin-left: var(--sidebar-width, 260px); flex: 1; display: flex; flex-direction: column; min-height: 100vh; background: var(--surface-base); }
        .cp-main  { padding: 28px 40px 80px; flex: 1; animation: fadeIn 0.28s ease; }

        /* Breadcrumb */
        .cp-breadcrumb {
          display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
          margin-bottom: 28px; font-size: 13.5px; font-weight: 600;
        }
        .cp-bread-link {
          display: inline-flex; align-items: center; gap: 5px;
          color: var(--text-muted); text-decoration: none; padding: 5px 10px;
          border-radius: 8px; transition: all 0.15s;
        }
        .cp-bread-link:hover { color: var(--brand-primary); background: rgba(37,99,235,0.06); }
        .cp-bread-sep { color: var(--border-soft); font-size: 16px; }

        /* Winner banner */
        .cp-winner {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border-radius: 18px; padding: 24px 28px; margin-bottom: 24px;
          display: flex; align-items: center; gap: 20px;
          box-shadow: 0 8px 28px rgba(245,158,11,0.3);
          position: relative; overflow: hidden;
        }
        .cp-winner::after {
          content: ''; position: absolute; top: -40px; right: -40px;
          width: 200px; height: 200px; border-radius: 50%;
          background: rgba(255,255,255,0.08); pointer-events: none;
        }
        .cp-winner-icon {
          width: 56px; height: 56px; border-radius: 16px; flex-shrink: 0;
          background: rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
        }
        .cp-winner-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255,255,255,0.75); margin-bottom: 6px; }
        .cp-winner-name  { font-size: 22px; font-weight: 900; color: white; letter-spacing: -0.03em; line-height: 1.1; }
        .cp-winner-reason { font-size: 14px; color: rgba(255,255,255,0.82); line-height: 1.55; margin-top: 6px; max-width: 600px; }

        /* Candidates header row */
        .cp-candidates-header {
          display: flex; gap: 16px; margin-bottom: 16px; padding-left: 200px;
        }
        .cp-cand-col {
          flex: 1; background: var(--surface-card);
          border: 1.5px solid var(--border-soft); border-radius: 16px;
          padding: 20px 22px; box-shadow: var(--shadow-card);
          text-align: center; position: relative;
        }
        .cp-cand-col.winner-col {
          border-color: #f59e0b; background: #fffbeb;
          box-shadow: 0 4px 20px rgba(245,158,11,0.15);
        }
        .cp-cand-avatar {
          width: 52px; height: 52px; border-radius: 50%; margin: 0 auto 12px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 800; color: white;
          box-shadow: 0 4px 14px rgba(37,99,235,0.3);
        }
        .cp-cand-col.winner-col .cp-cand-avatar {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          box-shadow: 0 4px 14px rgba(245,158,11,0.35);
        }
        .cp-cand-name  { font-size: 16px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; }
        .cp-cand-badge {
          position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 12px; border-radius: 99px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white; font-size: 11px; font-weight: 800; white-space: nowrap;
          box-shadow: 0 3px 10px rgba(245,158,11,0.4);
        }

        /* Score display */
        .cp-score-wrap {
          display: inline-flex; align-items: baseline; gap: 3px;
          padding: 10px 20px; border-radius: 14px; margin-top: 8px;
        }
        .cp-score-num  { font-size: 40px; font-weight: 900; line-height: 1; letter-spacing: -0.04em; }
        .cp-score-denom { font-size: 16px; font-weight: 600; color: var(--text-muted); }

        /* Comparison rows */
        .cp-table { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
        .cp-row {
          display: flex; gap: 16px;
        }
        .cp-row-label {
          width: 184px; flex-shrink: 0; display: flex; align-items: center;
          font-size: 13px; font-weight: 700; color: var(--text-secondary);
          text-transform: uppercase; letter-spacing: 0.07em;
          padding: 16px 0; border-bottom: none;
        }
        .cp-row-cell {
          flex: 1; background: var(--surface-card);
          border: 1.5px solid var(--border-soft); border-radius: 14px;
          padding: 18px 20px; box-shadow: var(--shadow-card);
        }
        .cp-row-cell.winner-cell {
          border-color: rgba(245,158,11,0.3);
          background: linear-gradient(135deg, rgba(255,251,235,0.8), rgba(255,255,255,1));
        }
        .cp-cell-text { font-size: 14px; color: var(--text-secondary); line-height: 1.6; }

        /* Verdict badge */
        .cp-verdict {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 10px; font-size: 13px; font-weight: 700;
          border: 1.5px solid;
        }

        /* Bias note */
        .cp-bias {
          background: #fffbeb; border: 1.5px solid #fde68a;
          border-radius: 14px; padding: 16px 20px;
          display: flex; align-items: flex-start; gap: 12px;
        }
        .cp-bias-text { font-size: 13.5px; color: #92400e; line-height: 1.65; }

        /* Empty state */
        .cp-empty {
          background: var(--surface-card); border: 1.5px solid var(--border-soft);
          border-radius: 18px; padding: 64px 40px; text-align: center;
          box-shadow: var(--shadow-card);
        }

        @media (max-width: 768px) {
          .cp-shell { margin-left: 0; }
          .cp-main  { padding: 20px 16px 80px; }
          .cp-candidates-header { flex-direction: column; padding-left: 0; }
          .cp-row  { flex-direction: column; }
          .cp-row-label { width: auto; padding: 8px 0 4px; }
        }
      `}</style>

      <div className="cp-root">
        <Sidebar />
        <div className="cp-shell">
          <AppHeader
            title="Candidate Comparison"
            subtitle={jobId ? "Side-by-side AI analysis for this role" : "Open from screening results"}
          />
          <main className="cp-main">

            {/* Breadcrumb */}
            <nav className="cp-breadcrumb">
              <Link href={backHref} className="cp-bread-link">
                <ArrowLeft size={14} /> Screening Results
              </Link>
              <span className="cp-bread-sep">›</span>
              {jobId && (
                <>
                  <Link href={`/jobs/${jobId}`} className="cp-bread-link">Job Hub</Link>
                  <span className="cp-bread-sep">›</span>
                </>
              )}
              <Link href="/screenings" className="cp-bread-link">All Screenings</Link>
              <span className="cp-bread-sep">›</span>
              <Link href="/dashboard" className="cp-bread-link">Dashboard</Link>
            </nav>

            {loading && <LoadingSpinner label="AI is comparing candidates…" />}

            {!loading && !result && (
              <div className="cp-empty">
                <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(37,99,235,0.07)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <Users size={28} color="#2563eb" />
                </div>
                <p style={{ fontWeight: 800, fontSize: 18, color: "var(--text-primary)", marginBottom: 10 }}>
                  {!jobId ? "Missing job ID" : ids.length < 2 ? "Select at least 2 candidates" : "No comparison data returned"}
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 28, maxWidth: 420, margin: "0 auto 28px", lineHeight: 1.6 }}>
                  {!jobId
                    ? "Open candidate comparison from the screening results page — it needs a jobId in the URL."
                    : ids.length < 2
                    ? "Select at least two candidates on the screening results page, then use the Compare button."
                    : "Try again from the screening results page."}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
                  <Link href={backHref} style={{ padding: "11px 20px", borderRadius: 11, border: "1.5px solid rgba(37,99,235,0.25)", background: "rgba(37,99,235,0.06)", color: "#2563eb", fontWeight: 700, fontSize: 13.5, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <ArrowLeft size={14} /> Screening results
                  </Link>
                  <Link href="/jobs" style={{ padding: "11px 20px", borderRadius: 11, border: "1.5px solid var(--border-soft)", background: "var(--surface-card)", color: "var(--text-secondary)", fontWeight: 700, fontSize: 13.5, textDecoration: "none" }}>
                    All jobs
                  </Link>
                </div>
              </div>
            )}

            {!loading && result && (() => {
              const comparison: any[] = result.comparison || [];
              const winnerCandId = result.winner;

              return (
                <>
                  {/* Winner banner */}
                  <div className="cp-winner">
                    <div className="cp-winner-icon"><Trophy size={28} color="white" /></div>
                    <div>
                      <p className="cp-winner-label">Recommended Hire</p>
                      <p className="cp-winner-name">
                        {comparison.find((c: any) => c.candidateId === winnerCandId)?.fullName || "Top Candidate"}
                      </p>
                      {result.winnerReason && (
                        <p className="cp-winner-reason">{result.winnerReason}</p>
                      )}
                    </div>
                  </div>

                  {/* Candidate header cards */}
                  <div className="cp-candidates-header">
                    {comparison.map((c: any, i: number) => {
                      const isWinner = c.candidateId === winnerCandId;
                      const initials = (c.fullName || `C${i+1}`).split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
                      const vc = verdictConfig(c.verdict);
                      const VIcon = vc.icon;
                      return (
                        <div key={i} className={`cp-cand-col${isWinner ? " winner-col" : ""}`}>
                          {isWinner && (
                            <div className="cp-cand-badge"><Trophy size={11} /> Recommended</div>
                          )}
                          <div className="cp-cand-avatar">{initials}</div>
                          <p className="cp-cand-name">{c.fullName || `Candidate ${i + 1}`}</p>

                          {/* Score */}
                          <div className="cp-score-wrap" style={{ background: scoreBg(c.score) }}>
                            <span className="cp-score-num" style={{ color: scoreColor(c.score) }}>{c.score}</span>
                            <span className="cp-score-denom">/100</span>
                          </div>

                          {/* Verdict badge */}
                          <div style={{ marginTop: 12 }}>
                            <span className="cp-verdict" style={{ background: vc.bg, color: vc.color, borderColor: vc.border }}>
                              <VIcon size={13} /> {c.verdict}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Comparison rows */}
                  <div className="cp-table">
                    {[
                      {
                        label: "Top Strength",
                        render: (c: any) => <p className="cp-cell-text">{c.topStrength || "—"}</p>,
                      },
                      {
                        label: "Main Gap",
                        render: (c: any) => <p className="cp-cell-text">{c.biggestGap || "—"}</p>,
                      },
                      {
                        label: "Recommendation",
                        render: (c: any) => {
                          const vc = verdictConfig(c.verdict);
                          const VIcon = vc.icon;
                          return (
                            <span className="cp-verdict" style={{ background: vc.bg, color: vc.color, borderColor: vc.border }}>
                              <VIcon size={13} /> {c.verdict}
                            </span>
                          );
                        },
                      },
                    ].map((row) => (
                      <div key={row.label} className="cp-row">
                        <div className="cp-row-label">{row.label}</div>
                        {comparison.map((c: any, i: number) => {
                          const isWinner = c.candidateId === winnerCandId;
                          return (
                            <div key={i} className={`cp-row-cell${isWinner ? " winner-cell" : ""}`}>
                              {row.render(c)}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Bias notice */}
                  <div className="cp-bias">
                    <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p className="cp-bias-text">
                      {result.biasNotice || "AI comparison is a decision-support tool only. Final hiring decisions must always be made by qualified human recruiters who review candidates holistically."}
                    </p>
                  </div>
                </>
              );
            })()}
          </main>
        </div>
      </div>
    </>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage label="Loading comparison…" />}>
      <CompareContent />
    </Suspense>
  );
}