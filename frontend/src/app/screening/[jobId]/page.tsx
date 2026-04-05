"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import {
  triggerScreening,
  fetchResults,
  toggleSelectForCompare,
} from "../../../store/slices/screeningSlice";
import { AppDispatch, RootState } from "../../../store";
import Sidebar from "../../../components/Sidebar";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  Brain,
  Users,
  Trophy,
  TrendingUp,
  CheckCircle,
  XCircle,
  GitCompare,
} from "lucide-react";

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 70 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div
        style={{
          flex: 1,
          height: "8px",
          background: "#f1f5f9",
          borderRadius: "99px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: "100%",
            background: color,
            borderRadius: "99px",
            transition: "width 0.7s ease",
          }}
        />
      </div>
      <span style={{ fontSize: "13px", fontWeight: "700", color, width: "48px", textAlign: "right" }}>
        {score}/100
      </span>
    </div>
  );
}

export default function ScreeningPage() {
  const { jobId } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { results, loading, selectedForCompare } = useSelector(
    (state: RootState) => state.screening
  );

  useEffect(() => {
    if (jobId) dispatch(fetchResults(jobId as string));
  }, [jobId]);

  const handleRunScreening = async () => {
    try {
      await dispatch(triggerScreening(jobId as string)).unwrap();
      toast.success("AI screening completed!");
    } catch (err: any) {
      toast.error(err || "Screening failed");
    }
  };

  const handleCompare = () => {
    if (selectedForCompare.length < 2) {
      toast.error("Select at least 2 candidates to compare");
      return;
    }
    router.push(
      `/candidates/compare?jobId=${jobId}&ids=${selectedForCompare.join(",")}`
    );
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
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b" }}>
              AI Screening Results
            </h1>
            <p style={{ color: "#64748b", marginTop: "4px" }}>
              Powered by Google Gemini AI
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            {selectedForCompare.length >= 2 && (
              <button
                onClick={handleCompare}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  border: "2px solid #7c3aed",
                  background: "transparent",
                  color: "#7c3aed",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                <GitCompare size={18} /> Compare ({selectedForCompare.length})
              </button>
            )}
            <button
              onClick={handleRunScreening}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                borderRadius: "12px",
                background: loading
                  ? "#94a3b8"
                  : "linear-gradient(135deg, #7c3aed, #2563eb)",
                color: "white",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "600",
              }}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTop: "2px solid white",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  Screening...
                </>
              ) : (
                <>
                  <Brain size={18} />
                  {results ? "Re-run Screening" : "Run AI Screening"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading */}
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
                width: "64px",
                height: "64px",
                border: "4px solid #e9d5ff",
                borderTop: "4px solid #7c3aed",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 20px",
              }}
            />
            <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#374151", marginBottom: "8px" }}>
              AI is analyzing candidates...
            </h3>
            <p style={{ color: "#94a3b8" }}>
              Gemini is scoring and ranking all applicants. This takes 15–30 seconds.
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* No results yet */}
        {!loading && !results && (
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "64px",
              textAlign: "center",
            }}
          >
            <Brain size={64} color="#cbd5e1" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#374151", marginBottom: "8px" }}>
              Ready to Screen
            </h3>
            <p style={{ color: "#94a3b8", marginBottom: "24px" }}>
              Click the button above to analyze all applicants and get a ranked shortlist
            </p>
          </div>
        )}

        {/* Results */}
        {!loading && results && (
          <>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
              {[
                { label: "Total Screened", value: results.totalApplicants, icon: Users, color: "#2563eb" },
                { label: "Shortlisted", value: results.shortlistedCount, icon: Trophy, color: "#d97706" },
                { label: "Top Score", value: `${results.rankedCandidates?.[0]?.score || 0}%`, icon: TrendingUp, color: "#16a34a" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    padding: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: `${stat.color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <stat.icon size={22} color={stat.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: "26px", fontWeight: "700", color: "#1e293b" }}>
                      {stat.value}
                    </p>
                    <p style={{ color: "#64748b", fontSize: "13px" }}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bias Notice */}
            <div
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "20px",
                display: "flex",
                gap: "10px",
              }}
            >
              <span style={{ fontSize: "18px" }}>⚠️</span>
              <p style={{ color: "#92400e", fontSize: "13px" }}>{results.biasNotice}</p>
            </div>

            {/* Hint */}
            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "16px",
                color: "#1d4ed8",
                fontSize: "13px",
              }}
            >
              💡 Select 2–3 candidates using checkboxes below then click Compare
            </div>

            {/* Candidate Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {results.rankedCandidates?.map((candidate: any, index: number) => {
                const isSelected = selectedForCompare.includes(candidate.candidateId?._id || candidate.candidateId);
                const rankColors = ["#f59e0b", "#94a3b8", "#d97706"];

                return (
                  <div
                    key={index}
                    style={{
                      background: "white",
                      borderRadius: "16px",
                      border: `2px solid ${isSelected ? "#7c3aed" : "#e2e8f0"}`,
                      padding: "24px",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          dispatch(
                            toggleSelectForCompare(
                              candidate.candidateId?._id || candidate.candidateId
                            )
                          )
                        }
                        style={{ width: "18px", height: "18px", accentColor: "#7c3aed", marginTop: "4px", cursor: "pointer" }}
                      />

                      {/* Rank */}
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          background: index < 3 ? rankColors[index] : "#e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: index < 3 ? "white" : "#64748b",
                          fontWeight: "700",
                          fontSize: "14px",
                          flexShrink: 0,
                        }}
                      >
                        #{candidate.rank}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                          <div>
                            <p style={{ fontWeight: "700", fontSize: "17px", color: "#1e293b" }}>
                              {candidate.candidateId?.fullName || `Candidate #${candidate.rank}`}
                            </p>
                            <p style={{ color: "#64748b", fontSize: "13px" }}>
                              {candidate.candidateId?.email || ""}
                            </p>
                          </div>
                          <Link href={`/candidates/${candidate.candidateId?._id || candidate.candidateId}`}>
                            <button
                              style={{
                                padding: "8px 16px",
                                borderRadius: "8px",
                                border: "1px solid #bfdbfe",
                                background: "transparent",
                                color: "#2563eb",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "500",
                              }}
                            >
                              View Details
                            </button>
                          </Link>
                        </div>

                        {/* Score Bar */}
                        <div style={{ marginBottom: "12px" }}>
                          <ScoreBar score={candidate.score} />
                        </div>

                        {/* Skills */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                          {candidate.skillsMatched?.map((s: string) => (
                            <span
                              key={s}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 10px",
                                background: "#f0fdf4",
                                color: "#16a34a",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "500",
                              }}
                            >
                              <CheckCircle size={10} /> {s}
                            </span>
                          ))}
                          {candidate.skillsMissing?.map((s: string) => (
                            <span
                              key={s}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 10px",
                                background: "#fef2f2",
                                color: "#dc2626",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "500",
                              }}
                            >
                              <XCircle size={10} /> {s}
                            </span>
                          ))}
                        </div>

                        {/* Strengths and Gaps */}
                        <p style={{ color: "#475569", fontSize: "13px", marginBottom: "6px" }}>
                          <span style={{ fontWeight: "600", color: "#16a34a" }}>✓ Strengths: </span>
                          {candidate.strengths}
                        </p>
                        <p style={{ color: "#475569", fontSize: "13px" }}>
                          <span style={{ fontWeight: "600", color: "#d97706" }}>⚡ Gaps: </span>
                          {candidate.gaps}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}