"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import {
  triggerScreening, fetchResults, toggleSelectForCompare,
} from "../../../store/slices/screeningSlice";
import { AppDispatch, RootState } from "../../../store";
import Sidebar from "../../../components/Sidebar";
import api from "../../../services/api";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  Brain, Users, Trophy, TrendingUp, CheckCircle, XCircle,
  GitCompare, Send, MessageCircle, X, Minimize2,
} from "lucide-react";

const confidenceStyle: Record<string, { bg: string; color: string }> = {
  High: { bg: "#dcfce7", color: "#15803d" },
  Medium: { bg: "#fef9c3", color: "#ca8a04" },
  Low: { bg: "#fee2e2", color: "#dc2626" },
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "#15803d" : score >= 50 ? "#ca8a04" : "#dc2626";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{ flex: 1, height: "8px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: "99px", transition: "width 0.8s ease" }} />
      </div>
      <span style={{ fontSize: "13px", fontWeight: "700", color, width: "44px", textAlign: "right" }}>{score}/100</span>
    </div>
  );
}

export default function ScreeningPage() {
  const { jobId } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { results, loading, selectedForCompare } = useSelector((state: RootState) => state.screening);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (jobId) dispatch(fetchResults(jobId as string));
  }, [jobId]);

  const handleRunScreening = async () => {
    try {
      await dispatch(triggerScreening(jobId as string)).unwrap();
      toast.success("AI screening complete!");
    } catch (err: any) { toast.error(err || "Screening failed"); }
  };

  const handleCompare = () => {
    if (selectedForCompare.length < 2) { toast.error("Select at least 2 candidates"); return; }
    router.push(`/candidates/compare?jobId=${jobId}&ids=${selectedForCompare.join(",")}`);
  };

  const sendChat = async () => {
    const msg = chatMessage.trim();
    if (!msg || chatLoading) return;
    setChatHistory((h) => [...h, { role: "user", text: msg }]);
    setChatMessage("");
    setChatLoading(true);
    try {
      const res = await api.post("/chat", { message: msg, context: results });
      setChatHistory((h) => [...h, { role: "ai", text: res.data.response }]);
    } catch {
      setChatHistory((h) => [...h, { role: "ai", text: "⚠️ AI assistant is currently unavailable." }]);
    } finally { setChatLoading(false); }
  };

  const quickPrompts = [
    "Who is the strongest overall candidate?",
    "Who has the best skills match?",
    "Which candidates are immediately available?",
  ];

  const rankColors = ["#f59e0b", "#94a3b8", "#d97706"];

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ marginLeft: "260px", minHeight: "100vh", padding: "32px", background: "#f8fafc", flex: 1, paddingBottom: "100px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#1e293b", marginBottom: "4px" }}>AI Screening</h1>
            <p style={{ color: "#64748b", fontSize: "14px" }}>Powered by Google Gemini AI</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {selectedForCompare.length >= 2 && (
              <button onClick={handleCompare} style={{
                display: "flex", alignItems: "center", gap: "7px", padding: "11px 18px",
                borderRadius: "10px", border: "2px solid #7c3aed", background: "transparent",
                color: "#7c3aed", cursor: "pointer", fontWeight: "600", fontSize: "13px",
              }}>
                <GitCompare size={16} /> Compare ({selectedForCompare.length})
              </button>
            )}
            <button onClick={handleRunScreening} disabled={loading} style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "11px 20px",
              borderRadius: "10px", border: "none", fontWeight: "600", fontSize: "13px",
              background: loading ? "#94a3b8" : "linear-gradient(135deg,#7c3aed,#2563eb)",
              color: "white", cursor: loading ? "not-allowed" : "pointer",
            }}>
              {loading ? (
                <><div style={{ width: "15px", height: "15px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Analyzing...</>
              ) : (
                <><Brain size={16} />{results ? "Re-run Screening" : "Run AI Screening"}</>
              )}
            </button>
          </div>
        </div>

        {/* Spinner CSS */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        {/* Loading */}
        {loading && (
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "72px", textAlign: "center" }}>
            <div style={{ width: "60px", height: "60px", border: "4px solid #ede9fe", borderTop: "4px solid #7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>AI is analyzing candidates...</h3>
            <p style={{ color: "#94a3b8", fontSize: "13px" }}>Gemini is scoring and ranking all applicants. This may take 15–30 seconds.</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !results && (
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "72px", textAlign: "center" }}>
            <div style={{ width: "64px", height: "64px", background: "#f5f3ff", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Brain size={28} color="#7c3aed" />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>Ready to screen</h3>
            <p style={{ color: "#94a3b8", fontSize: "13px", maxWidth: "320px", margin: "0 auto" }}>
              Click "Run AI Screening" to analyze all applicants and get a ranked shortlist with AI explanations.
            </p>
          </div>
        )}

        {/* Results */}
        {!loading && results && (
          <>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", marginBottom: "20px" }}>
              {[
                { label: "Total Screened", value: results.totalApplicants, icon: Users, color: "#2563eb" },
                { label: "Shortlisted", value: results.shortlistedCount, icon: Trophy, color: "#ca8a04" },
                { label: "Top Score", value: `${results.rankedCandidates?.[0]?.score || 0}%`, icon: TrendingUp, color: "#15803d" },
              ].map((s) => (
                <div key={s.label} style={{ background: "white", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "18px", display: "flex", gap: "14px", alignItems: "center" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "11px", background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <s.icon size={20} color={s.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", lineHeight: 1 }}>{s.value}</p>
                    <p style={{ color: "#64748b", fontSize: "12px", marginTop: "2px" }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bias Notice */}
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", display: "flex", gap: "8px" }}>
              <span style={{ fontSize: "14px" }}>⚠️</span>
              <p style={{ color: "#92400e", fontSize: "12px" }}>{results.biasNotice}</p>
            </div>

            {/* Hint */}
            {results.rankedCandidates?.length >= 2 && (
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", color: "#1d4ed8", fontSize: "12px" }}>
                Tip: Check the boxes on 2–3 candidates, then click Compare to get a side-by-side AI analysis.
              </div>
            )}

            {/* Candidate Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {results.rankedCandidates?.map((c: any, i: number) => {
                const candidateId = c.candidateId?._id || c.candidateId;
                const isSelected = selectedForCompare.includes(candidateId);
                const conf = c.confidence as string;
                return (
                  <div key={i} style={{
                    background: "white", borderRadius: "14px",
                    border: `2px solid ${isSelected ? "#7c3aed" : "#e2e8f0"}`,
                    padding: "20px", transition: "border-color 0.15s",
                  }}>
                    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                      {/* Checkbox */}
                      <input type="checkbox" checked={isSelected}
                        onChange={() => dispatch(toggleSelectForCompare(candidateId))}
                        style={{ width: "16px", height: "16px", accentColor: "#7c3aed", marginTop: "3px", cursor: "pointer" }} />

                      {/* Rank badge */}
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "9px", flexShrink: 0,
                        background: i < 3 ? rankColors[i] : "#f1f5f9",
                        color: i < 3 ? "white" : "#64748b",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: "700", fontSize: "13px",
                      }}>#{c.rank}</div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                          <div>
                            <p style={{ fontWeight: "700", fontSize: "15px", color: "#1e293b", marginBottom: "1px" }}>
                              {c.candidateId?.firstName || c.candidateId?.fullName || `Candidate #${c.rank}`}{" "}
                              {c.candidateId?.lastName || ""}
                            </p>
                            <p style={{ color: "#64748b", fontSize: "12px" }}>{c.candidateId?.headline || c.candidateId?.email || ""}</p>
                          </div>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
                            {conf && confidenceStyle[conf] && (
                              <span style={{
                                padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600",
                                background: confidenceStyle[conf].bg, color: confidenceStyle[conf].color,
                              }}>{conf} Confidence</span>
                            )}
                            <Link href={`/candidates/${candidateId}?jobId=${jobId}`}>
                              <button style={{
                                padding: "7px 14px", borderRadius: "8px", border: "1px solid #bfdbfe",
                                background: "transparent", color: "#2563eb", cursor: "pointer",
                                fontSize: "12px", fontWeight: "500",
                              }}>View Profile</button>
                            </Link>
                          </div>
                        </div>

                        {/* Score Bar */}
                        <div style={{ marginBottom: "10px" }}>
                          <ScoreBar score={c.score} />
                        </div>

                        {/* Skills chips */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "10px" }}>
                          {c.skillsMatched?.map((s: string) => (
                            <span key={s} style={{ display: "flex", alignItems: "center", gap: "3px", padding: "3px 9px", background: "#f0fdf4", color: "#15803d", borderRadius: "5px", fontSize: "11px", fontWeight: "500" }}>
                              <CheckCircle size={9} />{s}
                            </span>
                          ))}
                          {c.skillsMissing?.map((s: string) => (
                            <span key={s} style={{ display: "flex", alignItems: "center", gap: "3px", padding: "3px 9px", background: "#fef2f2", color: "#dc2626", borderRadius: "5px", fontSize: "11px", fontWeight: "500" }}>
                              <XCircle size={9} />{s}
                            </span>
                          ))}
                        </div>

                        {/* Strengths & Gaps */}
                        <p style={{ color: "#475569", fontSize: "12px", marginBottom: "4px" }}>
                          <span style={{ fontWeight: "600", color: "#15803d" }}>Strengths: </span>{c.strengths}
                        </p>
                        <p style={{ color: "#475569", fontSize: "12px" }}>
                          <span style={{ fontWeight: "600", color: "#ca8a04" }}>Gaps: </span>{c.gaps}
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

      {/* ── Floating AI Chat Bubble ── */}
      {results && (
        <>
          {/* Floating button */}
          {!chatOpen && (
            <button onClick={() => setChatOpen(true)} style={{
              position: "fixed", bottom: "32px", right: "32px", zIndex: 1000,
              width: "56px", height: "56px", borderRadius: "50%", border: "none",
              background: "linear-gradient(135deg,#7c3aed,#2563eb)",
              boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", transition: "transform 0.2s",
            }}>
              <MessageCircle size={22} />
            </button>
          )}

          {/* Chat panel */}
          {chatOpen && (
            <div style={{
              position: "fixed", bottom: "24px", right: "24px", zIndex: 1000,
              width: "360px", background: "white", borderRadius: "16px",
              border: "1px solid #e2e8f0", boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              display: "flex", flexDirection: "column", overflow: "hidden",
              maxHeight: "520px",
            }}>
              {/* Chat header */}
              <div style={{
                background: "linear-gradient(135deg,#7c3aed,#2563eb)",
                padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80" }} />
                  <span style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>Ask AI about candidates</span>
                </div>
                <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.8)", cursor: "pointer" }}>
                  <X size={16} />
                </button>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "10px", minHeight: "200px" }}>
                {chatHistory.length === 0 && (
                  <>
                    <p style={{ color: "#94a3b8", fontSize: "12px", textAlign: "center", marginBottom: "8px" }}>
                      Ask me anything about these candidates
                    </p>
                    {quickPrompts.map((q) => (
                      <button key={q} onClick={() => { setChatMessage(q); setTimeout(sendChat, 10); }} style={{
                        padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0",
                        background: "#f8fafc", color: "#475569", cursor: "pointer",
                        fontSize: "12px", textAlign: "left", fontWeight: "400",
                      }}>{q}</button>
                    ))}
                  </>
                )}
                {chatHistory.map((m, i) => (
                  <div key={i} style={{
                    maxWidth: "85%", padding: "9px 12px", borderRadius: "10px", fontSize: "13px", lineHeight: "1.5",
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                    background: m.role === "user" ? "linear-gradient(135deg,#7c3aed,#2563eb)" : "#f8fafc",
                    color: m.role === "user" ? "white" : "#374151",
                    border: m.role === "ai" ? "1px solid #e2e8f0" : "none",
                  }}>{m.text}</div>
                ))}
                {chatLoading && (
                  <div style={{ alignSelf: "flex-start", padding: "9px 12px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <span style={{ color: "#94a3b8", fontSize: "13px" }}>Thinking...</span>
                  </div>
                )}
              </div>

              {/* Input */}
              <div style={{ padding: "12px", borderTop: "1px solid #f1f5f9", display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="Ask about candidates..."
                  style={{
                    flex: 1, padding: "9px 12px", borderRadius: "9px",
                    border: "1px solid #e2e8f0", fontSize: "13px", outline: "none",
                  }}
                />
                <button onClick={sendChat} disabled={chatLoading || !chatMessage.trim()} style={{
                  width: "36px", height: "36px", borderRadius: "9px", border: "none",
                  background: chatLoading || !chatMessage.trim() ? "#e2e8f0" : "linear-gradient(135deg,#7c3aed,#2563eb)",
                  color: "white", cursor: chatLoading || !chatMessage.trim() ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}