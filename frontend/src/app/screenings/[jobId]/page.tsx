"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import AppHeader from "../../../components/AppHeader";
import ScreeningResults from "../../../components/ScreeningResults";
import { getJob } from "../../../services/jobService";
import { getResults } from "../../../services/screeningService";
import { sendChatMessage } from "../../../services/chatService";
import type { Job, ScreeningResult } from "../../../types";
import {
  Brain, Briefcase, Upload, ArrowRight, Sparkles,
  Send, Download, RotateCcw, ChevronRight, Users,
} from "lucide-react";
import toast from "react-hot-toast";

/* ── CSV download helper ── */
function downloadCSV(results: any, jobTitle: string) {
  const headers = ["Rank","Name","Email","Score","Recommendation","Confidence","Skills Matched","Skills Missing","Strengths","Gaps"];
  const rows = (results.rankedCandidates || []).map((r: any, i: number) => {
    const c = typeof r.candidateId === "object" ? r.candidateId as any : {};
    const name = c ? `${c.firstName || ""} ${c.lastName || ""}`.trim() : `Candidate ${i + 1}`;
    return [r.rank, name, c?.email || "", r.score, r.recommendation, r.confidence,
            (r.skillsMatched || []).join("; "), (r.skillsMissing || []).join("; "),
            (r.strengths || "").replace(/"/g, "'"), (r.gaps || "").replace(/"/g, "'")];
  });
  const csv = [headers, ...rows].map((row) =>
    row.map((v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
  ).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  a.download = `screening-${jobTitle.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

export default function ScreeningJobPage() {
  const { jobId } = useParams();
  const router    = useRouter();
  const id        = jobId as string;

  const [job,     setJob]     = useState<Job | null>(null);
  const [results, setResults] = useState<ScreeningResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [topN,    setTopN]    = useState<10 | 20 | "all">("all");

  /* AI Chat state */
  const [chatInput,   setChatInput]   = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/"); return; }
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const [jr, sr] = await Promise.all([
          getJob(id).catch(() => ({ job: null })),
          getResults(id).catch(() => ({ data: null })),
        ]);
        if (cancelled) return;
        setJob(jr.job || null);
        if (sr.data) setResults(sr.data as ScreeningResult);
        else setError("no-results");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, router]);

  /* Scroll chat to bottom */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading || !job) return;
    setChatHistory(h => [...h, { role: "user", text: msg }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await sendChatMessage(msg, {
        jobId: job._id,
        job: { title: job.title, description: (job as any).description, requiredSkills: (job as any).requiredSkills, yearsOfExperience: (job as any).yearsOfExperience, educationLevel: (job as any).educationLevel, location: (job as any).location, jobType: (job as any).jobType },
        screeningSummary: results ? { totalApplicants: results.totalApplicants, shortlistedCount: results.shortlistedCount } : null,
      });
      setChatHistory(h => [...h, { role: "ai", text: res.response || "No response" }]);
    } catch {
      setChatHistory(h => [...h, { role: "ai", text: "AI assistant unavailable. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const CHIPS = [
    "Who should I interview first?",
    "Compare the top 3 candidates",
    "What skills are most matched?",
    "Which candidates have the highest confidence?",
  ];

  return (
    <>
      <style>{`
        .sr-root { display: flex; font-family: var(--font-body, system-ui); }
        .sr-main { margin-left: var(--sidebar-width); min-height: 100vh; background: #f0f4f8; flex: 1; }
        .sr-body { padding: 28px 36px 80px; max-width: 1080px; animation: fadeIn 0.28s ease; }

        /* ── Empty state ── */
        .sr-empty {
          background: #fff; border-radius: 20px;
          border: 1.5px solid #e2e8f0;
          padding: 72px 40px; text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .sr-empty-ico { width: 72px; height: 72px; border-radius: 20px; background: rgba(124,58,237,0.08); display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }

        /* ── Results header bar ── */
        .sr-header {
          background: #fff; border-radius: 16px;
          border: 1.5px solid #e2e8f0;
          padding: 18px 22px; margin-bottom: 20px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .sr-header-left { display: flex; flex-direction: column; gap: 3px; }
        .sr-header-title { font-size: 17px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; display: flex; align-items: center; gap: 8px; }
        .sr-header-meta { font-size: 13px; color: #64748b; }
        .sr-header-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

        /* Top N pills */
        .sr-topn-wrap { display: flex; align-items: center; gap: 7px; }
        .sr-topn-label { font-size: 12px; font-weight: 700; color: #64748b; white-space: nowrap; }
        .sr-topn-select {
          font-size: 13px; font-weight: 600; color: #0f172a;
          border: 1.5px solid #e2e8f0; border-radius: 9px;
          background: #f8fafc; padding: 6px 10px; outline: none; cursor: pointer;
          transition: border-color 0.15s;
        }
        .sr-topn-select:focus { border-color: #2563eb; }

        /* Download button */
        .sr-dl-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 18px; border-radius: 10px;
          border: 1.5px solid #e2e8f0; background: #fff;
          color: #475569; font-weight: 700; font-size: 13px;
          cursor: pointer; font-family: inherit;
          transition: all 0.15s;
        }
        .sr-dl-btn:hover { border-color: #16a34a; color: #16a34a; background: rgba(22,163,74,0.05); }

        /* Back link */
        .sr-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 600; color: #64748b;
          text-decoration: none; padding: 7px 14px;
          border-radius: 9px; border: 1.5px solid #e2e8f0;
          background: #fff; transition: all 0.15s;
        }
        .sr-back:hover { border-color: #2563eb; color: #2563eb; }

        /* ── AI Chat panel ── */
        .sr-chat {
          background: #fff; border-radius: 20px;
          border: 1.5px solid #e2e8f0;
          padding: 24px 26px; margin-top: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          animation: fadeIn 0.3s ease 0.15s both;
        }
        .sr-chat-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px;
        }
        .sr-chat-title {
          font-size: 15px; font-weight: 800; color: #0f172a;
          display: flex; align-items: center; gap: 8px;
          letter-spacing: -0.2px;
        }
        .sr-chat-badge {
          font-size: 10px; font-weight: 700; padding: 3px 8px;
          border-radius: 99px; background: rgba(124,58,237,0.1);
          color: #7c3aed; text-transform: uppercase; letter-spacing: 0.06em;
        }

        /* Chips */
        .sr-chips { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 14px; }
        .sr-chip {
          padding: 7px 13px; border-radius: 99px;
          border: 1.5px solid #e2e8f0; background: #f8fafc;
          font-size: 12.5px; font-weight: 600; color: #475569;
          cursor: pointer; transition: all 0.15s; white-space: nowrap;
        }
        .sr-chip:hover { border-color: #7c3aed; color: #7c3aed; background: rgba(124,58,237,0.05); }

        /* Messages */
        .sr-msgs {
          max-height: 320px; overflow-y: auto; margin-bottom: 14px;
          display: flex; flex-direction: column; gap: 10px;
          padding-right: 4px;
        }
        .sr-msgs::-webkit-scrollbar { width: 4px; }
        .sr-msgs::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }

        .sr-msg-user {
          align-self: flex-end; max-width: 78%;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white; padding: 10px 14px; border-radius: 14px 14px 4px 14px;
          font-size: 13.5px; line-height: 1.5; font-weight: 500;
        }
        .sr-msg-ai {
          align-self: flex-start; max-width: 88%;
          background: #f8fafc; border: 1.5px solid #f1f5f9;
          color: #1e293b; padding: 10px 14px; border-radius: 14px 14px 14px 4px;
          font-size: 13.5px; line-height: 1.6; font-weight: 400;
        }
        .sr-msg-thinking {
          align-self: flex-start; display: flex; align-items: center; gap: 8px;
          color: #94a3b8; font-size: 13px; font-style: italic; padding: 4px 0;
        }
        .sr-think-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #94a3b8;
          animation: srPulse 1.2s ease-in-out infinite;
        }
        .sr-think-dot:nth-child(2) { animation-delay: 0.2s; }
        .sr-think-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes srPulse { 0%,100% { opacity:0.3; transform:scale(0.8); } 50% { opacity:1; transform:scale(1); } }

        /* Input row */
        .sr-chat-input-row { display: flex; gap: 8px; align-items: center; }
        .sr-chat-input {
          flex: 1; padding: 11px 16px;
          border-radius: 11px; border: 1.5px solid #e2e8f0;
          background: #f8fafc; color: #0f172a;
          font-size: 14px; font-family: inherit; outline: none;
          transition: all 0.15s;
        }
        .sr-chat-input:focus { border-color: #7c3aed; background: #fff; box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }
        .sr-chat-input::placeholder { color: #b0bec5; }
        .sr-chat-send {
          padding: 11px 18px; border-radius: 11px; border: none;
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          color: white; font-weight: 700; font-size: 13.5px;
          cursor: pointer; display: flex; align-items: center; gap: 6px;
          font-family: inherit; transition: all 0.15s; flex-shrink: 0;
          box-shadow: 0 3px 10px rgba(124,58,237,0.3);
        }
        .sr-chat-send:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(124,58,237,0.4); }
        .sr-chat-send:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        @media (max-width: 768px) {
          .sr-main { margin-left: 0; }
          .sr-body { padding: 20px 16px 80px; }
          .sr-header { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="sr-root">
        <Sidebar />
        <div className="sr-main">
          <AppHeader
            title={job?.title || "Screening Results"}
            subtitle="AI-ranked candidates for this job"
          />
          <div className="sr-body">

            {/* ── Loading ── */}
            {loading && (
              <div style={{ padding: 64, textAlign: "center" }}>
                <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.75s linear infinite", margin: "0 auto 14px" }} />
                <p style={{ color: "#94a3b8", fontSize: 14 }}>Loading screening results…</p>
              </div>
            )}

            {/* ── No results yet ── */}
            {!loading && (error === "no-results" || !results) && (
              <div className="sr-empty">
                <div className="sr-empty-ico"><Brain size={32} color="#7c3aed" /></div>
                <p style={{ fontWeight: 800, fontSize: 20, color: "#0f172a", letterSpacing: "-0.3px" }}>
                  No screening results yet
                </p>
                <p style={{ color: "#64748b", fontSize: 14, maxWidth: 380, lineHeight: 1.65 }}>
                  Upload candidates for this job, then run AI screening to get a ranked shortlist with scores, strengths and gaps.
                </p>
                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", justifyContent: "center" }}>
                  <Link href={`/applicants?jobId=${id}`} style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"11px 22px", borderRadius:12, background:"linear-gradient(135deg,#7c3aed,#2563eb)", color:"white", fontWeight:700, fontSize:14, textDecoration:"none", boxShadow:"0 4px 14px rgba(124,58,237,0.3)" }}>
                    <Upload size={15} /> Upload Candidates <ArrowRight size={14} />
                  </Link>
                  <Link href={`/screenings?jobId=${id}`} style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"11px 22px", borderRadius:12, border:"1.5px solid #e2e8f0", background:"#fff", color:"#475569", fontWeight:700, fontSize:14, textDecoration:"none" }}>
                    <Sparkles size={15} /> Run AI Screening
                  </Link>
                </div>
                <Link href="/jobs" style={{ marginTop: 16, fontSize: 13, color: "#94a3b8", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                  <Briefcase size={13} /> View all jobs
                </Link>
              </div>
            )}

            {/* ── Results ── */}
            {!loading && results && (
              <>
                {/* Results header bar */}
                <div className="sr-header">
                  <div className="sr-header-left">
                    <p className="sr-header-title">
                      <Sparkles size={17} color="#7c3aed" />
                      {results.totalApplicants} candidates screened
                    </p>
                    <p className="sr-header-meta">
                      {results.shortlistedCount} shortlisted · Screened {new Date(results.screenedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="sr-header-right">
                    {/* Top N picker */}
                    <div className="sr-topn-wrap">
                      <span className="sr-topn-label">Show top</span>
                      <select
                        className="sr-topn-select"
                        value={topN}
                        onChange={(e) => setTopN(e.target.value as any)}
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value="all">All</option>
                      </select>
                    </div>

                    {/* Download */}
                    <button className="sr-dl-btn" onClick={() => downloadCSV(results, job?.title || "results")}>
                      <Download size={14} /> Download Results
                    </button>

                    {/* Back to job */}
                    <Link href={`/jobs/${id}`} className="sr-back">
                      <Briefcase size={13} /> Back to Job <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>

                {/* Screening results component */}
                <ScreeningResults jobId={id} results={results} fromCache={false} displayTopN={topN} />

                {/* ── AI Chat — appears after results ── */}
                <div className="sr-chat">
                  <div className="sr-chat-header">
                    <p className="sr-chat-title">
                      <Sparkles size={16} color="#7c3aed" />
                      Ask AI about these results
                    </p>
                    <span className="sr-chat-badge">Gemini AI</span>
                  </div>

                  {/* Suggestion chips — only when no messages yet */}
                  {chatHistory.length === 0 && (
                    <div className="sr-chips">
                      {CHIPS.map((chip) => (
                        <button key={chip} className="sr-chip" onClick={() => setChatInput(chip)}>
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Messages */}
                  {chatHistory.length > 0 && (
                    <div className="sr-msgs">
                      {chatHistory.map((m, i) => (
                        <div key={i} className={m.role === "user" ? "sr-msg-user" : "sr-msg-ai"}>
                          {m.text}
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="sr-msg-thinking">
                          <div className="sr-think-dot" />
                          <div className="sr-think-dot" />
                          <div className="sr-think-dot" />
                          Thinking…
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}

                  {/* Input */}
                  <div className="sr-chat-input-row">
                    <input
                      className="sr-chat-input"
                      placeholder="Ask about candidates, scores, or hiring decisions…"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendChat()}
                    />
                    <button className="sr-chat-send" disabled={!chatInput.trim() || chatLoading} onClick={sendChat}>
                      <Send size={14} /> Ask AI
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}