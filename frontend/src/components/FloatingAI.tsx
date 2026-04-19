"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { X, Send, Sparkles, Zap, Brain } from "lucide-react";
import { RootState } from "../store";
import { sendChatMessage } from "../services/chatService";
import { buildScreeningChatContext } from "../utils/screeningChatContext";

type Msg = { role: "user" | "ai"; text: string };

const SUGGESTED_PROMPTS_SCREENING = [
  "Who is the strongest candidate?",
  "What are the biggest skill gaps?",
  "Who should I shortlist?",
];

const SUGGESTED_PROMPTS_GENERAL = [
  "How do I write a great job description?",
  "What makes a strong technical candidate?",
  "Tips for bias-aware screening?",
];

function hasToken(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("token"));
}

function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 0" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#94a3b8", display: "inline-block", animation: `ai-bounce 1.2s ease-in-out ${i * 0.18}s infinite` }} />
      ))}
    </div>
  );
}

export default function FloatingAI() {
  const pathname = usePathname();
  const reduxToken = useSelector((s: RootState) => s.auth.token);
  const results = useSelector((s: RootState) => s.screening.results);
  const assistantScreeningContext = useSelector((s: RootState) => s.screening.assistantScreeningContext);

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const welcomedJobRef = useRef<string | null>(null);

  const screeningContext = buildScreeningChatContext(results) ?? assistantScreeningContext;
  const loggedIn = Boolean(reduxToken) || (mounted && hasToken());
  const showWidget = mounted && pathname !== "/" && loggedIn;
  const suggestedPrompts = screeningContext ? SUGGESTED_PROMPTS_SCREENING : SUGGESTED_PROMPTS_GENERAL;
  const showSuggestions = history.length <= 1;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [history, open, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const pushWelcomeIfNeeded = useCallback(() => {
    const jobKey = screeningContext ? String((screeningContext as { jobId?: string }).jobId || "") : "";
    if (!open) return;
    if (jobKey && welcomedJobRef.current === jobKey) return;
    if (!jobKey && welcomedJobRef.current === "__empty__") return;

    if (screeningContext && (screeningContext as { candidates?: unknown[] }).candidates) {
      welcomedJobRef.current = jobKey || "__job__";
      const n = (screeningContext as { candidates: unknown[] }).candidates.length;
      setHistory((h) => h.length ? h : [{ role: "ai", text: `I have context for the latest screening — ${n} ranked candidates loaded. Ask me about fit, who to shortlist, skills gaps, or trade-offs between candidates.` }]);
    } else {
      welcomedJobRef.current = "__empty__";
      setHistory((h) => h.length ? h : [{ role: "ai", text: "I'm your Umurava AI recruitment copilot. Run a screening for a job first and I'll have candidate context. You can also ask general hiring questions anytime." }]);
    }
  }, [open, screeningContext]);

  useEffect(() => { pushWelcomeIfNeeded(); }, [pushWelcomeIfNeeded]);

  const closePanel = () => setOpen(false);

  const send = async (overrideMsg?: string) => {
    const msg = (overrideMsg ?? message).trim();
    if (!msg || loading) return;
    setHistory((h) => [...h, { role: "user", text: msg }]);
    setMessage("");
    setLoading(true);
    try {
      const res = await sendChatMessage(msg, screeningContext || {});
      setHistory((h) => [...h, { role: "ai", text: res.response || "No response from AI." }]);
    } catch {
      setHistory((h) => [...h, { role: "ai", text: "AI assistant is currently unavailable. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrompt = (p: string) => send(p);

  if (!showWidget) return null;

  return createPortal(
    <>
      <style>{`
        .ai-fab {
          position: fixed; bottom: max(24px, env(safe-area-inset-bottom, 24px)); right: max(24px, env(safe-area-inset-right, 24px));
          z-index: 9998; height: 46px; padding: 0 18px;
          border-radius: 99px; border: none; cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          font-size: 14px; font-weight: 700; font-family: var(--font-body, system-ui);
          color: white;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          box-shadow: 0 6px 24px rgba(37,99,235,0.45), inset 0 1px 0 rgba(255,255,255,0.18);
          transition: all 0.2s ease;
          animation: logoPulse 3s ease-in-out infinite;
        }
        .ai-fab:hover { transform: scale(1.04); box-shadow: 0 8px 28px rgba(37,99,235,0.55), inset 0 1px 0 rgba(255,255,255,0.18); }
        .ai-fab:active { transform: scale(0.97); }

        .ai-backdrop { position: fixed; inset: 0; z-index: 9997; background: rgba(15,23,42,0.2); backdrop-filter: blur(2px); opacity: 0; animation: ai-backdrop-in 0.2s ease forwards; }

        .ai-panel {
          position: fixed; z-index: 9999;
          bottom: max(22px, env(safe-area-inset-bottom, 22px));
          right: max(22px, env(safe-area-inset-right, 22px));
          width: min(400px, calc(100vw - 32px));
          max-height: min(580px, calc(100vh - 100px));
          background: var(--surface-card, #fff);
          border-radius: 20px; border: 1.5px solid var(--border-soft);
          box-shadow: 0 24px 64px rgba(15,23,42,0.16), 0 4px 16px rgba(15,23,42,0.06);
          display: flex; flex-direction: column; overflow: hidden;
          transform-origin: bottom right;
          animation: ai-panel-in 0.28s cubic-bezier(0.34,1.2,0.64,1) forwards;
        }

        .ai-panel-header {
          padding: 15px 16px;
          background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #4f46e5 100%);
          display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-shrink: 0;
        }
        .ai-header-avatar { width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center; flex-shrink: 0; animation: logoPulse 3s ease-in-out infinite; }
        .ai-header-name { color: white; font-weight: 800; font-size: 14px; letter-spacing: -0.01em; }
        .ai-header-sub { color: rgba(255,255,255,0.65); font-size: 11px; margin-top: 1px; }
        .ai-header-btn { width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.12); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.15s; flex-shrink: 0; }
        .ai-header-btn:hover { background: rgba(255,255,255,0.22); }

        .ai-context-bar { background: #eff6ff; border-bottom: 1px solid #dbeafe; padding: 8px 14px; display: flex; align-items: center; gap: 7px; font-size: 11.5px; font-weight: 600; color: #1d4ed8; flex-shrink: 0; }

        .ai-messages { flex: 1; overflow-y: auto; padding: 14px 14px 8px; display: flex; flex-direction: column; gap: 10px; background: var(--surface-base, #f8fafc); min-height: 200px; }
        .ai-msg { max-width: 88%; font-size: 13px; line-height: 1.58; animation: ai-msg-in 0.18s ease forwards; }
        .ai-msg-user { align-self: flex-end; background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; padding: 10px 14px; border-radius: 16px 16px 4px 16px; box-shadow: 0 2px 8px rgba(37,99,235,0.25); }
        .ai-msg-ai { align-self: flex-start; background: var(--surface-card, white); color: var(--text-primary, #334155); border: 1px solid var(--border-soft); padding: 10px 14px; border-radius: 16px 16px 16px 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .ai-typing { align-self: flex-start; background: var(--surface-card, white); border: 1px solid var(--border-soft); border-radius: 16px 16px 16px 4px; padding: 12px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }

        .ai-suggestions { padding: 0 14px 10px; display: flex; flex-wrap: wrap; gap: 6px; background: var(--surface-base, #f8fafc); }
        .ai-suggestion-btn { padding: 6px 12px; border-radius: 99px; border: 1.5px solid var(--border-soft); background: var(--surface-card, white); color: var(--text-secondary, #475569); font-size: 12px; font-weight: 600; cursor: pointer; font-family: var(--font-body, system-ui); transition: all 0.15s; white-space: nowrap; }
        .ai-suggestion-btn:hover { border-color: #bfdbfe; color: #2563eb; background: #eff6ff; }

        .ai-input-bar { padding: 11px 12px; border-top: 1px solid var(--border-muted); display: flex; gap: 8px; background: var(--surface-card, white); flex-shrink: 0; }
        .ai-input { flex: 1; padding: 9px 13px; border-radius: 10px; border: 1.5px solid var(--border-input); background: var(--surface-hover, #fafbfc); font-size: 13px; font-family: var(--font-body, system-ui); color: var(--text-primary, #0f172a); outline: none; transition: all 0.15s; }
        .ai-input:focus { border-color: #2563eb; background: var(--surface-card, white); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .ai-input::placeholder { color: var(--text-muted, #94a3b8); }
        .ai-send-btn { width: 40px; height: 40px; border-radius: 10px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: all 0.15s; }
        .ai-send-btn:not(:disabled) { background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; box-shadow: 0 2px 8px rgba(37,99,235,0.3); }
        .ai-send-btn:not(:disabled):hover { transform: scale(1.06); }
        .ai-send-btn:disabled { background: var(--surface-hover, #f1f5f9); color: var(--text-muted, #94a3b8); cursor: not-allowed; }

        @media (max-width: 480px) { .ai-panel { left: 12px; right: 12px; width: auto; } .ai-fab { padding: 0 14px; font-size: 13px; } }
      `}</style>

      {/* FAB — "Umurava AI" branding with animated pulse */}
      {!open && (
        <button type="button" className="ai-fab" aria-label="Open Umurava AI assistant" onClick={() => setOpen(true)}>
          <Brain size={17} strokeWidth={2.5} />
          Umurava AI
        </button>
      )}

      {/* Panel */}
      {open && (
        <>
          <div className="ai-backdrop" aria-hidden onClick={closePanel} />
          <div className="ai-panel" role="dialog" aria-label="Umurava AI recruitment assistant">

            {/* Header — "Umurava AI Assistant" */}
            <div className="ai-panel-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                <div className="ai-header-avatar">
                  <Brain size={16} color="white" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="ai-header-name">Umurava AI Assistant</p>
                  <p className="ai-header-sub">
                    {screeningContext ? "Screening context loaded" : "General hiring mode"}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button type="button" className="ai-header-btn" onClick={closePanel} aria-label="Close assistant">
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Context indicator */}
            {screeningContext && (
              <div className="ai-context-bar">
                <Zap size={12} />
                {(screeningContext as { candidates?: unknown[] }).candidates?.length || 0} candidates in context · Ask anything about the ranking
              </div>
            )}

            {/* Messages */}
            <div className="ai-messages">
              {history.map((m, i) => (
                <div key={i} className={`ai-msg ${m.role === "user" ? "ai-msg-user" : "ai-msg-ai"}`} style={{ animationDelay: `${i * 0.02}s` }}>
                  {m.text}
                </div>
              ))}
              {loading && (
                <div className="ai-typing">
                  <TypingDots />
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggested prompts */}
            {showSuggestions && (
              <div className="ai-suggestions">
                {suggestedPrompts.map((p) => (
                  <button key={p} className="ai-suggestion-btn" onClick={() => handlePrompt(p)} disabled={loading}>
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="ai-input-bar">
              <input
                ref={inputRef}
                type="text"
                className="ai-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder={screeningContext ? "Ask about these candidates…" : "Ask a hiring question…"}
                aria-label="Message input"
              />
              <button type="button" className="ai-send-btn" onClick={() => send()} disabled={loading || !message.trim()} aria-label="Send message">
                <Send size={15} />
              </button>
            </div>
          </div>
        </>
      )}
    </>,
    document.body
  );
}