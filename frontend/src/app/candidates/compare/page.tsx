"use client";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "../../../components/Sidebar";
import { compareCandidates } from "../../../services/screeningService";
import toast from "react-hot-toast";
import { Trophy, ArrowLeft } from "lucide-react";

// Separate component that uses useSearchParams
function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get("jobId") || "";
  const ids = searchParams.get("ids")?.split(",") || [];
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (jobId && ids.length >= 2) {
      compareCandidates(jobId, ids)
        .then((d) => setResult(d.data))
        .catch(() => toast.error("Comparison failed"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const verdictColors: any = {
    "Strong Fit": { background: "#dcfce7", color: "#16a34a" },
    "Good Fit": { background: "#dbeafe", color: "#2563eb" },
    "Moderate Fit": { background: "#fef9c3", color: "#ca8a04" },
    "Weak Fit": { background: "#fee2e2", color: "#dc2626" },
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main
        style={{
          marginLeft: "260px",
          minHeight: "100vh",
          padding: "32px",
          background: "#f8fafc",
          flex: 1,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "24px",
            background: "none",
            border: "none",
            color: "#64748b",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          <ArrowLeft size={18} /> Back to Results
        </button>

        <h1
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#1e293b",
            marginBottom: "8px",
          }}
        >
          Candidate Comparison
        </h1>
        <p style={{ color: "#64748b", marginBottom: "32px" }}>
          Side-by-side AI analysis
        </p>

        {loading && (
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "64px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                border: "4px solid #e9d5ff",
                borderTop: "4px solid #7c3aed",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <p style={{ color: "#64748b" }}>AI is comparing candidates...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && !result && (
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "48px",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#64748b" }}>
              No comparison data found. Please go back and select candidates.
            </p>
          </div>
        )}

        {!loading && result && (
          <>
            {/* Winner Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                color: "white",
              }}
            >
              <Trophy size={36} />
              <div>
                <p style={{ fontWeight: "700", fontSize: "20px" }}>
                  Recommended Candidate
                </p>
                <p style={{ opacity: 0.9, marginTop: "4px" }}>
                  {result.winnerReason}
                </p>
              </div>
            </div>

            {/* Comparison Table */}
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
              }}
            >
              {/* Headers */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `180px repeat(${
                    result.comparison?.length || 2
                  }, 1fr)`,
                  background: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    padding: "16px",
                    fontWeight: "600",
                    color: "#64748b",
                    fontSize: "12px",
                    textTransform: "uppercase",
                  }}
                >
                  Category
                </div>
                {result.comparison?.map((c: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      fontWeight: "700",
                      color:
                        c.candidateId === result.winner
                          ? "#d97706"
                          : "#1e293b",
                      background:
                        c.candidateId === result.winner
                          ? "#fffbeb"
                          : "transparent",
                      borderLeft: "1px solid #e2e8f0",
                    }}
                  >
                    {c.fullName || `Candidate ${i + 1}`}
                    {c.candidateId === result.winner && " 🏆"}
                  </div>
                ))}
              </div>

              {/* Score Row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `180px repeat(${
                    result.comparison?.length || 2
                  }, 1fr)`,
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    padding: "16px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Match Score
                </div>
                {result.comparison?.map((c: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      borderLeft: "1px solid #e2e8f0",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "28px",
                        fontWeight: "700",
                        color:
                          c.score >= 70
                            ? "#16a34a"
                            : c.score >= 50
                            ? "#d97706"
                            : "#dc2626",
                      }}
                    >
                      {c.score}
                    </span>
                    <span style={{ color: "#94a3b8", fontSize: "13px" }}>
                      /100
                    </span>
                  </div>
                ))}
              </div>

              {/* Verdict Row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `180px repeat(${
                    result.comparison?.length || 2
                  }, 1fr)`,
                  background: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    padding: "16px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Verdict
                </div>
                {result.comparison?.map((c: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      borderLeft: "1px solid #e2e8f0",
                    }}
                  >
                    <span
                      style={{
                        padding: "6px 14px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "600",
                        ...(verdictColors[c.verdict] || {
                          background: "#f1f5f9",
                          color: "#64748b",
                        }),
                      }}
                    >
                      {c.verdict}
                    </span>
                  </div>
                ))}
              </div>

              {/* Strength Row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `180px repeat(${
                    result.comparison?.length || 2
                  }, 1fr)`,
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    padding: "16px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Top Strength
                </div>
                {result.comparison?.map((c: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      padding: "16px",
                      fontSize: "13px",
                      color: "#475569",
                      borderLeft: "1px solid #e2e8f0",
                    }}
                  >
                    {c.topStrength}
                  </div>
                ))}
              </div>

              {/* Gap Row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `180px repeat(${
                    result.comparison?.length || 2
                  }, 1fr)`,
                  background: "#f8fafc",
                }}
              >
                <div
                  style={{
                    padding: "16px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Main Gap
                </div>
                {result.comparison?.map((c: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      padding: "16px",
                      fontSize: "13px",
                      color: "#475569",
                      borderLeft: "1px solid #e2e8f0",
                    }}
                  >
                    {c.biggestGap}
                  </div>
                ))}
              </div>
            </div>

            {/* Bias Notice */}
            <div
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "12px",
                padding: "16px",
                marginTop: "20px",
              }}
            >
              <p style={{ color: "#92400e", fontSize: "13px" }}>
                ⚠️ {result.biasNotice}
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// Main page wraps content in Suspense
export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: "#f8fafc",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "4px solid #e9d5ff",
              borderTop: "4px solid #7c3aed",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}