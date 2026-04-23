"use client";
import { Suspense, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import AppHeader from "../../../components/AppHeader";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { getApplicantById } from "../../../services/applicantService";
import { getResults } from "../../../services/screeningService";
import {
  ArrowLeft, MapPin, Briefcase, GraduationCap, Globe, Link2,
  CheckCircle, XCircle, Star, Award, FolderOpen, ExternalLink,
  FileText, Mail, Phone, User,
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
  High:   { bg: "#dcfce7", color: "#15803d" },
  Medium: { bg: "#fef9c3", color: "#ca8a04" },
  Low:    { bg: "#fee2e2", color: "#dc2626" },
};

function CandidateDetailInner() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const id    = String(params.id || "");
  const jobId = searchParams.get("jobId") || "";

  const [candidate, setCandidate] = useState<any>(null);
  const [aiResult,  setAiResult]  = useState<any>(null);
  const [biasNotice, setBiasNotice] = useState<string>("");
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  // ── FIXED backHref: use query param route, not dynamic segment ──
  const backHref = jobId ? `/screenings?jobId=${jobId}` : "/screenings";

  const displayName = candidate
    ? `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim()
    : "Candidate Profile";

  useEffect(() => {
    if (!id) { setLoading(false); setError("No candidate ID in URL."); return; }

    const loadData = async () => {
      try {
        // FIXED: Always fetch candidate directly by ID — works with or without screening
        const applicantRes = await getApplicantById(id);
        setCandidate(applicantRes.applicant);

        // If jobId present, also fetch AI screening results for this candidate
        if (jobId) {
          try {
            const screeningRes = await getResults(jobId);
            setBiasNotice(typeof screeningRes.data?.biasNotice === "string" ? screeningRes.data.biasNotice : "");
            const ranked = screeningRes.data?.rankedCandidates || [];
            const found  = ranked.find(
              (r: any) => r.candidateId?._id === id || r.candidateId === id
            );
            if (found) setAiResult(found);
          } catch {
            // Screening not run yet — profile still shows, just no AI section
          }
        }
      } catch {
        setError("Could not load this candidate's profile.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, jobId]);

  const scoreColor = aiResult?.score >= 70 ? "#15803d" : aiResult?.score >= 50 ? "#ca8a04" : "#dc2626";

  const mutedLink: CSSProperties = { color: "#64748b", fontWeight: 600, fontSize: 13, textDecoration: "none" };
  const linkStyle: CSSProperties = { color: "#2563eb", fontWeight: 600, fontSize: 13, textDecoration: "none" };

  return (
    <div style={{ display: "flex", fontFamily: "var(--font-body, system-ui)" }}>
      <Sidebar />
      <div style={{ marginLeft: "var(--sidebar-width, 260px)", flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--surface-base, #f0f2f8)" }}>
        <AppHeader
          title={displayName}
          subtitle={jobId ? "Candidate profile · AI screening context included" : "Candidate profile"}
        />
        <main style={{ padding: "24px 40px 60px", flex: 1 }}>

          {/* Breadcrumb nav */}
          <nav style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <Link href={backHref} style={{ ...mutedLink, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <ArrowLeft size={14} /> {jobId ? "Screening results" : "Screenings"}
            </Link>
            <span style={{ color: "#cbd5e1" }}>·</span>
            {jobId && (
              <>
                <Link href={`/jobs/${jobId}`} style={mutedLink}>Job hub</Link>
                <span style={{ color: "#cbd5e1" }}>·</span>
              </>
            )}
            <Link href="/candidates" style={mutedLink}>All candidates</Link>
            <span style={{ color: "#cbd5e1" }}>·</span>
            <Link href="/dashboard" style={mutedLink}>Dashboard</Link>
          </nav>

          {/* Loading */}
          {loading && <LoadingSpinner label="Loading profile…" />}

          {/* Error */}
          {!loading && error && (
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: 48, textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "#fee2e2", border: "1px solid #fca5a5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <User size={24} color="#dc2626" />
              </div>
              <p style={{ color: "#64748b", marginBottom: 20, lineHeight: 1.6 }}>{error}</p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <Link href={backHref} style={{ ...linkStyle, padding: "10px 18px", borderRadius: 10, border: "1px solid #bfdbfe", background: "#eff6ff" }}>
                  ← Go back
                </Link>
                <Link href="/candidates" style={{ ...mutedLink, padding: "10px 18px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                  All candidates
                </Link>
              </div>
            </div>
          )}

          {/* Profile content */}
          {!loading && !error && candidate && (
            <div style={{ maxWidth: 780 }}>

              {/* ── AI Analysis — only when screening exists ── */}
              {aiResult && (
                <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24, marginBottom: 16 }}>
                  <h3 style={{ fontWeight: 700, color: "#1e293b", marginBottom: 16, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                    <Star size={15} color="#ca8a04" /> AI Analysis
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 14 }}>
                      <p style={{ fontWeight: 600, color: "#15803d", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Strengths</p>
                      <p style={{ color: "#374151", fontSize: 13, lineHeight: 1.6 }}>{aiResult.strengths}</p>
                    </div>
                    <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: 14 }}>
                      <p style={{ fontWeight: 600, color: "#c2410c", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Gaps</p>
                      <p style={{ color: "#374151", fontSize: 13, lineHeight: 1.6 }}>{aiResult.gaps}</p>
                    </div>
                    <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 14 }}>
                      <p style={{ fontWeight: 600, color: "#1d4ed8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Recommendation</p>
                      <p style={{ color: "#374151", fontSize: 13, lineHeight: 1.6 }}>{aiResult.recommendation}</p>
                    </div>
                  </div>
                  {(aiResult.skillsMatched?.length > 0 || aiResult.skillsMissing?.length > 0) && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
                      <p style={{ fontWeight: 600, color: "#1e293b", fontSize: 13, marginBottom: 8 }}>Skills match</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {aiResult.skillsMatched?.map((s: string) => (
                          <span key={s} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "#f0fdf4", color: "#15803d", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
                            <CheckCircle size={10} />{s}
                          </span>
                        ))}
                        {aiResult.skillsMissing?.map((s: string) => (
                          <span key={s} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "#fef2f2", color: "#dc2626", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
                            <XCircle size={10} />{s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiResult.upskillingPaths?.length > 0 && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
                      <p style={{ fontWeight: 600, color: "#1e293b", fontSize: 13, marginBottom: 8 }}>Upskilling paths</p>
                      {aiResult.upskillingPaths.map((u: any, i: number) => (
                        <div key={i} style={{ padding: 12, background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 8 }}>
                          <p style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{u.skill}</p>
                          <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{u.reason}</p>
                          {u.suggestedResource && (
                            <a href={u.suggestedResource} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: "#2563eb", marginTop: 6, display: "inline-block" }}>
                              Suggested resource →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {aiResult.adjacentRoles?.length > 0 && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
                      <p style={{ fontWeight: 600, color: "#1e293b", fontSize: 13, marginBottom: 8 }}>Adjacent roles</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {aiResult.adjacentRoles.map((role: string) => (
                          <span key={role} style={{ padding: "4px 10px", borderRadius: 8, background: "#f1f5f9", color: "#475569", fontSize: 12, fontWeight: 600 }}>{role}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Profile Header ── */}
              <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: 28, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
                  {/* Avatar */}
                  <div style={{ width: 88, height: 88, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 28, fontWeight: 700 }}>
                    {`${candidate.firstName?.charAt(0)||""}${candidate.lastName?.charAt(0)||""}`.toUpperCase() || <User size={32} />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
                      {candidate.firstName} {candidate.lastName}
                    </h1>
                    {candidate.headline && (
                      <p style={{ color: "#2563eb", fontWeight: 600, marginBottom: 8, fontSize: 14 }}>{candidate.headline}</p>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, color: "#64748b", fontSize: 13 }}>
                      {candidate.location && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={13} />{candidate.location}</span>
                      )}
                      {candidate.email && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Mail size={13} />{candidate.email}</span>
                      )}
                      {candidate.phone && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={13} />{candidate.phone}</span>
                      )}
                      {candidate.availability && (
                        <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: candidate.availability.status === "Available" ? "#dcfce7" : "#fef9c3", color: candidate.availability.status === "Available" ? "#15803d" : "#ca8a04" }}>
                          {candidate.availability.status} · {candidate.availability.type}
                        </span>
                      )}
                    </div>
                    {candidate.bio && (
                      <p style={{ marginTop: 10, color: "#475569", fontSize: 13, lineHeight: 1.6 }}>{candidate.bio}</p>
                    )}
                  </div>

                  {/* AI score circle — only when screened */}
                  {aiResult && (
                    <div style={{ flexShrink: 0, textAlign: "center" }}>
                      <div style={{ width: 80, height: 80, borderRadius: "50%", border: `5px solid ${scoreColor}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 22, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{aiResult.score}</span>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>/100</span>
                      </div>
                      {aiResult.confidence && (
                        <span style={{ display: "inline-block", marginTop: 6, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: confidenceStyle[aiResult.confidence]?.bg, color: confidenceStyle[aiResult.confidence]?.color }}>
                          {aiResult.confidence} confidence
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* ── View Resume + Social Links ── */}
                {(candidate.resumeUrl || candidate.socialLinks?.linkedin || candidate.socialLinks?.github || candidate.socialLinks?.portfolio) && (
                  <div style={{ display: "flex", gap: 10, marginTop: 16, paddingTop: 16, borderTop: "1px solid #f1f5f9", flexWrap: "wrap" }}>
                    {/* View Resume button — only shows if Cloudinary URL was saved */}
                    {candidate.resumeUrl && !candidate.resumeUrl.includes("@resume.uploaded") && (
                      <a
                        href={candidate.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, background: "#f0fdf4", color: "#15803d", textDecoration: "none", fontSize: 13, fontWeight: 700, border: "1px solid #bbf7d0" }}
                      >
                        <FileText size={14} /> View Resume <ExternalLink size={11} />
                      </a>
                    )}
                    {candidate.socialLinks?.linkedin && (
                      <a href={candidate.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 9, background: "#eff6ff", color: "#2563eb", textDecoration: "none", fontSize: 13, fontWeight: 500, border: "1px solid #bfdbfe" }}>
                        <Link2 size={13} /> LinkedIn <ExternalLink size={10} />
                      </a>
                    )}
                    {candidate.socialLinks?.github && (
                      <a href={candidate.socialLinks.github} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 9, background: "#f8fafc", color: "#475569", textDecoration: "none", fontSize: 13, fontWeight: 500, border: "1px solid #e2e8f0" }}>
                        <Link2 size={13} /> GitHub <ExternalLink size={10} />
                      </a>
                    )}
                    {candidate.socialLinks?.portfolio && (
                      <a href={candidate.socialLinks.portfolio} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 9, background: "#f5f3ff", color: "#7c3aed", textDecoration: "none", fontSize: 13, fontWeight: 500, border: "1px solid #ddd6fe" }}>
                        <Link2 size={13} /> Portfolio <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* ── Skills ── */}
              {candidate.skills?.length > 0 && (
                <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24, marginBottom: 16 }}>
                  <h3 style={{ fontWeight: 700, color: "#1e293b", fontSize: 15, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                    <Award size={16} /> Skills
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {candidate.skills.map((s: any) => (
                      <div key={s.name} style={{ padding: "6px 12px", borderRadius: 8, background: levelColor[s.level] || "#f1f5f9", border: "1px solid rgba(0,0,0,0.05)" }}>
                        <span style={{ fontWeight: 600, color: levelText[s.level] || "#475569", fontSize: 13 }}>{s.name}</span>
                        <span style={{ color: levelText[s.level] || "#475569", fontSize: 11, marginLeft: 6, opacity: 0.8 }}>
                          {s.level} · {s.yearsOfExperience}y
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Experience ── */}
              {candidate.experience?.length > 0 && (
                <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24, marginBottom: 16 }}>
                  <h3 style={{ fontWeight: 700, color: "#1e293b", fontSize: 15, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                    <Briefcase size={16} /> Work Experience
                  </h3>
                  {candidate.experience.map((ex: any, i: number) => (
                    <div key={i} style={{ borderLeft: "3px solid #2563eb", paddingLeft: 16, marginBottom: 16, position: "relative" }}>
                      <div style={{ position: "absolute", left: -6, top: 4, width: 10, height: 10, borderRadius: "50%", background: ex.isCurrent ? "#2563eb" : "#cbd5e1" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <p style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>{ex.role}</p>
                          <p style={{ color: "#2563eb", fontWeight: 600, fontSize: 13 }}>{ex.company}</p>
                        </div>
                        <span style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>
                          {ex.startDate} → {ex.isCurrent ? "Present" : ex.endDate}
                          {ex.isCurrent && <span style={{ marginLeft: 6, background: "#dbeafe", color: "#1d4ed8", padding: "2px 6px", borderRadius: 4, fontSize: 10 }}>Current</span>}
                        </span>
                      </div>
                      {ex.description && <p style={{ color: "#475569", fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{ex.description}</p>}
                      {ex.technologies?.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                          {ex.technologies.map((t: string) => (
                            <span key={t} style={{ padding: "2px 8px", background: "#f1f5f9", color: "#475569", borderRadius: 4, fontSize: 11 }}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Education ── */}
              {candidate.education?.length > 0 && (
                <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24, marginBottom: 16 }}>
                  <h3 style={{ fontWeight: 700, color: "#1e293b", fontSize: 15, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                    <GraduationCap size={16} /> Education
                  </h3>
                  {candidate.education.map((ed: any, i: number) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <GraduationCap size={18} color="#15803d" />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>{ed.degree}{ed.fieldOfStudy ? ` in ${ed.fieldOfStudy}` : ""}</p>
                        <p style={{ color: "#64748b", fontSize: 13 }}>{ed.institution}</p>
                        {(ed.startYear || ed.endYear) && <p style={{ color: "#94a3b8", fontSize: 12 }}>{ed.startYear} – {ed.endYear}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Certifications ── */}
              {candidate.certifications?.length > 0 && (
                <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24, marginBottom: 16 }}>
                  <h3 style={{ fontWeight: 700, color: "#1e293b", fontSize: 15, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                    <Award size={16} /> Certifications
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {candidate.certifications.map((cert: any, i: number) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a" }}>
                        <Award size={16} color="#ca8a04" />
                        <div>
                          <p style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }}>{cert.name}</p>
                          <p style={{ color: "#64748b", fontSize: 12 }}>{cert.issuer}{cert.issueDate ? ` · ${cert.issueDate}` : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Projects ── */}
              {candidate.projects?.length > 0 && (
                <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24, marginBottom: 16 }}>
                  <h3 style={{ fontWeight: 700, color: "#1e293b", fontSize: 15, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                    <FolderOpen size={16} /> Projects
                  </h3>
                  {candidate.projects.map((pr: any, i: number) => (
                    <div key={i} style={{ padding: 14, background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <p style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>{pr.name}</p>
                          {pr.role && <p style={{ color: "#2563eb", fontSize: 12, fontWeight: 500 }}>{pr.role}</p>}
                        </div>
                        {pr.link && (
                          <a href={pr.link} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: "#eff6ff", color: "#2563eb", textDecoration: "none", fontSize: 11, fontWeight: 500 }}>
                            <ExternalLink size={10} /> View
                          </a>
                        )}
                      </div>
                      {pr.description && <p style={{ color: "#475569", fontSize: 12, marginTop: 6 }}>{pr.description}</p>}
                      {pr.technologies?.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                          {pr.technologies.map((t: string) => (
                            <span key={t} style={{ padding: "2px 8px", background: "#eff6ff", color: "#2563eb", borderRadius: 4, fontSize: 11 }}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Languages ── */}
              {candidate.languages?.length > 0 && (
                <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24, marginBottom: 16 }}>
                  <h3 style={{ fontWeight: 700, color: "#1e293b", fontSize: 15, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                    <Globe size={16} /> Languages
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {candidate.languages.map((l: any) => (
                      <span key={l.name} style={{ padding: "6px 14px", borderRadius: 8, background: proficiencyColor[l.proficiency] || "#f1f5f9", color: proficiencyText[l.proficiency] || "#475569", fontSize: 13, fontWeight: 500 }}>
                        {l.name} <span style={{ opacity: 0.7, fontWeight: 400 }}>· {l.proficiency}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bias notice */}
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 14 }}>
                <p style={{ color: "#92400e", fontSize: 12, lineHeight: 1.55 }}>
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