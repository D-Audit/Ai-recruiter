"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../../../components/Sidebar";
import AppHeader from "../../../components/AppHeader";
import ScreeningResults from "../../../components/ScreeningResults";
import { getJob } from "../../../services/jobService";
import { sendChatMessage } from "../../../services/chatService";
import {
  triggerScreening,
  fetchResults,
  clearResults,
} from "../../../store/slices/screeningSlice";
import { saveJob } from "../../../store/slices/jobSlice";
import { AppDispatch, RootState } from "../../../store";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Brain,
  MapPin,
  Users,
  Pencil,
  Send,
  Sparkles,
} from "lucide-react";

type JobRow = {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  jobType?: string;
  status?: string;
  applicantsCount?: number;
  createdAt?: string;
  requiredSkills?: string[];
  yearsOfExperience?: number;
  educationLevel?: string;
};

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const {
    results,
    fromCache,
    loading: screeningLoading,
  } = useSelector((s: RootState) => s.screening);

  const [job, setJob] = useState<JobRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [topN, setTopN] = useState<10 | 20 | "all">(20);
  const [editForm, setEditForm] = useState<Partial<JobRow>>({});

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);
  const [chatLoading, setChatLoading] = useState(false);

  const jobId = id as string;

  const loadJob = () => {
    if (!jobId) return;
    getJob(jobId)
      .then((d) => setJob(d.job))
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadJob();
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;
    dispatch(clearResults());
    dispatch(fetchResults(jobId))
      .unwrap()
      .catch(() => {
        /* no saved results */
      });
  }, [jobId, dispatch]);

  useEffect(() => {
    if (job) {
      setEditForm({
        title: job.title,
        description: job.description,
        location: job.location,
        jobType: job.jobType,
        yearsOfExperience: job.yearsOfExperience,
        educationLevel: job.educationLevel,
        requiredSkills: job.requiredSkills,
      });
    }
  }, [job, editOpen]);

  const statusMap: Record<string, { bg: string; color: string; label: string }> =
    {
      open: { bg: "#dcfce7", color: "#16a34a", label: "Active" },
      screening: { bg: "#dbeafe", color: "#2563eb", label: "Screening" },
      closed: { bg: "#f1f5f9", color: "#64748b", label: "Closed" },
    };

  const runScreen = async () => {
    try {
      await dispatch(triggerScreening(jobId)).unwrap();
      toast.success("Screening complete");
      loadJob();
      router.push(`/screenings/${jobId}`);
    } catch (e: unknown) {
      toast.error(typeof e === "string" ? e : "Screening failed");
    }
  };

  const saveEdit = async () => {
    if (!job) return;
    try {
      await dispatch(
        saveJob({
          id: job._id,
          data: {
            title: editForm.title,
            description: editForm.description,
            location: editForm.location,
            jobType: editForm.jobType,
            yearsOfExperience: editForm.yearsOfExperience,
            educationLevel: editForm.educationLevel,
            requiredSkills: editForm.requiredSkills,
          },
        })
      ).unwrap();
      toast.success("Job updated");
      setEditOpen(false);
      loadJob();
    } catch (e: unknown) {
      toast.error(typeof e === "string" ? e : "Update failed");
    }
  };

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading || !job) return;
    setChatHistory((h) => [...h, { role: "user", text: msg }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await sendChatMessage(msg, {
        jobId: job._id,
        job: {
          title: job.title,
          description: job.description,
          requiredSkills: job.requiredSkills,
          yearsOfExperience: job.yearsOfExperience,
          educationLevel: job.educationLevel,
          location: job.location,
          jobType: job.jobType,
        },
        screeningSummary: results
          ? {
              totalApplicants: results.totalApplicants,
              shortlistedCount: results.shortlistedCount,
            }
          : null,
      });
      setChatHistory((h) => [
        ...h,
        { role: "ai", text: res.response || "No response" },
      ]);
    } catch {
      setChatHistory((h) => [
        ...h,
        { role: "ai", text: "Assistant unavailable. Try again later." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const chips = [
    "Who should I interview first?",
    "Compare top 3 candidates",
    "What skills are most matched?",
  ];

  const st = job
    ? statusMap[job.status || "closed"] ?? statusMap.closed
    : statusMap.closed;

  return (
    <>
      <style>{`
        .jd-root { display: flex; font-family: system-ui, sans-serif; }
        .jd-main { margin-left: 260px; min-height: 100vh; background: #f8fafc; flex: 1; display: flex; flex-direction: column; }
        .jd-body { padding: 28px 40px 120px; flex: 1; max-width: 920px; }
        .jd-back {
          display: inline-flex; align-items: center; gap: 6px; color: #64748b; font-size: 13px; font-weight: 600;
          background: none; border: none; cursor: pointer; margin-bottom: 20px; padding: 0;
        }
        .jd-card {
          background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; margin-bottom: 20px;
        }
        .jd-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .jd-title { font-size: 24px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
        .jd-badge { padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; }
        .jd-actions { display: flex; flex-wrap: wrap; gap: 10px; }
        .jd-btn {
          display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 11px;
          font-weight: 700; font-size: 13px; cursor: pointer; border: none;
        }
        .jd-btn-outline { background: white; border: 2px solid #2563eb; color: #2563eb; }
        .jd-btn-primary { background: #2563eb; color: white; box-shadow: 0 4px 14px rgba(37,99,235,0.25); }
        .jd-meta { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
        .jd-meta-cell { padding: 12px 14px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
        .jd-meta-l { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; }
        .jd-meta-v { font-size: 14px; font-weight: 700; color: #1e293b; margin-top: 4px; }
        .ingest-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 20px; }
        .ingest-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 16px; }
        .jd-select { height: 42px; padding: 0 12px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 14px; }
        .chat-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; }
        .chat-msg-user { background: #eff6ff; padding: 10px 14px; border-radius: 12px; margin-bottom: 8px; font-size: 14px; }
        .chat-msg-ai { background: #f8fafc; padding: 10px 14px; border-radius: 12px; margin-bottom: 8px; font-size: 14px; color: #334155; }
        .chip {
          padding: 6px 12px; border-radius: 20px; border: 1px solid #e2e8f0; background: #f8fafc;
          font-size: 12px; font-weight: 600; color: #475569; cursor: pointer;
        }
        .chip:hover { border-color: #bfdbfe; color: #2563eb; }
        .modal-bg {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 150;
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .modal-inner { background: white; border-radius: 16px; padding: 28px; max-width: 520px; width: 100%; max-height: 90vh; overflow-y: auto; }
        @media (max-width: 768px) { .jd-main { margin-left: 0; } .jd-body { padding: 20px; } }
      `}</style>

      <div className="jd-root">
        <Sidebar />
        <div className="jd-main">
          <AppHeader title={job?.title || "Job"} />
          <div className="jd-body">
            <button
              type="button"
              className="jd-back"
              onClick={() => router.push("/jobs")}
            >
              <ArrowLeft size={15} /> Back to Jobs
            </button>

            {loading ? (
              <p style={{ color: "#94a3b8" }}>Loading…</p>
            ) : !job ? (
              <p style={{ color: "#64748b", fontWeight: 600 }}>Job not found</p>
            ) : (
              <>
                <div className="jd-card">
                  <div className="jd-row">
                    <div>
                      <h1 className="jd-title">{job.title}</h1>
                      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                        <span className="jd-badge" style={{ background: "#eff6ff", color: "#2563eb" }}>
                          {job.jobType}
                        </span>
                        <span className="jd-badge" style={{ background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                      </div>
                    </div>
                    <div className="jd-actions">
                      <Link href={`/applicants?jobId=${job._id}`}>
                        <button type="button" className="jd-btn jd-btn-outline">
                          <Users size={16} /> Upload Applicants
                        </button>
                      </Link>
                      <button
                        type="button"
                        className="jd-btn jd-btn-outline"
                        onClick={() => setEditOpen(true)}
                      >
                        <Pencil size={16} /> Edit Job
                      </button>
                    </div>
                  </div>
                  <div className="jd-meta">
                    <div className="jd-meta-cell">
                      <p className="jd-meta-l">Location</p>
                      <p className="jd-meta-v" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <MapPin size={14} color="#64748b" /> {job.location || "—"}
                      </p>
                    </div>
                    <div className="jd-meta-cell">
                      <p className="jd-meta-l">Posted</p>
                      <p className="jd-meta-v">
                        {job.createdAt
                          ? new Date(job.createdAt).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <div className="jd-meta-cell">
                      <p className="jd-meta-l">Applicants</p>
                      <p className="jd-meta-v">{job.applicantsCount ?? 0}</p>
                    </div>
                  </div>
                  {job.description ? (
                    <p style={{ marginTop: 16, color: "#475569", lineHeight: 1.65, fontSize: 14 }}>
                      {job.description}
                    </p>
                  ) : null}
                </div>

                <div className="ingest-card">
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
                    Applicant ingestion & screening
                  </h2>
                  <p style={{ color: "#64748b", fontSize: 14, marginBottom: 16 }}>
                    <strong style={{ color: "#0f172a" }}>{job.applicantsCount ?? 0}</strong>{" "}
                    candidate(s) ingested for this role.
                  </p>
                  <div className="ingest-row">
                    <Link href={`/applicants?jobId=${job._id}`}>
                      <button type="button" className="jd-btn jd-btn-outline">
                        <Users size={16} /> Upload Applicants
                      </button>
                    </Link>
                    <select
                      className="jd-select"
                      value={topN}
                      onChange={(e) => {
                        const v = e.target.value;
                        setTopN(v === "all" ? "all" : (Number(v) as 10 | 20));
                      }}
                    >
                      <option value={10}>Top 10</option>
                      <option value={20}>Top 20</option>
                      <option value="all">All</option>
                    </select>
                    <button
                      type="button"
                      className="jd-btn jd-btn-primary"
                      disabled={screeningLoading}
                      onClick={runScreen}
                    >
                      {screeningLoading ? (
                        "…"
                      ) : (
                        <>
                          <Brain size={17} /> Screen Candidates
                        </>
                      )}
                    </button>
                    {fromCache ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "4px 10px",
                          borderRadius: 20,
                          background: "#fef9c3",
                          color: "#a16207",
                        }}
                      >
                        ⚡ Cached result
                      </span>
                    ) : null}
                  </div>
                  {screeningLoading ? (
                    <div style={{ textAlign: "center", padding: "32px 16px" }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          border: "3px solid #e2e8f0",
                          borderTopColor: "#2563eb",
                          borderRadius: "50%",
                          margin: "0 auto 12px",
                          animation: "spin 0.75s linear infinite",
                        }}
                      />
                      <p style={{ fontWeight: 600, color: "#334155" }}>
                        AI is analyzing candidates…
                      </p>
                    </div>
                  ) : !screeningLoading && results && results.jobId === jobId ? (
                    <ScreeningResults
                      jobId={jobId}
                      results={results}
                      fromCache={fromCache}
                      displayTopN={topN}
                    />
                  ) : (
                    <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 8 }}>
                      Run screening to see ranked candidates here, or open the{" "}
                      <Link href={`/screenings/${jobId}`} style={{ color: "#2563eb", fontWeight: 600 }}>
                        full results page
                      </Link>
                      .
                    </p>
                  )}
                </div>

                <div className="chat-card">
                  <h2
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#0f172a",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Sparkles size={18} color="#7c3aed" />
                    AI Assistant · Powered by Gemini
                  </h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                    {chips.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="chip"
                        onClick={() => setChatInput(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <div style={{ maxHeight: 280, overflowY: "auto", marginBottom: 12 }}>
                    {chatHistory.map((m, i) =>
                      m.role === "user" ? (
                        <div key={i} className="chat-msg-user">
                          {m.text}
                        </div>
                      ) : (
                        <div key={i} className="chat-msg-ai">
                          {m.text}
                        </div>
                      )
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="field-input"
                      style={{
                        flex: 1,
                        padding: "12px 14px",
                        borderRadius: 11,
                        border: "1px solid #e2e8f0",
                        fontSize: 14,
                      }}
                      placeholder="Ask about this job or candidates…"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") sendChat();
                      }}
                    />
                    <button
                      type="button"
                      className="jd-btn jd-btn-primary"
                      onClick={sendChat}
                      disabled={chatLoading}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {editOpen && job ? (
        <div className="modal-bg" onClick={() => setEditOpen(false)}>
          <div className="modal-inner" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 16 }}>Edit job</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Title</label>
              <input
                style={{ padding: 10, borderRadius: 10, border: "1px solid #e2e8f0" }}
                value={editForm.title || ""}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Description</label>
              <textarea
                rows={4}
                style={{ padding: 10, borderRadius: 10, border: "1px solid #e2e8f0", resize: "none" }}
                value={editForm.description || ""}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Location</label>
                  <input
                    style={{ padding: 10, borderRadius: 10, border: "1px solid #e2e8f0", width: "100%", marginTop: 4 }}
                    value={editForm.location || ""}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Job type</label>
                  <select
                    style={{ padding: 10, borderRadius: 10, border: "1px solid #e2e8f0", width: "100%", marginTop: 4 }}
                    value={editForm.jobType || "Full-time"}
                    onChange={(e) => setEditForm({ ...editForm, jobType: e.target.value })}
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Remote</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 11,
                  border: "1px solid #e2e8f0",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 11,
                  border: "none",
                  background: "#2563eb",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
