"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { RootState } from "../store";
import { sendChatMessage } from "../services/chatService";
import { buildScreeningChatContext } from "../utils/screeningChatContext";

type Msg = { role: "user" | "ai"; text: string };

function hasToken(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("token"));
}

export default function FloatingAI() {
  const pathname = usePathname();
  const reduxToken = useSelector((s: RootState) => s.auth.token);
  const results = useSelector((s: RootState) => s.screening.results);
  const assistantScreeningContext = useSelector(
    (s: RootState) => s.screening.assistantScreeningContext
  );

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const welcomedJobRef = useRef<string | null>(null);

  const screeningContext =
    buildScreeningChatContext(results) ?? assistantScreeningContext;

  const loggedIn = Boolean(reduxToken) || (mounted && hasToken());
  const showWidget = mounted && pathname !== "/" && loggedIn;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, open, loading]);

  const pushWelcomeIfNeeded = useCallback(() => {
    const jobKey = screeningContext
      ? String((screeningContext as { jobId?: string }).jobId || "")
      : "";
    if (!open) return;
    if (jobKey && welcomedJobRef.current === jobKey) return;
    if (!jobKey && welcomedJobRef.current === "__empty__") return;

    if (screeningContext && (screeningContext as { candidates?: unknown[] }).candidates) {
      welcomedJobRef.current = jobKey || "__job__";
      const n = (screeningContext as { candidates: unknown[] }).candidates.length;
      setHistory((h) =>
        h.length
          ? h
          : [
              {
                role: "ai",
                text: `I have context for the latest screening (${n} ranked candidates). Ask about fit, trade-offs, red flags, or who to shortlist — I'll stay concise and professional.`,
              },
            ]
      );
    } else {
      welcomedJobRef.current = "__empty__";
      setHistory((h) =>
        h.length
          ? h
          : [
              {
                role: "ai",
                text: "I'm your recruitment copilot. After you run screening for a job, open results once so I can see ranked candidates — then you can ask detailed questions about them. You can still ask general hiring questions anytime.",
              },
            ]
      );
    }
  }, [open, screeningContext]);

  useEffect(() => {
    pushWelcomeIfNeeded();
  }, [pushWelcomeIfNeeded]);

  // Closing only hides the panel — history is preserved so reopening continues the conversation.
  const closePanel = () => {
    setOpen(false);
  };

  const send = async () => {
    const msg = message.trim();
    if (!msg || loading) return;
    setHistory((h) => [...h, { role: "user", text: msg }]);
    setMessage("");
    setLoading(true);
    try {
      const { response } = await sendChatMessage(msg, {
        screening: screeningContext,
        route: pathname,
      });
      setHistory((h) => [...h, { role: "ai", text: response }]);
    } catch {
      setHistory((h) => [
        ...h,
        { role: "ai", text: "The assistant is temporarily unavailable. Try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!showWidget) return null;

  return createPortal(
    <>
      <style>{`
        .um-fab {
          position: fixed;
          bottom: max(24px, env(safe-area-inset-bottom));
          right: max(24px, env(safe-area-inset-right));
          z-index: 9998;
          height: 52px;
          padding: 0 20px;
          border-radius: 26px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: white;
          background: linear-gradient(145deg, #4f46e5 0%, #2563eb 45%, #7c3aed 100%);
          box-shadow:
            0 4px 24px rgba(37, 99, 235, 0.45),
            0 0 0 1px rgba(255,255,255,0.12) inset;
          transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
          white-space: nowrap;
          font-size: 14px;
          font-weight: 700;
          font-family: system-ui, sans-serif;
          letter-spacing: -0.01em;
        }
        .um-fab:hover {
          transform: scale(1.04);
          box-shadow: 0 8px 28px rgba(79, 70, 229, 0.5), 0 0 0 1px rgba(255,255,255,0.15) inset;
        }
        .um-fab:active { transform: scale(0.96); }
        @keyframes um-fab-pulse {
          0%, 100% { box-shadow: 0 4px 24px rgba(37, 99, 235, 0.45), 0 0 0 0 rgba(99, 102, 241, 0.35); }
          50% { box-shadow: 0 4px 28px rgba(37, 99, 235, 0.55), 0 0 0 10px rgba(99, 102, 241, 0); }
        }
        .um-fab-pulse { animation: um-fab-pulse 2.8s ease-in-out infinite; }
        .um-chat-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9997;
          background: rgba(15, 23, 42, 0.25);
          backdrop-filter: blur(2px);
          opacity: 0;
          animation: um-backdrop-in 0.22s ease forwards;
        }
        @keyframes um-backdrop-in { to { opacity: 1; } }
        .um-chat-panel {
          position: fixed;
          z-index: 9999;
          bottom: max(20px, env(safe-area-inset-bottom));
          right: max(20px, env(safe-area-inset-right));
          width: min(400px, calc(100vw - 32px));
          max-height: min(560px, calc(100vh - 100px));
          background: #fff;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transform-origin: bottom right;
          animation: um-panel-in 0.28s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
        }
        @keyframes um-panel-in {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (max-width: 480px) {
          .um-chat-panel {
            left: 16px;
            right: 16px;
            width: auto;
            max-height: min(70vh, 520px);
          }
          .um-fab {
            padding: 0 14px;
            font-size: 13px;
          }
        }
      `}</style>

      {!open && (
        <button
          type="button"
          className="um-fab um-fab-pulse"
          aria-label="Open AI assistant"
          onClick={() => setOpen(true)}
        >
          <Sparkles size={18} strokeWidth={2} />
          AI Assistant
        </button>
      )}

      {open && (
        <>
          <div
            className="um-chat-backdrop"
            aria-hidden
            onClick={closePanel}
          />
          <div className="um-chat-panel" role="dialog" aria-label="AI recruitment assistant">
            <div
              style={{
                padding: "16px 18px",
                background: "linear-gradient(135deg, #312e81 0%, #1e40af 50%, #5b21b6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MessageCircle size={18} color="white" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: 14,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    AI Assistant
                  </p>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.75)",
                      fontSize: 11,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {screeningContext
                      ? "Screening context loaded"
                      : "General hiring Q&A"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePanel}
                aria-label="Close assistant"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: "none",
                  background: "rgba(255,255,255,0.12)",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                minHeight: 220,
                background: "#f8fafc",
              }}
            >
              {history.map((m, i) => (
                <div
                  key={i}
                  style={{
                    maxWidth: "88%",
                    padding: "10px 14px",
                    borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                    background:
                      m.role === "user"
                        ? "linear-gradient(135deg, #4f46e5, #2563eb)"
                        : "#fff",
                    color: m.role === "user" ? "#fff" : "#334155",
                    border: m.role === "ai" ? "1px solid #e2e8f0" : "none",
                    fontSize: 13,
                    lineHeight: 1.55,
                    boxShadow: m.role === "ai" ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
                  }}
                >
                  {m.text}
                </div>
              ))}
              {loading && (
                <div
                  style={{
                    alignSelf: "flex-start",
                    padding: "10px 14px",
                    background: "#fff",
                    borderRadius: "16px 16px 16px 4px",
                    border: "1px solid #e2e8f0",
                    fontSize: 13,
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span className="um-ai-typing-dot" />
                  Thinking…
                </div>
              )}
              <div ref={bottomRef} />
              <style>{`
                @keyframes um-ai-bounce {
                  0%, 80%, 100% { transform: scale(0.75); opacity: 0.5; }
                  40% { transform: scale(1); opacity: 1; }
                }
                .um-ai-typing-dot {
                  width: 8px; height: 8px; border-radius: 50%;
                  background: #6366f1;
                  animation: um-ai-bounce 1s ease-in-out infinite;
                }
              `}</style>
            </div>

            <div
              style={{
                padding: "12px 14px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                gap: 8,
                background: "#fff",
              }}
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder={
                  screeningContext
                    ? "Ask about these candidates…"
                    : "Ask a hiring question…"
                }
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  fontSize: 13,
                  outline: "none",
                  background: "#fafafa",
                }}
              />
              <button
                type="button"
                onClick={send}
                disabled={loading || !message.trim()}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  border: "none",
                  background:
                    loading || !message.trim()
                      ? "#e2e8f0"
                      : "linear-gradient(135deg, #4f46e5, #2563eb)",
                  color: "white",
                  cursor: loading || !message.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.15s",
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </>,
    document.body
  );
}