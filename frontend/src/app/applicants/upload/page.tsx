"use client";
import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Sidebar from "../../../components/Sidebar";
import {
  uploadCSV, uploadPDF, getUmuravaProfiles, selectUmuravaProfiles,
} from "../../../services/applicantService";
import { getAllJobs } from "../../../services/jobService";
import api from "../../../services/api";
import toast from "react-hot-toast";
import {
  Upload, FileText, Download, CheckCircle, Plus, X, User,
  Briefcase, GraduationCap, Award, FolderOpen, Globe, Link2,
} from "lucide-react";

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: "10px",
  border: "1px solid #e2e8f0", fontSize: "14px", outline: "none",
  color: "#1e293b", background: "white",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: "13px", fontWeight: "600",
  color: "#374151", marginBottom: "4px",
};
const section: React.CSSProperties = {
  marginBottom: "20px", padding: "16px",
  background: "#f8fafc", borderRadius: "12px",
};
const sectionTitle: React.CSSProperties = {
  fontWeight: "600", color: "#1e293b", marginBottom: "12px",
  fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em",
  display: "flex", alignItems: "center", gap: "6px",
};

const emptyForm = () => ({
  firstName: "", lastName: "", email: "", headline: "", bio: "", location: "",
  skills: [{ name: "", level: "Intermediate", yearsOfExperience: 1 }],
  languages: [{ name: "English", proficiency: "Fluent" }],
  experience: [{
    company: "", role: "", startDate: "", endDate: "",
    description: "", technologies: [""], isCurrent: false,
  }],
  education: [{
    institution: "", degree: "Bachelor's", fieldOfStudy: "", startYear: 2020, endYear: 2024,
  }],
  certifications: [] as { name: string; issuer: string; issueDate: string }[],
  projects: [] as { name: string; description: string; technologies: string[]; role: string; link: string; startDate: string; endDate: string }[],
  availability: { status: "Available", type: "Full-time", startDate: "" },
  socialLinks: { linkedin: "", github: "", portfolio: "" },
});

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState<"umurava" | "external" | "manual">("umurava");
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [profileSearch, setProfileSearch] = useState("");
  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    getAllJobs().then((d) => setJobs(d.jobs || []));
    getUmuravaProfiles().then((d) => setProfiles(d.profiles || []));
  }, []);

  const filteredProfiles = profiles.filter((p) =>
    `${p.firstName} ${p.lastName} ${p.headline}`.toLowerCase().includes(profileSearch.toLowerCase())
  );

  const onDropCSV = useCallback(async (files: File[]) => {
    if (!selectedJob) { toast.error("Select a job first"); return; }
    setUploading(true);
    try {
      const res = await uploadCSV(selectedJob, files[0]);
      toast.success(`${res.count} applicants uploaded!`);
    } catch { toast.error("CSV upload failed"); } finally { setUploading(false); }
  }, [selectedJob]);

  const onDropPDF = useCallback(async (files: File[]) => {
    if (!selectedJob) { toast.error("Select a job first"); return; }
    setUploading(true);
    try {
      for (const file of files) await uploadPDF(selectedJob, file);
      toast.success(`${files.length} resume(s) uploaded!`);
    } catch { toast.error("PDF upload failed"); } finally { setUploading(false); }
  }, [selectedJob]);

  const { getRootProps: csvProps, getInputProps: csvInput, isDragActive: csvDrag } =
    useDropzone({ onDrop: onDropCSV, accept: { "text/csv": [".csv"] }, maxFiles: 1 });
  const { getRootProps: pdfProps, getInputProps: pdfInput, isDragActive: pdfDrag } =
    useDropzone({ onDrop: onDropPDF, accept: { "application/pdf": [".pdf"] } });

  const toggleProfile = (id: string) =>
    setSelectedProfiles((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );

  const handleSelectProfiles = async () => {
    if (!selectedJob) { toast.error("Select a job first"); return; }
    if (!selectedProfiles.length) { toast.error("Select at least one profile"); return; }
    setUploading(true);
    try {
      const res = await selectUmuravaProfiles(selectedJob, selectedProfiles);
      toast.success(`${res.count} profiles added!`);
      setSelectedProfiles([]);
    } catch { toast.error("Failed to add profiles"); } finally { setUploading(false); }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) { toast.error("Select a job first"); return; }
    setUploading(true);
    try {
      await api.post("/applicants/manual", { ...form, jobId: selectedJob, source: "umurava" });
      toast.success("Profile added!");
      setForm(emptyForm());
    } catch { toast.error("Failed to add profile"); } finally { setUploading(false); }
  };

  const downloadTemplate = () => {
    const csv = "firstName,lastName,email,headline,location,skillName,skillLevel,yearsOfExperience,educationDegree,educationField,availabilityStatus\n" +
      "John,Doe,john@email.com,Backend Engineer,Kigali Rwanda,Node.js,Advanced,3,Bachelor's,Computer Science,Available";
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: "umurava_candidates_template.csv",
    });
    a.click();
  };

  // helpers to mutate form arrays
  const updateSkill = (i: number, k: string, v: any) => {
    const s = form.skills.map((x, idx) => idx === i ? { ...x, [k]: v } : x);
    setForm({ ...form, skills: s });
  };
  const updateLang = (i: number, k: string, v: any) => {
    const l = form.languages.map((x, idx) => idx === i ? { ...x, [k]: v } : x);
    setForm({ ...form, languages: l });
  };
  const updateExp = (i: number, k: string, v: any) => {
    const e = form.experience.map((x, idx) => idx === i ? { ...x, [k]: v } : x);
    setForm({ ...form, experience: e });
  };
  const updateEdu = (i: number, k: string, v: any) => {
    const e = form.education.map((x, idx) => idx === i ? { ...x, [k]: v } : x);
    setForm({ ...form, education: e });
  };
  const updateCert = (i: number, k: string, v: any) => {
    const c = form.certifications.map((x, idx) => idx === i ? { ...x, [k]: v } : x);
    setForm({ ...form, certifications: c });
  };
  const updateProj = (i: number, k: string, v: any) => {
    const p = form.projects.map((x, idx) => idx === i ? { ...x, [k]: v } : x);
    setForm({ ...form, projects: p });
  };

  const levelColor: Record<string, string> = {
    Beginner: "#e0f2fe", Intermediate: "#ede9fe", Advanced: "#dcfce7", Expert: "#fef9c3",
  };
  const levelText: Record<string, string> = {
    Beginner: "#0369a1", Intermediate: "#6d28d9", Advanced: "#15803d", Expert: "#ca8a04",
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ marginLeft: "260px", minHeight: "100vh", padding: "32px", background: "#f8fafc", flex: 1 }}>

        {/* Header row with floating CSV button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#1e293b", marginBottom: "4px" }}>Add Applicants</h1>
            <p style={{ color: "#64748b", fontSize: "14px" }}>Add from platform, fill a profile, or upload CSV / PDF resumes</p>
          </div>
          <button
            onClick={downloadTemplate}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 18px", borderRadius: "10px",
              background: "#2563eb", color: "white", border: "none",
              cursor: "pointer", fontWeight: "600", fontSize: "13px",
              boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
            }}
          >
            <Download size={15} /> Download CSV Template
          </button>
        </div>

        {/* Job selector */}
        <div style={{ background: "white", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px", marginBottom: "20px" }}>
          <label style={lbl}>Select Job Position *</label>
          <select value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)}
            style={{ ...inp, maxWidth: "420px" }}>
            <option value="">-- Choose a job --</option>
            {jobs.map((j) => <option key={j._id} value={j._id}>{j.title}</option>)}
          </select>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "white", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "4px", marginBottom: "20px", width: "fit-content", gap: "4px" }}>
          {[
            { key: "umurava", label: "Platform Profiles" },
            { key: "manual", label: "Add Manually" },
            { key: "external", label: "Upload File" },
          ].map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{
              padding: "9px 20px", borderRadius: "10px", border: "none",
              fontWeight: "600", fontSize: "13px", cursor: "pointer",
              background: activeTab === t.key ? "linear-gradient(135deg,#2563eb,#7c3aed)" : "transparent",
              color: activeTab === t.key ? "white" : "#64748b", transition: "all 0.2s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── TAB: UMURAVA PROFILES ── */}
        {activeTab === "umurava" && (
          <div style={{ background: "white", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
              <h3 style={{ fontWeight: "700", color: "#1e293b", fontSize: "16px" }}>
                Umurava Platform Profiles <span style={{ color: "#94a3b8", fontWeight: "400" }}>({filteredProfiles.length})</span>
              </h3>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  placeholder="Search profiles..."
                  value={profileSearch}
                  onChange={(e) => setProfileSearch(e.target.value)}
                  style={{ ...inp, width: "200px" }}
                />
                <button onClick={handleSelectProfiles} disabled={uploading || !selectedProfiles.length} style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "10px 16px", borderRadius: "10px", whiteSpace: "nowrap",
                  background: selectedProfiles.length ? "#2563eb" : "#94a3b8",
                  color: "white", border: "none", cursor: selectedProfiles.length ? "pointer" : "not-allowed",
                  fontWeight: "600", fontSize: "13px",
                }}>
                  <CheckCircle size={14} /> Add Selected ({selectedProfiles.length})
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "480px", overflowY: "auto" }}>
              {filteredProfiles.length === 0 ? (
                <p style={{ textAlign: "center", color: "#94a3b8", padding: "32px" }}>
                  No profiles found. Run <code>npm run seed</code> or add manually.
                </p>
              ) : filteredProfiles.map((p) => {
                const sel = selectedProfiles.includes(p._id);
                return (
                  <div key={p._id} onClick={() => toggleProfile(p._id)} style={{
                    display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px",
                    borderRadius: "12px", border: `2px solid ${sel ? "#2563eb" : "#e2e8f0"}`,
                    background: sel ? "#eff6ff" : "white", cursor: "pointer", transition: "all 0.15s",
                  }}>
                    <input type="checkbox" checked={sel} readOnly style={{ width: "16px", height: "16px", accentColor: "#2563eb" }} />
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0,
                      background: "linear-gradient(135deg,#2563eb,#7c3aed)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "white", fontWeight: "700", fontSize: "15px",
                    }}>{p.firstName?.charAt(0) || "?"}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: "600", color: "#1e293b", marginBottom: "2px" }}>{p.firstName} {p.lastName}</p>
                      <p style={{ color: "#64748b", fontSize: "12px", marginBottom: "6px" }}>{p.headline}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {p.skills?.slice(0, 5).map((s: any) => (
                          <span key={s.name} style={{
                            padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "500",
                            background: levelColor[s.level] || "#f1f5f9",
                            color: levelText[s.level] || "#475569",
                          }}>{s.name} · {s.level}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>{p.location}</p>
                      <span style={{
                        fontSize: "11px", padding: "3px 8px", borderRadius: "20px", fontWeight: "600",
                        background: p.availability?.status === "Available" ? "#dcfce7" : "#fef9c3",
                        color: p.availability?.status === "Available" ? "#15803d" : "#ca8a04",
                      }}>{p.availability?.status || "Available"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB: MANUAL (full schema form) ── */}
        {activeTab === "manual" && (
          <form onSubmit={handleManualSubmit} style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            <div style={{ background: "white", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px" }}>
              <h3 style={{ fontWeight: "700", color: "#1e293b", fontSize: "16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <User size={18} /> Add Candidate Profile
              </h3>

              {/* Basic Info */}
              <div style={section}>
                <p style={sectionTitle}><User size={14} />Basic Information</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div><label style={lbl}>First Name *</label><input required type="text" placeholder="John" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} style={inp} /></div>
                  <div><label style={lbl}>Last Name *</label><input required type="text" placeholder="Doe" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} style={inp} /></div>
                  <div><label style={lbl}>Email *</label><input required type="email" placeholder="john@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inp} /></div>
                  <div><label style={lbl}>Location *</label><input required type="text" placeholder="Kigali, Rwanda" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} style={inp} /></div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <label style={lbl}>Professional Headline *</label>
                    <input required type="text" placeholder='e.g. "Backend Engineer – Node.js & AI Systems"' value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} style={inp} />
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <label style={lbl}>Bio <span style={{ color: "#94a3b8", fontWeight: "400" }}>(optional)</span></label>
                    <textarea rows={2} placeholder="Short professional biography..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} style={{ ...inp, resize: "none" }} />
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div style={section}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <p style={{ ...sectionTitle, marginBottom: 0 }}><Award size={14} />Skills *</p>
                  <button type="button" onClick={() => setForm({ ...form, skills: [...form.skills, { name: "", level: "Intermediate", yearsOfExperience: 1 }] })}
                    style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "8px", background: "#eff6ff", color: "#2563eb", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                    <Plus size={12} /> Add Skill
                  </button>
                </div>
                {form.skills.map((s, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 150px 80px 32px", gap: "8px", marginBottom: "8px" }}>
                    <input required type="text" placeholder="Skill name (e.g. React)" value={s.name} onChange={(e) => updateSkill(i, "name", e.target.value)} style={inp} />
                    <select value={s.level} onChange={(e) => updateSkill(i, "level", e.target.value)} style={inp}>
                      {["Beginner", "Intermediate", "Advanced", "Expert"].map((l) => <option key={l}>{l}</option>)}
                    </select>
                    <input type="number" min={0} max={20} placeholder="Yrs" value={s.yearsOfExperience} onChange={(e) => updateSkill(i, "yearsOfExperience", +e.target.value)} style={inp} />
                    {form.skills.length > 1 && (
                      <button type="button" onClick={() => setForm({ ...form, skills: form.skills.filter((_, idx) => idx !== i) })}
                        style={{ background: "#fee2e2", border: "none", borderRadius: "8px", cursor: "pointer", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Experience */}
              <div style={section}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <p style={{ ...sectionTitle, marginBottom: 0 }}><Briefcase size={14} />Work Experience *</p>
                  <button type="button" onClick={() => setForm({ ...form, experience: [...form.experience, { company: "", role: "", startDate: "", endDate: "", description: "", technologies: [""], isCurrent: false }] })}
                    style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "8px", background: "#eff6ff", color: "#2563eb", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                    <Plus size={12} /> Add Role
                  </button>
                </div>
                {form.experience.map((ex, i) => (
                  <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px", marginBottom: "10px", background: "white" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                      <div><label style={lbl}>Company</label><input type="text" placeholder="Company Name" value={ex.company} onChange={(e) => updateExp(i, "company", e.target.value)} style={inp} /></div>
                      <div><label style={lbl}>Role / Title</label><input type="text" placeholder="Backend Engineer" value={ex.role} onChange={(e) => updateExp(i, "role", e.target.value)} style={inp} /></div>
                      <div><label style={lbl}>Start Date (YYYY-MM)</label><input type="text" placeholder="2022-01" value={ex.startDate} onChange={(e) => updateExp(i, "startDate", e.target.value)} style={inp} /></div>
                      <div>
                        <label style={lbl}>End Date</label>
                        <input type="text" placeholder={ex.isCurrent ? "Present" : "2024-06"} value={ex.isCurrent ? "Present" : ex.endDate} disabled={ex.isCurrent}
                          onChange={(e) => updateExp(i, "endDate", e.target.value)} style={{ ...inp, opacity: ex.isCurrent ? 0.5 : 1 }} />
                      </div>
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <label style={lbl}>Description</label>
                      <textarea rows={2} placeholder="Key responsibilities and achievements..." value={ex.description} onChange={(e) => updateExp(i, "description", e.target.value)} style={{ ...inp, resize: "none" }} />
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <label style={lbl}>Technologies (comma separated)</label>
                      <input type="text" placeholder="Node.js, PostgreSQL, Docker" value={ex.technologies.join(", ")}
                        onChange={(e) => updateExp(i, "technologies", e.target.value.split(",").map((s) => s.trim()))} style={inp} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#374151", cursor: "pointer" }}>
                        <input type="checkbox" checked={ex.isCurrent} onChange={(e) => updateExp(i, "isCurrent", e.target.checked)} /> Currently working here
                      </label>
                      {form.experience.length > 1 && (
                        <button type="button" onClick={() => setForm({ ...form, experience: form.experience.filter((_, idx) => idx !== i) })}
                          style={{ padding: "4px 10px", borderRadius: "6px", background: "#fee2e2", color: "#dc2626", border: "none", cursor: "pointer", fontSize: "12px" }}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Education */}
              <div style={section}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <p style={{ ...sectionTitle, marginBottom: 0 }}><GraduationCap size={14} />Education *</p>
                  <button type="button" onClick={() => setForm({ ...form, education: [...form.education, { institution: "", degree: "Bachelor's", fieldOfStudy: "", startYear: 2020, endYear: 2024 }] })}
                    style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "8px", background: "#eff6ff", color: "#2563eb", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                    <Plus size={12} /> Add Education
                  </button>
                </div>
                {form.education.map((ed, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 140px 1fr 80px 80px 32px", gap: "8px", marginBottom: "8px" }}>
                    <input type="text" placeholder="Institution" value={ed.institution} onChange={(e) => updateEdu(i, "institution", e.target.value)} style={inp} />
                    <select value={ed.degree} onChange={(e) => updateEdu(i, "degree", e.target.value)} style={inp}>
                      {["High School", "Bachelor's", "Master's", "PhD"].map((d) => <option key={d}>{d}</option>)}
                    </select>
                    <input type="text" placeholder="Field of Study" value={ed.fieldOfStudy} onChange={(e) => updateEdu(i, "fieldOfStudy", e.target.value)} style={inp} />
                    <input type="number" placeholder="Start" value={ed.startYear} onChange={(e) => updateEdu(i, "startYear", +e.target.value)} style={inp} />
                    <input type="number" placeholder="End" value={ed.endYear} onChange={(e) => updateEdu(i, "endYear", +e.target.value)} style={inp} />
                    {form.education.length > 1 && (
                      <button type="button" onClick={() => setForm({ ...form, education: form.education.filter((_, idx) => idx !== i) })}
                        style={{ background: "#fee2e2", border: "none", borderRadius: "8px", cursor: "pointer", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Languages */}
              <div style={section}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <p style={{ ...sectionTitle, marginBottom: 0 }}><Globe size={14} />Languages <span style={{ color: "#94a3b8", fontWeight: "400", textTransform: "none", letterSpacing: "normal" }}>(optional)</span></p>
                  <button type="button" onClick={() => setForm({ ...form, languages: [...form.languages, { name: "", proficiency: "Fluent" }] })}
                    style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "8px", background: "#eff6ff", color: "#2563eb", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                    <Plus size={12} /> Add Language
                  </button>
                </div>
                {form.languages.map((l, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 180px 32px", gap: "8px", marginBottom: "8px" }}>
                    <input type="text" placeholder="Language (e.g. English)" value={l.name} onChange={(e) => updateLang(i, "name", e.target.value)} style={inp} />
                    <select value={l.proficiency} onChange={(e) => updateLang(i, "proficiency", e.target.value)} style={inp}>
                      {["Basic", "Conversational", "Fluent", "Native"].map((p) => <option key={p}>{p}</option>)}
                    </select>
                    {form.languages.length > 1 && (
                      <button type="button" onClick={() => setForm({ ...form, languages: form.languages.filter((_, idx) => idx !== i) })}
                        style={{ background: "#fee2e2", border: "none", borderRadius: "8px", cursor: "pointer", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Certifications */}
              <div style={section}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <p style={{ ...sectionTitle, marginBottom: 0 }}><Award size={14} />Certifications <span style={{ color: "#94a3b8", fontWeight: "400", textTransform: "none", letterSpacing: "normal" }}>(optional)</span></p>
                  <button type="button" onClick={() => setForm({ ...form, certifications: [...form.certifications, { name: "", issuer: "", issueDate: "" }] })}
                    style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "8px", background: "#eff6ff", color: "#2563eb", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                    <Plus size={12} /> Add Cert
                  </button>
                </div>
                {form.certifications.length === 0 && (
                  <p style={{ color: "#94a3b8", fontSize: "13px" }}>No certifications added. Click "Add Cert" to add one.</p>
                )}
                {form.certifications.map((c, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 32px", gap: "8px", marginBottom: "8px" }}>
                    <input type="text" placeholder="Certification name" value={c.name} onChange={(e) => updateCert(i, "name", e.target.value)} style={inp} />
                    <input type="text" placeholder="Issuer (e.g. Amazon)" value={c.issuer} onChange={(e) => updateCert(i, "issuer", e.target.value)} style={inp} />
                    <input type="text" placeholder="YYYY-MM" value={c.issueDate} onChange={(e) => updateCert(i, "issueDate", e.target.value)} style={inp} />
                    <button type="button" onClick={() => setForm({ ...form, certifications: form.certifications.filter((_, idx) => idx !== i) })}
                      style={{ background: "#fee2e2", border: "none", borderRadius: "8px", cursor: "pointer", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Projects */}
              <div style={section}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <p style={{ ...sectionTitle, marginBottom: 0 }}><FolderOpen size={14} />Projects <span style={{ color: "#94a3b8", fontWeight: "400", textTransform: "none", letterSpacing: "normal" }}>(optional)</span></p>
                  <button type="button" onClick={() => setForm({ ...form, projects: [...form.projects, { name: "", description: "", technologies: [], role: "", link: "", startDate: "", endDate: "" }] })}
                    style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "8px", background: "#eff6ff", color: "#2563eb", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                    <Plus size={12} /> Add Project
                  </button>
                </div>
                {form.projects.length === 0 && (
                  <p style={{ color: "#94a3b8", fontSize: "13px" }}>No projects added. Portfolio projects improve AI scoring.</p>
                )}
                {form.projects.map((pr, i) => (
                  <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px", marginBottom: "10px", background: "white" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                      <div><label style={lbl}>Project Name</label><input type="text" placeholder="AI Recruitment System" value={pr.name} onChange={(e) => updateProj(i, "name", e.target.value)} style={inp} /></div>
                      <div><label style={lbl}>Your Role</label><input type="text" placeholder="Backend Engineer" value={pr.role} onChange={(e) => updateProj(i, "role", e.target.value)} style={inp} /></div>
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <label style={lbl}>Description</label>
                      <input type="text" placeholder="Brief project description" value={pr.description} onChange={(e) => updateProj(i, "description", e.target.value)} style={inp} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                      <div><label style={lbl}>Technologies</label><input type="text" placeholder="Next.js, Node.js" value={pr.technologies.join(", ")} onChange={(e) => updateProj(i, "technologies", e.target.value.split(",").map((s) => s.trim()))} style={inp} /></div>
                      <div><label style={lbl}>Start (YYYY-MM)</label><input type="text" placeholder="2023-01" value={pr.startDate} onChange={(e) => updateProj(i, "startDate", e.target.value)} style={inp} /></div>
                      <div><label style={lbl}>End (YYYY-MM)</label><input type="text" placeholder="2023-06" value={pr.endDate} onChange={(e) => updateProj(i, "endDate", e.target.value)} style={inp} /></div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
                        <Link2 size={13} color="#64748b" />
                        <input type="text" placeholder="https://github.com/..." value={pr.link} onChange={(e) => updateProj(i, "link", e.target.value)} style={{ ...inp, flex: 1 }} />
                      </div>
                      <button type="button" onClick={() => setForm({ ...form, projects: form.projects.filter((_, idx) => idx !== i) })}
                        style={{ marginLeft: "8px", padding: "4px 10px", borderRadius: "6px", background: "#fee2e2", color: "#dc2626", border: "none", cursor: "pointer", fontSize: "12px" }}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Availability */}
              <div style={section}>
                <p style={sectionTitle}>Availability *</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={lbl}>Status</label>
                    <select value={form.availability.status} onChange={(e) => setForm({ ...form, availability: { ...form.availability, status: e.target.value } })} style={inp}>
                      {["Available", "Open to Opportunities", "Not Available"].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Type</label>
                    <select value={form.availability.type} onChange={(e) => setForm({ ...form, availability: { ...form.availability, type: e.target.value } })} style={inp}>
                      {["Full-time", "Part-time", "Contract"].map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Start Date <span style={{ color: "#94a3b8", fontWeight: "400" }}>(optional)</span></label>
                    <input type="date" value={form.availability.startDate} onChange={(e) => setForm({ ...form, availability: { ...form.availability, startDate: e.target.value } })} style={inp} />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div style={section}>
                <p style={sectionTitle}><Link2 size={14} />Social Links <span style={{ color: "#94a3b8", fontWeight: "400", textTransform: "none", letterSpacing: "normal" }}>(optional)</span></p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input type="url" placeholder="LinkedIn URL (https://linkedin.com/in/...)" value={form.socialLinks.linkedin} onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, linkedin: e.target.value } })} style={inp} />
                  <input type="url" placeholder="GitHub URL (https://github.com/...)" value={form.socialLinks.github} onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, github: e.target.value } })} style={inp} />
                  <input type="url" placeholder="Portfolio URL (https://...)" value={form.socialLinks.portfolio} onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, portfolio: e.target.value } })} style={inp} />
                </div>
              </div>

              <button type="submit" disabled={uploading} style={{
                width: "100%", padding: "14px", borderRadius: "12px", border: "none",
                background: uploading ? "#94a3b8" : "linear-gradient(135deg,#2563eb,#7c3aed)",
                color: "white", fontWeight: "700", fontSize: "15px",
                cursor: uploading ? "not-allowed" : "pointer",
              }}>{uploading ? "Adding..." : "Add Candidate Profile"}</button>
            </div>
          </form>
        )}

        {/* ── TAB: UPLOAD EXTERNAL ── */}
        {activeTab === "external" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* CSV */}
            <div style={{ background: "white", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontWeight: "700", color: "#1e293b", marginBottom: "4px" }}>Upload CSV Spreadsheet</h3>
                  <p style={{ color: "#64748b", fontSize: "13px" }}>Upload a spreadsheet with multiple candidates at once</p>
                </div>
                <button onClick={downloadTemplate} style={{
                  display: "flex", alignItems: "center", gap: "6px", padding: "9px 14px",
                  borderRadius: "9px", border: "1px solid #bfdbfe", background: "#eff6ff",
                  color: "#2563eb", cursor: "pointer", fontSize: "13px", fontWeight: "600",
                }}>
                  <Download size={14} /> Download Template
                </button>
              </div>
              <div {...csvProps()} style={{
                border: `2px dashed ${csvDrag ? "#2563eb" : "#cbd5e1"}`,
                borderRadius: "14px", padding: "40px", textAlign: "center",
                cursor: "pointer", background: csvDrag ? "#eff6ff" : "#f8fafc",
                transition: "all 0.2s",
              }}>
                <input {...csvInput()} />
                <Upload size={28} color="#94a3b8" style={{ margin: "0 auto 10px" }} />
                <p style={{ fontWeight: "600", color: "#475569", marginBottom: "4px" }}>{csvDrag ? "Drop your CSV here" : "Drag & drop CSV file here"}</p>
                <p style={{ color: "#94a3b8", fontSize: "13px" }}>or click to browse · .csv files only</p>
              </div>
            </div>

            {/* PDF */}
            <div style={{ background: "white", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px" }}>
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ fontWeight: "700", color: "#1e293b", marginBottom: "4px" }}>Upload PDF Resumes</h3>
                <p style={{ color: "#64748b", fontSize: "13px" }}>AI will extract skills, contact info, and experience automatically</p>
              </div>
              <div {...pdfProps()} style={{
                border: `2px dashed ${pdfDrag ? "#7c3aed" : "#cbd5e1"}`,
                borderRadius: "14px", padding: "40px", textAlign: "center",
                cursor: "pointer", background: pdfDrag ? "#f5f3ff" : "#f8fafc",
                transition: "all 0.2s",
              }}>
                <input {...pdfInput()} />
                <FileText size={28} color="#94a3b8" style={{ margin: "0 auto 10px" }} />
                <p style={{ fontWeight: "600", color: "#475569", marginBottom: "4px" }}>{pdfDrag ? "Drop resumes here" : "Drag & drop PDF resumes here"}</p>
                <p style={{ color: "#94a3b8", fontSize: "13px" }}>or click to browse · multiple files allowed</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}