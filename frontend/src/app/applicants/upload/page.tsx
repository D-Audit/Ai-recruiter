"use client";
import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Sidebar from "../../../components/Sidebar";
import {
  uploadCSV,
  uploadPDF,
  getUmuravaProfiles,
  selectUmuravaProfiles,
} from "../../../services/applicantService";
import { getAllJobs } from "../../../services/jobService";
import toast from "react-hot-toast";
import { Upload, FileText, Download, CheckCircle } from "lucide-react";

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState<"umurava" | "external">("umurava");
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getAllJobs().then((d) => setJobs(d.jobs || []));
    getUmuravaProfiles().then((d) => setProfiles(d.profiles || []));
  }, []);

  const onDropCSV = useCallback(
    async (files: File[]) => {
      if (!selectedJob) {
        toast.error("Please select a job first");
        return;
      }
      setUploading(true);
      try {
        const res = await uploadCSV(selectedJob, files[0]);
        toast.success(`${res.count} applicants uploaded successfully!`);
      } catch {
        toast.error("CSV upload failed");
      } finally {
        setUploading(false);
      }
    },
    [selectedJob]
  );

  const onDropPDF = useCallback(
    async (files: File[]) => {
      if (!selectedJob) {
        toast.error("Please select a job first");
        return;
      }
      setUploading(true);
      try {
        for (const file of files) {
          await uploadPDF(selectedJob, file);
        }
        toast.success(`${files.length} resume(s) uploaded!`);
      } catch {
        toast.error("PDF upload failed");
      } finally {
        setUploading(false);
      }
    },
    [selectedJob]
  );

  const { getRootProps: csvProps, getInputProps: csvInput, isDragActive: csvDrag } =
    useDropzone({ onDrop: onDropCSV, accept: { "text/csv": [".csv"] }, maxFiles: 1 });

  const { getRootProps: pdfProps, getInputProps: pdfInput, isDragActive: pdfDrag } =
    useDropzone({ onDrop: onDropPDF, accept: { "application/pdf": [".pdf"] } });

  const toggleProfile = (id: string) => {
    setSelectedProfiles((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSelectProfiles = async () => {
    if (!selectedJob) { toast.error("Select a job first"); return; }
    if (selectedProfiles.length === 0) { toast.error("Select at least one profile"); return; }
    setUploading(true);
    try {
      const res = await selectUmuravaProfiles(selectedJob, selectedProfiles);
      toast.success(`${res.count} profiles added to job!`);
      setSelectedProfiles([]);
    } catch {
      toast.error("Failed to add profiles");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csv =
      "fullName,email,phone,skills,yearsOfExperience,education,location,languages\n" +
      'John Doe,john@email.com,+250780000000,"React,Node.js",3,Bachelor in CS,Kigali Rwanda,"English,Kinyarwanda"';
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "umurava_template.csv";
    a.click();
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ marginLeft: "260px", minHeight: "100vh", padding: "32px", background: "#f8fafc", flex: 1 }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
          Add Applicants
        </h1>
        <p style={{ color: "#64748b", marginBottom: "32px" }}>
          Add candidates from Umurava platform or upload from external sources
        </p>

        {/* Job Selector */}
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
            Select Job Position *
          </label>
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            style={{ width: "100%", maxWidth: "400px", padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "14px", outline: "none" }}
          >
            <option value="">-- Choose a job --</option>
            {jobs.map((j) => (
              <option key={j._id} value={j._id}>{j.title}</option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "white", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "4px", marginBottom: "24px", width: "fit-content" }}>
          {(["umurava", "external"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "10px 24px",
                borderRadius: "12px",
                border: "none",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
                background: activeTab === tab ? "linear-gradient(135deg, #2563eb, #7c3aed)" : "transparent",
                color: activeTab === tab ? "white" : "#64748b",
                transition: "all 0.2s",
              }}
            >
              {tab === "umurava" ? "🏢 Umurava Profiles" : "📤 Upload External"}
            </button>
          ))}
        </div>

        {/* Umurava Tab */}
        {activeTab === "umurava" && (
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontWeight: "700", color: "#1e293b" }}>
                Umurava Platform Profiles ({profiles.length})
              </h3>
              <button
                onClick={handleSelectProfiles}
                disabled={uploading || selectedProfiles.length === 0}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  background: selectedProfiles.length === 0 ? "#94a3b8" : "#2563eb",
                  color: "white",
                  border: "none",
                  cursor: selectedProfiles.length === 0 ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                <CheckCircle size={15} /> Add Selected ({selectedProfiles.length})
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "400px", overflowY: "auto" }}>
              {profiles.map((p) => (
                <div
                  key={p._id}
                  onClick={() => toggleProfile(p._id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "16px",
                    borderRadius: "12px",
                    border: `2px solid ${selectedProfiles.includes(p._id) ? "#2563eb" : "#e2e8f0"}`,
                    background: selectedProfiles.includes(p._id) ? "#eff6ff" : "white",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedProfiles.includes(p._id)}
                    readOnly
                    style={{ width: "18px", height: "18px", accentColor: "#2563eb" }}
                  />
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "700",
                      flexShrink: 0,
                    }}
                  >
                    {p.fullName?.charAt(0) || "?"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: "600", color: "#1e293b" }}>{p.fullName}</p>
                    <p style={{ color: "#64748b", fontSize: "13px" }}>
                      {p.yearsOfExperience} yrs exp • {p.education}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                      {p.skills?.slice(0, 4).map((s: string) => (
                        <span
                          key={s}
                          style={{
                            padding: "2px 8px",
                            background: "#eff6ff",
                            color: "#2563eb",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "500",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* External Tab */}
        {activeTab === "external" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* CSV */}
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontWeight: "700", color: "#1e293b" }}>Upload CSV Spreadsheet</h3>
                <button
                  onClick={downloadTemplate}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "1px solid #bfdbfe",
                    background: "transparent",
                    color: "#2563eb",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  <Download size={14} /> Download Template
                </button>
              </div>
              <div
                {...csvProps()}
                style={{
                  border: `2px dashed ${csvDrag ? "#2563eb" : "#e2e8f0"}`,
                  borderRadius: "16px",
                  padding: "40px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: csvDrag ? "#eff6ff" : "transparent",
                  transition: "all 0.2s",
                }}
              >
                <input {...csvInput()} />
                <Upload size={32} color="#cbd5e1" style={{ margin: "0 auto 12px" }} />
                <p style={{ fontWeight: "600", color: "#475569" }}>
                  {csvDrag ? "Drop your CSV here" : "Drag & drop your CSV file"}
                </p>
                <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
                  or click to browse • CSV files only
                </p>
              </div>
            </div>

            {/* PDF */}
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px" }}>
              <h3 style={{ fontWeight: "700", color: "#1e293b", marginBottom: "16px" }}>
                Upload PDF Resumes
              </h3>
              <div
                {...pdfProps()}
                style={{
                  border: `2px dashed ${pdfDrag ? "#7c3aed" : "#e2e8f0"}`,
                  borderRadius: "16px",
                  padding: "40px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: pdfDrag ? "#f5f3ff" : "transparent",
                  transition: "all 0.2s",
                }}
              >
                <input {...pdfInput()} />
                <FileText size={32} color="#cbd5e1" style={{ margin: "0 auto 12px" }} />
                <p style={{ fontWeight: "600", color: "#475569" }}>
                  {pdfDrag ? "Drop PDFs here" : "Drag & drop resume PDFs"}
                </p>
                <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
                  or click to browse • Multiple PDFs allowed
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}