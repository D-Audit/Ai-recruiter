"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import { getApplicants } from "../../../services/applicantService";
import { getResults } from "../../../services/screeningService";
import {
  ArrowLeft,
  MapPin,
  BookOpen,
  Globe,
  Briefcase,
  CheckCircle,
  XCircle,
  Star,
} from "lucide-react";

export default function CandidateDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [candidate, setCandidate] = useState<any>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get candidate info from URL search params
    const searchParams = new URLSearchParams(window.location.search);
    const jobId = searchParams.get("jobId");

    if (jobId) {
      // Get AI result for this candidate
      getResults(jobId)
        .then((d) => {
          const results = d.data?.rankedCandidates || [];
          const found = results.find(
            (r: any) =>
              r.candidateId?._id === id || r.candidateId === id
          );
          if (found) {
            setAiResult(found);
            setCandidate(found.candidateId);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id]);

  const scoreColor =
    aiResult?.score >= 70
      ? "#16a34a"
      : aiResult?.score >= 50
      ? "#d97706"
      : "#dc2626";

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
            fontSize: "14px",
          }}
        >
          <ArrowLeft size={18} /> Back to Results
        </button>

        {loading ? (
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "48px",
              textAlign: "center",
              color: "#94a3b8",
            }}
          >
            Loading candidate details...
          </div>
        ) : !candidate && !aiResult ? (
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "48px",
              textAlign: "center",
              color: "#94a3b8",
            }}
          >
            <p>Candidate not found.</p>
            <p style={{ fontSize: "13px", marginTop: "8px" }}>
              Make sure you navigated here from the screening results page.
            </p>
          </div>
        ) : (
          <div style={{ maxWidth: "720px" }}>
            {/* Profile Header */}
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                padding: "32px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "24px",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "32px",
                  fontWeight: "700",
                  flexShrink: 0,
                }}
              >
                {candidate?.fullName?.charAt(0) || "?"}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <h1
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#1e293b",
                    marginBottom: "6px",
                  }}
                >
                  {candidate?.fullName || "Unknown Candidate"}
                </h1>
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  {candidate?.location && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        color: "#64748b",
                        fontSize: "13px",
                      }}
                    >
                      <MapPin size={13} /> {candidate.location}
                    </span>
                  )}
                  {candidate?.yearsOfExperience !== undefined && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        color: "#64748b",
                        fontSize: "13px",
                      }}
                    >
                      <Briefcase size={13} />{" "}
                      {candidate.yearsOfExperience} years exp
                    </span>
                  )}
                  {candidate?.education && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        color: "#64748b",
                        fontSize: "13px",
                      }}
                    >
                      <BookOpen size={13} /> {candidate.education}
                    </span>
                  )}
                </div>
              </div>

              {/* Score Circle */}
              {aiResult && (
                <div
                  style={{
                    width: "90px",
                    height: "90px",
                    borderRadius: "50%",
                    border: `6px solid ${scoreColor}`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      color: scoreColor,
                      lineHeight: 1,
                    }}
                  >
                    {aiResult.score}
                  </span>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                    /100
                  </span>
                </div>
              )}
            </div>

            {/* Skills Section */}
            {(candidate?.skills?.length > 0 ||
              aiResult?.skillsMatched?.length > 0) && (
              <div
                style={{
                  background: "white",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  padding: "24px",
                  marginBottom: "20px",
                }}
              >
                <h3
                  style={{
                    fontWeight: "700",
                    color: "#1e293b",
                    marginBottom: "16px",
                    fontSize: "16px",
                  }}
                >
                  Skills Analysis
                </h3>

                {aiResult?.skillsMatched?.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#16a34a",
                        marginBottom: "8px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      ✓ Matched Skills
                    </p>
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                    >
                      {aiResult.skillsMatched.map((s: string) => (
                        <span
                          key={s}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "6px 12px",
                            background: "#f0fdf4",
                            color: "#16a34a",
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: "500",
                            border: "1px solid #bbf7d0",
                          }}
                        >
                          <CheckCircle size={12} /> {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {aiResult?.skillsMissing?.length > 0 && (
                  <div>
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#dc2626",
                        marginBottom: "8px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      ✗ Missing Skills
                    </p>
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                    >
                      {aiResult.skillsMissing.map((s: string) => (
                        <span
                          key={s}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "6px 12px",
                            background: "#fef2f2",
                            color: "#dc2626",
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: "500",
                            border: "1px solid #fecaca",
                          }}
                        >
                          <XCircle size={12} /> {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Analysis */}
            {aiResult && (
              <div
                style={{
                  background: "white",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  padding: "24px",
                  marginBottom: "20px",
                }}
              >
                <h3
                  style={{
                    fontWeight: "700",
                    color: "#1e293b",
                    marginBottom: "20px",
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  🤖 AI Analysis
                </h3>

                {/* Strengths */}
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "12px",
                  }}
                >
                  <p
                    style={{
                      fontWeight: "700",
                      color: "#16a34a",
                      marginBottom: "8px",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    ✓ Strengths
                  </p>
                  <p style={{ color: "#374151", fontSize: "14px", lineHeight: "1.6" }}>
                    {aiResult.strengths}
                  </p>
                </div>

                {/* Gaps */}
                <div
                  style={{
                    background: "#fff7ed",
                    border: "1px solid #fed7aa",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "12px",
                  }}
                >
                  <p
                    style={{
                      fontWeight: "700",
                      color: "#c2410c",
                      marginBottom: "8px",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    ⚡ Gaps
                  </p>
                  <p style={{ color: "#374151", fontSize: "14px", lineHeight: "1.6" }}>
                    {aiResult.gaps}
                  </p>
                </div>

                {/* Recommendation */}
                <div
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  <p
                    style={{
                      fontWeight: "700",
                      color: "#1d4ed8",
                      marginBottom: "8px",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Star size={13} /> Final Recommendation
                  </p>
                  <p style={{ color: "#374151", fontSize: "14px", lineHeight: "1.6" }}>
                    {aiResult.recommendation}
                  </p>
                </div>
              </div>
            )}

            {/* Past Projects */}
            {candidate?.pastProjects?.length > 0 && (
              <div
                style={{
                  background: "white",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  padding: "24px",
                  marginBottom: "20px",
                }}
              >
                <h3
                  style={{
                    fontWeight: "700",
                    color: "#1e293b",
                    marginBottom: "16px",
                    fontSize: "16px",
                  }}
                >
                  Past Projects
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {candidate.pastProjects.map((project: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        padding: "16px",
                        background: "#f8fafc",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: "600",
                          color: "#1e293b",
                          marginBottom: "4px",
                        }}
                      >
                        {project.title}
                      </p>
                      <p
                        style={{
                          color: "#64748b",
                          fontSize: "13px",
                          marginBottom: "8px",
                        }}
                      >
                        {project.description}
                      </p>
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}
                      >
                        {project.techUsed?.map((tech: string) => (
                          <span
                            key={tech}
                            style={{
                              padding: "3px 10px",
                              background: "#eff6ff",
                              color: "#2563eb",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {candidate?.languages?.length > 0 && (
              <div
                style={{
                  background: "white",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  padding: "24px",
                  marginBottom: "20px",
                }}
              >
                <h3
                  style={{
                    fontWeight: "700",
                    color: "#1e293b",
                    marginBottom: "12px",
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Globe size={18} /> Languages
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {candidate.languages.map((lang: string) => (
                    <span
                      key={lang}
                      style={{
                        padding: "6px 16px",
                        background: "#f5f3ff",
                        color: "#7c3aed",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "500",
                        border: "1px solid #ddd6fe",
                      }}
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bias Notice */}
            <div
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <p style={{ color: "#92400e", fontSize: "13px" }}>
                ⚠️ AI screening is a decision-support tool only. Final
                hiring decisions must always be made by qualified human
                recruiters.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}