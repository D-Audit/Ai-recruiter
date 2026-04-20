"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import { getAllJobs } from "../../services/jobService";
import { RootState, AppDispatch } from "../../store";
import {
  Briefcase, Users, Brain, Plus, ArrowRight,
  Sparkles, TrendingUp, ListChecks, ArrowUpRight, Zap,
} from "lucide-react";

/* ══════════════════════════════════════════════
   CHART HELPERS — pure SVG, zero dependencies
══════════════════════════════════════════════ */

function bezierPath(pts: { x: number; y: number }[]) {
  return pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = pts[i - 1];
    const cpx = (prev.x + pt.x) / 2;
    return `${acc} C ${cpx} ${prev.y} ${cpx} ${pt.y} ${pt.x} ${pt.y}`;
  }, "");
}

/* ── Large area chart ── */
function AreaChart({ data: rawData, color, label, height = 120 }: { data: number[]; color: string; label: string; height?: number }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; val: number; i: number } | null>(null);

  const SEED = [1, 2, 1, 3, 2, 4, 3, 5, 4, 5, 4, 6];
  const raw = rawData?.length ? rawData : [];
  const merged = SEED.map((s, i) => { const off = SEED.length - raw.length; return i >= off ? (raw[i - off] ?? s) : s; });
  const allSame = merged.every((v) => v === merged[0]);
  const data = allSame ? merged.map((v, i) => v + SEED[i] * 0.4) : merged;

  const W = 100; const H = 100;
  const pad = { t: 8, b: 4, l: 2, r: 2 };
  const min = Math.min(...data); const max = Math.max(...data); const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: pad.l + (i / (data.length - 1)) * (W - pad.l - pad.r),
    y: pad.t + (1 - (v - min) / range) * (H - pad.t - pad.b), v,
  }));
  const linePath = bezierPath(pts);
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;
  const uid = `ac${color.replace(/\W/g, "")}`;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
        style={{ width: "100%", height, display: "block", overflow: "visible" }}
        onMouseLeave={() => setTooltip(null)}>
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="85%" stopColor={color} stopOpacity="0.03" />
          </linearGradient>
        </defs>
        {[25, 50, 75].map((p) => (
          <line key={p} x1={pad.l} y1={pad.t + (p / 100) * (H - pad.t - pad.b)}
            x2={W - pad.r} y2={pad.t + (p / 100) * (H - pad.t - pad.b)}
            stroke="currentColor" strokeOpacity="0.06" strokeWidth="0.5" />
        ))}
        <path d={areaPath} fill={`url(#${uid})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((pt, i) => (
          <g key={i}>
            <rect x={pt.x - (W / data.length) / 2} y={pad.t} width={W / data.length} height={H - pad.t}
              fill="transparent" style={{ cursor: "crosshair" }}
              onMouseEnter={() => setTooltip({ x: pt.x, y: pt.y, val: raw[i - (data.length - raw.length)] ?? pt.v, i })} />
            {tooltip?.i === i && (
              <>
                <line x1={pt.x} y1={pad.t} x2={pt.x} y2={H} stroke={color} strokeWidth="0.5" strokeOpacity="0.4" strokeDasharray="1.5 1.5" />
                <circle cx={pt.x} cy={pt.y} r="2.5" fill="white" stroke={color} strokeWidth="1.5" />
              </>
            )}
          </g>
        ))}
        {!tooltip && <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2" fill={color} />}
      </svg>
      {tooltip && (
        <div style={{
          position: "absolute",
          bottom: `${height - (tooltip.y / 100) * height - 8}px`,
          left: `${tooltip.x}%`, transform: "translateX(-50%)",
          background: "#0f172a", color: "white", fontSize: 11, fontWeight: 700,
          padding: "4px 9px", borderRadius: 6, whiteSpace: "nowrap",
          pointerEvents: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          border: `1px solid ${color}50`, zIndex: 20,
        }}>
          <span style={{ color }}>{Math.round(tooltip.val)}</span>
          <span style={{ color: "rgba(255,255,255,0.45)", marginLeft: 5 }}>{label}</span>
        </div>
      )}
    </div>
  );
}

/* ── Bar chart ── */
function BarChart({ bars, height = 130 }: { bars: { label: string; value: number; color: string }[]; height?: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...bars.map((b) => b.value), 1);
  const W = 100; const H = 100;
  const barW = (W / bars.length) * 0.52;
  const gap = (W / bars.length) * 0.48;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
        style={{ width: "100%", height, display: "block" }}
        onMouseLeave={() => setHovered(null)}>
        {[25, 50, 75].map((p) => (
          <line key={p} x1="0" y1={H - (p / 100) * H * 0.85} x2={W} y2={H - (p / 100) * H * 0.85}
            stroke="currentColor" strokeOpacity="0.06" strokeWidth="0.5" />
        ))}
        {bars.map((b, i) => {
          const bh = Math.max((b.value / max) * H * 0.85, b.value > 0 ? 3 : 0);
          const x = i * (W / bars.length) + gap / 2;
          const y = H - bh;
          return (
            <g key={i} onMouseEnter={() => setHovered(i)} style={{ cursor: "pointer" }}>
              <rect x={x} y={H * 0.15} width={barW} height={H * 0.85} fill={b.color} opacity="0.06" rx="1" />
              <rect x={x} y={y} width={barW} height={bh} fill={b.color}
                opacity={hovered === i ? 1 : 0.72} rx="1.5"
                style={{ transition: "opacity 0.15s" }} />
              <text x={x + barW / 2} y={H - 1} textAnchor="middle" fontSize="4.5" fill="currentColor" opacity="0.4">
                {b.label.length > 6 ? b.label.slice(0, 5) + "…" : b.label}
              </text>
            </g>
          );
        })}
      </svg>
      {hovered !== null && (
        <div style={{
          position: "absolute", top: 4,
          left: `${(hovered / bars.length) * 100 + (100 / bars.length) * 0.5}%`,
          transform: "translateX(-50%)",
          background: "#0f172a", color: "white", fontSize: 11, fontWeight: 700,
          padding: "4px 9px", borderRadius: 6, pointerEvents: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          border: `1px solid ${bars[hovered].color}50`, zIndex: 20, whiteSpace: "nowrap",
        }}>
          <span style={{ color: bars[hovered].color }}>{bars[hovered].value}</span>
          <span style={{ color: "rgba(255,255,255,0.45)", marginLeft: 5 }}>{bars[hovered].label}</span>
        </div>
      )}
    </div>
  );
}

/* ── Donut chart ── */
function DonutChart({ segments, size = 110 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = segments.reduce((s, sg) => s + sg.value, 0) || 1;
  const r = 38; const cx = 60; const cy = 60; const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <svg width={size} height={size} viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-soft)" strokeWidth="11" />
        {segments.map((sg, i) => {
          const dash = (sg.value / total) * circ;
          const seg = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={sg.color}
              strokeWidth={hovered === i ? 14 : 10}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset} strokeLinecap="round"
              style={{ transition: "stroke-width 0.15s", cursor: "pointer" }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
          );
          offset += dash; return seg;
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="14" fontWeight="800" fill="var(--text-primary)">
          {hovered !== null ? segments[hovered].value : total}
        </text>
        <text x={cx} y={cy + 9} textAnchor="middle" fontSize="6.5" fill="var(--text-muted)">
          {hovered !== null ? segments[hovered].label : "Total"}
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
        {segments.map((sg, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", opacity: hovered === null || hovered === i ? 1 : 0.35, transition: "opacity 0.15s" }}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: sg.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", flex: 1 }}>{sg.label}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>{sg.value}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 32, textAlign: "right" }}>{Math.round((sg.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Mini sparkline for stat cards ── */
function MiniSparkline({ data: rawData, color }: { data: number[]; color: string }) {
  const [hov, setHov] = useState<{ x: number; y: number; val: number; i: number } | null>(null);
  const SEED = [2, 3, 2, 4, 3, 5, 4, 6];
  const raw = rawData?.length ? rawData : [];
  const merged = SEED.map((s, i) => { const off = SEED.length - raw.length; return i >= off ? (raw[i - off] ?? s) : s; });
  const allSame = merged.every((v) => v === merged[0]);
  const data = allSame ? merged.map((v, i) => v + SEED[i] * 0.3) : merged;
  const W = 80; const H = 38; const pad = 4;
  const min = Math.min(...data); const max = Math.max(...data); const range = max - min || 1;
  const pts = data.map((v, i) => ({ x: pad + (i / (data.length - 1)) * (W - pad * 2), y: pad + (1 - (v - min) / range) * (H - pad * 2), v }));
  const lp = bezierPath(pts);
  const ap = `${lp} L ${pts[pts.length - 1].x} ${H - pad} L ${pts[0].x} ${H - pad} Z`;
  const uid = `ms${color.replace(/\W/g, "")}`;

  return (
    <div style={{ position: "relative" }}>
      <svg width={W} height={H} style={{ overflow: "visible", display: "block" }} onMouseLeave={() => setHov(null)}>
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={ap} fill={`url(#${uid})`} />
        <path d={lp} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((pt, i) => (
          <rect key={i} x={pt.x - (W / data.length) / 2} y={pad} width={W / data.length} height={H - pad * 2}
            fill="transparent" style={{ cursor: "crosshair" }}
            onMouseEnter={() => setHov({ x: pt.x, y: pt.y, val: raw[i - (data.length - raw.length)] ?? pt.v, i })} />
        ))}
        {hov ? <circle cx={hov.x} cy={hov.y} r="2.5" fill={color} />
          : <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2" fill={color} />}
      </svg>
      {hov && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 4px)", left: hov.x, transform: "translateX(-50%)",
          background: "#0f172a", color: "white", fontSize: 10, fontWeight: 700,
          padding: "3px 7px", borderRadius: 5, whiteSpace: "nowrap",
          pointerEvents: "none", border: `1px solid ${color}40`, zIndex: 10,
        }}>
          <span style={{ color }}>{Math.round(hov.val)}</span>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════ */
export default function DashboardPage() {
  const router   = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((s: RootState) => s.auth);
  const [jobs, setJobs]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.push("/"); return; }
    getAllJobs().then((d) => setJobs(d.jobs || [])).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  const totalCandidates = jobs.reduce((s, j) => s + (j.applicantsCount || 0), 0);
  const openJobs        = jobs.filter((j) => j.status === "open").length;
  const screeningJobs   = jobs.filter((j) => j.status === "screening").length;
  const closedJobs      = jobs.filter((j) => j.status === "closed").length;
  const recentJobs      = [...jobs].slice(0, 5);
  const firstName       = user?.name?.split(" ")[0] || "Recruiter";

  const candidateSeries = jobs.reduce((acc: number[], j) => { acc.push((acc[acc.length - 1] || 0) + (j.applicantsCount || 0)); return acc; }, []);
  const jobSeries       = jobs.map((_, i) => i + 1);
  const openSeries      = jobs.map((j) => j.status === "open" ? 1 : 0).reduce((acc: number[], v) => { acc.push((acc[acc.length - 1] || 0) + v); return acc; }, []);
  const screenSeries    = jobs.map((j) => j.status === "screening" ? 1 : 0).reduce((acc: number[], v) => { acc.push((acc[acc.length - 1] || 0) + v); return acc; }, []);

  const stats = [
    { label: "Total Jobs",       value: jobs.length,     color: "#2563eb", bg: "rgba(37,99,235,0.08)",  icon: Briefcase,  spark: jobSeries,       change: jobs.length > 0 ? `${jobs.length} posted` : "Post first job",   positive: jobs.length > 0 },
    { label: "Open Positions",   value: openJobs,        color: "#16a34a", bg: "rgba(22,163,74,0.08)",  icon: TrendingUp, spark: openSeries,      change: openJobs > 0 ? `${openJobs} active` : "None open",              positive: openJobs > 0 },
    { label: "Total Candidates", value: totalCandidates, color: "#7c3aed", bg: "rgba(124,58,237,0.08)", icon: Users,      spark: candidateSeries, change: totalCandidates > 0 ? `Across ${jobs.length} jobs` : "Upload resumes", positive: totalCandidates > 0 },
    { label: "AI Screenings",    value: screeningJobs,   color: "#0891b2", bg: "rgba(8,145,178,0.08)",  icon: Brain,      spark: screenSeries,    change: screeningJobs > 0 ? `${screeningJobs} running` : "None yet",   positive: screeningJobs > 0 },
  ];

  const statusMap: Record<string, { bg: string; color: string; label: string; dot: string }> = {
    open:      { bg: "rgba(22,163,74,0.08)",   color: "#16a34a", label: "Open",      dot: "#16a34a" },
    screening: { bg: "rgba(37,99,235,0.08)",   color: "#2563eb", label: "Screening", dot: "#2563eb" },
    closed:    { bg: "rgba(100,116,139,0.08)", color: "#64748b", label: "Closed",    dot: "#94a3b8" },
  };

  const donutSegments = [
    { label: "Open",      value: openJobs || 0,      color: "#16a34a" },
    { label: "Screening", value: screeningJobs || 0, color: "#2563eb" },
    { label: "Closed",    value: closedJobs || 0,    color: "#94a3b8" },
  ];
  const donutFallback = [
    { label: "Open",      value: 3, color: "#16a34a" },
    { label: "Screening", value: 2, color: "#2563eb" },
    { label: "Closed",    value: 1, color: "#94a3b8" },
  ];

  const barData = [
    { label: "Open",       value: openJobs,       color: "#16a34a" },
    { label: "Screening",  value: screeningJobs,  color: "#2563eb" },
    { label: "Closed",     value: closedJobs,     color: "#94a3b8" },
    { label: "Candidates", value: totalCandidates, color: "#7c3aed" },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <style>{`
        .dash-root { display:flex; font-family:var(--font-body); }
        .dash-main { margin-left:var(--sidebar-width); min-height:100vh; background:var(--surface-base); flex:1; display:flex; flex-direction:column; }
        .dash-body { padding:26px 32px 100px; flex:1; }

        @keyframes greetIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cardIn  { from{opacity:0;transform:translateY(8px)}  to{opacity:1;transform:translateY(0)} }

        .dash-greeting {
          position:relative; overflow:hidden; border-radius:20px;
          padding:26px 32px; margin-bottom:20px;
          background:linear-gradient(135deg,#0f1f5c 0%,#1a3aad 40%,#2556e8 70%,#4f46e5 100%);
          box-shadow:0 8px 32px rgba(37,99,235,0.22);
          animation:greetIn 0.4s ease both;
          display:flex; align-items:center; justify-content:space-between; gap:20px;
        }
        .dash-greeting::before { content:''; position:absolute; top:-80px; right:-80px; width:280px; height:280px; border-radius:50%; background:radial-gradient(circle,rgba(255,255,255,0.07) 0%,transparent 70%); pointer-events:none; }
        .dash-greeting-eyebrow { font-size:10px; font-weight:700; letter-spacing:1.8px; text-transform:uppercase; color:rgba(255,255,255,0.45); margin-bottom:5px; }
        .dash-greeting-title   { font-size:23px; font-weight:800; color:white; letter-spacing:-0.04em; font-family:var(--font-display,'Syne',sans-serif); }
        .dash-greeting-sub     { font-size:13px; color:rgba(255,255,255,0.55); margin-top:6px; }
        .dash-greeting-cta     { flex-shrink:0; display:inline-flex; align-items:center; gap:7px; padding:10px 20px; border-radius:11px; background:rgba(255,255,255,0.13); color:white; font-weight:700; font-size:13px; text-decoration:none; border:1px solid rgba(255,255,255,0.2); transition:all 0.18s; position:relative; z-index:1; }
        .dash-greeting-cta:hover { background:rgba(255,255,255,0.22); transform:translateY(-1px); }

        .dash-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
        .dash-stat-card { background:var(--surface-card); border:1px solid var(--border-soft); border-radius:16px; padding:18px 20px; box-shadow:var(--shadow-card); transition:all 0.18s; animation:cardIn 0.35s ease both; position:relative; overflow:visible; }
        .dash-stat-card:hover { transform:translateY(-2px); box-shadow:var(--shadow-card-hover); }
        .dash-stat-card::after { content:''; position:absolute; bottom:0; left:0; right:0; height:2px; background:var(--sac,transparent); opacity:0; transition:opacity 0.18s; border-radius:0 0 16px 16px; }
        .dash-stat-card:hover::after { opacity:1; }
        .dash-stat-top   { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:12px; }
        .dash-stat-icon  { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; }
        .dash-stat-value { font-size:30px; font-weight:800; color:var(--text-primary); letter-spacing:-0.05em; line-height:1; font-family:var(--font-display,'Syne',sans-serif); }
        .dash-stat-label { font-size:10.5px; color:var(--text-muted); font-weight:600; margin-top:4px; text-transform:uppercase; letter-spacing:0.07em; }
        .dash-stat-change{ font-size:11px; font-weight:600; margin-top:8px; display:flex; align-items:center; gap:3px; }

        .dash-charts-row  { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
        .dash-charts-row2 { display:grid; grid-template-columns:1.4fr 1fr; gap:16px; margin-bottom:20px; }

        .dash-card { background:var(--surface-card); border:1px solid var(--border-soft); border-radius:18px; box-shadow:var(--shadow-card); overflow:hidden; animation:cardIn 0.4s ease both; }
        .dash-card-header { padding:16px 20px 0; display:flex; align-items:flex-start; justify-content:space-between; }
        .dash-card-title  { font-size:13px; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:7px; }
        .dash-card-sub    { font-size:11px; color:var(--text-muted); margin-top:2px; }
        .dash-card-big    { font-size:22px; font-weight:800; color:var(--text-primary); font-family:var(--font-display,'Syne',sans-serif); }
        .dash-chart-wrap  { padding:12px 18px 16px; }
        .dash-card-link   { font-size:12px; font-weight:600; color:var(--brand-primary); text-decoration:none; display:flex; align-items:center; gap:3px; transition:gap 0.15s; }
        .dash-card-link:hover { gap:6px; }
        .dash-card-body   { padding:6px; }

        .dash-two-col { display:grid; grid-template-columns:1fr 300px; gap:16px; align-items:stretch; }
        .dash-left-col { display:flex; flex-direction:column; }
        .dash-left-col .dash-card { flex:1; }

        .dash-job-row  { display:flex; align-items:center; gap:12px; padding:11px 14px; border-radius:12px; text-decoration:none; transition:background 0.15s; }
        .dash-job-row:hover { background:var(--surface-hover); }
        .dash-job-icon { width:34px; height:34px; border-radius:9px; background:rgba(37,99,235,0.07); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .dash-job-title{ font-size:13px; font-weight:700; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dash-job-meta { font-size:11px; color:var(--text-muted); margin-top:2px; }
        .dash-job-badge{ padding:3px 10px; border-radius:99px; font-size:10.5px; font-weight:700; flex-shrink:0; display:flex; align-items:center; gap:4px; }
        .dash-badge-dot{ width:5px; height:5px; border-radius:50%; }

        .dash-pipeline   { padding:12px 18px 16px; display:flex; flex-direction:column; gap:11px; }
        .dash-pipe-row   { display:flex; align-items:center; gap:9px; }
        .dash-pipe-label { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:600; color:var(--text-secondary); min-width:100px; }
        .dash-pipe-track { flex:1; height:5px; border-radius:99px; background:var(--border-soft); overflow:hidden; }
        .dash-pipe-fill  { height:100%; border-radius:99px; transition:width 0.8s cubic-bezier(0.4,0,0.2,1); }
        .dash-pipe-num   { font-size:12.5px; font-weight:800; color:var(--text-primary); min-width:18px; text-align:right; }

        .dash-section-title{ font-size:12px; font-weight:700; color:var(--text-primary); margin-bottom:9px; display:flex; align-items:center; gap:6px; }
        .dash-action-btn { display:flex; align-items:center; gap:11px; padding:11px 13px; border-radius:11px; text-decoration:none; border:1px solid var(--border-soft); background:var(--surface-card); box-shadow:var(--shadow-card); transition:all 0.17s; }
        .dash-action-btn:hover { transform:translateX(2px); border-color:rgba(37,99,235,0.2); box-shadow:var(--shadow-card-hover); }
        .dash-action-icon { width:32px; height:32px; border-radius:9px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
        .dash-action-title{ font-size:12.5px; font-weight:700; color:var(--text-primary); }
        .dash-action-desc { font-size:11px; color:var(--text-muted); margin-top:1px; }

        .dash-ai-cta { margin-top:14px; border-radius:14px; overflow:hidden; background:linear-gradient(135deg,#1e3a8a,#2563eb 55%,#4f46e5); padding:16px 18px; position:relative; box-shadow:0 6px 24px rgba(37,99,235,0.25); }
        .dash-ai-cta::before { content:''; position:absolute; top:-30px; right:-30px; width:120px; height:120px; border-radius:50%; background:radial-gradient(circle,rgba(255,255,255,0.08) 0%,transparent 70%); }
        .dash-ai-cta-title{ font-size:13px; font-weight:800; color:white; position:relative; z-index:1; margin-bottom:3px; }
        .dash-ai-cta-sub  { font-size:11px; color:rgba(255,255,255,0.58); position:relative; z-index:1; line-height:1.5; }
        .dash-ai-cta-btn  { margin-top:11px; display:inline-flex; align-items:center; gap:5px; padding:7px 14px; border-radius:8px; border:none; background:white; color:#2563eb; font-weight:700; font-size:12px; cursor:pointer; font-family:var(--font-body); text-decoration:none; position:relative; z-index:1; transition:all 0.15s; }
        .dash-ai-cta-btn:hover { transform:scale(1.03); }

        .dash-empty { padding:42px 20px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:10px; }
        .dash-empty-icon { width:50px; height:50px; border-radius:13px; background:var(--surface-hover); border:1px solid var(--border-soft); display:flex; align-items:center; justify-content:center; }

        @media(max-width:1200px){ .dash-stats{grid-template-columns:repeat(2,1fr)} .dash-charts-row,.dash-charts-row2{grid-template-columns:1fr} .dash-two-col{grid-template-columns:1fr} }
        @media(max-width:768px) { .dash-main{margin-left:0} .dash-body{padding:16px 14px 80px} .dash-stats{grid-template-columns:1fr 1fr} .dash-greeting{flex-direction:column} }
      `}</style>

      <div className="dash-root">
        <Sidebar />
        <div className="dash-main">
          <AppHeader title="Dashboard" subtitle="Umurava AI — Talent Screening Platform" />
          <div className="dash-body">

            {/* Greeting */}
            <div className="dash-greeting">
              <div style={{ position: "relative", zIndex: 1 }}>
                <p className="dash-greeting-eyebrow">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
                <h1 className="dash-greeting-title">{greeting}, {firstName} 👋</h1>
                <p className="dash-greeting-sub">
                  {loading ? "Loading your pipeline…"
                    : jobs.length === 0 ? "Post your first job to begin AI-powered screening."
                    : `${jobs.length} job${jobs.length !== 1 ? "s" : ""} · ${totalCandidates} candidate${totalCandidates !== 1 ? "s" : ""} · ${screeningJobs} in screening`}
                </p>
              </div>
              <Link href="/jobs/create" className="dash-greeting-cta"><Zap size={14} /> Post a Job</Link>
            </div>

            {/* Stat cards */}
            <div className="dash-stats">
              {stats.map((s, i) => (
                <div key={s.label} className="dash-stat-card"
                  style={{ animationDelay: `${i * 0.07}s`, ["--sac" as string]: s.color }}>
                  <div className="dash-stat-top">
                    <div className="dash-stat-icon" style={{ background: s.bg }}>
                      <s.icon size={17} color={s.color} />
                    </div>
                    <MiniSparkline data={s.spark} color={s.color} />
                  </div>
                  <p className="dash-stat-value">{loading ? "—" : s.value}</p>
                  <p className="dash-stat-label">{s.label}</p>
                  <p className="dash-stat-change" style={{ color: s.positive ? s.color : "var(--text-muted)" }}>
                    {s.positive && <ArrowUpRight size={11} />}{s.change}
                  </p>
                </div>
              ))}
            </div>

            {/* Charts row 1: Candidate growth + Jobs posted */}
            <div className="dash-charts-row">
              <div className="dash-card">
                <div className="dash-card-header">
                  <div>
                    <p className="dash-card-title"><Users size={14} color="#7c3aed" /> Candidate Growth</p>
                    <p className="dash-card-sub">Cumulative candidates across all jobs</p>
                  </div>
                  <span className="dash-card-big">{loading ? "—" : totalCandidates}</span>
                </div>
                <div className="dash-chart-wrap">
                  <AreaChart data={candidateSeries} color="#7c3aed" label="candidates" height={120} />
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-card-header">
                  <div>
                    <p className="dash-card-title"><Briefcase size={14} color="#2563eb" /> Jobs Posted</p>
                    <p className="dash-card-sub">Total job postings over time</p>
                  </div>
                  <span className="dash-card-big">{loading ? "—" : jobs.length}</span>
                </div>
                <div className="dash-chart-wrap">
                  <AreaChart data={jobSeries} color="#2563eb" label="jobs" height={120} />
                </div>
              </div>
            </div>

            {/* Charts row 2: Bar chart + Donut */}
            <div className="dash-charts-row2">
              <div className="dash-card">
                <div className="dash-card-header">
                  <div>
                    <p className="dash-card-title"><TrendingUp size={14} color="#0891b2" /> Pipeline Breakdown</p>
                    <p className="dash-card-sub">Jobs and candidates by status</p>
                  </div>
                </div>
                <div className="dash-chart-wrap">
                  <BarChart bars={barData} height={130} />
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-card-header">
                  <div>
                    <p className="dash-card-title"><Brain size={14} color="#0891b2" /> Job Status</p>
                    <p className="dash-card-sub">Distribution by stage</p>
                  </div>
                </div>
                <div className="dash-chart-wrap">
                  <DonutChart
                    segments={donutSegments.some((s) => s.value > 0) ? donutSegments : donutFallback}
                    size={110}
                  />
                </div>
              </div>
            </div>

            {/* Bottom: Recent jobs + side panel */}
            <div className="dash-two-col">
              <div className="dash-left-col">
                <div className="dash-card">
                  <div className="dash-card-header" style={{ paddingBottom: 10 }}>
                    <span className="dash-card-title"><Briefcase size={14} color="var(--brand-primary)" /> Recent Jobs</span>
                    <Link href="/jobs" className="dash-card-link">View all <ArrowRight size={12} /></Link>
                  </div>
                  <div className="dash-card-body">
                    {loading ? (
                      <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                        <div style={{ width: 26, height: 26, border: "2.5px solid var(--border-soft)", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.75s linear infinite", margin: "0 auto 12px" }} />
                        Loading…
                      </div>
                    ) : recentJobs.length === 0 ? (
                      <div className="dash-empty">
                        <div className="dash-empty-icon"><Briefcase size={19} color="var(--text-muted)" /></div>
                        <p style={{ fontWeight: 700, fontSize: 13.5, color: "var(--text-primary)" }}>No jobs yet</p>
                        <p style={{ color: "var(--text-muted)", fontSize: 12, maxWidth: 230 }}>Post your first job to start AI screening.</p>
                        <Link href="/jobs/create" className="btn-primary" style={{ marginTop: 8, fontSize: 13 }}><Plus size={13} /> Post a Job</Link>
                      </div>
                    ) : recentJobs.map((job) => {
                      const st = statusMap[job.status] || statusMap.closed;
                      return (
                        <Link key={job._id} href={`/jobs/${job._id}`} className="dash-job-row">
                          <div className="dash-job-icon"><Briefcase size={15} color="#2563eb" /></div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="dash-job-title">{job.title}</p>
                            <p className="dash-job-meta">{job.applicantsCount || 0} candidates · {job.location || "Remote"}</p>
                          </div>
                          <span className="dash-job-badge" style={{ background: st.bg, color: st.color }}>
                            <span className="dash-badge-dot" style={{ background: st.dot }} />{st.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Side panel */}
              <div>
                <div className="dash-card" style={{ marginBottom: 14 }}>
                  <div className="dash-card-header" style={{ paddingBottom: 0 }}>
                    <span className="dash-card-title"><TrendingUp size={14} color="var(--brand-primary)" /> Pipeline</span>
                  </div>
                  <div className="dash-pipeline">
                    {[
                      { label: "Open Jobs",   value: openJobs,       total: Math.max(jobs.length, 1), color: "#16a34a", dot: "#16a34a" },
                      { label: "Screening",   value: screeningJobs,  total: Math.max(jobs.length, 1), color: "#2563eb", dot: "#2563eb" },
                      { label: "Closed",      value: closedJobs,     total: Math.max(jobs.length, 1), color: "#94a3b8", dot: "#cbd5e1" },
                      { label: "Candidates",  value: totalCandidates, total: Math.max(totalCandidates, 1), color: "#7c3aed", dot: "#7c3aed" },
                    ].map((row) => (
                      <div key={row.label} className="dash-pipe-row">
                        <span className="dash-pipe-label">
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: row.dot, display: "inline-block", flexShrink: 0 }} />
                          {row.label}
                        </span>
                        <div className="dash-pipe-track">
                          <div className="dash-pipe-fill" style={{ width: loading ? "0%" : `${Math.min(100, (row.value / row.total) * 100)}%`, background: row.color }} />
                        </div>
                        <span className="dash-pipe-num">{loading ? "—" : row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="dash-section-title"><Sparkles size={12} color="var(--brand-primary)" /> Quick Actions</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {[
                    { href: "/jobs/create", icon: Plus,       iconColor: "#2563eb", iconBg: "rgba(37,99,235,0.1)",  title: "Post a New Job",    desc: "Define role & requirements" },
                    { href: "/applicants",  icon: Users,      iconColor: "#7c3aed", iconBg: "rgba(124,58,237,0.1)", title: "Upload Candidates", desc: "CSV, PDF, DOCX or manual" },
                    { href: "/screenings",  icon: Brain,      iconColor: "#0891b2", iconBg: "rgba(8,145,178,0.1)",  title: "View Screenings",   desc: "AI-ranked results" },
                    { href: "/candidates",  icon: ListChecks, iconColor: "#16a34a", iconBg: "rgba(22,163,74,0.1)",  title: "Browse Candidates", desc: "Explore the pool" },
                  ].map((a) => (
                    <Link key={a.href} href={a.href} className="dash-action-btn">
                      <div className="dash-action-icon" style={{ background: a.iconBg }}><a.icon size={15} color={a.iconColor} /></div>
                      <div style={{ flex: 1 }}>
                        <p className="dash-action-title">{a.title}</p>
                        <p className="dash-action-desc">{a.desc}</p>
                      </div>
                      <ArrowRight size={12} style={{ color: "var(--text-muted)" }} />
                    </Link>
                  ))}
                </div>

                <div className="dash-ai-cta">
                  <p className="dash-ai-cta-title"><Sparkles size={12} style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }} />Run AI Screening</p>
                  <p className="dash-ai-cta-sub">Rank all candidates instantly with Gemini-powered bias-aware scoring.</p>
                  <Link href="/screenings" className="dash-ai-cta-btn">Go <ArrowRight size={11} /></Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}