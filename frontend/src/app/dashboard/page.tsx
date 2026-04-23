"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import { getAllJobs } from "../../services/jobService";
import {
  Briefcase, Users, Sparkles, CheckCircle2, ArrowRight, GitCompare,
} from "lucide-react";

type PeriodKey = "1W" | "1M" | "3M" | "6M" | "1Y";

function smoothPath(points: { x: number; y: number }[]) {
  return points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return `${acc} C ${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`;
  }, "");
}

function PipelineChart({
  labels,
  candidates,
  shortlisted,
}: {
  labels: string[];
  candidates: number[];
  shortlisted: number[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 500;
  const H = 200;
  const P = { l: 48, r: 20, t: 14, b: 34 };
  const maxVal = Math.max(...candidates, ...shortlisted, 1);
  const yMax = Math.ceil(maxVal / 10) * 10;
  const ticks = [0, yMax / 4, yMax / 2, (yMax * 3) / 4, yMax];

  const toY = (v: number) => P.t + (1 - v / yMax) * (H - P.t - P.b);
  const toX = (i: number, len: number) => P.l + (i / Math.max(1, len - 1)) * (W - P.l - P.r);

  const p1 = candidates.map((v, i) => ({ x: toX(i, candidates.length), y: toY(v), v }));
  const p2 = shortlisted.map((v, i) => ({ x: toX(i, shortlisted.length), y: toY(v), v }));
  const p1Path = smoothPath(p1);
  const p2Path = smoothPath(p2);
  const areaPath = `${p1Path} L ${p1[p1.length - 1]?.x ?? 0} ${H - P.b} L ${p1[0]?.x ?? 0} ${H - P.b} Z`;
  const latest = p1[p1.length - 1];

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: 200, display: "block" }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="pipeArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#111827" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#111827" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={P.l}
              y1={toY(t)}
              x2={W - P.r}
              y2={toY(t)}
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeDasharray="4 4"
            />
            <text x={8} y={toY(t) + 4} fontSize="10" fill="currentColor" opacity="0.6">
              {Math.round(t)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#pipeArea)" />
        <path d={p1Path} fill="none" stroke="#111827" strokeWidth="1.25" strokeLinecap="round" />
        <path d={p2Path} fill="none" stroke="#9ca3af" strokeWidth="1.05" strokeLinecap="round" />

        {p1.map((pt, i) => (
          <rect
            key={i}
            x={pt.x - 10}
            y={P.t}
            width={20}
            height={H - P.t - P.b}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}

        {latest && <circle cx={latest.x} cy={latest.y} r="3" fill="#111827" />}

        {labels.map((label, i) => {
          const show = labels.length <= 6 || i % Math.ceil(labels.length / 6) === 0 || i === labels.length - 1;
          if (!show) return null;
          return (
            <text key={`${label}-${i}`} x={toX(i, labels.length)} y={H - 10} textAnchor="middle" fontSize="10.5" fill="currentColor" opacity="0.55">
              {label}
            </text>
          );
        })}
      </svg>

      {hover !== null && p1[hover] && (
        <div
          style={{
            position: "absolute",
            left: `${((p1[hover].x - P.l) / (W - P.l - P.r)) * 100}%`,
            top: `${((p1[hover].y - 12) / H) * 100}%`,
            transform: "translate(-50%, -100%)",
            background: "#111827",
            color: "#fff",
            borderRadius: 8,
            padding: "6px 10px",
            fontSize: 11,
            lineHeight: 1.35,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          <div>{candidates[hover]} Candidates</div>
          <div style={{ opacity: 0.75 }}>{shortlisted[hover]} Shortlisted</div>
        </div>
      )}
    </div>
  );
}

function JobsStatusChart({
  open,
  screening,
  closed,
}: { open: number; screening: number; closed: number }) {
  const data = [
    { label: "Open", value: open },
    { label: "Screen", value: screening },
    { label: "Closed", value: closed },
  ];
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {data.map((d) => (
        <div key={d.label}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 4 }}>
            <span>{d.label}</span><span>{d.value}</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: "var(--border-muted)" }}>
            <div style={{ height: "100%", width: `${(d.value / max) * 100}%`, borderRadius: 999, background: "#111827" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const getFilteredMonths = (months: number) => {
  return Array.from({ length: months }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (months - 1 - i));
    return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString("default", { month: "short" }) };
  });
};

export default function DashboardPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>("1M");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.push("/"); return; }
    getAllJobs().then((d) => setJobs(d.jobs || [])).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  const totalCandidates = jobs.reduce((s, j) => s + (j.applicantsCount || 0), 0);
  const aiScreenings = jobs.filter((j) => j.status === "screening" || j.screeningResult).length;
  const shortlisted = jobs.reduce((s, j) => s + (j.shortlistedCount || 0), 0);
  const openJobs = jobs.filter((j) => j.status === "open").length;
  const screeningJobs = jobs.filter((j) => j.status === "screening").length;
  const closedJobs = jobs.filter((j) => j.status === "closed").length;

  const series = useMemo(() => {
    if (period === "1W") {
      const dayBuckets = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { key: d.toDateString(), label: d.toLocaleDateString("en-US", { weekday: "short" }) };
      });
      const candidates = dayBuckets.map((b) =>
        jobs.filter((j) => new Date(j.createdAt || 0).toDateString() === b.key).reduce((s, j) => s + (j.applicantsCount || 0), 0)
      );
      const short = dayBuckets.map((b) =>
        jobs.filter((j) => new Date(j.createdAt || 0).toDateString() === b.key).reduce((s, j) => s + (j.shortlistedCount || 0), 0)
      );
      return { labels: dayBuckets.map((d) => d.label), candidates, shortlisted: short };
    }

    const count = period === "1M" ? 4 : period === "3M" ? 12 : period === "6M" ? 6 : 12;
    const months = getFilteredMonths(count);
    const candidates = months.map((m) =>
      jobs
        .filter((j) => {
          const d = new Date(j.createdAt || 0);
          return d.getFullYear() === m.year && d.getMonth() === m.month;
        })
        .reduce((s, j) => s + (j.applicantsCount || 0), 0)
    );
    const short = months.map((m) =>
      jobs
        .filter((j) => {
          const d = new Date(j.createdAt || 0);
          return d.getFullYear() === m.year && d.getMonth() === m.month;
        })
        .reduce((s, j) => s + (j.shortlistedCount || 0), 0)
    );
    return { labels: months.map((m) => m.label), candidates, shortlisted: short };
  }, [jobs, period]);

  const quickActions = [
    { href: "/jobs/create", icon: Briefcase, title: "Post a Job", subtitle: "Create a new job listing" },
    { href: "/applicants/upload", icon: Users, title: "Upload Candidates", subtitle: "Add CVs or import from CSV" },
    { href: "/screenings", icon: Sparkles, title: "Run AI Screening", subtitle: "Screen candidates with Gemini AI" },
    { href: "/candidates/compare", icon: GitCompare, title: "Compare Candidates", subtitle: "Side-by-side comparison" },
  ];

  return (
    <>
      <style>{`
        .db-root{display:flex;font-family:var(--font-body)}
        .db-main{margin-left:var(--sidebar-width);min-height:100vh;flex:1;background:var(--surface-base)}
        .db-body{padding:22px 28px 90px}
        .db-row4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}
        .db-stat{background:var(--surface-card);border:1px solid #e8edf3;border-radius:14px;padding:14px 16px;box-shadow:var(--shadow-card)}
        .db-stat-top{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-secondary);font-weight:700}
        .db-stat-val{font-size:34px;line-height:1;font-weight:800;color:var(--text-primary);margin-top:8px}
        .db-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}
        .db-action{display:flex;align-items:center;gap:10px;background:var(--surface-card);border:1px solid #e8edf3;border-radius:14px;padding:14px 14px;text-decoration:none;color:inherit;transition:all .15s;box-shadow:var(--shadow-card)}
        .db-action:hover{transform:translateY(-2px);box-shadow:var(--shadow-card-hover)}
        .db-action-title{font-size:13.5px;font-weight:700;color:var(--text-primary)}
        .db-action-sub{font-size:11.5px;color:var(--text-muted);margin-top:2px}
        .db-grid{display:grid;grid-template-columns:1fr 340px;gap:20px}
        .db-card{background:var(--surface-card);border:1px solid #e8edf3;border-radius:16px;padding:24px;box-shadow:var(--shadow-card)}
        .db-right{display:grid;grid-template-rows:auto auto;gap:20px}
        .db-title{font-size:17px;font-weight:700;color:var(--text-primary)}
        .db-sub{font-size:13px;color:var(--text-muted);margin-top:2px}
        .db-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:14px}
        .db-pills{display:flex;gap:6px;flex-wrap:wrap}
        .db-pill{padding:5px 9px;border-radius:999px;border:1px solid var(--border-soft);background:transparent;color:var(--text-muted);font-size:11px;font-weight:700;cursor:pointer}
        .db-pill.active{background:#0d1525;color:#fff;border-color:#0d1525}
        .dark .db-pill.active{background:#f1f5f9;color:#0d1525;border-color:#f1f5f9}
        .db-summary-line{display:flex;justify-content:space-between;font-size:13px;color:var(--text-secondary);padding:7px 0;border-bottom:1px solid var(--border-muted)}
        .db-summary-line:last-child{border-bottom:none}
        @media(max-width:1180px){.db-actions{grid-template-columns:repeat(2,1fr)}.db-row4{grid-template-columns:repeat(2,1fr)}.db-grid{grid-template-columns:1fr}}
        @media(max-width:768px){.db-main{margin-left:0}.db-body{padding:14px 12px 80px}.db-actions,.db-row4{grid-template-columns:1fr}}
      `}</style>

      <div className="db-root">
        <Sidebar />
        <div className="db-main">
          <AppHeader title="Dashboard" subtitle="Overview of recruiting performance" />
          <div className="db-body">
            <div className="db-row4">
              <div className="db-stat"><div className="db-stat-top"><Briefcase size={14} />Total Jobs</div><div className="db-stat-val">{loading ? "—" : jobs.length}</div></div>
              <div className="db-stat"><div className="db-stat-top"><Users size={14} />Total Candidates</div><div className="db-stat-val">{loading ? "—" : totalCandidates}</div></div>
              <div className="db-stat"><div className="db-stat-top"><Sparkles size={14} />AI Screenings</div><div className="db-stat-val">{loading ? "—" : aiScreenings}</div></div>
              <div className="db-stat"><div className="db-stat-top"><CheckCircle2 size={14} />Shortlisted</div><div className="db-stat-val">{loading ? "—" : shortlisted}</div></div>
            </div>

            <div className="db-actions">
              {quickActions.map((a) => (
                <Link href={a.href} key={a.title} className="db-action">
                  <a.icon size={18} color="#0d1525" />
                  <div style={{ flex: 1 }}>
                    <div className="db-action-title">{a.title}</div>
                    <div className="db-action-sub">{a.subtitle}</div>
                  </div>
                  <ArrowRight size={14} color="#64748b" />
                </Link>
              ))}
            </div>

            <div className="db-grid">
              <div className="db-card">
                <div className="db-card-head">
                  <div>
                    <div className="db-title">Candidate Pipeline</div>
                    <div className="db-sub">Applicant intake over time</div>
                  </div>
                  <div className="db-pills">
                    {(["1W", "1M", "3M", "6M", "1Y"] as PeriodKey[]).map((p) => (
                      <button key={p} className={`db-pill${period === p ? " active" : ""}`} onClick={() => setPeriod(p)}>{p}</button>
                    ))}
                  </div>
                </div>
                <PipelineChart labels={series.labels} candidates={series.candidates} shortlisted={series.shortlisted} />
              </div>

              <div className="db-right">
                <div className="db-card">
                  <div className="db-title" style={{ marginBottom: 12 }}>Jobs by Status</div>
                  <JobsStatusChart open={openJobs} screening={screeningJobs} closed={closedJobs} />
                </div>
                <div className="db-card">
                  <div className="db-title" style={{ marginBottom: 10 }}>Screening Summary</div>
                  <div className="db-summary-line"><span>Total Jobs</span><strong>{jobs.length}</strong></div>
                  <div className="db-summary-line"><span>Total Candidates</span><strong>{totalCandidates}</strong></div>
                  <div className="db-summary-line"><span>In Screening</span><strong>{screeningJobs}</strong></div>
                  <div className="db-summary-line"><span>Shortlisted</span><strong>{shortlisted}</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
