"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  Brain, Check, ChevronDown, ChevronUp,
  Sparkles, X, ExternalLink, Trophy,
  TrendingUp, AlertTriangle, CheckCircle2,
  XCircle, Users, ArrowRight, GitCompare,
} from "lucide-react";
import { AppDispatch, RootState } from "../store";
import { toggleSelectForCompare } from "../store/slices/screeningSlice";
import type { CandidateResult, ScreeningResult } from "../types";

function candidateKey(r: CandidateResult, i: number): string {
  const c = r.candidateId;
  if (typeof c === "object" && c && "_id" in c && c._id) return String(c._id);
  if (typeof c === "string") return c;
  return `idx-${i}`;
}

function getCandidateId(r: CandidateResult): string {
  const c = r.candidateId;
  if (typeof c === "object" && c && "_id" in c) return String(c._id);
  if (typeof c === "string") return c;
  return "";
}

function candidateName(r: CandidateResult): string {
  const c = r.candidateId;
  if (typeof c === "object" && c) {
    const fn = (c as any).firstName || "";
    const ln = (c as any).lastName || "";
    const n = `${fn} ${ln}`.trim();
    if (n) return n;
    if ((c as any).email) return (c as any).email;
  }
  return "Candidate";
}

function candidateEmail(r: CandidateResult): string {
  const c = r.candidateId;
  if (typeof c === "object" && c && "email" in c) return (c as any).email || "";
  return "";
}

function candidateHeadline(r: CandidateResult): string {
  const c = r.candidateId;
  if (typeof c === "object" && c && "headline" in c) return (c as any).headline || "";
  return "";
}

type Props = {
  jobId: string;
  results: ScreeningResult | null;
  fromCache?: boolean;
  displayTopN?: 10 | 20 | "all";
  showRunButton?: boolean;
  loadingRun?: boolean;
  onRunScreening?: () => void;
};

export default function ScreeningResults({
  jobId, results, fromCache = false,
  displayTopN = "all", showRunButton = false,
  loadingRun = false, onRunScreening,
}: Props) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const selectedForCompare = useSelector((s: RootState) => s.screening.selectedForCompare);
  const [expS, setExpS] = useState<Record<string, boolean>>({});
  const [expG, setExpG] = useState<Record<string, boolean>>({});

  const ranked = useMemo(() => {
    if (!results?.rankedCandidates?.length) return [];
    const list = [...results.rankedCandidates].sort((a, b) => a.rank - b.rank);
    if (displayTopN === "all") return list;
    return list.slice(0, displayTopN);
  }, [results, displayTopN]);

  if (!results) return null;

  const topScore = ranked[0]?.score ?? 0;
  const avgScore = ranked.length
    ? Math.round(ranked.reduce((s, c) => s + c.score, 0) / ranked.length)
    : 0;

  const recConfig = (rec: string) => {
    if (rec === "Shortlist") return { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", icon: CheckCircle2 };
    if (rec === "Consider") return { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", icon: TrendingUp };
    return { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0", icon: XCircle };
  };

  const confConfig = (c: string) => {
    if (c === "High") return { text: "High Confidence", bg: "#f0fdf4", color: "#15803d" };
    if (c === "Medium") return { text: "Medium Confidence", bg: "#fffbeb", color: "#d97706" };
    return { text: "Low Confidence", bg: "#fef2f2", color: "#dc2626" };
  };

  const rankMedal = (rank: number) => {
    if (rank === 1) return { bg: "linear-gradient(135deg, #f59e0b, #d97706)", text: "#fff", label: "🥇" };
    if (rank === 2) return { bg: "linear-gradient(135deg, #94a3b8, #64748b)", text: "#fff", label: "🥈" };
    if (rank === 3) return { bg: "linear-gradient(135deg, #d97706, #b45309)", text: "#fff", label: "🥉" };
    return { bg: "var(--surface-hover)", text: "var(--text-muted)", label: `#${rank}` };
  };

  const scoreColor = (score: number) => {
    if (score >= 75) return "#15803d";
    if (score >= 55) return "#d97706";
    return "#dc2626";
  };

  const scoreBarColor = (score: number) => {
    if (score >= 75) return "linear-gradient(90deg, #22c55e, #16a34a)";
    if (score >= 55) return "linear-gradient(90deg, #f59e0b, #d97706)";
    return "linear-gradient(90deg, #f87171, #dc2626)";
  };

  const handleCompareNav = () => {
    if (selectedForCompare.length < 2) return;
    router.push(`/candidates/compare?jobId=${jobId}&ids=${selectedForCompare.join(",")}`);
  };

  const toggleSel = (id: string) => dispatch(toggleSelectForCompare(id));

  return (
    <>
      <style>{`
        .sr-wrap { font-family: var(--font-body, system-ui); }

        /* Summary stats */
        .sr-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        .sr-stat {
          background: var(--surface-card); border: 1.5px solid var(--border-soft);
          border-radius: 14px; padding: 16px 18px; box-shadow: var(--shadow-card);
        }
        .sr-stat-v { font-size: 26px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.04em; line-height: 1; }
        .sr-stat-l { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-top: 6px; }

        /* Bias notice */
        .sr-bias {
          background: rgba(217,119,6,0.08); border: 1.5px solid rgba(217,119,6,0.2); border-radius: 12px;
          padding: 12px 16px; margin-bottom: 16px; color: var(--text-secondary);
          font-size: 13px; line-height: 1.55; display: flex; gap: 10px; align-items: flex-start;
        }

        /* Toolbar */
        .sr-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
        .sr-hint { font-size: 13px; color: var(--text-secondary); font-weight: 500; display: flex; align-items: center; gap: 6px; }
        .sr-cache-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 99px; background: rgba(217,119,6,0.08); color: var(--text-secondary); font-size: 11px; font-weight: 700; }
        .sr-run-btn {
          display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px;
          border-radius: 10px; border: none; background: var(--brand-primary);
          color: white; font-weight: 700; font-size: 13px; cursor: pointer;
          font-family: var(--font-body, system-ui); box-shadow: var(--shadow-button);
          transition: all var(--transition-fast);
        }
        .sr-run-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(37,99,235,0.38); }
        .sr-run-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

        /* Candidate card */
        .sr-card {
          background: var(--surface-card); border: 1.5px solid var(--border-soft); border-radius: 16px;
          padding: 20px 22px; margin-bottom: 12px; box-shadow: var(--shadow-card);
          transition: box-shadow 0.18s, border-color 0.18s;
          position: relative;
        }
        .sr-card:hover { box-shadow: var(--shadow-card-hover); border-color: rgba(37,99,235,0.2); }
        .sr-card.selected { border-color: var(--brand-primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.1), 0 4px 16px rgba(0,0,0,0.06); }
        .sr-card.rank-1 { border-color: rgba(217,119,6,0.4); }
        .sr-card.rank-1:hover { border-color: rgba(217,119,6,0.6); }

        .sr-card-header { display: flex; gap: 12px; align-items: flex-start; }
        .sr-checkbox-wrap { padding-top: 10px; flex-shrink: 0; }
        .sr-checkbox { width: 18px; height: 18px; accent-color: var(--brand-primary); cursor: pointer; border-radius: 4px; }
        .sr-rank-badge { width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; }
        .sr-candidate-info { flex: 1; min-width: 0; }
        .sr-name-row { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; margin-bottom: 3px; }
        .sr-name { font-size: 15.5px; font-weight: 700; color: var(--text-primary); }
        .sr-rec-pill { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 99px; font-size: 12px; font-weight: 700; border: 1px solid; }
        .sr-conf-pill { padding: 3px 9px; border-radius: 99px; font-size: 11px; font-weight: 600; }
        .sr-email { font-size: 12.5px; color: var(--text-secondary); }
        .sr-headline { font-size: 13px; color: var(--text-primary); margin-top: 4px; line-height: 1.45; }

        /* Score area */
        .sr-score-area { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; min-width: 70px; }
        .sr-score-circle { width: 60px; height: 60px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 3px solid; }
        .sr-score-num { font-size: 20px; font-weight: 800; line-height: 1; }
        .sr-score-label { font-size: 9px; color: var(--text-muted); font-weight: 600; margin-top: 1px; }

        /* Score bar — animates on mount */
        .sr-bar-wrap { height: 7px; background: var(--surface-hover); border-radius: 99px; overflow: hidden; margin-top: 12px; margin-bottom: 2px; }
        .sr-bar-fill { height: 100%; border-radius: 99px; animation: growBar 0.9s ease forwards; }

        /* Details */
        .sr-details { margin-top: 14px; }
        .sr-insights { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
        .sr-insight { border-radius: 10px; padding: 12px 14px; border: 1px solid; }
        .sr-insight-label { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 6px; }
        .sr-insight-text { font-size: 12.5px; line-height: 1.5; color: var(--text-primary); }

        .sr-expand-btn { display: inline-flex; align-items: center; gap: 4px; padding: 0; background: none; border: none; color: var(--brand-primary); font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: var(--font-body, system-ui); margin-top: 8px; transition: gap 0.15s; }
        .sr-expand-btn:hover { gap: 7px; }

        /* Skills chips */
        .sr-skills { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
        .sr-skill-match { padding: 3px 9px; border-radius: 6px; font-size: 11.5px; font-weight: 600; background: rgba(22,163,74,0.08); color: #15803d; border: 1px solid rgba(22,163,74,0.2); display: flex; align-items: center; gap: 3px; }
        .sr-skill-miss { padding: 3px 9px; border-radius: 6px; font-size: 11.5px; font-weight: 600; background: rgba(220,38,38,0.08); color: #dc2626; border: 1px solid rgba(220,38,38,0.2); display: flex; align-items: center; gap: 3px; }

        /* Card footer */
        .sr-card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border-muted); flex-wrap: wrap; gap: 10px; }
        .sr-view-link { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 700; color: var(--brand-primary); text-decoration: none; transition: gap 0.15s; }
        .sr-view-link:hover { gap: 8px; }

        /* Compare float */
        .sr-compare-float {
          position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); z-index: 80;
          padding: 13px 20px; border-radius: 16px; background: var(--surface-card);
          color: var(--text-primary); display: flex; align-items: center; gap: 14px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.14);
          border: 1px solid var(--border-soft); animation: fadeInUp 0.22s ease; margin-left: 130px;
        }
        .sr-compare-count { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .sr-compare-btn {
          padding: 8px 18px; border-radius: 10px; border: none;
          background: linear-gradient(135deg, var(--brand-primary), var(--brand-violet)); color: white;
          font-weight: 700; font-size: 13px; cursor: pointer; font-family: var(--font-body, system-ui);
          display: flex; align-items: center; gap: 6px;
          box-shadow: 0 4px 12px rgba(37,99,235,0.4); transition: all 0.15s;
        }
        .sr-compare-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(37,99,235,0.5); }
        .sr-clear-btn { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 8px; border: none; background: var(--surface-hover); color: var(--text-secondary); cursor: pointer; transition: background 0.15s; }
        .sr-clear-btn:hover { background: var(--border-muted); color: var(--text-primary); }

        /* Upskilling */
        .sr-upskill-item { padding: 10px 12px; background: var(--surface-hover); border-radius: 9px; border: 1px solid var(--border-soft); margin-bottom: 7px; }
        .sr-upskill-skill { font-weight: 700; font-size: 12.5px; color: var(--text-primary); }
        .sr-upskill-reason { font-size: 12px; color: var(--text-secondary); margin-top: 3px; line-height: 1.4; }

        @media (max-width: 900px) {
          .sr-summary { grid-template-columns: repeat(2, 1fr); }
          .sr-insights { grid-template-columns: 1fr; }
          .sr-compare-float { margin-left: 0; left: 16px; right: 16px; transform: none; flex-wrap: wrap; justify-content: center; }
        }
        @media (max-width: 600px) {
          .sr-score-area { display: none; }
          .sr-summary { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="sr-wrap">

        {/* DESIGN 4G: Summary stats header */}
        <div className="sr-summary">
          {[
            { label: "Total Screened", value: results.totalApplicants },
            { label: "Shortlisted",    value: results.shortlistedCount },
            { label: "Top Score",      value: `${topScore}` },
            { label: "Avg Score",      value: `${avgScore}` },
          ].map((s) => (
            <div key={s.label} className="sr-stat">
              <div className="sr-stat-v">{s.value}</div>
              <div className="sr-stat-l">{s.label}</div>
            </div>
          ))}
        </div>

        {results.biasNotice && (
          <div className="sr-bias">
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{results.biasNotice}</span>
          </div>
        )}

        <div className="sr-toolbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {showRunButton && onRunScreening && (
              <button type="button" className="sr-run-btn" disabled={loadingRun} onClick={onRunScreening}>
                {loadingRun ? (
                  <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.75s linear infinite" }} />Analyzing…</>
                ) : (
                  <><Brain size={15} /> Run Screening</>
                )}
              </button>
            )}
            {fromCache && (
              <span className="sr-cache-badge"><Sparkles size={11} /> Cached</span>
            )}
          </div>
          <p className="sr-hint">
            <Users size={13} />
            {ranked.length} candidate{ranked.length !== 1 ? "s" : ""} shown
            {selectedForCompare.length > 0 && ` · ${selectedForCompare.length} selected`}
          </p>
        </div>

        {ranked.length >= 2 && (
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 14, fontWeight: 500 }}>
            ☑ Check 2–3 candidates to compare them side by side
          </p>
        )}

        {/* Candidate cards */}
        {ranked.map((r, i) => {
          const id = getCandidateId(r);
          const key = candidateKey(r, i);
          const sel = !!(id && selectedForCompare.includes(id));
          const medal = rankMedal(r.rank);
          const sc = scoreColor(r.score);
          const rec = recConfig(String(r.recommendation));
          const cf = confConfig(String(r.confidence));
          const RecIcon = rec.icon;
          const sExpanded = expS[key];
          const gExpanded = expG[key];

          return (
            <div key={key} className={`sr-card${sel ? " selected" : ""}${r.rank === 1 ? " rank-1" : ""}`}>
              <div className="sr-card-header">
                {/* Checkbox */}
                <div className="sr-checkbox-wrap">
                  <input
                    type="checkbox" className="sr-checkbox" checked={sel}
                    disabled={!id || (!sel && selectedForCompare.length >= 3)}
                    onChange={() => id && toggleSel(id)}
                    title={sel ? "Remove from compare" : selectedForCompare.length >= 3 ? "Max 3 selected" : "Add to compare"}
                  />
                </div>

                {/* DESIGN 4G: Gradient rank badge */}
                <div className="sr-rank-badge" style={{ background: medal.bg, color: medal.text }}>
                  {medal.label}
                </div>

                {/* Info */}
                <div className="sr-candidate-info">
                  <div className="sr-name-row">
                    <span className="sr-name">{candidateName(r)}</span>
                    <span className="sr-rec-pill" style={{ background: rec.bg, color: rec.color, borderColor: rec.border }}>
                      <RecIcon size={11} />{r.recommendation}
                    </span>
                    <span className="sr-conf-pill" style={{ background: cf.bg, color: cf.color }}>{cf.text}</span>
                  </div>
                  {candidateEmail(r) && <p className="sr-email">{candidateEmail(r)}</p>}
                  {candidateHeadline(r) && <p className="sr-headline">{candidateHeadline(r)}</p>}

                  {/* DESIGN 4G: Score bar animates on mount via growBar */}
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>AI Match Score</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: sc }}>{r.score}/100</span>
                    </div>
                    <div className="sr-bar-wrap">
                      <div className="sr-bar-fill" style={{ background: scoreBarColor(r.score), "--target-width": `${r.score}%` } as React.CSSProperties} />
                    </div>
                  </div>
                </div>

                {/* Score circle */}
                <div className="sr-score-area">
                  <div className="sr-score-circle" style={{ borderColor: sc }}>
                    <span className="sr-score-num" style={{ color: sc }}>{r.score}</span>
                    <span className="sr-score-label">/100</span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="sr-details">
                <div className="sr-insights">
                  <div className="sr-insight" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
                    <p className="sr-insight-label" style={{ color: "#15803d" }}>✓ Strengths</p>
                    <p className="sr-insight-text">
                      {sExpanded || r.strengths.length <= 160 ? r.strengths : `${r.strengths.slice(0, 160)}…`}
                    </p>
                    {r.strengths.length > 160 && (
                      <button className="sr-expand-btn" style={{ color: "#15803d" }} onClick={() => setExpS((p) => ({ ...p, [key]: !p[key] }))}>
                        {sExpanded ? <><ChevronUp size={13} /> Less</> : <><ChevronDown size={13} /> More</>}
                      </button>
                    )}
                  </div>
                  <div className="sr-insight" style={{ background: "#fff7ed", borderColor: "#fed7aa" }}>
                    <p className="sr-insight-label" style={{ color: "#c2410c" }}>⚠ Gaps</p>
                    <p className="sr-insight-text">
                      {gExpanded || r.gaps.length <= 160 ? r.gaps : `${r.gaps.slice(0, 160)}…`}
                    </p>
                    {r.gaps.length > 160 && (
                      <button className="sr-expand-btn" style={{ color: "#c2410c" }} onClick={() => setExpG((p) => ({ ...p, [key]: !p[key] }))}>
                        {gExpanded ? <><ChevronUp size={13} /> Less</> : <><ChevronDown size={13} /> More</>}
                      </button>
                    )}
                  </div>
                </div>

                {/* Skills */}
                {(r.skillsMatched?.length > 0 || r.skillsMissing?.length > 0) && (
                  <div className="sr-skills">
                    {r.skillsMatched?.map((s) => (
                      <span key={s} className="sr-skill-match"><Check size={10} />{s}</span>
                    ))}
                    {r.skillsMissing?.map((s) => (
                      <span key={s} className="sr-skill-miss"><X size={10} />{s}</span>
                    ))}
                  </div>
                )}

                {/* Upskilling paths */}
                {(r.upskillingPaths?.length ?? 0) > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Upskilling Paths</p>
                    {(r.upskillingPaths ?? []).map((u, ui) => (
                      <div key={ui} className="sr-upskill-item">
                        <p className="sr-upskill-skill">{u.skill}</p>
                        <p className="sr-upskill-reason">{u.reason}</p>
                        {u.suggestedResource && (
                          <a href={u.suggestedResource} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--brand-primary)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, marginTop: 5 }}>
                            Resource <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Adjacent roles */}
                {(r.adjacentRoles?.length ?? 0) > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Also Suited For</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {(r.adjacentRoles ?? []).map((role, ri) => (
                        <span key={ri} style={{ padding: "3px 10px", borderRadius: 6, background: "var(--surface-hover)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, border: "1px solid var(--border-soft)" }}>{role}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                {id && (
                  <div className="sr-card-footer">
                    <Link href={`/candidates/${id}?jobId=${jobId}`} className="sr-view-link">
                      View full profile <ArrowRight size={13} />
                    </Link>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer" }}>
                      <input
                        type="checkbox" className="sr-checkbox"
                        checked={sel}
                        disabled={!id || (!sel && selectedForCompare.length >= 3)}
                        onChange={() => id && toggleSel(id)}
                      />
                      Compare
                    </label>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Compare float bar */}
        {selectedForCompare.length >= 2 && (
          <div className="sr-compare-float">
            <GitCompare size={18} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
            <p className="sr-compare-count">{selectedForCompare.length} candidates selected</p>
            <button className="sr-compare-btn" onClick={handleCompareNav}>
              <GitCompare size={14} /> Compare Side-by-Side
            </button>
            <button className="sr-clear-btn" onClick={() => selectedForCompare.forEach((id) => toggleSel(id))} title="Clear selection">
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}