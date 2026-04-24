"use client";
import { Suspense, useEffect, useState, useCallback, useRef } from "react";
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
  Sparkles, Brain, RefreshCw, List, PenSquare, FileUp,
} from "lucide-react";

const MAX_RESUME_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_CSV_SIZE_BYTES    = 5  * 1024 * 1024;

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

type FileProgress = { name: string; pct: number; status: "idle" | "uploading" | "done" | "error"; count?: number };
type CSVPreview   = { file: File; totalCandidates: number; columnsDetected: number; sampleRows: string[][]; headers: string[] };
type ResumeResult = { fileName: string; candidateName: string; email: string; skillsCount: number; hasExp: boolean };

// ✅ FIX: StagedFile has { file, id } — NOT { name }
type StagedFile = { file: File; id: string };

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

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function ProgressBar({ pct, color = "#2563eb" }: { pct: number; color?: string }) {
  return (
    <div style={{ height: 6, background: "var(--border-muted)", borderRadius: 99, overflow: "hidden", flex: 1 }}>
      <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: color, transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)" }} />
    </div>
  );
}

function UploadDoneBanner({ count, jobId, label, onReset, onRunScreening, running }: {
  count: number; jobId: string; label: string;
  onReset: () => void; onRunScreening: (topN: 10 | 20 | "all") => void; running: boolean;
}) {
  const [topN, setTopN] = useState<10 | 20 | "all">(10);
  return (
    <div style={{ background: "linear-gradient(135deg,rgba(240,253,244,0.95),rgba(239,246,255,0.95))", border: "1.5px solid #bbf7d0", borderRadius: 16, padding: "20px 24px", animation: "slideUp 0.28s ease" }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: "#dcfce7", border: "1.5px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <CheckCircle2 size={22} color="#15803d" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 800, fontSize: 15, color: "#14532d", marginBottom: 3 }}>{count} {label}</p>
          <p style={{ fontSize: 13, color: "#16a34a", lineHeight: 1.5 }}>Candidates are ready. Choose how many to rank, then trigger AI screening.</p>
        </div>
        <button onClick={onReset} style={{ width: 28, height: 28, borderRadius: 8, border: "1.5px solid #86efac", background: "white", color: "#15803d", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <X size={14} />
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", border: "1.5px solid #bbf7d0", borderRadius: 10, padding: "6px 12px" }}>
          <span style={{ fontSize: 12.5, color: "#15803d", fontWeight: 700, whiteSpace: "nowrap" }}>Rank top</span>
          <select value={topN} onChange={(e) => setTopN(e.target.value as any)} style={{ border: "none", background: "transparent", fontSize: 13, fontWeight: 700, color: "#14532d", outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
            <option value={10}>10 candidates</option>
            <option value={20}>20 candidates</option>
            <option value="all">All candidates</option>
          </select>
        </div>
        <button onClick={() => onRunScreening(topN)} disabled={running} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 11, border: "none", background: running ? "#94a3b8" : "linear-gradient(135deg,#2563eb,#7c3aed)", color: "white", fontWeight: 700, fontSize: 13.5, cursor: running ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: running ? "none" : "0 4px 14px rgba(37,99,235,0.28)", transition: "all 0.15s", whiteSpace: "nowrap" }}>
          {running ? <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Screening…</> : <><Brain size={15} /> Run AI Screening <ChevronRight size={14} /></>}
        </button>
        <span style={{ fontSize: 12, color: "#64748b" }}>
          {topN === "all" ? "All candidates will be ranked" : `Top ${topN} returned`}
        </span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function StagedPDFItem({ sf, onRemove }: { sf: StagedFile; onRemove: () => void }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "11px 14px",
      background: "var(--surface-card)",
      border: "1.5px solid var(--border-soft)",
      borderRadius: 11,
      transition: "border-color 0.15s",
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <FileText size={17} color="#7c3aed" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* ✅ FIX: sf.file.name not sf.name */}
        <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sf.file.name}</p>
        <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>{formatBytes(sf.file.size)}</p>
      </div>
      <button
        onClick={onRemove}
        style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "rgba(239,68,68,0.08)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}
        title="Remove file"
      >
        <X size={13} />
      </button>
    </div>
  );
}

function ApplicantsPageContent() {
  const dispatch     = useDispatch<AppDispatch>();
  const router       = useRouter();
  const searchParams = useSearchParams();

  // ✅ NEW: ref for the upload button so we can scroll to it
  const uploadBtnRef = useRef<HTMLDivElement>(null);

  const [activeTab,   setActiveTab]   = useState<"list" | "umurava" | "external" | "manual">("list");
  const [fileSubTab,  setFileSubTab]  = useState<"csv" | "resume" | "url">("csv");
  const [jobs,        setJobs]        = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [profiles,    setProfiles]    = useState<any[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [uploading,   setUploading]   = useState(false);
  const [profileSearch, setProfileSearch] = useState("");
  const [form,        setForm]        = useState(emptyForm());

  const [csvPreview,        setCsvPreview]        = useState<CSVPreview | null>(null);
  const [csvPreviewLoading, setCsvPreviewLoading] = useState(false);
  const [csvUploaded,       setCsvUploaded]       = useState(false);
  const [csvUploadedCount,  setCsvUploadedCount]  = useState(0);
  const [csvIngestPct,      setCsvIngestPct]      = useState(0);

  const [stagedPDFs,   setStagedPDFs]   = useState<StagedFile[]>([]);
  const [pdfUploading, setPdfUploading] = useState(false);

  const [fileProgresses,     setFileProgresses]     = useState<FileProgress[]>([]);
  const [resumeResults,      setResumeResults]      = useState<ResumeResult[]>([]);
  const [resumeUploaded,     setResumeUploaded]     = useState(false);
  const [resumeUploadedCount, setResumeUploadedCount] = useState(0);

  const [importUrl,    setImportUrl]    = useState("");
  const [importingUrl, setImportingUrl] = useState(false);
  const [urlProgress,  setUrlProgress]  = useState(0);
  const [urlUploaded,  setUrlUploaded]  = useState(false);
  const [urlUploadedCount, setUrlUploadedCount] = useState(0);

  const [candidates,        setCandidates]        = useState<any[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesLoaded,  setCandidatesLoaded]  = useState(false);
  const [candidateSearch,   setCandidateSearch]   = useState("");
  const [deleteTarget,      setDeleteTarget]      = useState<{ id: string; name: string } | null>(null);
  const [deleting,          setDeleting]          = useState(false);

  const [profilesAdded,      setProfilesAdded]      = useState(0);
  const [profilesAddedShown, setProfilesAddedShown] = useState(false);
  const [screeningRunning,   setScreeningRunning]   = useState(false);

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
    setStagedPDFs([]);
    setFileProgresses([]);
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
    if (!applicant.email)         missing.push("email");
    if (!applicant.skills?.length)     missing.push("skills");
    if (!applicant.experience?.length) missing.push("experience");
    if (missing.length > 0) toast(`⚠️ ${context} saved but missing: ${missing.join(", ")}`, {
      duration: 6000,
      style: { background: "#fefce8", color: "#854d0e", border: "1px solid #fde68a", fontWeight: 600 },
    });
  };

  const handleRunScreening = async (topN: 10 | 20 | "all") => {
    if (!selectedJob) { toast.error("Select a job first"); return; }
    setScreeningRunning(true);
    try {
      await (dispatch as any)(triggerScreening(selectedJob)).unwrap();
      toast.success("AI screening complete! Redirecting to results…");
      router.push(`/screenings?jobId=${encodeURIComponent(selectedJob)}&autoload=1`);
    } catch (e: unknown) {
      toast.error(typeof e === "string" ? e : "Screening failed. Make sure candidates are uploaded.");
    } finally { setScreeningRunning(false); }
  };

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

  const handleConfirmIngest = async () => {
    if (!csvPreview || !selectedJob) return;
    setUploading(true);
    setCsvIngestPct(10);
    const ticker = setInterval(() => { setCsvIngestPct(p => p < 85 ? p + 5 : p); }, 300);
    try {
      const res = await uploadCSV(selectedJob, csvPreview.file);
      clearInterval(ticker);
      setCsvIngestPct(100);
      const n = Number(res.count) || 0;
      if (n) { dispatch(bumpJobApplicants({ jobId: selectedJob, delta: n })); setCandidatesLoaded(false); setCsvUploadedCount(n); }
      setCsvUploaded(true);
    } catch (err: any) {
      clearInterval(ticker);
      setCsvIngestPct(0);
      toast.error(err?.response?.data?.message || "Upload failed.");
    } finally { setUploading(false); }
  };

  // ✅ FIX 1: s.file.name instead of s.name (StagedFile has no .name property)
  const onStagePDFs = useCallback((files: File[]) => {
    if (!selectedJob) { toast.error("Select a job first"); return; }
    const tooBig = files.filter(f => f.size > MAX_RESUME_SIZE_BYTES);
    if (tooBig.length) {
      toast.error(`${tooBig.map(f => f.name).join(", ")} exceeded 10 MB limit`);
      return;
    }
    const validFiles = files.filter(f => f.size <= MAX_RESUME_SIZE_BYTES);
    if (!validFiles.length) return;

    setStagedPDFs(prev => {
      // ✅ FIX: use s.file.name (not s.name) — StagedFile = { file, id }
      const existingNames = new Set(prev.map(s => s.file.name));
      const newFiles: StagedFile[] = validFiles
        .filter(f => !existingNames.has(f.name))
        .map(f => ({ file: f, id: `${f.name}-${f.size}-${Date.now()}` }));
      if (newFiles.length === 0) {
        toast("All selected files are already in the list", { icon: "ℹ️" });
        return prev;
      }

      // ✅ FIX 2: Auto-scroll to upload button after files are staged
      setTimeout(() => {
        uploadBtnRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 120);

      return [...prev, ...newFiles];
    });
    setResumeResults([]);
    setResumeUploaded(false);
    setFileProgresses([]);
  }, [selectedJob]);

  const handleUploadStagedPDFs = async () => {
    if (!selectedJob || stagedPDFs.length === 0) return;
    setPdfUploading(true);

    const progresses: FileProgress[] = stagedPDFs.map(sf => ({ name: sf.file.name, pct: 0, status: "uploading" }));
    setFileProgresses(progresses);

    const staged: ResumeResult[] = [];
    let added = 0;

    for (let i = 0; i < stagedPDFs.length; i++) {
      setFileProgresses(prev => prev.map((p, pi) => pi === i ? { ...p, pct: 20, status: "uploading" } : p));
      const animTick = setInterval(() => {
        setFileProgresses(prev => prev.map((p, pi) => {
          if (pi !== i || p.status !== "uploading") return p;
          return { ...p, pct: p.pct < 80 ? p.pct + 10 : p.pct };
        }));
      }, 400);

      try {
        const res = await uploadResumeFile(selectedJob, stagedPDFs[i].file);
        clearInterval(animTick);
        warnIfIncomplete(res?.applicant, stagedPDFs[i].file.name);
        const applicant = res?.applicant;
        staged.push({
          fileName:      stagedPDFs[i].file.name,
          candidateName: applicant ? `${applicant.firstName || ""} ${applicant.lastName || ""}`.trim() : stagedPDFs[i].file.name,
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
        toast.error(`${stagedPDFs[i].file.name}: ${err?.response?.data?.message || "Upload failed"}`);
      }
    }

    if (added > 0) {
      setResumeResults(staged.filter(s => s.candidateName));
      setResumeUploadedCount(added);
      setResumeUploaded(true);
      setStagedPDFs([]);
    }
    setPdfUploading(false);
  };

  const { getRootProps: getCSVRootProps, getInputProps: getCSVInputProps, isDragActive: isCSVDrag } = useDropzone({
    onDrop: onDropCSV,
    accept: { "text/csv": [".csv"], "application/vnd.ms-excel": [".xls"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
    multiple: false,
  });

  const { getRootProps: getResumeRootProps, getInputProps: getResumeInputProps, isDragActive: isResumeDrag } = useDropzone({
    onDrop: onStagePDFs,
    accept: { "application/pdf": [".pdf"], "application/msword": [".doc"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"], "text/plain": [".txt"] },
    multiple: true,
    noClick: pdfUploading,
    noDrag: pdfUploading,
  });

  const handleImportUrl = async () => {
    if (!selectedJob || !importUrl.trim()) { toast.error("Enter a URL and select a job"); return; }
    setImportingUrl(true); setUrlProgress(5); setUrlUploaded(false);
    const ticker = setInterval(() => { setUrlProgress(p => p < 80 ? p + 8 : p); }, 500);
    try {
      const res = await uploadFromURL(selectedJob, importUrl.trim());
      clearInterval(ticker); setUrlProgress(100);
      const n = Number(res.count) || 0;
      if (n) {
        dispatch(bumpJobApplicants({ jobId: selectedJob, delta: n }));
        setCandidatesLoaded(false); setUrlUploadedCount(n); setUrlUploaded(true); setImportUrl("");
      } else {
        toast.error(res?.message || "No candidates found at URL."); setUrlProgress(0);
      }
    } catch (err: any) { clearInterval(ticker); setUrlProgress(0); toast.error(err?.response?.data?.message || "Import failed."); }
    finally { setImportingUrl(false); }
  };

  const handleAddUmurava = async () => {
    if (!selectedJob || selectedProfiles.length === 0) { toast.error("Select profiles and a job first"); return; }
    setUploading(true);
    try {
      const res = await selectUmuravaProfiles(selectedJob, selectedProfiles);
      const n = Number(res.count) || 0;
      if (n) {
        dispatch(bumpJobApplicants({ jobId: selectedJob, delta: n }));
        setCandidatesLoaded(false); setProfilesAdded(n); setProfilesAddedShown(true); setSelectedProfiles([]);
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
      const payload = { ...form, skills: validSkills, experience: validExp.map(e => ({ ...e, technologies: e.technologies.filter((t: string) => t.trim()) })), education: form.education.filter(e => e.institution.trim()), certifications: form.certifications.filter(c => c.name.trim()), projects: form.projects.filter(p => p.name.trim()), languages: form.languages.filter(l => l.name.trim()), source: "external" };
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
        html.dark .ap-tab:hover:not(.active) { background:rgba(255,255,255,0.08); }
        .ap-tab.active { background:linear-gradient(135deg,#2563eb,#4f46e5); color:white; box-shadow:0 4px 14px rgba(37,99,235,0.3); }

        .ap-dropzone { border:2.5px dashed rgba(37,99,235,0.28); border-radius:18px; padding:48px 32px; text-align:center; cursor:pointer; transition:all 0.2s; background:linear-gradient(135deg,rgba(37,99,235,0.02),rgba(124,58,237,0.01)); }
        .ap-dropzone:hover,.ap-dropzone.drag { border-color:#2563eb; background:rgba(37,99,235,0.06); transform:scale(1.005); }
        .ap-dropzone-icon { width:64px; height:64px; border-radius:18px; background:rgba(37,99,235,0.1); border:1.5px solid rgba(37,99,235,0.15); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
        .ap-dropzone-title { font-size:18px; font-weight:800; color:var(--text-primary); margin-bottom:6px; letter-spacing:-0.02em; }
        .ap-dropzone-sub { font-size:13.5px; color:var(--text-secondary); font-weight:500; line-height:1.5; }

        .ap-fp-row { background:var(--surface-card); border:1.5px solid var(--border-soft); border-radius:12px; padding:12px 16px; display:flex; flex-direction:column; gap:8px; }
        .ap-fp-top  { display:flex; align-items:center; gap:10px; }
        .ap-fp-name { flex:1; font-size:13px; font-weight:600; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ap-fp-pct  { font-size:12px; font-weight:700; min-width:36px; text-align:right; }

        .ap-staged-row { display:flex; align-items:center; gap:12px; padding:12px 16px; background:var(--surface-card); border:1.5px solid #bbf7d0; border-radius:12px; }
        .ap-staged-avatar { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,#2563eb,#7c3aed); display:flex; align-items:center; justify-content:center; color:white; font-size:12px; font-weight:800; flex-shrink:0; }

        /* ✅ FIX 3: Upload trigger button — prominent, always visible, with pulse attention animation */
        .ap-upload-trigger {
          display:flex; align-items:center; justify-content:space-between;
          padding:18px 22px; border-radius:16px;
          background:linear-gradient(135deg,#2563eb,#7c3aed);
          color:white; cursor:pointer; border:none; font-family:inherit;
          box-shadow:0 8px 28px rgba(37,99,235,0.38);
          transition:transform 0.15s, box-shadow 0.15s;
          width:100%;
          animation: ap-uploadPulse 2s ease-in-out 3;
        }
        @keyframes ap-uploadPulse {
          0%,100% { box-shadow: 0 8px 28px rgba(37,99,235,0.38); }
          50%      { box-shadow: 0 12px 40px rgba(37,99,235,0.6), 0 0 0 6px rgba(37,99,235,0.12); }
        }
        .ap-upload-trigger:hover:not(:disabled) { transform:translateY(-3px); box-shadow:0 14px 40px rgba(37,99,235,0.5); }
        .ap-upload-trigger:disabled { opacity:0.6; cursor:not-allowed; transform:none; }

        /* Attention badge on upload button */
        .ap-upload-badge {
          display:inline-flex; align-items:center; gap:6px;
          background:rgba(255,255,255,0.2); border:1.5px solid rgba(255,255,255,0.35);
          padding:8px 18px; border-radius:10px;
          font-size:13.5px; font-weight:800; color:white;
          flex-shrink:0;
        }

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
        @keyframes pulse { 0%,100% { opacity:.7; } 50% { opacity:1; } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
        @media (max-width:768px) { .ap-main { margin-left:0; } .ap-body { padding:16px 12px 80px; } .ap-selector-row { flex-direction:column; align-items:stretch; } }
      `}</style>

      <div className="ap-root">
        <Sidebar />
        <div className="ap-main">
          <AppHeader title="Upload Candidates" subtitle="Add candidates to a job for AI screening" />
          <div className="ap-body">

            {/* Stepper */}
            <div className="ap-stepper">
              {[{ n: 1, label: "Select Job" }, { n: 2, label: "Add Candidates" }, { n: 3, label: "Run AI Screening" }].map((s, i) => {
                const isDone = step > s.n; const isActive = step === s.n;
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
              {step === 3 && (
                <Link href={selectedJob ? `/screenings?jobId=${selectedJob}` : "/screenings"} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "1.5px solid rgba(37,99,235,0.25)", background: "rgba(37,99,235,0.06)", color: "#2563eb", fontWeight: 700, fontSize: 13, textDecoration: "none", flexShrink: 0, whiteSpace: "nowrap" }}>
                  <Sparkles size={13} /> View Screenings
                </Link>
              )}
            </div>

            {/* Job selector */}
            <div className="ap-selector">
              <p className="ap-selector-title"><Briefcase size={16} color="#2563eb" /> Select a Job</p>
              <div className="ap-selector-row">
                <select className="ap-job-select" value={selectedJob} onChange={e => handleJobChange(e.target.value)}>
                  <option value="">— Choose a job position —</option>
                  {jobs.map(j => <option key={j._id} value={j._id}>{j.title}{j.location ? ` · ${j.location}` : ""} ({Math.max(j.applicantsCount || 0, 0)} candidates)</option>)}
                </select>
                {selectedJob && (
                  <button className="ap-load-btn" onClick={handleLoadApplicants} disabled={candidatesLoading}>
                    {candidatesLoading ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Loading…</> : <><List size={15} /> View Candidates</>}
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="ap-tabs">
              <button className={`ap-tab${activeTab === "list" ? " active" : ""}`} onClick={() => setActiveTab("list")}><List size={15} /> Candidate List</button>
              <button className={`ap-tab${activeTab === "external" ? " active" : ""}`} onClick={() => setActiveTab("external")}><Upload size={15} /> Upload File</button>
              <button className={`ap-tab${activeTab === "umurava" ? " active" : ""}`} onClick={() => setActiveTab("umurava")}><Users size={15} /> Umurava Talent</button>
              <button className={`ap-tab${activeTab === "manual" ? " active" : ""}`} onClick={() => setActiveTab("manual")}><PenSquare size={15} /> Manual Entry</button>
            </div>

            {/* ── TAB: Candidate List ── */}
            {activeTab === "list" && (
              <div>
                {!selectedJob ? (
                  <div style={{ background: "var(--surface-card)", border: "1.5px solid var(--border-soft)", borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
                    <Users size={32} style={{ margin: "0 auto 12px", display: "block", opacity: 0.35 }} />
                    <p style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 6 }}>No job selected</p>
                    <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Select a job above to view its candidates.</p>
                  </div>
                ) : (
                  <>
                    {(csvUploaded || resumeUploaded || urlUploaded || profilesAddedShown) && (
                      <div style={{ marginBottom: 16 }}>
                        {csvUploaded && <UploadDoneBanner count={csvUploadedCount} jobId={selectedJob} label="candidates imported from CSV" onReset={() => setCsvUploaded(false)} onRunScreening={handleRunScreening} running={screeningRunning} />}
                        {resumeUploaded && <UploadDoneBanner count={resumeUploadedCount} jobId={selectedJob} label="resume(s) uploaded and parsed" onReset={() => setResumeUploaded(false)} onRunScreening={handleRunScreening} running={screeningRunning} />}
                        {urlUploaded && <UploadDoneBanner count={urlUploadedCount} jobId={selectedJob} label="candidate(s) imported from URL" onReset={() => setUrlUploaded(false)} onRunScreening={handleRunScreening} running={screeningRunning} />}
                        {profilesAddedShown && <UploadDoneBanner count={profilesAdded} jobId={selectedJob} label="Umurava profile(s) added" onReset={() => setProfilesAddedShown(false)} onRunScreening={handleRunScreening} running={screeningRunning} />}
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                      <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 360 }}>
                        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                        <input type="text" placeholder="Search candidates…" value={candidateSearch} onChange={e => setCandidateSearch(e.target.value)} style={{ ...inp, paddingLeft: 36 }} />
                      </div>
                      <button className="ap-load-btn" onClick={handleLoadApplicants} disabled={candidatesLoading} style={{ fontSize: 13, padding: "10px 18px" }}>
                        {candidatesLoading ? "Loading…" : "Refresh"}
                      </button>
                      <span style={{ fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? "s" : ""}</span>
                    </div>

                    {!candidatesLoaded && !candidatesLoading && (
                      <div style={{ background: "var(--surface-card)", border: "1.5px solid var(--border-soft)", borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
                        <Users size={32} style={{ margin: "0 auto 12px", display: "block", opacity: 0.35 }} />
                        <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 15, marginBottom: 6 }}>Click "View Candidates" to load</p>
                        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Candidates for <strong>{selectedJobObj?.title}</strong> will appear here.</p>
                      </div>
                    )}

                    {candidatesLoading && <LoadingSpinner label="Loading candidates…" />}

                    {candidatesLoaded && filteredCandidates.length === 0 ? (
                      <div style={{ background: "var(--surface-card)", border: "1.5px solid var(--border-soft)", borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
                        <Users size={32} style={{ margin: "0 auto 12px", display: "block", opacity: 0.35 }} />
                        <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 15, marginBottom: 6 }}>No candidates yet</p>
                        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Upload CVs using the "Upload File" tab.</p>
                      </div>
                    ) : (
                      filteredCandidates.map((c) => {
                        const name = `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Unknown";
                        const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
                        const score = c.aiScore;
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
                        <input type="text" placeholder="Search Umurava talent pool…" value={profileSearch} onChange={e => setProfileSearch(e.target.value)} style={{ ...inp, paddingLeft: 36 }} />
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
                        const name = `${p.firstName || ""} ${p.lastName || ""}`.trim();
                        const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
                        const sel = selectedProfiles.includes(p._id);
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

                <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
                  {([
                    { id: "csv",    label: "CSV / Excel",  icon: FileSpreadsheet, color: "#2563eb", activeBg: "linear-gradient(135deg,#2563eb,#1d4ed8)", activeShadow: "0 4px 14px rgba(37,99,235,0.35)" },
                    { id: "resume", label: "PDF / DOCX",   icon: FileText,        color: "#7c3aed", activeBg: "linear-gradient(135deg,#7c3aed,#4f46e5)", activeShadow: "0 4px 14px rgba(124,58,237,0.35)" },
                    { id: "url",    label: "Import URL",   icon: Upload,          color: "#0891b2", activeBg: "linear-gradient(135deg,#0891b2,#0e7490)", activeShadow: "0 4px 14px rgba(8,145,178,0.3)" },
                  ] as const).map((t) => {
                    const Icon = t.icon;
                    return (
                      <button key={t.id} onClick={() => setFileSubTab(t.id)} style={{ padding: "12px 22px", borderRadius: 12, border: fileSubTab === t.id ? "none" : `1.5px solid ${t.color}30`, background: fileSubTab === t.id ? t.activeBg : `${t.color}0d`, color: fileSubTab === t.id ? "white" : t.color, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, boxShadow: fileSubTab === t.id ? t.activeShadow : "none", transition: "all 0.15s" }}>
                        <Icon size={15} /> {t.label}
                      </button>
                    );
                  })}
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
                    {csvPreviewLoading && <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, color: "var(--text-muted)", fontSize: 13 }}><span style={{ width: 14, height: 14, border: "2px solid var(--border-soft)", borderTopColor: "#2563eb", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />Parsing file…</div>}
                    {csvPreview && !csvUploaded && (
                      <div style={{ marginTop: 16, background: "var(--surface-card)", border: "1.5px solid var(--border-soft)", borderRadius: 16, padding: 22, boxShadow: "var(--shadow-card)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(37,99,235,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><FileSpreadsheet size={20} color="#2563eb" /></div>
                          <div><p style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{csvPreview.file.name}</p><p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{formatBytes(csvPreview.file.size)}</p></div>
                        </div>
                        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, background: "#f0fdf4", border: "1.5px solid #bbf7d0" }}><CheckCircle2 size={15} color="#15803d" /><span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>{csvPreview.totalCandidates} candidates detected</span></div>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, background: "#eff6ff", border: "1.5px solid #bfdbfe" }}><FileSpreadsheet size={15} color="#2563eb" /><span style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}>{csvPreview.columnsDetected} columns found</span></div>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
                          {csvPreview.headers.map(h => <span key={h} style={{ padding: "3px 10px", borderRadius: 6, background: "var(--surface-hover)", border: "1px solid var(--border-muted)", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{h}</span>)}
                        </div>
                        {uploading && <div style={{ marginBottom: 14 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 600 }}>Uploading to server…</span><span style={{ fontSize: 12.5, color: "#2563eb", fontWeight: 700 }}>{csvIngestPct}%</span></div><ProgressBar pct={csvIngestPct} /></div>}
                        <button onClick={handleConfirmIngest} disabled={uploading} style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "14px 28px", borderRadius: 13, background: uploading ? "var(--surface-hover)" : "linear-gradient(135deg,#2563eb,#4f46e5,#7c3aed)", color: uploading ? "var(--text-muted)" : "white", border: "none", fontWeight: 800, fontSize: 15.5, cursor: uploading ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: uploading ? "none" : "0 5px 20px rgba(37,99,235,0.38)", transition: "all 0.15s" }}>
                          {uploading ? <><RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> Uploading candidates…</> : <><Upload size={17} /> Upload {csvPreview.totalCandidates} Candidate{csvPreview.totalCandidates !== 1 ? "s" : ""} to Job</>}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Resume / PDF sub-tab ── */}
                {fileSubTab === "resume" && (
                  <div>
                    <div style={{ background: "rgba(124,58,237,0.06)", border: "1.5px solid rgba(124,58,237,0.15)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 9 }}>
                      <FileText size={17} color="#7c3aed" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 13.5, color: "var(--text-primary)", marginBottom: 3 }}>How PDF / DOCX upload works</p>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>
                          Drop files below — they will be <strong>staged</strong> first. Review the list, then click the <strong>Upload Files</strong> button that appears below to send them to AI for parsing.
                        </p>
                      </div>
                    </div>

                    {!pdfUploading && (
                      <div
                        {...getResumeRootProps()}
                        className={`ap-dropzone${isResumeDrag ? " drag" : ""}`}
                        style={{ borderColor: "rgba(124,58,237,0.3)", background: "linear-gradient(135deg,rgba(124,58,237,0.03),rgba(79,70,229,0.02))" }}
                      >
                        <input {...getResumeInputProps()} />
                        <div className="ap-dropzone-icon" style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.14),rgba(79,70,229,0.1))", border: "1.5px solid rgba(124,58,237,0.2)" }}>
                          <FileUp size={26} color="#7c3aed" />
                        </div>
                        <p className="ap-dropzone-title">{stagedPDFs.length > 0 ? "Drop more files to add" : "Drop candidate resumes here"}</p>
                        <p className="ap-dropzone-sub">
                          {stagedPDFs.length > 0
                            ? "Files will be added to the list below"
                            : "AI will extract name, email, skills and experience from each file"}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                          {[".pdf", ".docx", ".doc", ".txt"].map(fmt => (
                            <span key={fmt} style={{ padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700, background: "rgba(124,58,237,0.08)", color: "#7c3aed", border: "1px solid rgba(124,58,237,0.2)" }}>{fmt}</span>
                          ))}
                          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>· 10 MB each · Multiple OK</span>
                        </div>
                      </div>
                    )}

                    {/* Staged files list + Upload button */}
                    {stagedPDFs.length > 0 && !pdfUploading && (
                      <div style={{ marginTop: 18 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(124,58,237,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <FileText size={14} color="#7c3aed" />
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                              {stagedPDFs.length} file{stagedPDFs.length !== 1 ? "s" : ""} ready to upload
                            </span>
                          </div>
                          <button
                            onClick={() => setStagedPDFs([])}
                            style={{ padding: "4px 12px", borderRadius: 7, border: "1.5px solid var(--border-soft)", background: "transparent", color: "var(--text-muted)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}
                          >
                            <X size={12} /> Clear all
                          </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                          {stagedPDFs.map((sf) => (
                            <StagedPDFItem
                              key={sf.id}
                              sf={sf}
                              onRemove={() => setStagedPDFs(prev => prev.filter(s => s.id !== sf.id))}
                            />
                          ))}
                        </div>

                        {/* ✅ FIX 3: Upload button ref for auto-scroll + pulsing attention animation */}
                        <div ref={uploadBtnRef}>
                          {/* Attention indicator above the button */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }} />
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#2563eb" }}>
                              Ready! Click below to start uploading {stagedPDFs.length} file{stagedPDFs.length !== 1 ? "s" : ""}
                            </span>
                          </div>

                          <button
                            className="ap-upload-trigger"
                            onClick={handleUploadStagedPDFs}
                            disabled={!selectedJob || pdfUploading}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                              <div style={{ width: 46, height: 46, borderRadius: 13, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <Upload size={22} color="white" />
                              </div>
                              <div style={{ textAlign: "left" }}>
                                <p style={{ fontSize: 16, fontWeight: 900, color: "white", lineHeight: 1.2 }}>
                                  Upload {stagedPDFs.length} File{stagedPDFs.length !== 1 ? "s" : ""}
                                </p>
                                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", marginTop: 3 }}>
                                  AI will parse and extract each candidate&apos;s profile
                                </p>
                              </div>
                            </div>
                            <div className="ap-upload-badge">
                              <Sparkles size={14} color="white" />
                              Start Upload
                            </div>
                          </button>

                          {!selectedJob && (
                            <p style={{ fontSize: 12.5, color: "#ef4444", marginTop: 8, fontWeight: 500 }}>⚠️ Select a job above before uploading.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Uploading progress */}
                    {pdfUploading && fileProgresses.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                          <span style={{ width: 16, height: 16, border: "2.5px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>
                            Uploading {fileProgresses.length} file{fileProgresses.length !== 1 ? "s" : ""}…
                          </span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {fileProgresses.map((fp, i) => {
                            const pctColor = fp.status === "done" ? "#16a34a" : fp.status === "error" ? "#dc2626" : "#7c3aed";
                            return (
                              <div key={i} className="ap-fp-row">
                                <div className="ap-fp-top">
                                  <FileText size={15} color={pctColor} style={{ flexShrink: 0 }} />
                                  <span className="ap-fp-name">{fp.name}</span>
                                  <span className="ap-fp-pct" style={{ color: pctColor }}>
                                    {fp.status === "done" ? "Done ✓" : fp.status === "error" ? "Error" : `${fp.pct}%`}
                                  </span>
                                </div>
                                {fp.status !== "error" && <ProgressBar pct={fp.pct} color={pctColor} />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Parsed results */}
                    {resumeResults.length > 0 && (
                      <div style={{ marginTop: 18, background: "var(--surface-card)", border: "1.5px solid rgba(124,58,237,0.2)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-card)" }}>
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(124,58,237,0.12)", background: "rgba(124,58,237,0.04)", display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 11, background: resumeUploaded ? "#dcfce7" : "rgba(124,58,237,0.1)", border: `1px solid ${resumeUploaded ? "#bbf7d0" : "rgba(124,58,237,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {resumeUploaded ? <CheckCircle2 size={20} color="#15803d" /> : <FileText size={20} color="#7c3aed" />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 800, fontSize: 14.5, color: "var(--text-primary)" }}>
                              {resumeUploaded ? `✅ ${resumeUploadedCount} candidate${resumeUploadedCount !== 1 ? "s" : ""} uploaded successfully!` : `${resumeResults.length} resume${resumeResults.length !== 1 ? "s" : ""} parsed`}
                            </p>
                            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>
                              {resumeUploaded ? "Candidates are ready. You can now run AI screening." : "Check the parsed data below."}
                            </p>
                          </div>
                        </div>
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
                      </div>
                    )}
                  </div>
                )}

                {/* ── URL sub-tab ── */}
                {fileSubTab === "url" && (
                  <div>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.6 }}>Import a LinkedIn profile, resume URL, or a direct link to a CSV / XLSX file.</p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <input type="url" placeholder="https://example.com/resume.pdf" value={importUrl} onChange={e => setImportUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && handleImportUrl()} style={{ ...inp, flex: 1 }} />
                      <button onClick={handleImportUrl} disabled={importingUrl || !importUrl.trim() || !selectedJob} style={{ padding: "0 22px", height: 44, borderRadius: 10, background: importingUrl ? "var(--surface-hover)" : "var(--brand-primary)", color: importingUrl ? "var(--text-muted)" : "white", border: "none", fontWeight: 700, fontSize: 13.5, cursor: importingUrl ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 7, transition: "all 0.15s" }}>
                        {importingUrl ? <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Importing…</> : <><Upload size={14} /> Import</>}
                      </button>
                    </div>
                    {importingUrl && urlProgress > 0 && (
                      <div style={{ marginTop: 14, background: "var(--surface-card)", border: "1.5px solid var(--border-soft)", borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Fetching and parsing URL…</span>
                          <span style={{ fontSize: 13, color: "#2563eb", fontWeight: 700 }}>{urlProgress}%</span>
                        </div>
                        <ProgressBar pct={urlProgress} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: Manual Entry ── */}
            {activeTab === "manual" && (
              <div style={{ background: "var(--surface-card)", border: "1.5px solid var(--border-soft)", borderRadius: 18, padding: "24px 28px", boxShadow: "var(--shadow-card)" }}>
                <p style={{ fontWeight: 800, fontSize: 17, color: "var(--text-primary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}><PenSquare size={18} color="#2563eb" /> Manual Entry</p>
                <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 22 }}>Fill in the candidate's information manually.</p>
                {!selectedJob && <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(245,158,11,0.07)", border: "1.5px solid rgba(245,158,11,0.25)", color: "#d97706", fontWeight: 600, fontSize: 13, marginBottom: 18 }}>⚠️ Select a job above before adding a candidate manually.</div>}
                <div style={sectionBox}><p style={sectionTitle}><User size={13} /> Basic Info</p><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{[["firstName","First Name"],["lastName","Last Name"],["email","Email"],["headline","Headline / Role"],["location","Location"],["bio","Bio"]].map(([k, l]) => (<div key={k}><label style={lbl}>{l}</label><input style={inp} value={(form as any)[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))} placeholder={l} /></div>))}</div></div>
                <div style={sectionBox}><p style={sectionTitle}><Award size={13} /> Skills</p>{form.skills.map((s, i) => (<div key={i} style={{ display:"flex",gap:8,alignItems:"center",marginBottom:8 }}><input style={{...inp,flex:2}} placeholder="Skill name" value={s.name} onChange={e => setForm(f => ({...f,skills:f.skills.map((x,xi)=>xi===i?{...x,name:e.target.value}:x)}))}/><select style={{...inp,flex:1}} value={s.level} onChange={e => setForm(f => ({...f,skills:f.skills.map((x,xi)=>xi===i?{...x,level:e.target.value}:x)}))}>{["Beginner","Intermediate","Advanced","Expert"].map(l=><option key={l}>{l}</option>)}</select><button className="ap-row-remove" onClick={()=>removeSkill(i)}><X size={13}/></button></div>))}<button className="ap-add-row" onClick={addSkill}><Plus size={13}/>Add Skill</button></div>
                <div style={sectionBox}><p style={sectionTitle}><Briefcase size={13}/> Work Experience</p>{form.experience.map((e, i)=>(<div key={i} style={{borderBottom:"1px solid var(--border-muted)",paddingBottom:12,marginBottom:12}}><div style={{display:"flex",justifyContent:"flex-end"}}><button className="ap-row-remove" onClick={()=>removeExp(i)}><X size={13}/></button></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div><label style={lbl}>Company</label><input style={inp} placeholder="Company" value={e.company} onChange={ev=>setForm(f=>({...f,experience:f.experience.map((x,xi)=>xi===i?{...x,company:ev.target.value}:x)}))}/></div><div><label style={lbl}>Role</label><input style={inp} placeholder="Role" value={e.role} onChange={ev=>setForm(f=>({...f,experience:f.experience.map((x,xi)=>xi===i?{...x,role:ev.target.value}:x)}))}/></div></div></div>))}<button className="ap-add-row" onClick={addExp}><Plus size={13}/>Add Experience</button></div>
                <div style={sectionBox}><p style={sectionTitle}><GraduationCap size={13}/> Education</p>{form.education.map((e,i)=>(<div key={i} style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}><input style={{...inp,flex:2}} placeholder="Institution" value={e.institution} onChange={ev=>setForm(f=>({...f,education:f.education.map((x,xi)=>xi===i?{...x,institution:ev.target.value}:x)}))}/><input style={{...inp,flex:2}} placeholder="Degree" value={e.degree} onChange={ev=>setForm(f=>({...f,education:f.education.map((x,xi)=>xi===i?{...x,degree:ev.target.value}:x)}))}/><button className="ap-row-remove" onClick={()=>removeEdu(i)}><X size={13}/></button></div>))}<button className="ap-add-row" onClick={addEdu}><Plus size={13}/>Add Education</button></div>
                <button onClick={handleSubmitManual} disabled={uploading || !canSubmit || !selectedJob} style={{ padding:"14px 28px",borderRadius:13,background:!canSubmit||!selectedJob?"var(--surface-hover)":"linear-gradient(135deg,#2563eb,#7c3aed)",color:!canSubmit||!selectedJob?"var(--text-muted)":"white",border:"none",fontWeight:800,fontSize:15,cursor:!canSubmit||!selectedJob?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:!canSubmit||!selectedJob?"none":"0 5px 20px rgba(37,99,235,0.38)",transition:"all 0.15s",display:"inline-flex",alignItems:"center",gap:9 }}>
                  {uploading ? <><RefreshCw size={16} style={{animation:"spin 1s linear infinite"}}/>Saving…</> : <><CheckCircle2 size={17}/>Add Candidate</>}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="ap-del-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="ap-del-box" onClick={e => e.stopPropagation()}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}><Trash2 size={20} color="#ef4444" /></div>
            <p style={{ fontWeight: 800, fontSize: 17, color: "var(--text-primary)", marginBottom: 6 }}>Remove candidate?</p>
            <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>Remove <strong>{deleteTarget.name}</strong> from this job? Their profile stays in the system.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: 12, borderRadius: 11, border: "1.5px solid var(--border-soft)", background: "var(--surface-card)", color: "var(--text-secondary)", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={handleRemoveCandidate} disabled={deleting} style={{ flex: 1, padding: 12, borderRadius: 11, border: "none", background: "#ef4444", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(239,68,68,0.3)" }}>
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