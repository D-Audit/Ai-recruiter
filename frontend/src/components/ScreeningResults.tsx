"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
  X,
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
    const fn = c.firstName || "";
    const ln = c.lastName || "";
    const n = `${fn} ${ln}`.trim();
    if (n) return n;
    if ("email" in c && c.email) return c.email;
  }
  return "Candidate";
}

function candidateEmail(r: CandidateResult): string {
  const c = r.candidateId;
  if (typeof c === "object" && c && "email" in c) return c.email || "";
  return "";
}

function candidateHeadline(r: CandidateResult): string {
  const c = r.candidateId;
  if (typeof c === "object" && c && "headline" in c) return c.headline || "";
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
  jobId,
  results,
  fromCache = false,
  displayTopN = "all",
  showRunButton = false,
  loadingRun = false,
  onRunScreening,
}: Props) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const selectedForCompare = useSelector(
    (s: RootState) => s.screening.selectedForCompare
  );

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

  const recStyle = (rec: string) => {
    if (rec === "Shortlist")
      return { bg: "#dcfce7", color: "#15803d" };
    if (rec === "Consider")
      return { bg: "#dbeafe", color: "#2563eb" };
    return { bg: "#f1f5f9", color: "#64748b" };
  };

  const confLabel = (c: string) => {
    if (c === "High") return { text: "High Confidence", bg: "#dcfce7", color: "#15803d" };
    if (c === "Medium")
      return { text: "Medium Confidence", bg: "#fef9c3", color: "#ca8a04" };
    return { text: "Low Confidence", bg: "#fee2e2", color: "#dc2626" };
  };

  const rankMedal = (rank: number) => {
    if (rank === 1) return { bg: "#f59e0b", label: "#1" };
    if (rank === 2) return { bg: "#94a3b8", label: "#2" };
    if (rank === 3) return { bg: "#d97706", label: "#3" };
    return { bg: "#cbd5e1", label: `#${rank}` };
  };

  const handleCompareNav = () => {
    if (selectedForCompare.length < 2) return;
    router.push(
      `/candidates/compare?jobId=${jobId}&ids=${selectedForCompare.join(",")}`
    );
  };

  const toggleSel = (id: string) => {
    dispatch(toggleSelectForCompare(id));
  };

  return (
    <>
      <style>{`
        .sr-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; }
        .sr-stat {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 18px 20px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .sr-stat-v { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.03em; }
        .sr-stat-l { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-top: 6px; }
        .sr-bias {
          background: #fef9c3;
          border: 1px solid #fde68a;
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 16px;
          color: #92400e;
          font-size: 13px;
          line-height: 1.55;
        }
        .sr-hint {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 16px;
          font-weight: 500;
        }
        .sr-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px 22px;
          margin-bottom: 14px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .sr-card-top { display: flex; gap: 14px; align-items: flex-start; flex-wrap: wrap; }
        .sr-rank {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 14px;
          flex-shrink: 0;
        }
        .sr-bar-wrap {
          height: 8px;
          background: #f1f5f9;
          border-radius: 99px;
          overflow: hidden;
          margin-top: 10px;
        }
        .sr-bar-fill {
          height: 100%;
          border-radius: 99px;
          animation: growBar 0.85s ease forwards;
        }
        .sr-chip { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; }
        .sr-expand {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 8px;
          background: none;
          border: none;
          color: #2563eb;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }
        .sr-cache {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 20px;
          background: #fef9c3;
          color: #a16207;
          font-size: 11px;
          font-weight: 700;
        }
        .sr-run-wrap { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
        .sr-run {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 11px;
          border: none;
          background: #2563eb;
          color: white;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(37,99,235,0.28);
        }
        .sr-run:disabled { opacity: 0.65; cursor: not-allowed; }
        .sr-float {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 80;
          padding: 12px 20px;
          border-radius: 14px;
          background: #0f172a;
          color: white;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.25);
          margin-left: 130px;
        }
        @media (max-width: 768px) {
          .sr-stats { grid-template-columns: 1fr; }
          .sr-float { margin-left: 0; left: 16px; right: 16px; transform: none; flex-wrap: wrap; justify-content: center; }
        }
      `}</style>

      <div className="sr-run-wrap">
        {showRunButton && onRunScreening ? (
          <button
            type="button"
            className="sr-run"
            disabled={loadingRun}
            onClick={onRunScreening}
          >
            {loadingRun ? (
              <>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    border: "2px solid rgba(255,255,255,0.35)",
                    borderTopColor: "white",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.75s linear infinite",
                  }}
                />
                Analyzing…
              </>
            ) : (
              <>
                <Brain size={17} /> Run Screening
              </>
            )}
          </button>
        ) : null}
        {fromCache ? (
          <span className="sr-cache">
            <Sparkles size={12} /> Served from cache
          </span>
        ) : null}
      </div>

      <div className="sr-stats">
        <div className="sr-stat">
          <div className="sr-stat-v">{results.totalApplicants}</div>
          <div className="sr-stat-l">Total screened</div>
        </div>
        <div className="sr-stat">
          <div className="sr-stat-v">{results.shortlistedCount}</div>
          <div className="sr-stat-l">Shortlisted</div>
        </div>
        <div className="sr-stat">
          <div className="sr-stat-v">{topScore}</div>
          <div className="sr-stat-l">Top score</div>
        </div>
      </div>

      {results.biasNotice ? (
        <div className="sr-bias">⚠️ {results.biasNotice}</div>
      ) : null}

      <p className="sr-hint">
        Select 2–3 candidates using the checkboxes, then click Compare.
      </p>

      {ranked.map((r, i) => {
        const id = getCandidateId(r);
        const key = candidateKey(r, i);
        const sel = id && selectedForCompare.includes(id);
        const medal = rankMedal(r.rank);
        const scoreColor =
          r.score >= 70 ? "#16a34a" : r.score >= 50 ? "#d97706" : "#dc2626";
        const rec = recStyle(String(r.recommendation));
        const cf = confLabel(String(r.confidence));

        return (
          <div key={key} className="sr-card">
            <div className="sr-card-top">
              <input
                type="checkbox"
                checked={!!sel}
                disabled={!id || (!sel && selectedForCompare.length >= 3)}
                onChange={() => id && toggleSel(id)}
                style={{ width: 18, height: 18, accentColor: "#2563eb", marginTop: 10 }}
              />
              <div className="sr-rank" style={{ background: medal.bg }}>
                {medal.label}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#0f172a",
                      margin: 0,
                    }}
                  >
                    {candidateName(r)}
                  </h3>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 20,
                      background: rec.bg,
                      color: rec.color,
                    }}
                  >
                    {r.recommendation}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 20,
                      background: cf.bg,
                      color: cf.color,
                    }}
                  >
                    {cf.text}
                  </span>
                </div>
                {candidateEmail(r) ? (
                  <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                    {candidateEmail(r)}
                  </p>
                ) : null}
                {candidateHeadline(r) ? (
                  <p
                    style={{
                      fontSize: 13,
                      color: "#475569",
                      marginTop: 6,
                      lineHeight: 1.5,
                    }}
                  >
                    {candidateHeadline(r)}
                  </p>
                ) : null}

                <div style={{ marginTop: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Match score
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: scoreColor,
                      }}
                    >
                      {r.score}/100
                    </span>
                  </div>
                  <div className="sr-bar-wrap">
                    <div
                      className="sr-bar-fill"
                      style={
                        {
                          background: scoreColor,
                          ["--target-width" as string]: `${r.score}%`,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 12,
                  }}
                >
                  {(r.skillsMatched || []).map((s) => (
                    <span
                      key={s}
                      className="sr-chip"
                      style={{ background: "#dcfce7", color: "#15803d" }}
                    >
                      <Check size={12} /> {s}
                    </span>
                  ))}
                  {(r.skillsMissing || []).map((s) => (
                    <span
                      key={s}
                      className="sr-chip"
                      style={{ background: "#fee2e2", color: "#dc2626" }}
                    >
                      <X size={12} /> {s}
                    </span>
                  ))}
                </div>

                <div style={{ marginTop: 12 }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#15803d",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Strengths
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#374151",
                      lineHeight: 1.55,
                      marginTop: 4,
                    }}
                  >
                    {expS[key]
                      ? r.strengths
                      : (r.strengths || "").slice(0, 140) +
                        ((r.strengths || "").length > 140 ? "…" : "")}
                  </p>
                  {(r.strengths || "").length > 140 ? (
                    <button
                      type="button"
                      className="sr-expand"
                      onClick={() =>
                        setExpS((x) => ({ ...x, [key]: !x[key] }))
                      }
                    >
                      {expS[key] ? (
                        <>
                          Show less <ChevronUp size={14} />
                        </>
                      ) : (
                        <>
                          Show more <ChevronDown size={14} />
                        </>
                      )}
                    </button>
                  ) : null}
                </div>

                <div style={{ marginTop: 10 }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#c2410c",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Gaps
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#374151",
                      lineHeight: 1.55,
                      marginTop: 4,
                    }}
                  >
                    {expG[key]
                      ? r.gaps
                      : (r.gaps || "").slice(0, 140) +
                        ((r.gaps || "").length > 140 ? "…" : "")}
                  </p>
                  {(r.gaps || "").length > 140 ? (
                    <button
                      type="button"
                      className="sr-expand"
                      onClick={() =>
                        setExpG((x) => ({ ...x, [key]: !x[key] }))
                      }
                    >
                      {expG[key] ? (
                        <>
                          Show less <ChevronUp size={14} />
                        </>
                      ) : (
                        <>
                          Show more <ChevronDown size={14} />
                        </>
                      )}
                    </button>
                  ) : null}
                </div>

                {r.upskillingPaths && r.upskillingPaths.length > 0 ? (
                  <div style={{ marginTop: 14 }}>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 8,
                      }}
                    >
                      Upskilling paths
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {r.upskillingPaths.map((u, ui) => (
                        <div
                          key={ui}
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: 10,
                            padding: "10px 12px",
                            background: "#f8fafc",
                          }}
                        >
                          <p
                            style={{
                              fontWeight: 700,
                              fontSize: 13,
                              color: "#0f172a",
                            }}
                          >
                            {u.skill}
                          </p>
                          <p
                            style={{
                              fontSize: 12,
                              color: "#64748b",
                              marginTop: 4,
                            }}
                          >
                            {u.reason}
                          </p>
                          {u.suggestedResource ? (
                            <a
                              href={u.suggestedResource}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                marginTop: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#2563eb",
                              }}
                            >
                              Resource <ExternalLink size={12} />
                            </a>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {r.adjacentRoles && r.adjacentRoles.length > 0 ? (
                  <div style={{ marginTop: 12 }}>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#64748b",
                        marginBottom: 6,
                      }}
                    >
                      Adjacent roles
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {r.adjacentRoles.map((role) => (
                        <span
                          key={role}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 8,
                            background: "#f1f5f9",
                            color: "#475569",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {id ? (
                  <Link
                    href={`/candidates/${id}?jobId=${jobId}`}
                    style={{ marginTop: 14, display: "inline-block" }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#2563eb",
                      }}
                    >
                      View Profile →
                    </span>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}

      {selectedForCompare.length >= 2 ? (
        <div className="sr-float">
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            {selectedForCompare.length} selected
          </span>
          <button
            type="button"
            onClick={handleCompareNav}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: "none",
              background: "#2563eb",
              color: "white",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Compare
          </button>
        </div>
      ) : null}
    </>
  );
}
