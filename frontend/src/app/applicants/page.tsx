"use client";
import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { useDispatch } from "react-redux";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  uploadCSV, uploadResumeFile, uploadFromURL,
  getUmuravaProfiles, selectUmuravaProfiles,
  submitManualApplicant, getApplicants, removeApplicantFromJob,
} from "../../services/applicantService";
import { getAllJobs } from "../../services/jobService";
import { AppDispatch } from "../../store";
import { bumpJobApplicants } from "../../store/slices/jobSlice";
import { triggerScreening } from "../../store/slices/screeningSlice";
import toast from "react-hot-toast";
import {
  Upload, FileText, CheckCircle, Plus, X, User,
  Briefcase, GraduationCap, Award, Globe,
  CheckCircle2, Users, Trash2, Search,
  ChevronRight, AlertTriangle, FileSpreadsheet, Eye,
  Sparkles, Brain, RefreshCw,
} from "lucide-react";

const MAX_RESUME_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_CSV_SIZE_BYTES    = 5  * 1024 * 1024;

// ── Shared style objects ───────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: "10px",
  border: "1.5px solid var(--border-input)", fontSize: "14px", outline: "none",
  color: "var(--text-primary)", background: "var(--surface-input)", fontFamily: "inherit",
  transition: "border-color 0.15s",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: "700",
  color: "var(--text-secondary)", marginBottom: "5px",
  textTransform: "uppercase", letterSpacing: "0.05em",
};
const sectionBox: React.CSSProperties = {
  marginBottom: "16px", padding: "16px 18px",
  background: "var(--surface-hover)", borderRadius: "12px",
  border: "1px solid var(--border-muted)",
};
const sectionTitle: React.CSSProperties = {
  fontWeight: "700", color: "var(--text-primary)", marginBottom: "12px",
  fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "0.07em",
  display: "flex", alignItems: "center", gap: "6px",
};

const emptyForm = () => ({
  firstName: "", lastName: "", email: "", headline: "", bio: "", location: "",
  skills:         [{ name: "", level: "Intermediate", yearsOfExperience: 1 }],
  languages:      [] as { name: string; proficiency: string }[],
  experience:     [{ company: "", role: "", startDate: "", endDate: "", description: "", technologies: [""], isCurrent: false }],
  education:      [{ institution: "", degree: "Bachelor's", fieldOfStudy: "", startYear: 2020, endYear: 2024 }],
  certifications: [] as { name: string; issuer: string; issueDate: string }[],
  projects:       [] as { name: string; description: string; technologies: string[]; role: string; link: string; startDate: string; endDate: string }[],
  availability:   { status: "Available", type: "Full-time", startDate: "" },
  socialLinks:    { linkedin: "", github: "", portfolio: "" },
});

// ── Types ─────────────────────────────────────────────────────────────────────
type FileProgress = { name: string; pct: number; status: "idle" | "uploading" | "done" | "error"; count?: number };
type CSVPreview   = { file: File; totalCandidates: number; columnsDetected: number; sampleRows: string[][]; headers: string[] };

// ── Parsed resume result staged before confirm ────────────────────────────────
type ResumeResult = { fileName: string; candidateName: string; email: string; skillsCount: number; hasExp: boolean };

function parseCSVPreview(file: File): Promise<CSVPreview> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text  = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length < 2) { reject(new Error("File has no data rows")); return; }
        const headers    = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
        const sampleRows = lines.slice(1, 4).map(l => l.split(",").map(v => v.trim().replace(/^"|"$/g, "")));
        resolve({ file, totalCandidates: lines.length - 1, columnsDetected: headers.length, sampleRows, headers });
      } catch { reject(new Error("Could not parse file")); }
    };
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsText(file);
  });
}

function ScoreBadge({ pts, label }: { pts: string; label: string }) {
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, color: "#2563eb", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap" }}>
      {pts} · {label}
    </span>
  );
}

// ── Animated progress bar ──────────────────────────────────────────────────────
function ProgressBar({ pct, color = "#2563eb" }: { pct: number; color?: string }) {
  return (
    <div style={{ height: 6, background: "var(--border-muted)", borderRadius: 99, overflow: "hidden", flex: 1 }}>
      <div style={{
        height: "100%", width: `${pct}%`, borderRadius: 99,
        background: color,
        transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
      }} />
    </div>
  );
}

// ── Upload confirmation banner (green) ────────────────────────────────────────
function UploadDoneBanner({
  count, jobId, label, onReset, onRunScreening, running,
}: {
  count: number; jobId: string; label: string;
  onReset: () => void;
  onRunScreening: (topN: 10 | 20 | "all") => void;
  running: boolean;
}) {
  const [topN, setTopN] = useState<10 | 20 | "all">(10);
  return (
    <div style={{
      background: "linear-gradient(135deg,rgba(240,253,244,0.95),rgba(239,246,255,0.95))",
      border: "1.5px solid #bbf7d0", borderRadius: 16, padding: "20px 24px",
      animation: "slideUp 0.28s ease",
    }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: "#dcfce7", border: "1.5px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <CheckCircle2 size={22} color="#15803d" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 800, fontSize: 15, color: "#14532d", marginBottom: 3 }}>
            {count} {label}
          </p>
          <p style={{ fontSize: 13, color: "#16a34a", lineHeight: 1.5 }}>
            Candidates are ready. Choose how many to rank, then trigger AI screening.
          </p>
        </div>
        <button onClick={onReset} style={{ width: 28, height: 28, borderRadius: 8, border: "1.5px solid #86efac", background: "white", color: "#15803d", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <X size={14} />
        </button>
      </div>

      {/* Bottom row: topN + Run button */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", border: "1.5px solid #bbf7d0", borderRadius: 10, padding: "6px 12px" }}>
          <span style={{ fontSize: 12.5, color: "#15803d", fontWeight: 700, whiteSpace: "nowrap" }}>Rank top</span>
          <select
            value={topN}
            onChange={(e) => setTopN(e.target.value as any)}
            style={{ border: "none", background: "transparent", fontSize: 13, fontWeight: 700, color: "#14532d", outline: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            <option value={10}>10 candidates</option>
            <option value={20}>20 candidates</option>
            <option value="all">All candidates</option>
          </select>
        </div>

        <button
          onClick={() => onRunScreening(topN)}
          disabled={running}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 22px", borderRadius: 11, border: "none",
            background: running ? "#94a3b8" : "linear-gradient(135deg,#2563eb,#7c3aed)",
            color: "white", fontWeight: 700, fontSize: 13.5, cursor: running ? "not-allowed" : "pointer",
            fontFamily: "inherit", boxShadow: running ? "none" : "0 4px 14px rgba(37,99,235,0.28)",
            transition: "all 0.15s", whiteSpace: "nowrap",
          }}
        >
          {running
            ? <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Screening…</>
            : <><Brain size={15} /> Run AI Screening <ChevronRight size={14} /></>
          }
        </button>

        <span style={{ fontSize: 12, color: "#64748b" }}>
          {topN === "all" ? "All candidates will be ranked" : `Top ${topN} returned — you can change before running`}
        </span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ApplicantsPageContent() {
  const dispatch     = useDispatch<AppDispatch>();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [activeTab,   setActiveTab]   = useState<"list" | "umurava" | "external" | "manual">("list");
  const [fileSubTab,  setFileSubTab]  = useState<"csv" | "resume" | "url">("csv");
  const [jobs,        setJobs]        = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [profiles,    setProfiles]    = useState<any[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [uploading,   setUploading]   = useState(false);
  const [profileSearch, setProfileSearch] = useState("");
  const [form,        setForm]        = useState(emptyForm());

  // ── CSV state ────────────────────────────────────────────────────────────
  const [csvPreview,        setCsvPreview]        = useState<CSVPreview | null>(null);
  const [csvPreviewLoading, setCsvPreviewLoading] = useState(false);
  const [csvUploaded,       setCsvUploaded]       = useState(false);
  const [csvUploadedCount,  setCsvUploadedCount]  = useState(0);
  const [csvIngestPct,      setCsvIngestPct]      = useState(0); // progress during upload

  // ── Resume state ─────────────────────────────────────────────────────────
  const [fileProgresses,    setFileProgresses]    = useState<FileProgress[]>([]);
  const [resumeResults,     setResumeResults]     = useState<ResumeResult[]>([]); // staged results
  const [resumeUploaded,    setResumeUploaded]    = useState(false); // show confirm banner
  const [resumeUploadedCount, setResumeUploadedCount] = useState(0);

  // ── URL state ────────────────────────────────────────────────────────────
  const [importUrl,    setImportUrl]    = useState("");
  const [importingUrl, setImportingUrl] = useState(false);
  const [urlProgress,  setUrlProgress]  = useState(0);  // animated progress for URL
  const [urlUploaded,  setUrlUploaded]  = useState(false);
  const [urlUploadedCount, setUrlUploadedCount] = useState(0);

  // ── Candidate list state ─────────────────────────────────────────────────
  const [candidates,      setCandidates]      = useState<any[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesLoaded,  setCandidatesLoaded]  = useState(false);
  const [candidateSearch,   setCandidateSearch]   = useState("");
  const [deleteTarget,      setDeleteTarget]      = useState<{ id: string; name: string } | null>(null);
  const [deleting,          setDeleting]          = useState(false);

  // ── Profiles added (Umurava tab) ─────────────────────────────────────────
  const [profilesAdded,     setProfilesAdded]     = useState(0);
  const [profilesAddedShown, setProfilesAddedShown] = useState(false);

  // ── Screening running flag ────────────────────────────────────────────────
  const [screeningRunning, setScreeningRunning] = useState(false);

  useEffect(() => {
    getAllJobs().then((d) => setJobs(d.jobs || []));
    getUmuravaProfiles().then((d) => setProfiles(d.profiles || []));
  }, []);

  useEffect(() => {
    const q = searchParams.get("jobId");
    if (q) setSelectedJob(q);
  }, [searchParams]);

  const handleJobChange = (jobId: string) => {
    setSelectedJob(jobId);
    setCandidates([]); setCandidatesLoaded(false);
    setCsvPreview(null); setCsvUploaded(false);
    setResumeResults([]); setResumeUploaded(false);
    setUrlUploaded(false); setProfilesAddedShown(false);
    if (jobId) router.replace(`/applicants?jobId=${encodeURIComponent(jobId)}`, { scroll: false });
    else router.replace("/applicants", { scroll: false });
  };

  const selectedJobObj = jobs.find((j) => j._id === selectedJob);

  const handleLoadApplicants = useCallback(async () => {
    if (!selectedJob) return;
    setCandidatesLoading(true);
    try {
      const data = await getApplicants(selectedJob);
      setCandidates(data.applicants || []);
      setCandidatesLoaded(true);
      setActiveTab("list");
    } catch { setCandidates([]); setCandidatesLoaded(true); }
    finally { setCandidatesLoading(false); }
  }, [selectedJob]);

  const handleRemoveCandidate = async () => {
    if (!deleteTarget || !selectedJob) return;
    setDeleting(true);
    try {
      await removeApplicantFromJob(selectedJob, deleteTarget.id);
      setCandidates(prev => prev.filter(c => c._id !== deleteTarget.id));
      toast.success(`${deleteTarget.name} removed`);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not remove candidate");
    } finally { setDeleting(false); }
  };

  const filteredCandidates = candidates.filter((c) => {
    if (!candidateSearch) return true;
    const s = candidateSearch.toLowerCase();
    return `${c.firstName} ${c.lastName} ${c.email} ${c.headline}`.toLowerCase().includes(s) ||
      (c.skills || []).some((sk: any) => sk.name?.toLowerCase().includes(s));
  });

  const warnIfIncomplete = (applicant: any, context: string) => {
    if (!applicant) return;
    const missing: string[] = [];
    if (!applicant.firstName && !applicant.lastName) missing.push("name");
    if (!applicant.email)        missing.push("email");
    if (!applicant.skills?.length)     missing.push("skills");
    if (!applicant.experience?.length) missing.push("experience");
    if (missing.length > 0) toast(`⚠️ ${context} saved but missing: ${missing.join(", ")}`, {
      duration: 6000,
      style: { background: "#fefce8", color: "#854d0e", border: "1px solid #fde68a", fontWeight: 600 },
    });
  };

  // ── Run AI screening (called from any UploadDoneBanner) ──────────────────
  const handleRunScreening = async (topN: 10 | 20 | "all") => {
    if (!selectedJob) { toast.error("Select a job first"); return; }
    setScreeningRunning(true);
    try {
      await (dispatch as any)(triggerScreening(selectedJob)).unwrap();
      toast.success("AI screening complete! Redirecting to results…");
      // Pass autoload=1 so screenings page shows results without clicking Load Results
      router.push(`/screenings?jobId=${encodeURIComponent(selectedJob)}&autoload=1`);
    } catch (e: unknown) {
      toast.error(typeof e === "string" ? e : "Screening failed. Make sure candidates are uploaded.");
    } finally {
      setScreeningRunning(false);
    }
  };

  // ── CSV: drop → preview ───────────────────────────────────────────────────
  const onDropCSV = useCallback(async (files: File[]) => {
    if (!selectedJob) { toast.error("Select a job first"); return; }
    const file = files[0];
    if (file.size > MAX_CSV_SIZE_BYTES) { toast.error("Max 5 MB for CSV files."); return; }
    setCsvPreviewLoading(true);
    setCsvPreview(null); setCsvUploaded(false); setCsvIngestPct(0);
    try {
      const preview = await parseCSVPreview(file);
      setCsvPreview(preview);
    } catch (err: any) { toast.error(err.message || "Could not read file"); }
    finally { setCsvPreviewLoading(false); }
  }, [selectedJob]);

  // ── CSV: confirm → upload ─────────────────────────────────────────────────
  const handleConfirmIngest = async () => {
    if (!csvPreview || !selectedJob) return;
    setUploading(true);
    setCsvIngestPct(10);
    // Animate progress smoothly while waiting for the server
    const ticker = setInterval(() => {
      setCsvIngestPct(p => p < 85 ? p + 5 : p);
    }, 300);
    try {
      const res = await uploadCSV(selectedJob, csvPreview.file);
      clearInterval(ticker);
      setCsvIngestPct(100);
      const n = Number(res.count) || 0;
      if (n) {
        dispatch(bumpJobApplicants({ jobId: selectedJob, delta: n }));
        setCandidatesLoaded(false);
        setCsvUploadedCount(n);
      }
      setCsvUploaded(true);
    } catch (err: any) {
      clearInterval(ticker);
      setCsvIngestPct(0);
      toast.error(err?.response?.data?.message || "Upload failed.");
    } finally { setUploading(false); }
  };

  // ── Resume: drop → upload each file individually with staged results ──────
  const onDropResume = useCallback(async (files: File[]) => {
    if (!selectedJob) { toast.error("Select a job first"); return; }
    const tooBig = files.filter(f => f.size > MAX_RESUME_SIZE_BYTES);
    if (tooBig.length) { toast.error(`${tooBig.map(f => f.name).join(", ")} exceeded 10 MB limit`); return; }

    // Reset previous
    setResumeUploaded(false);
    setResumeResults([]);
    const progresses: FileProgress[] = files.map(f => ({ name: f.name, pct: 0, status: "uploading" }));
    setFileProgresses(progresses);

    const staged: ResumeResult[] = [];
    let added = 0;

    for (let i = 0; i < files.length; i++) {
      // Animate 0 → 30 → 60 smoothly while waiting
      setFileProgresses(prev => prev.map((p, pi) => pi === i ? { ...p, pct: 20, status: "uploading" } : p));
      const animTick = setInterval(() => {
        setFileProgresses(prev => prev.map((p, pi) => {
          if (pi !== i || p.status !== "uploading") return p;
          return { ...p, pct: p.pct < 80 ? p.pct + 10 : p.pct };
        }));
      }, 400);

      try {
        const res = await uploadResumeFile(selectedJob, files[i]);
        clearInterval(animTick);
        warnIfIncomplete(res?.applicant, files[i].name);
        const applicant = res?.applicant;
        staged.push({
          fileName:      files[i].name,
          candidateName: applicant ? `${applicant.firstName || ""} ${applicant.lastName || ""}`.trim() : files[i].name,
          email:         applicant?.email || "—",
          skillsCount:   applicant?.skills?.length || 0,
          hasExp:        (applicant?.experience?.length || 0) > 0,
        });
        if (res?.count) {
          dispatch(bumpJobApplicants({ jobId: selectedJob, delta: res.count }));
          setCandidatesLoaded(false);
          added += res.count;
        }
        setFileProgresses(prev => prev.map((p, pi) => pi === i ? { ...p, pct: 100, status: "done", count: res?.count || 0 } : p));
      } catch (err: any) {
        clearInterval(animTick);
        setFileProgresses(prev => prev.map((p, pi) => pi === i ? { ...p, pct: 0, status: "error" } : p));
        toast.error(`${files[i].name}: ${err?.response?.data?.message || "Upload failed"}`);
      }
    }

    if (added > 0) {
      setResumeResults(staged.filter(s => s.candidateName));
      setResumeUploadedCount(added);
      setResumeUploaded(true);
    }
  }, [selectedJob, dispatch]);

  const { getRootProps: getCSVRootProps, getInputProps: getCSVInputProps, isDragActive: isCSVDrag } = useDropzone({
    onDrop: onDropCSV,
    accept: { "text/csv": [".csv"], "application/vnd.ms-excel": [".xls"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
    multiple: false,
  });
  const { getRootProps: getResumeRootProps, getInputProps: getResumeInputProps, isDragActive: isResumeDrag } = useDropzone({
    onDrop: onDropResume,
    accept: { "application/pdf": [".pdf"], "application/msword": [".doc"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"], "text/plain": [".txt"] },
    multiple: true,
  });

  // ── URL import with animated progress ────────────────────────────────────
  const handleImportUrl = async () => {
    if (!selectedJob || !importUrl.trim()) { toast.error("Enter a URL and select a job"); return; }
    setImportingUrl(true);
    setUrlProgress(5);
    setUrlUploaded(false);
    const ticker = setInterval(() => {
      setUrlProgress(p => p < 80 ? p + 8 : p);
    }, 500);
    try {
      const res = await uploadFromURL(selectedJob, importUrl.trim());
      clearInterval(ticker);
      setUrlProgress(100);
      const n = Number(res.count) || 0;
      if (n) {
        dispatch(bumpJobApplicants({ jobId: selectedJob, delta: n }));
        setCandidatesLoaded(false);
        setUrlUploadedCount(n);
        setUrlUploaded(true);
        setImportUrl("");
      } else {
        toast.error(res?.message || "No candidates found at URL.");
        setUrlProgress(0);
      }
    } catch (err: any) {
      clearInterval(ticker);
      setUrlProgress(0);
      toast.error(err?.response?.data?.message || "Import failed.");
    } finally { setImportingUrl(false); }
  };

  const handleAddUmurava = async () => {
    if (!selectedJob || selectedProfiles.length === 0) { toast.error("Select profiles and a job first"); return; }
    setUploading(true);
    try {
      const res = await selectUmuravaProfiles(selectedJob, selectedProfiles);
      const n = Number(res.count) || 0;
      if (n) {
        dispatch(bumpJobApplicants({ jobId: selectedJob, delta: n }));
        setCandidatesLoaded(false);
        setProfilesAdded(n);
        setProfilesAddedShown(true);
        setSelectedProfiles([]);
      } else toast.success("Profiles already linked to this job.");
    } catch (err: any) { toast.error(err?.response?.data?.message || "Could not add profiles"); }
    finally { setUploading(false); }
  };

  const handleSubmitManual = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) { toast.error("First name, last name, and email are required"); return; }
    const validSkills = form.skills.filter(s => s.name.trim());
    if (!validSkills.length) { toast.error("Add at least one skill"); return; }
    const validExp = form.experience.filter(e => e.company.trim() && e.role.trim());
    if (!validExp.length) { toast.error("Add at least one work experience entry"); return; }
    if (!selectedJob) { toast.error("Select a job first"); return; }
    setUploading(true);
    try {
      const payload = {
        ...form, skills: validSkills,
        experience: validExp.map(e => ({ ...e, technologies: e.technologies.filter((t: string) => t.trim()) })),
        education:      form.education.filter(e => e.institution.trim()),
        certifications: form.certifications.filter(c => c.name.trim()),
        projects:       form.projects.filter(p => p.name.trim()),
        languages:      form.languages.filter(l => l.name.trim()),
        source: "external",
      };
      const res = await submitManualApplicant(selectedJob, payload);
      warnIfIncomplete(res?.applicant, `${form.firstName} ${form.lastName}`);
      dispatch(bumpJobApplicants({ jobId: selectedJob, delta: 1 }));
      setCandidatesLoaded(false);
      setForm(emptyForm());
      toast.success(`${form.firstName} ${form.lastName} added!`);
    } catch (err: any) { toast.error(err?.response?.data?.message || "Could not save candidate"); }
    finally { setUploading(false); }
  };

  const filteredProfiles = profiles.filter((p) => {
    if (!profileSearch) return true;
    const s = profileSearch.toLowerCase();
    return `${p.firstName} ${p.lastName} ${p.email} ${p.headline}`.toLowerCase().includes(s);
  });

  const step = !selectedJob ? 1 : !candidatesLoaded ? 2 : 3;

  const addSkill      = () => setForm(f => ({ ...f, skills: [...f.skills, { name: "", level: "Intermediate", yearsOfExperience: 1 }] }));
  const removeSkill   = (i: number) => setForm(f => ({ ...f, skills: f.skills.filter((_, idx) => idx !== i) }));
  const addExp        = () => setForm(f => ({ ...f, experience: [...f.experience, { company: "", role: "", startDate: "", endDate: "", description: "", technologies: [""], isCurrent: false }] }));
  const removeExp     = (i: number) => setForm(f => ({ ...f, experience: f.experience.filter((_, idx) => idx !== i) }));
  const addEdu        = () => setForm(f => ({ ...f, education: [...f.education, { institution: "", degree: "Bachelor's", fieldOfStudy: "", startYear: 2020, endYear: 2024 }] }));
  const removeEdu     = (i: number) => setForm(f => ({ ...f, education: f.education.filter((_, idx) => idx !== i) }));
  const addCert       = () => setForm(f => ({ ...f, certifications: [...f.certifications, { name: "", issuer: "", issueDate: "" }] }));
  const removeCert    = (i: number) => setForm(f => ({ ...f, certifications: f.certifications.filter((_, idx) => idx !== i) }));
  const addLang       = () => setForm(f => ({ ...f, languages: [...f.languages, { name: "", proficiency: "Fluent" }] }));
  const removeLang    = (i: number) => setForm(f => ({ ...f, languages: f.languages.filter((_, idx) => idx !== i) }));
  const addProject    = () => setForm(f => ({ ...f, projects: [...f.projects, { name: "", description: "", technologies: [""], role: "", link: "", startDate: "", endDate: "" }] }));
  const removeProject = (i: number) => setForm(f => ({ ...f, projects: f.projects.filter((_, idx) => idx !== i) }));

  const canSubmit = form.firstName.trim() && form.lastName.trim() && form.email.trim() &&
    form.skills.some(s => s.name.trim()) && form.experience.some(e => e.company.trim() && e.role.trim());

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .ap-root { display:flex; font-family:var(--font-body,system-ui); }
        .ap-main { margin-left:var(--sidebar-width,260px); min-height:100vh; background:var(--surface-base); flex:1; display:flex; flex-direction:column; }
        .ap-body { padding:24px 36px 100px; flex:1; animation:fadeIn 0.28s ease; }

        .ap-stepper { display:flex; align-items:center; gap:0; margin-bottom:24px; background:var(--surface-card); border-radius:14px; border:1.5px solid var(--border-soft); padding:18px 24px; box-shadow:var(--shadow-card); }
        .ap-step { display:flex; align-items:center; gap:10px; flex:1; }
        .ap-step-circle { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; flex-shrink:0; transition:all 0.2s; }
        .ap-step-circle.done { background:linear-gradient(135deg,#16a34a,#15803d); color:white; }
        .ap-step-circle.active { background:linear-gradient(135deg,#2563eb,#7c3aed); color:white; box-shadow:0 0 0 4px rgba(37,99,235,0.15); }
        .ap-step-circle.inactive { background:var(--surface-hover); color:var(--text-muted); border:1.5px solid var(--border-soft); }
        .ap-step-text { font-size:13px; font-weight:600; }
        .ap-step-text.active { color:var(--text-primary); }
        .ap-step-text.inactive { color:var(--text-muted); }
        .ap-step-arrow { color:var(--border-soft); margin:0 12px; flex-shrink:0; }

        .ap-selector { background:var(--surface-card); border-radius:16px; border:1.5px solid var(--border-soft); padding:22px 26px; margin-bottom:20px; box-shadow:var(--shadow-card); }
        .ap-selector-title { font-size:15px; font-weight:700; color:var(--text-primary); margin-bottom:14px; display:flex; align-items:center; gap:8px; }
        .ap-selector-row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
        .ap-job-select { flex:1; min-width:200px; padding:11px 14px; border-radius:10px; border:1.5px solid var(--border-input); background:var(--surface-input); color:var(--text-primary); font-family:inherit; font-size:14px; outline:none; cursor:pointer; appearance:none; transition:border-color 0.15s; }
        .ap-job-select:focus { border-color:var(--brand-primary); box-shadow:0 0 0 3px rgba(37,99,235,0.1); }
        .ap-load-btn { padding:11px 20px; border-radius:10px; border:none; background:linear-gradient(135deg,#2563eb,#7c3aed); color:white; font-weight:700; font-size:14px; font-family:inherit; cursor:pointer; box-shadow:var(--shadow-button); display:flex; align-items:center; gap:7px; white-space:nowrap; transition:all var(--transition-fast); }
        .ap-load-btn:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(37,99,235,0.4); }
        .ap-load-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; box-shadow:none; }

        .ap-tabs { display:flex; gap:6px; background:var(--surface-hover); border-radius:14px; padding:5px; margin-bottom:20px; flex-wrap:wrap; }
        .ap-tab { padding:11px 20px; border-radius:10px; border:none; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; transition:all 0.18s; color:var(--text-secondary); background:transparent; display:flex; align-items:center; gap:7px; }
        .ap-tab:hover:not(.active) { background:rgba(255,255,255,0.6); color:var(--text-primary); }
        .ap-tab.active { background:linear-gradient(135deg,#2563eb,#4f46e5); color:white; box-shadow:0 4px 14px rgba(37,99,235,0.3); }

        .ap-dropzone { border:2.5px dashed rgba(37,99,235,0.28); border-radius:18px; padding:52px 32px; text-align:center; cursor:pointer; transition:all 0.2s; background:linear-gradient(135deg,rgba(37,99,235,0.02),rgba(124,58,237,0.01)); }
        .ap-dropzone:hover,.ap-dropzone.drag { border-color:#2563eb; background:rgba(37,99,235,0.06); transform:scale(1.005); }
        .ap-dropzone-icon { width:64px; height:64px; border-radius:18px; background:rgba(37,99,235,0.1); border:1.5px solid rgba(37,99,235,0.15); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
        .ap-dropzone-title { font-size:18px; font-weight:800; color:var(--text-primary); margin-bottom:6px; letter-spacing:-0.02em; }
        .ap-dropzone-sub { font-size:13.5px; color:var(--text-secondary); font-weight:500; line-height:1.5; }

        /* File progress row */
        .ap-fp-row { background:var(--surface-card); border:1.5px solid var(--border-soft); border-radius:12px; padding:12px 16px; display:flex; flex-direction:column; gap:8px; }
        .ap-fp-top  { display:flex; align-items:center; gap:10px; }
        .ap-fp-name { flex:1; font-size:13px; font-weight:600; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ap-fp-pct  { font-size:12px; font-weight:700; min-width:36px; text-align:right; }

        /* Staged resume results */
        .ap-staged-row { display:flex; align-items:center; gap:12px; padding:12px 16px; background:var(--surface-card); border:1.5px solid #bbf7d0; border-radius:12px; }
        .ap-staged-avatar { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,#2563eb,#7c3aed); display:flex; align-items:center; justify-content:center; color:white; font-size:12px; font-weight:800; flex-shrink:0; }

        .ap-cand-card { background:var(--surface-card); border:1.5px solid var(--border-soft); border-radius:14px; padding:16px 18px; display:flex; align-items:center; gap:14px; margin-bottom:10px; box-shadow:var(--shadow-card); transition:all var(--transition-fast); }
        .ap-cand-card:hover { transform:translateY(-1px); box-shadow:var(--shadow-card-hover); border-color:rgba(37,99,235,0.2); }
        .ap-cand-avatar { width:40px; height:40px; border-radius:50%; background:var(--brand-gradient); display:flex; align-items:center; justify-content:center; color:white; font-size:14px; font-weight:700; flex-shrink:0; }
        .ap-cand-name { font-size:14px; font-weight:700; color:var(--text-primary); }
        .ap-cand-meta { font-size:12px; color:var(--text-muted); margin-top:2px; }
        .ap-cand-remove { width:30px; height:30px; border-radius:8px; border:none; background:var(--surface-hover); color:var(--text-muted); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s; flex-shrink:0; }
        .ap-cand-remove:hover { background:rgba(239,68,68,0.1); color:#ef4444; }

        .ap-profile-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:12px; margin-top:14px; }
        .ap-profile-card { background:var(--surface-card); border:1.5px solid var(--border-soft); border-radius:12px; padding:14px 16px; cursor:pointer; transition:all 0.15s; display:flex; align-items:center; gap:12px; }
        .ap-profile-card:hover { border-color:rgba(37,99,235,0.3); background:rgba(37,99,235,0.03); }
        .ap-profile-card.selected { border-color:var(--brand-primary); background:rgba(37,99,235,0.07); }
        .ap-profile-avatar { width:38px; height:38px; border-radius:50%; background:var(--brand-gradient); display:flex; align-items:center; justify-content:center; color:white; font-size:13px; font-weight:700; flex-shrink:0; }

        .ap-del-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.55); backdrop-filter:blur(4px); z-index:400; display:flex; align-items:center; justify-content:center; padding:20px; animation:fadeIn 0.15s ease; }
        .ap-del-box { background:var(--surface-card); border:1.5px solid var(--border-soft); border-radius:18px; padding:28px; max-width:360px; width:100%; box-shadow:0 24px 60px rgba(0,0,0,0.2); animation:scaleIn 0.15s ease; }

        .ap-row-remove { width:28px; height:28px; border-radius:7px; border:none; background:rgba(239,68,68,0.08); color:#ef4444; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:background 0.15s; }
        .ap-row-remove:hover { background:rgba(239,68,68,0.18); }
        .ap-add-row { display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:8px; border:1.5px dashed var(--border-soft); background:transparent; color:var(--text-muted); font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; transition:all 0.15s; margin-top:8px; }
        .ap-add-row:hover { border-color:var(--brand-primary); color:var(--brand-primary); background:rgba(37,99,235,0.04); }
        .ap-manual-select { width:100%; padding:9px 12px; border-radius:10px; border:1.5px solid var(--border-input); background:var(--surface-input); color:var(--text-primary); font-family:inherit; font-size:14px; outline:none; transition:border-color 0.15s; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width:768px) { .ap-main { margin-left:0; } .ap-body { padding:16px 12px 80px; } .ap-selector-row { flex-direction:column; align-items:stretch; } }
      `}</style>

      <div className="ap-root">
        <Sidebar />
        <div className="ap-main">
          <AppHeader title="Upload Candidates" subtitle="Add candidates to a job for AI screening" />
          <div className="ap-body">

            {/* ── Stepper ── */}
            <div className="ap-stepper">
              {[{ n: 1, label: "Select Job" }, { n: 2, label: "Add Candidates" }, { n: 3, label: "Run AI Screening" }].map((s, i) => {
                const isDone   = step > s.n;
                const isActive = step === s.n;
                return (
                  <div key={s.n} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                    <div className="ap-step">
                      <div className={`ap-step-circle ${isDone ? "done" : isActive ? "active" : "inactive"}`}>
                        {isDone ? <CheckCircle2 size={16} /> : s.n}
                      </div>
                      <p className={`ap-step-text ${isActive ? "active" : "inactive"}`}>{s.label}</p>
                    </div>
                    {i < 2 && <ChevronRight size={16} className="ap-step-arrow" />}
                  </div>
                );
              })}
              {/* Step 3: only show link to screenings page (no run button here — that's in the banner) */}
              {step === 3 && (
                <Link
                  href={selectedJob ? `/screenings?jobId=${selectedJob}` : "/screenings"}
                  style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "1.5px solid rgba(37,99,235,0.25)", background: "rgba(37,99,235,0.06)", color: "#2563eb", fontWeight: 700, fontSize: 13, textDecoration: "none", flexShrink: 0, whiteSpace: "nowrap" }}
                >
                  <Sparkles size={13} /> View Screenings
                </Link>
              )}
            </div>

            {/* ── Job selector ── */}
            <div className="ap-selector">
              <p className="ap-selector-title">
                <Briefcase size={17} color="var(--brand-primary)" /> Select Job
              </p>
              <div className="ap-selector-row">
                <select className="ap-job-select" value={selectedJob} onChange={(e) => handleJobChange(e.target.value)}>
                  <option value="">Choose a job posting…</option>
                  {jobs.map((j) => <option key={j._id} value={j._id}>{j.title}</option>)}
                </select>
                <button className="ap-load-btn" onClick={handleLoadApplicants} disabled={!selectedJob || candidatesLoading}>
                  {candidatesLoading
                    ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Loading…</>
                    : <><Users size={15} /> Load Applicants</>
                  }
                </button>
              </div>
              {!selectedJob && (
                <p style={{ marginTop: 12, fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertTriangle size={13} /> Select a job above, then click <strong>Load Applicants</strong>.
                </p>
              )}
              {selectedJob && !candidatesLoaded && !candidatesLoading && (
                <p style={{ marginTop: 12, fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle2 size={13} color="#16a34a" />
                  <strong>{selectedJobObj?.title || "Job"}</strong> selected — click <strong>Load Applicants</strong> to view candidates.
                </p>
              )}
            </div>

            {/* ── Upload Done Banners ── */}
            {csvUploaded && selectedJob && (
              <div style={{ marginBottom: 20 }}>
                <UploadDoneBanner
                  count={csvUploadedCount}
                  jobId={selectedJob}
                  label={`candidate${csvUploadedCount !== 1 ? "s" : ""} uploaded from CSV — ready for AI screening!`}
                  onReset={() => { setCsvUploaded(false); setCsvPreview(null); setCsvUploadedCount(0); setCsvIngestPct(0); }}
                  onRunScreening={handleRunScreening}
                  running={screeningRunning}
                />
              </div>
            )}

            {resumeUploaded && selectedJob && (
              <div style={{ marginBottom: 20 }}>
                <UploadDoneBanner
                  count={resumeUploadedCount}
                  jobId={selectedJob}
                  label={`candidate${resumeUploadedCount !== 1 ? "s" : ""} added from resume${resumeUploadedCount !== 1 ? "s" : ""} — ready for AI screening!`}
                  onReset={() => { setResumeUploaded(false); setResumeResults([]); setFileProgresses([]); setResumeUploadedCount(0); }}
                  onRunScreening={handleRunScreening}
                  running={screeningRunning}
                />
              </div>
            )}

            {urlUploaded && selectedJob && (
              <div style={{ marginBottom: 20 }}>
                <UploadDoneBanner
                  count={urlUploadedCount}
                  jobId={selectedJob}
                  label={`candidate${urlUploadedCount !== 1 ? "s" : ""} imported from URL — ready for AI screening!`}
                  onReset={() => { setUrlUploaded(false); setUrlUploadedCount(0); setUrlProgress(0); }}
                  onRunScreening={handleRunScreening}
                  running={screeningRunning}
                />
              </div>
            )}

            {profilesAddedShown && selectedJob && (
              <div style={{ marginBottom: 20 }}>
                <UploadDoneBanner
                  count={profilesAdded}
                  jobId={selectedJob}
                  label={`Umurava profile${profilesAdded !== 1 ? "s" : ""} added — ready for AI screening!`}
                  onReset={() => setProfilesAddedShown(false)}
                  onRunScreening={handleRunScreening}
                  running={screeningRunning}
                />
              </div>
            )}

            {/* ── Tabs ── */}
            <div className="ap-tabs">
              {[
                { id: "list",     label: "Candidate List",    emoji: "👥" },
                { id: "umurava",  label: "Umurava Profiles",  emoji: "🌍" },
                { id: "external", label: "Upload Files",      emoji: "📤" },
                { id: "manual",   label: "Manual Entry",      emoji: "✏️"  },
              ].map((t) => (
                <button key={t.id} className={`ap-tab${activeTab === t.id ? " active" : ""}`} onClick={() => setActiveTab(t.id as any)}>
                  <span style={{ fontSize: 15 }}>{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── TAB: Candidate List ── */}
            {activeTab === "list" && (
              <div>
                {!candidatesLoaded ? (
                  <div style={{ background: "var(--surface-card)", border: "1.5px solid var(--border-soft)", borderRadius: 16, padding: "56px 32px", textAlign: "center", boxShadow: "var(--shadow-card)" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(37,99,235,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                      <Users size={24} color="#2563eb" />
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 6 }}>
                      {!selectedJob ? "Select a job to view candidates" : "Ready to load candidates"}
                    </p>
                    <p style={{ color: "var(--text-muted)", fontSize: 13, maxWidth: 320, margin: "0 auto 20px", lineHeight: 1.6 }}>
                      {!selectedJob ? "Choose a job from the dropdown above, then click Load Applicants." : `Click "Load Applicants" to view candidates for ${selectedJobObj?.title || "this job"}.`}
                    </p>
                    {selectedJob && (
                      <button className="ap-load-btn" onClick={handleLoadApplicants} disabled={candidatesLoading} style={{ display: "inline-flex", margin: "0 auto" }}>
                        <Users size={15} /> Load Applicants
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
                        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                        <input type="text" placeholder="Search candidates…" value={candidateSearch} onChange={(e) => setCandidateSearch(e.target.value)} style={{ ...inp, paddingLeft: 36 }} />
                      </div>
                      <span style={{ fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? "s" : ""}</span>
                    </div>
                    {filteredCandidates.length === 0 ? (
                      <div style={{ background: "var(--surface-card)", border: "1.5px solid var(--border-soft)", borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
                        <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 16, marginBottom: 8 }}>No candidates found</p>
                        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{candidateSearch ? "Try a different search term." : "Upload candidates using the tabs above."}</p>
                      </div>
                    ) : (
                      filteredCandidates.map((c) => {
                        const name     = `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Unknown";
                        const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
                        const score    = c.aiScore;
                        const scoreColor = score >= 80 ? "#15803d" : score >= 65 ? "#2563eb" : score >= 50 ? "#d97706" : "#dc2626";
                        const scoreBg   = score >= 80 ? "#f0fdf4" : score >= 65 ? "#eff6ff" : score >= 50 ? "#fffbeb" : "#fef2f2";
                        return (
                          <div key={c._id} className="ap-cand-card">
                            <div className="ap-cand-avatar">{initials || <User size={16} />}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p className="ap-cand-name">{name}</p>
                              <p className="ap-cand-meta">{c.email}{c.location ? ` · ${c.location}` : ""}{c.headline ? ` · ${c.headline}` : ""}</p>
                            </div>
                            {score != null && (
                              <span style={{ padding: "4px 10px", borderRadius: 8, background: scoreBg, color: scoreColor, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                                {score >= 80 ? "Strong Fit" : score >= 65 ? "Good Fit" : score >= 50 ? "Moderate Fit" : "Weak Fit"} · {score}
                              </span>
                            )}
                            <Link href={`/candidates/${c._id}`} style={{ width: 30, height: 30, borderRadius: 8, background: "var(--surface-hover)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Eye size={14} color="var(--text-muted)" />
                            </Link>
                            <button className="ap-cand-remove" onClick={() => setDeleteTarget({ id: c._id, name })}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── TAB: Umurava Profiles ── */}
            {activeTab === "umurava" && (
              <div>
                {!selectedJob && <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Select a job first to add Umurava profiles.</p>}
                {selectedJob && (
                  <>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ position: "relative" }}>
                        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                        <input type="text" placeholder="Search Umurava talent pool…" value={profileSearch} onChange={(e) => setProfileSearch(e.target.value)} style={{ ...inp, paddingLeft: 36 }} />
                      </div>
                    </div>
                    {selectedProfiles.length > 0 && (
                      <div style={{ background: "rgba(37,99,235,0.07)", border: "1.5px solid rgba(37,99,235,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#2563eb" }}>{selectedProfiles.length} profile{selectedProfiles.length !== 1 ? "s" : ""} selected</span>
                        <button onClick={handleAddUmurava} disabled={uploading} style={{ padding: "8px 18px", borderRadius: 9, background: "var(--brand-gradient)", color: "white", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                          {uploading ? "Adding…" : `Add to ${selectedJobObj?.title || "Job"}`}
                        </button>
                      </div>
                    )}
                    <div className="ap-profile-grid">
                      {filteredProfiles.map((p) => {
                        const name     = `${p.firstName || ""} ${p.lastName || ""}`.trim();
                        const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
                        const sel      = selectedProfiles.includes(p._id);
                        return (
                          <div key={p._id} className={`ap-profile-card${sel ? " selected" : ""}`} onClick={() => setSelectedProfiles(prev => sel ? prev.filter(x => x !== p._id) : [...prev, p._id])}>
                            <div className="ap-profile-avatar">{initials || <User size={14} />}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontWeight: 700, fontSize: 13.5, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
                              <p style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.headline || p.email}</p>
                            </div>
                            {sel && <CheckCircle2 size={16} color="#2563eb" style={{ flexShrink: 0 }} />}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── TAB: Upload File ── */}
            {activeTab === "external" && (
              <div>
                {!selectedJob && <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>Select a job first to upload files.</p>}

                {/* Sub-tab buttons */}
                <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
                  {([
                    { id: "csv",    label: "CSV / Excel",  emoji: "📊", color: "#2563eb", activeBg: "linear-gradient(135deg,#2563eb,#1d4ed8)", activeShadow: "0 4px 14px rgba(37,99,235,0.35)" },
                    { id: "resume", label: "PDF / DOCX",   emoji: "📄", color: "#7c3aed", activeBg: "linear-gradient(135deg,#7c3aed,#4f46e5)", activeShadow: "0 4px 14px rgba(124,58,237,0.35)" },
                    { id: "url",    label: "Import URL",   emoji: "🔗", color: "#0891b2", activeBg: "linear-gradient(135deg,#0891b2,#0e7490)", activeShadow: "0 4px 14px rgba(8,145,178,0.3)" },
                  ] as const).map((t) => (
                    <button key={t.id} onClick={() => setFileSubTab(t.id)} style={{
                      padding: "12px 22px", borderRadius: 12,
                      border: fileSubTab === t.id ? "none" : `1.5px solid ${t.color}30`,
                      background: fileSubTab === t.id ? t.activeBg : `${t.color}0d`,
                      color: fileSubTab === t.id ? "white" : t.color,
                      fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
                      display: "flex", alignItems: "center", gap: 8,
                      boxShadow: fileSubTab === t.id ? t.activeShadow : "none",
                      transition: "all 0.15s",
                    }}>
                      <span style={{ fontSize: 15 }}>{t.emoji}</span> {t.label}
                    </button>
                  ))}
                </div>

                {/* ── CSV sub-tab ── */}
                {fileSubTab === "csv" && (
                  <div>
                    <div {...getCSVRootProps()} className={`ap-dropzone${isCSVDrag ? " drag" : ""}`}>
                      <input {...getCSVInputProps()} />
                      <div className="ap-dropzone-icon"><FileSpreadsheet size={22} color="#2563eb" /></div>
                      <p className="ap-dropzone-title">Drop a CSV or Excel file here</p>
                      <p className="ap-dropzone-sub">or click to browse · Max 5 MB</p>
                    </div>

                    {csvPreviewLoading && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, color: "var(--text-muted)", fontSize: 13 }}>
                        <span style={{ width: 14, height: 14, border: "2px solid var(--border-soft)", borderTopColor: "#2563eb", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                        Parsing file…
                      </div>
                    )}

                    {/* CSV preview + confirm stage */}
                    {csvPreview && !csvUploaded && (
                      <div style={{ marginTop: 16, background: "var(--surface-card)", border: "1.5px solid var(--border-soft)", borderRadius: 16, padding: 22, boxShadow: "var(--shadow-card)" }}>
                        {/* Detection summary */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(37,99,235,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <FileSpreadsheet size={20} color="#2563eb" />
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{csvPreview.file.name}</p>
                            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{(csvPreview.file.size / 1024).toFixed(0)} KB</p>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, background: "#f0fdf4", border: "1.5px solid #bbf7d0" }}>
                            <CheckCircle2 size={15} color="#15803d" />
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>{csvPreview.totalCandidates} candidates detected</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, background: "#eff6ff", border: "1.5px solid #bfdbfe" }}>
                            <FileSpreadsheet size={15} color="#2563eb" />
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}>{csvPreview.columnsDetected} columns found</span>
                          </div>
                        </div>

                        {/* Column names preview */}
                        <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Columns detected</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
                          {csvPreview.headers.map((h) => (
                            <span key={h} style={{ padding: "3px 10px", borderRadius: 6, background: "var(--surface-hover)", border: "1px solid var(--border-muted)", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{h}</span>
                          ))}
                        </div>

                        {/* Upload progress bar */}
                        {uploading && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <span style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 600 }}>Uploading to server…</span>
                              <span style={{ fontSize: 12.5, color: "#2563eb", fontWeight: 700 }}>{csvIngestPct}%</span>
                            </div>
                            <ProgressBar pct={csvIngestPct} color="linear-gradient(90deg,#2563eb,#7c3aed)" />
                          </div>
                        )}

                        <button
                          onClick={handleConfirmIngest}
                          disabled={uploading}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 9,
                            padding: "14px 28px", borderRadius: 13,
                            background: uploading ? "var(--surface-hover)" : "linear-gradient(135deg,#2563eb,#4f46e5,#7c3aed)",
                            color: uploading ? "var(--text-muted)" : "white",
                            border: "none", fontWeight: 800, fontSize: 15.5,
                            cursor: uploading ? "not-allowed" : "pointer", fontFamily: "inherit",
                            boxShadow: uploading ? "none" : "0 5px 20px rgba(37,99,235,0.38)",
                            transition: "all 0.15s", letterSpacing: "-0.01em",
                          }}
                        >
                          {uploading
                            ? <><RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> Uploading candidates…</>
                            : <><Upload size={17} /> Upload {csvPreview.totalCandidates} Candidate{csvPreview.totalCandidates !== 1 ? "s" : ""} to Job</>
                          }
                        </button>
                        {!uploading && (
                          <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 8, fontWeight: 500 }}>
                            Adds to <strong>{selectedJobObj?.title || "selected job"}</strong> and shows in Candidate List tab
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Resume sub-tab ── */}
                {fileSubTab === "resume" && (
                  <div>
                    {/* Info banner explaining PDF parsing */}
                    <div style={{ background: "rgba(124,58,237,0.06)", border: "1.5px solid rgba(124,58,237,0.15)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 9 }}>
                      <span style={{ fontSize: 17, flexShrink: 0 }}>ℹ️</span>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 13.5, color: "var(--text-primary)", marginBottom: 3 }}>How PDF / DOCX upload works</p>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>
                          Drop one or more files — AI extracts <strong>name, email, skills, and experience</strong> automatically.
                          A preview will appear so you can review before the candidates are saved.
                        </p>
                      </div>
                    </div>

                    <div {...getResumeRootProps()} className={`ap-dropzone${isResumeDrag ? " drag" : ""}`}
                      style={{ borderColor: "rgba(124,58,237,0.3)", background: "linear-gradient(135deg,rgba(124,58,237,0.03),rgba(79,70,229,0.02))" }}>
                      <input {...getResumeInputProps()} />
                      <div className="ap-dropzone-icon" style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.14),rgba(79,70,229,0.1))", border: "1.5px solid rgba(124,58,237,0.2)", width: 64, height: 64, borderRadius: 18 }}>
                        <FileText size={28} color="#7c3aed" />
                      </div>
                      <p className="ap-dropzone-title">Drop candidate resumes here</p>
                      <p className="ap-dropzone-sub">AI will extract name, email, skills and experience from each file</p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                        {[".pdf", ".docx", ".doc", ".txt"].map(fmt => (
                          <span key={fmt} style={{ padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700, background: "rgba(124,58,237,0.08)", color: "#7c3aed", border: "1px solid rgba(124,58,237,0.2)" }}>{fmt}</span>
                        ))}
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>· 10 MB each · Multiple OK</span>
                      </div>
                    </div>

                    {/* Per-file progress rows */}
                    {fileProgresses.length > 0 && (
                      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                        {fileProgresses.map((fp, i) => {
                          const pctColor = fp.status === "done" ? "#16a34a" : fp.status === "error" ? "#dc2626" : "#2563eb";
                          return (
                            <div key={i} className="ap-fp-row">
                              <div className="ap-fp-top">
                                <FileText size={15} color={pctColor} style={{ flexShrink: 0 }} />
                                <span className="ap-fp-name">{fp.name}</span>
                                <span className="ap-fp-pct" style={{ color: pctColor }}>
                                  {fp.status === "done" ? "Done ✓" : fp.status === "error" ? "Error" : `${fp.pct}%`}
                                </span>
                              </div>
                              {fp.status !== "error" && (
                                <ProgressBar pct={fp.pct} color={pctColor} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Staged PDF results — review then confirm */}
                    {resumeResults.length > 0 && (
                      <div style={{ marginTop: 18, background: "var(--surface-card)", border: "1.5px solid rgba(124,58,237,0.2)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-card)" }}>
                        {/* Header */}
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(124,58,237,0.12)", background: "rgba(124,58,237,0.04)", display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 11, background: resumeUploaded ? "#dcfce7" : "rgba(124,58,237,0.1)", border: `1px solid ${resumeUploaded ? "#bbf7d0" : "rgba(124,58,237,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {resumeUploaded ? <CheckCircle2 size={20} color="#15803d" /> : <FileText size={20} color="#7c3aed" />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 800, fontSize: 14.5, color: "var(--text-primary)" }}>
                              {resumeUploaded ? `✅ ${resumeUploadedCount} candidate${resumeUploadedCount !== 1 ? "s" : ""} uploaded successfully!` : `${resumeResults.length} resume${resumeResults.length !== 1 ? "s" : ""} parsed — review before saving`}
                            </p>
                            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>
                              {resumeUploaded ? "Candidates are ready. You can now run AI screening." : "Check the parsed data below, then click Upload to save."}
                            </p>
                          </div>
                        </div>

                        {/* Candidate rows */}
                        <div style={{ padding: "10px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
                          {resumeResults.map((r, i) => {
                            const initials = r.candidateName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
                            return (
                              <div key={i} className="ap-staged-row" style={{ margin: "0 4px" }}>
                                <div className="ap-staged-avatar">{initials}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{r.candidateName}</p>
                                  <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 1 }}>{r.email} · {r.fileName}</p>
                                </div>
                                <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                                  {r.skillsCount > 0 && <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>{r.skillsCount} skills</span>}
                                  {r.hasExp && <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>Has exp</span>}
                                  <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>✓ Parsed</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Action row */}
                        {!resumeUploaded && (
                          <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(124,58,237,0.1)", background: "var(--surface-card)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                            <p style={{ fontSize: 13, color: "var(--text-secondary)", flex: 1, fontWeight: 500 }}>
                              {resumeResults.length} candidate{resumeResults.length !== 1 ? "s" : ""} ready to add to <strong>{selectedJobObj?.title || "the job"}</strong>
                            </p>
                            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                              Already uploaded automatically ✓
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── URL sub-tab ── */}
                {fileSubTab === "url" && (
                  <div>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.6 }}>
                      Import a LinkedIn profile, resume URL, or a direct link to a CSV / XLSX file.
                    </p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <input
                        type="url"
                        placeholder="https://example.com/resume.pdf"
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleImportUrl()}
                        style={{ ...inp, flex: 1 }}
                      />
                      <button
                        onClick={handleImportUrl}
                        disabled={importingUrl || !importUrl.trim() || !selectedJob}
                        style={{ padding: "0 22px", height: 44, borderRadius: 10, background: importingUrl ? "var(--surface-hover)" : "var(--brand-primary)", color: importingUrl ? "var(--text-muted)" : "white", border: "none", fontWeight: 700, fontSize: 13.5, cursor: importingUrl ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 7, transition: "all 0.15s" }}
                      >
                        {importingUrl
                          ? <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Importing…</>
                          : <><Upload size={14} /> Import</>
                        }
                      </button>
                    </div>

                    {/* URL animated progress */}
                    {importingUrl && urlProgress > 0 && (
                      <div style={{ marginTop: 14, background: "var(--surface-card)", border: "1.5px solid var(--border-soft)", borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Fetching and parsing URL…</span>
                          <span style={{ fontSize: 13, color: "#2563eb", fontWeight: 700 }}>{urlProgress}%</span>
                        </div>
                        <ProgressBar pct={urlProgress} color="linear-gradient(90deg,#2563eb,#7c3aed)" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: Manual Entry ── */}
            {activeTab === "manual" && (
              <div style={{ background: "var(--surface-card)", border: "1.5px solid var(--border-soft)", borderRadius: 18, padding: 28, boxShadow: "var(--shadow-card)" }}>
                {!selectedJob && (
                  <div style={{ background: "rgba(37,99,235,0.06)", border: "1.5px solid rgba(37,99,235,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#2563eb", fontWeight: 600 }}>
                    Select a job above before submitting.
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                  <p style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>Add Candidate Manually</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <ScoreBadge pts="40 pts" label="Skills" />
                    <ScoreBadge pts="25 pts" label="Experience" />
                    <ScoreBadge pts="20 pts" label="Education" />
                    <ScoreBadge pts="15 pts" label="Extras" />
                  </div>
                </div>
                <div style={sectionBox}>
                  <p style={sectionTitle}><User size={13} /> Basic Info <span style={{ color: "#dc2626", fontWeight: 700 }}>* Required</span></p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    {[["firstName","First Name *"],["lastName","Last Name *"],["email","Email *"],["location","Location"]].map(([f,l]) => (
                      <div key={f}>
                        <label style={lbl}>{l}</label>
                        <input style={inp} type={f === "email" ? "email" : "text"} placeholder={f === "firstName" ? "e.g. Alice" : f === "lastName" ? "e.g. Uwimana" : f === "email" ? "alice@example.com" : "e.g. Kigali, Rwanda"} value={(form as any)[f]} onChange={(e) => setForm({...form,[f]:e.target.value})} />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={lbl}>Professional Headline</label>
                    <input style={inp} type="text" placeholder="e.g. Senior Full Stack Engineer" value={form.headline} onChange={(e) => setForm({...form,headline:e.target.value})} />
                  </div>
                  <div>
                    <label style={lbl}>Bio / Summary</label>
                    <textarea style={{...inp,minHeight:80,resize:"vertical"}} placeholder="Short professional summary…" value={form.bio} onChange={(e) => setForm({...form,bio:e.target.value})} />
                  </div>
                </div>
                <div style={sectionBox}>
                  <p style={sectionTitle}><Award size={13} /> Skills <span style={{color:"#dc2626"}}>* Required (at least 1)</span><span style={{marginLeft:"auto"}}><ScoreBadge pts="40 pts" label="Skills Match" /></span></p>
                  {form.skills.map((sk, i) => (
                    <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 140px 90px 28px",gap:8,marginBottom:8,alignItems:"end"}}>
                      <div>{i===0&&<label style={lbl}>Skill Name</label>}<input style={inp} type="text" placeholder="e.g. React" value={sk.name} onChange={(e)=>setForm(f=>({...f,skills:f.skills.map((s,si)=>si===i?{...s,name:e.target.value}:s)}))} /></div>
                      <div>{i===0&&<label style={lbl}>Level</label>}<select className="ap-manual-select" value={sk.level} onChange={(e)=>setForm(f=>({...f,skills:f.skills.map((s,si)=>si===i?{...s,level:e.target.value}:s)}))}>{["Beginner","Intermediate","Advanced","Expert"].map(l=><option key={l}>{l}</option>)}</select></div>
                      <div>{i===0&&<label style={lbl}>Yrs Exp.</label>}<input style={inp} type="number" min={0} max={30} value={sk.yearsOfExperience} onChange={(e)=>setForm(f=>({...f,skills:f.skills.map((s,si)=>si===i?{...s,yearsOfExperience:Number(e.target.value)}:s)}))} /></div>
                      <button className="ap-row-remove" onClick={()=>removeSkill(i)} style={{marginTop:i===0?20:0}}><X size={13}/></button>
                    </div>
                  ))}
                  <button className="ap-add-row" onClick={addSkill}><Plus size={13}/> Add Skill</button>
                </div>
                <div style={sectionBox}>
                  <p style={sectionTitle}><Briefcase size={13}/> Work Experience <span style={{color:"#dc2626"}}>* Required (at least 1)</span><span style={{marginLeft:"auto"}}><ScoreBadge pts="25 pts" label="Experience"/></span></p>
                  {form.experience.map((ex,i)=>(
                    <div key={i} style={{background:"var(--surface-card)",border:"1px solid var(--border-soft)",borderRadius:10,padding:"14px 16px",marginBottom:12,position:"relative"}}>
                      <button className="ap-row-remove" onClick={()=>removeExp(i)} style={{position:"absolute",top:12,right:12}}><X size={13}/></button>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                        <div><label style={lbl}>Company *</label><input style={inp} type="text" placeholder="e.g. Andela" value={ex.company} onChange={(e)=>setForm(f=>({...f,experience:f.experience.map((x,xi)=>xi===i?{...x,company:e.target.value}:x)}))} /></div>
                        <div><label style={lbl}>Role / Title *</label><input style={inp} type="text" placeholder="e.g. Backend Engineer" value={ex.role} onChange={(e)=>setForm(f=>({...f,experience:f.experience.map((x,xi)=>xi===i?{...x,role:e.target.value}:x)}))} /></div>
                        <div><label style={lbl}>Start Date</label><input style={inp} type="text" placeholder="2021-03" value={ex.startDate} onChange={(e)=>setForm(f=>({...f,experience:f.experience.map((x,xi)=>xi===i?{...x,startDate:e.target.value}:x)}))} /></div>
                        <div><label style={lbl}>End Date</label><input style={inp} type="text" placeholder="2023-08" disabled={ex.isCurrent} value={ex.endDate} onChange={(e)=>setForm(f=>({...f,experience:f.experience.map((x,xi)=>xi===i?{...x,endDate:e.target.value}:x)}))} /></div>
                      </div>
                      <div style={{marginBottom:10}}><label style={lbl}>Description</label><textarea style={{...inp,minHeight:68,resize:"vertical"}} value={ex.description} onChange={(e)=>setForm(f=>({...f,experience:f.experience.map((x,xi)=>xi===i?{...x,description:e.target.value}:x)}))} /></div>
                      <div style={{marginBottom:10}}><label style={lbl}>Technologies (comma separated)</label><input style={inp} type="text" placeholder="React, Node.js, MongoDB" value={ex.technologies.join(", ")} onChange={(e)=>setForm(f=>({...f,experience:f.experience.map((x,xi)=>xi===i?{...x,technologies:e.target.value.split(",").map(t=>t.trim())}:x)}))} /></div>
                      <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"var(--text-secondary)",cursor:"pointer",userSelect:"none"}}>
                        <input type="checkbox" checked={ex.isCurrent} onChange={(e)=>setForm(f=>({...f,experience:f.experience.map((x,xi)=>xi===i?{...x,isCurrent:e.target.checked,endDate:e.target.checked?"":x.endDate}:x)}))} />
                        Currently working here
                      </label>
                    </div>
                  ))}
                  <button className="ap-add-row" onClick={addExp}><Plus size={13}/> Add Experience</button>
                </div>
                <div style={sectionBox}>
                  <p style={sectionTitle}><GraduationCap size={13}/> Education<span style={{marginLeft:"auto"}}><ScoreBadge pts="20 pts" label="Education"/></span></p>
                  {form.education.map((ed,i)=>(
                    <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 80px 80px 28px",gap:8,marginBottom:8,alignItems:"end"}}>
                      <div>{i===0&&<label style={lbl}>Institution</label>}<input style={inp} type="text" placeholder="University of Rwanda" value={ed.institution} onChange={(e)=>setForm(f=>({...f,education:f.education.map((x,xi)=>xi===i?{...x,institution:e.target.value}:x)}))} /></div>
                      <div>{i===0&&<label style={lbl}>Degree</label>}<select className="ap-manual-select" value={ed.degree} onChange={(e)=>setForm(f=>({...f,education:f.education.map((x,xi)=>xi===i?{...x,degree:e.target.value}:x)}))}>{["Bachelor's","Master's","PhD","Associate's","Diploma","Certificate","High School"].map(d=><option key={d}>{d}</option>)}</select></div>
                      <div>{i===0&&<label style={lbl}>Field of Study</label>}<input style={inp} type="text" placeholder="Computer Science" value={ed.fieldOfStudy} onChange={(e)=>setForm(f=>({...f,education:f.education.map((x,xi)=>xi===i?{...x,fieldOfStudy:e.target.value}:x)}))} /></div>
                      <div>{i===0&&<label style={lbl}>Start Yr</label>}<input style={inp} type="number" min={1990} max={2030} value={ed.startYear} onChange={(e)=>setForm(f=>({...f,education:f.education.map((x,xi)=>xi===i?{...x,startYear:Number(e.target.value)}:x)}))} /></div>
                      <div>{i===0&&<label style={lbl}>End Yr</label>}<input style={inp} type="number" min={1990} max={2035} value={ed.endYear} onChange={(e)=>setForm(f=>({...f,education:f.education.map((x,xi)=>xi===i?{...x,endYear:Number(e.target.value)}:x)}))} /></div>
                      <button className="ap-row-remove" onClick={()=>removeEdu(i)} style={{marginTop:i===0?20:0}}><X size={13}/></button>
                    </div>
                  ))}
                  <button className="ap-add-row" onClick={addEdu}><Plus size={13}/> Add Education</button>
                </div>
                <div style={sectionBox}>
                  <p style={sectionTitle}><Award size={13}/> Certifications<span style={{marginLeft:"auto"}}><ScoreBadge pts="15 pts" label="Extras"/></span></p>
                  {form.certifications.map((cert,i)=>(
                    <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 130px 28px",gap:8,marginBottom:8,alignItems:"end"}}>
                      <div>{i===0&&<label style={lbl}>Certification Name</label>}<input style={inp} type="text" placeholder="AWS Certified Developer" value={cert.name} onChange={(e)=>setForm(f=>({...f,certifications:f.certifications.map((x,xi)=>xi===i?{...x,name:e.target.value}:x)}))} /></div>
                      <div>{i===0&&<label style={lbl}>Issuer</label>}<input style={inp} type="text" placeholder="Amazon" value={cert.issuer} onChange={(e)=>setForm(f=>({...f,certifications:f.certifications.map((x,xi)=>xi===i?{...x,issuer:e.target.value}:x)}))} /></div>
                      <div>{i===0&&<label style={lbl}>Issue Date</label>}<input style={inp} type="text" placeholder="2023-06" value={cert.issueDate} onChange={(e)=>setForm(f=>({...f,certifications:f.certifications.map((x,xi)=>xi===i?{...x,issueDate:e.target.value}:x)}))} /></div>
                      <button className="ap-row-remove" onClick={()=>removeCert(i)} style={{marginTop:i===0?20:0}}><X size={13}/></button>
                    </div>
                  ))}
                  <button className="ap-add-row" onClick={addCert}><Plus size={13}/> Add Certification</button>
                </div>
                <div style={sectionBox}>
                  <p style={sectionTitle}><Globe size={13}/> Languages</p>
                  {form.languages.map((lang,i)=>(
                    <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 160px 28px",gap:8,marginBottom:8,alignItems:"end"}}>
                      <div>{i===0&&<label style={lbl}>Language</label>}<input style={inp} type="text" placeholder="English, Kinyarwanda" value={lang.name} onChange={(e)=>setForm(f=>({...f,languages:f.languages.map((x,xi)=>xi===i?{...x,name:e.target.value}:x)}))} /></div>
                      <div>{i===0&&<label style={lbl}>Proficiency</label>}<select className="ap-manual-select" value={lang.proficiency} onChange={(e)=>setForm(f=>({...f,languages:f.languages.map((x,xi)=>xi===i?{...x,proficiency:e.target.value}:x)}))}>{["Basic","Conversational","Fluent","Native"].map(p=><option key={p}>{p}</option>)}</select></div>
                      <button className="ap-row-remove" onClick={()=>removeLang(i)} style={{marginTop:i===0?20:0}}><X size={13}/></button>
                    </div>
                  ))}
                  <button className="ap-add-row" onClick={addLang}><Plus size={13}/> Add Language</button>
                </div>
                <div style={sectionBox}>
                  <p style={sectionTitle}><Sparkles size={13}/> Projects</p>
                  {form.projects.map((proj,i)=>(
                    <div key={i} style={{background:"var(--surface-card)",border:"1px solid var(--border-soft)",borderRadius:10,padding:"14px 16px",marginBottom:12,position:"relative"}}>
                      <button className="ap-row-remove" onClick={()=>removeProject(i)} style={{position:"absolute",top:12,right:12}}><X size={13}/></button>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                        <div><label style={lbl}>Project Name</label><input style={inp} type="text" placeholder="E-commerce Platform" value={proj.name} onChange={(e)=>setForm(f=>({...f,projects:f.projects.map((x,xi)=>xi===i?{...x,name:e.target.value}:x)}))} /></div>
                        <div><label style={lbl}>Your Role</label><input style={inp} type="text" placeholder="Full Stack Developer" value={proj.role} onChange={(e)=>setForm(f=>({...f,projects:f.projects.map((x,xi)=>xi===i?{...x,role:e.target.value}:x)}))} /></div>
                      </div>
                      <div style={{marginBottom:10}}><label style={lbl}>Description</label><textarea style={{...inp,minHeight:56,resize:"vertical"}} value={proj.description} onChange={(e)=>setForm(f=>({...f,projects:f.projects.map((x,xi)=>xi===i?{...x,description:e.target.value}:x)}))} /></div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                        <div><label style={lbl}>Technologies</label><input style={inp} type="text" placeholder="React, Node.js…" value={proj.technologies.join(", ")} onChange={(e)=>setForm(f=>({...f,projects:f.projects.map((x,xi)=>xi===i?{...x,technologies:e.target.value.split(",").map(t=>t.trim())}:x)}))} /></div>
                        <div><label style={lbl}>Link (optional)</label><input style={inp} type="url" placeholder="https://github.com/…" value={proj.link} onChange={(e)=>setForm(f=>({...f,projects:f.projects.map((x,xi)=>xi===i?{...x,link:e.target.value}:x)}))} /></div>
                        <div><label style={lbl}>Year / Dates</label><input style={inp} type="text" placeholder="2022" value={proj.startDate} onChange={(e)=>setForm(f=>({...f,projects:f.projects.map((x,xi)=>xi===i?{...x,startDate:e.target.value}:x)}))} /></div>
                      </div>
                    </div>
                  ))}
                  <button className="ap-add-row" onClick={addProject}><Plus size={13}/> Add Project</button>
                </div>
                <div style={sectionBox}>
                  <p style={sectionTitle}><CheckCircle size={13}/> Availability &amp; Links</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
                    <div><label style={lbl}>Status</label><select className="ap-manual-select" value={form.availability.status} onChange={(e)=>setForm(f=>({...f,availability:{...f.availability,status:e.target.value}}))}>{["Available","Open to Opportunities","Not Available"].map(s=><option key={s}>{s}</option>)}</select></div>
                    <div><label style={lbl}>Type</label><select className="ap-manual-select" value={form.availability.type} onChange={(e)=>setForm(f=>({...f,availability:{...f.availability,type:e.target.value}}))}>{["Full-time","Part-time","Contract"].map(t=><option key={t}>{t}</option>)}</select></div>
                    <div><label style={lbl}>Available From</label><input style={inp} type="text" placeholder="Immediately" value={form.availability.startDate} onChange={(e)=>setForm(f=>({...f,availability:{...f.availability,startDate:e.target.value}}))} /></div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                    <div><label style={lbl}>LinkedIn</label><input style={inp} type="url" placeholder="https://linkedin.com/in/…" value={form.socialLinks.linkedin} onChange={(e)=>setForm(f=>({...f,socialLinks:{...f.socialLinks,linkedin:e.target.value}}))} /></div>
                    <div><label style={lbl}>GitHub</label><input style={inp} type="url" placeholder="https://github.com/…" value={form.socialLinks.github} onChange={(e)=>setForm(f=>({...f,socialLinks:{...f.socialLinks,github:e.target.value}}))} /></div>
                    <div><label style={lbl}>Portfolio</label><input style={inp} type="url" placeholder="https://yoursite.com" value={form.socialLinks.portfolio} onChange={(e)=>setForm(f=>({...f,socialLinks:{...f.socialLinks,portfolio:e.target.value}}))} /></div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                  <button onClick={handleSubmitManual} disabled={uploading||!selectedJob||!canSubmit} style={{padding:"12px 28px",borderRadius:11,background:canSubmit&&selectedJob?"var(--brand-gradient)":"var(--surface-hover)",color:canSubmit&&selectedJob?"white":"var(--text-muted)",border:"none",fontWeight:700,fontSize:14,cursor:canSubmit&&selectedJob?"pointer":"not-allowed",fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:7,boxShadow:canSubmit&&selectedJob?"var(--shadow-button)":"none",transition:"all 0.15s"}}>
                    <Plus size={15}/> {uploading?"Saving…":"Add Candidate"}
                  </button>
                  {!canSubmit&&<p style={{fontSize:12.5,color:"var(--text-muted)"}}>Required: First name, Last name, Email, at least 1 Skill, at least 1 Experience</p>}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="ap-del-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="ap-del-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 48, height: 48, borderRadius: 13, background: "rgba(239,68,68,0.1)", border: "1.5px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Trash2 size={20} color="#ef4444" />
            </div>
            <p style={{ fontWeight: 800, fontSize: 17, color: "var(--text-primary)", marginBottom: 6 }}>Remove candidate?</p>
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 22, lineHeight: 1.55 }}>
              <strong>{deleteTarget.name}</strong> will be removed from this job. This does not delete their profile.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: 11, borderRadius: 10, border: "1.5px solid var(--border-soft)", background: "var(--surface-card)", color: "var(--text-secondary)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={handleRemoveCandidate} disabled={deleting} style={{ flex: 1, padding: 11, borderRadius: 10, border: "none", background: "#ef4444", color: "white", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {deleting ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ApplicantsPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage label="Loading…" />}>
      <ApplicantsPageContent />
    </Suspense>
  );
}