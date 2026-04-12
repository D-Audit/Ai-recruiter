"use client";
import { Suspense, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import AppHeader from "../../../components/AppHeader";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { getResults } from "../../../services/screeningService";
import {
  ArrowLeft, MapPin, Briefcase, GraduationCap, Globe, Link2,
  CheckCircle, XCircle, Star, Award, FolderOpen, ExternalLink, FileText,
} from "lucide-react";

const levelColor: Record<string, string> = {
  Beginner: "#e0f2fe", Intermediate: "#ede9fe", Advanced: "#dcfce7", Expert: "#fef9c3",
};
const levelText: Record<string, string> = {
  Beginner: "#0369a1", Intermediate: "#6d28d9", Advanced: "#15803d", Expert: "#ca8a04",
};
const proficiencyColor: Record<string, string> = {
  Basic: "#f1f5f9", Conversational: "#ede9fe", Fluent: "#dcfce7", Native: "#fef9c3",
};
const proficiencyText: Record<string, string> = {
  Basic: "#475569", Conversational: "#6d28d9", Fluent: "#15803d", Native: "#ca8a04",
};
const confidenceStyle: Record<string, { bg: string; color: string }> = {
  High: { bg: "#dcfce7", color: "#15803d" },
  Medium: { bg: "#fef9c3", color: "#ca8a04" },
  Low: { bg: "#fee2e2", color: "#dc2626" },
};

function CandidateDetailInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = String(params.id || "");
  const jobId = searchParams.get("jobId");
  const [candidate, setCandidate] = useState<any>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [biasNotice, setBiasNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const backHref = jobId ? `/screenings/${jobId}` : "/screenings";
  const displayName = candidate
    ? `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim()
    : "";

  useEffect(() => {
    if (!jobId || !id) {
      setLoading(false);
      return;
    }
    getResults(jobId)
      .then((d) => {
        setBiasNotice(typeof d.data?.biasNotice === "string" ? d.data.biasNotice : null);
        const results = d.data?.rankedCandidates || [];
        const found = results.find(
          (r: any) => r.candidateId?._id === id || r.candidateId === id
        );
        if (found) {
          setAiResult(found);
          setCandidate(found.candidateId);
        }
      })
      .finally(() => setLoading(false));
  }, [id, jobId]);

  const scoreColor = aiResult?.score >= 70 ? "#15803d" : aiResult?.score >= 50 ? "#ca8a04" : "#dc2626";

  const linkStyle: CSSProperties = {
    color: "#2563eb",
    fontWeight: 600,
    fontSize: 13,
    textDecoration: "none",
  };
  const mutedLink: CSSProperties = { color: "#64748b", fontWeight: 600, fontSize: 13, textDecoration: "none" };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div
        style={{
          marginLeft: 260,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          background: "#f8fafc",
        }}
      >
        <AppHeader
          title={displayName || "Candidate profile"}
          subtitle={
            jobId
              ? "Screening context · use the links below to move around the app"
              : "Open from screening results (link includes ?jobId=) for full AI context"
          }
        />
        <main style={{ padding: "24px 40px 48px", flex: 1 }}>
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

        {loading ? (
          <LoadingSpinner label="Loading profile…" />
        ) : !candidate && !aiResult ? (
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "48px", textAlign: "center" }}>
            <p style={{ color: "#64748b", marginBottom: 16, lineHeight: 1.6 }}>
              {!jobId
                ? "This page needs a job context. Open a candidate from screening results (the link includes ?jobId=)."
                : "No candidate match in the screening results for this job. Return to results or pick another candidate."}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
              <Link href={backHref} style={{ ...linkStyle, padding: "10px 18px", borderRadius: 10, border: "1px solid #bfdbfe", background: "#eff6ff" }}>
                ← Screening results
              </Link>
              <Link href="/jobs" style={{ ...linkStyle, padding: "10px 18px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569" }}>
                All jobs
              </Link>
              <Link href="/dashboard" style={{ ...linkStyle, padding: "10px 18px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569" }}>
                Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: "760px" }}>

            {/* AI Analysis — shown first when screening data exists */}
            {aiResult && (
              <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "16px" }}>
                <h3 style={{ fontWeight: "700", color: "#1e293b", marginBottom: "16px", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                  AI Analysis
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "14px" }}>
                    <p style={{ fontWeight: "600", color: "#15803d", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Strengths</p>
                    <p style={{ color: "#374151", fontSize: "13px", lineHeight: "1.6" }}>{aiResult.strengths}</p>
                  </div>
                  <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "10px", padding: "14px" }}>
                    <p style={{ fontWeight: "600", color: "#c2410c", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Gaps</p>
                    <p style={{ color: "#374151", fontSize: "13px", lineHeight: "1.6" }}>{aiResult.gaps}</p>
                  </div>
                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "14px" }}>
                    <p style={{ fontWeight: "600", color: "#1d4ed8", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
                      <Star size={11} /> Recommendation
                    </p>
                    <p style={{ color: "#374151", fontSize: "13px", lineHeight: "1.6" }}>{aiResult.recommendation}</p>
                  </div>
                </div>

                {(aiResult.skillsMatched?.length > 0 || aiResult.skillsMissing?.length > 0) && (
                  <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
                    <p style={{ fontWeight: "600", color: "#1e293b", fontSize: "13px", marginBottom: "8px" }}>Skills Analysis</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {aiResult.skillsMatched?.map((s: string) => (
                        <span key={s} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", background: "#f0fdf4", color: "#15803d", borderRadius: "6px", fontSize: "12px", fontWeight: "500" }}>
                          <CheckCircle size={10} />{s}
                        </span>
                      ))}
                      {aiResult.skillsMissing?.map((s: string) => (
                        <span key={s} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", background: "#fef2f2", color: "#dc2626", borderRadius: "6px", fontSize: "12px", fontWeight: "500" }}>
                          <XCircle size={10} />{s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {aiResult.upskillingPaths?.length > 0 && (
                  <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
                    <p style={{ fontWeight: "600", color: "#1e293b", fontSize: "13px", marginBottom: "8px" }}>Upskilling paths</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {aiResult.upskillingPaths.map((u: { skill: string; reason: string; suggestedResource?: string }, i: number) => (
                        <div key={i} style={{ padding: "12px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                          <p style={{ fontWeight: "700", fontSize: "13px", color: "#0f172a" }}>{u.skill}</p>
                          <p style={{ fontSize: "12px", color: "#64748b", marginTop: 4 }}>{u.reason}</p>
                          {u.suggestedResource ? (
                            <a href={u.suggestedResource} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", fontWeight: 600, color: "#2563eb", marginTop: 6, display: "inline-block" }}>
                              Suggested resource →
                            </a>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aiResult.adjacentRoles?.length > 0 && (
                  <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
                    <p style={{ fontWeight: "600", color: "#1e293b", fontSize: "13px", marginBottom: "8px" }}>Adjacent roles</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {aiResult.adjacentRoles.map((role: string) => (
                        <span key={role} style={{ padding: "4px 10px", borderRadius: "8px", background: "#f1f5f9", color: "#475569", fontSize: "12px", fontWeight: 600 }}>{role}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Header */}
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "28px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
                <div style={{
                  width: "88px", height: "88px", borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg,#2563eb,#7c3aed)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontSize: "28px", fontWeight: "700",
                }}>{`${candidate?.firstName?.charAt(0) || ""}${candidate?.lastName?.charAt(0) || ""}`.toUpperCase() || "?"}</div>
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#1e293b", marginBottom: "4px" }}>
                    {candidate?.firstName} {candidate?.lastName}
                  </h1>
                  <p style={{ color: "#2563eb", fontWeight: "600", marginBottom: "8px", fontSize: "14px" }}>
                    {candidate?.headline}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", color: "#64748b", fontSize: "13px" }}>
                    {candidate?.location && <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={13} />{candidate.location}</span>}
                    {candidate?.experience?.length > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Briefcase size={13} />
                        {candidate.experience.filter((e: any) => e.isCurrent).length > 0
                          ? candidate.experience.find((e: any) => e.isCurrent)?.role + " at " + candidate.experience.find((e: any) => e.isCurrent)?.company
                          : candidate.experience[0]?.role}
                      </span>
                    )}
                    {candidate?.availability && (
                      <span style={{
                        padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600",
                        background: candidate.availability.status === "Available" ? "#dcfce7" : "#fef9c3",
                        color: candidate.availability.status === "Available" ? "#15803d" : "#ca8a04",
                      }}>{candidate.availability.status} · {candidate.availability.type}</span>
                    )}
                  </div>
                  {candidate?.bio && (
                    <p style={{ marginTop: "10px", color: "#475569", fontSize: "13px", lineHeight: "1.6" }}>{candidate.bio}</p>
                  )}
                </div>
                {/* Score circle */}
                {aiResult && (
                  <div style={{ flexShrink: 0, textAlign: "center" }}>
                    <div style={{
                      width: "80px", height: "80px", borderRadius: "50%",
                      border: `5px solid ${scoreColor}`,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: "22px", fontWeight: "700", color: scoreColor, lineHeight: 1 }}>{aiResult.score}</span>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>/100</span>
                    </div>
                    {aiResult.confidence && (
                      <span style={{
                        display: "inline-block", marginTop: "6px", padding: "3px 10px",
                        borderRadius: "20px", fontSize: "11px", fontWeight: "600",
                        background: confidenceStyle[aiResult.confidence]?.bg,
                        color: confidenceStyle[aiResult.confidence]?.color,
                      }}>{aiResult.confidence} Confidence</span>
                    )}
                  </div>
                )}
              </div>
              {/* Social Links + Resume */}
              {(candidate?.resumeUrl || (candidate?.socialLinks && (candidate.socialLinks.linkedin || candidate.socialLinks.github || candidate.socialLinks.portfolio))) && (
                <div style={{ display: "flex", gap: "10px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #f1f5f9", flexWrap: "wrap" }}>
                  {/* View Resume — only shown if backend has stored a resumeUrl */}
                  {candidate.resumeUrl && (
                    <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer" style={{
                      display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px",
                      borderRadius: "8px", background: "#f0fdf4", color: "#15803d",
                      textDecoration: "none", fontSize: "12px", fontWeight: "600",
                      border: "1px solid #bbf7d0",
                    }}>
                      <FileText size={12} /> View Resume <ExternalLink size={10} />
                    </a>
                  )}
                  {candidate.socialLinks?.linkedin && (
                    <a href={candidate.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" style={{
                      display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px",
                      borderRadius: "8px", background: "#eff6ff", color: "#2563eb",
                      textDecoration: "none", fontSize: "12px", fontWeight: "500",
                    }}>
                      <Link2 size={12} /> LinkedIn <ExternalLink size={10} />
                    </a>
                  )}
                  {candidate.socialLinks?.github && (
                    <a href={candidate.socialLinks.github} target="_blank" rel="noopener noreferrer" style={{
                      display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px",
                      borderRadius: "8px", background: "#f8fafc", color: "#475569",
                      textDecoration: "none", fontSize: "12px", fontWeight: "500",
                    }}>
                      <Link2 size={12} /> GitHub <ExternalLink size={10} />
                    </a>
                  )}
                  {candidate.socialLinks?.portfolio && (
                    <a href={candidate.socialLinks.portfolio} target="_blank" rel="noopener noreferrer" style={{
                      display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px",
                      borderRadius: "8px", background: "#f5f3ff", color: "#7c3aed",
                      textDecoration: "none", fontSize: "12px", fontWeight: "500",
                    }}>
                      <Link2 size={12} /> Portfolio <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Skills */}
            {candidate?.skills?.length > 0 && (
              <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "16px" }}>
                <h3 style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Award size={16} /> Skills
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {candidate.skills.map((s: any) => (
                    <div key={s.name} style={{
                      padding: "6px 12px", borderRadius: "8px",
                      background: levelColor[s.level] || "#f1f5f9",
                      border: "1px solid rgba(0,0,0,0.05)",
                    }}>
                      <span style={{ fontWeight: "600", color: levelText[s.level] || "#475569", fontSize: "13px" }}>{s.name}</span>
                      <span style={{ color: levelText[s.level] || "#475569", fontSize: "11px", marginLeft: "6px", opacity: 0.8 }}>
                        {s.level} · {s.yearsOfExperience}y
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {candidate?.experience?.length > 0 && (
              <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "16px" }}>
                <h3 style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Briefcase size={16} /> Work Experience
                </h3>
                {candidate.experience.map((ex: any, i: number) => (
                  <div key={i} style={{ borderLeft: "3px solid #2563eb", paddingLeft: "16px", marginBottom: "16px", position: "relative" }}>
                    <div style={{
                      position: "absolute", left: "-6px", top: "4px", width: "10px", height: "10px",
                      borderRadius: "50%", background: ex.isCurrent ? "#2563eb" : "#cbd5e1",
                    }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ fontWeight: "700", color: "#1e293b", fontSize: "14px" }}>{ex.role}</p>
                        <p style={{ color: "#2563eb", fontWeight: "600", fontSize: "13px" }}>{ex.company}</p>
                      </div>
                      <span style={{ fontSize: "12px", color: "#94a3b8", whiteSpace: "nowrap" }}>
                        {ex.startDate} → {ex.isCurrent ? "Present" : ex.endDate}
                        {ex.isCurrent && <span style={{ marginLeft: "6px", background: "#dbeafe", color: "#1d4ed8", padding: "2px 6px", borderRadius: "4px", fontSize: "10px" }}>Current</span>}
                      </span>
                    </div>
                    {ex.description && <p style={{ color: "#475569", fontSize: "13px", marginTop: "6px", lineHeight: "1.5" }}>{ex.description}</p>}
                    {ex.technologies?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
                        {ex.technologies.map((t: string) => (
                          <span key={t} style={{ padding: "2px 8px", background: "#f1f5f9", color: "#475569", borderRadius: "4px", fontSize: "11px" }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Education */}
            {candidate?.education?.length > 0 && (
              <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "16px" }}>
                <h3 style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <GraduationCap size={16} /> Education
                </h3>
                {candidate.education.map((ed: any, i: number) => (
                  <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <GraduationCap size={18} color="#15803d" />
                    </div>
                    <div>
                      <p style={{ fontWeight: "700", color: "#1e293b", fontSize: "14px" }}>{ed.degree} in {ed.fieldOfStudy}</p>
                      <p style={{ color: "#64748b", fontSize: "13px" }}>{ed.institution}</p>
                      <p style={{ color: "#94a3b8", fontSize: "12px" }}>{ed.startYear} – {ed.endYear}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Certifications — optional but displayed when present */}
            {candidate?.certifications?.length > 0 && (
              <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "16px" }}>
                <h3 style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Award size={16} /> Certifications
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {candidate.certifications.map((c: any, i: number) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "#fffbeb", borderRadius: "10px", border: "1px solid #fde68a" }}>
                      <Award size={16} color="#ca8a04" />
                      <div>
                        <p style={{ fontWeight: "600", color: "#1e293b", fontSize: "13px" }}>{c.name}</p>
                        <p style={{ color: "#64748b", fontSize: "12px" }}>{c.issuer} · {c.issueDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects — optional but displayed when present */}
            {candidate?.projects?.length > 0 && (
              <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "16px" }}>
                <h3 style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FolderOpen size={16} /> Projects
                </h3>
                {candidate.projects.map((pr: any, i: number) => (
                  <div key={i} style={{ padding: "14px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ fontWeight: "700", color: "#1e293b", fontSize: "13px" }}>{pr.name}</p>
                        {pr.role && <p style={{ color: "#2563eb", fontSize: "12px", fontWeight: "500" }}>{pr.role}</p>}
                      </div>
                      {pr.link && (
                        <a href={pr.link} target="_blank" rel="noopener noreferrer" style={{
                          display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px",
                          borderRadius: "6px", background: "#eff6ff", color: "#2563eb",
                          textDecoration: "none", fontSize: "11px", fontWeight: "500",
                        }}>
                          <ExternalLink size={10} /> View
                        </a>
                      )}
                    </div>
                    {pr.description && <p style={{ color: "#475569", fontSize: "12px", marginTop: "6px" }}>{pr.description}</p>}
                    {pr.technologies?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
                        {pr.technologies.map((t: string) => (
                          <span key={t} style={{ padding: "2px 8px", background: "#eff6ff", color: "#2563eb", borderRadius: "4px", fontSize: "11px" }}>{t}</span>
                        ))}
                      </div>
                    )}
                    {(pr.startDate || pr.endDate) && (
                      <p style={{ color: "#94a3b8", fontSize: "11px", marginTop: "6px" }}>{pr.startDate} → {pr.endDate || "Present"}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Languages — optional, displayed when present */}
            {candidate?.languages?.length > 0 && (
              <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "16px" }}>
                <h3 style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Globe size={16} /> Languages
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {candidate.languages.map((l: any) => (
                    <span key={l.name} style={{
                      padding: "6px 14px", borderRadius: "8px",
                      background: proficiencyColor[l.proficiency] || "#f1f5f9",
                      color: proficiencyText[l.proficiency] || "#475569",
                      fontSize: "13px", fontWeight: "500",
                    }}>
                      {l.name} <span style={{ opacity: 0.7, fontWeight: "400" }}>· {l.proficiency}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bias Notice */}
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "14px" }}>
              <p style={{ color: "#92400e", fontSize: "12px", lineHeight: 1.55 }}>
                ⚠️ {biasNotice || "AI screening is a decision-support tool. Final hiring decisions must be made by qualified human recruiters."}
              </p>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}

export default function CandidateDetailPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage label="Loading candidate…" />}>
      <CandidateDetailInner />
    </Suspense>
  );
}