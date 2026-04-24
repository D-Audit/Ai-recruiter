"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import { getAllJobs } from "../../services/jobService";
import {
  Briefcase, Plus, Users, ArrowRight, ChevronRight,
  MapPin, Zap, TrendingUp, Clock, Sparkles,
  BarChart2, Target, CheckCircle2,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildWeeklyData(jobs: any[]): { day: string; candidates: number; jobs: number }[] {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return { date: d, day: DAY_NAMES[d.getDay()], candidates: 0, jobs: 0 };
  });
  jobs.forEach((job) => {
    const created = new Date(job.createdAt || Date.now());
    const diffDays = Math.floor((today.getTime() - created.getTime()) / 86400000);
    if (diffDays >= 0 && diffDays < 7) {
      const idx = 6 - diffDays;
      days[idx].jobs += 1;
      const cands = job.applicantsCount || 0;
      for (let k = idx; k < 7 && cands > 0; k++) {
        days[k].candidates += Math.ceil(cands / (7 - idx));
      }
    }
  });
  return days;
}

function BarChart({ data }: { data: { day: string; candidates: number; jobs: number }[] }) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 120);
    return () => clearTimeout(timer);
  }, []);

  const maxCand = Math.max(...data.map((d) => d.candidates), 1);
  const maxJobs = Math.max(...data.map((d) => d.jobs), 1);
  const chartH  = 120;
  const barW    = 22;
  const gap     = 14;
  const totalW  = data.length * (barW * 2 + gap + 8);

  return (
    <div ref={ref} style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap, paddingBottom: 24, paddingTop: 8, minWidth: totalW }}>
        {data.map((d, i) => {
          const candH = animated ? Math.round((d.candidates / maxCand) * chartH) : 0;
          const jobH  = animated ? Math.round((d.jobs / maxJobs) * chartH) : 0;
          const isToday = i === data.length - 1;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: chartH }}>
                <div
                  title={`${d.candidates} candidates`}
                  style={{
                    width: barW, borderRadius: "6px 6px 2px 2px",
                    height: candH || 3,
                    background: isToday ? "linear-gradient(180deg,#3b82f6,#1d4ed8)" : "linear-gradient(180deg,#93c5fd,#60a5fa)",
                    transition: "height 0.7s cubic-bezier(0.34,1.56,0.64,1)",
                    cursor: "default",
                    boxShadow: isToday ? "0 2px 8px rgba(59,130,246,0.35)" : "none",
                  }}
                />
                <div
                  title={`${d.jobs} jobs`}
                  style={{
                    width: barW, borderRadius: "6px 6px 2px 2px",
                    height: jobH || 3,
                    background: isToday ? "linear-gradient(180deg,#a78bfa,#7c3aed)" : "linear-gradient(180deg,#c4b5fd,#a78bfa)",
                    transition: `height 0.7s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.04}s`,
                    cursor: "default",
                    boxShadow: isToday ? "0 2px 8px rgba(124,58,237,0.3)" : "none",
                  }}
                />
              </div>
              <span style={{ fontSize: 11, fontWeight: isToday ? 700 : 500, color: isToday ? "#2563eb" : "var(--text-muted)", marginTop: 2 }}>
                {d.day}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 16, paddingBottom: 4 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "#60a5fa", display: "inline-block" }} />
          Candidates
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "#a78bfa", display: "inline-block" }} />
          Jobs posted
        </span>
      </div>
    </div>
  );
}

function QuickAction({
  href, icon: Icon, label, desc, iconBg, iconColor, delay,
}: {
  href: string; icon: any; label: string; desc: string;
  iconBg: string; iconColor: string; delay: number;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      className="qa-item"
      style={{ animationDelay: `${delay}s` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="qa-icon" style={{ background: hovered ? iconColor : iconBg, transition: "background 0.22s" }}>
        <Icon size={18} color={hovered ? "#fff" : iconColor} style={{ transition: "color 0.22s" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="qa-label">{label}</p>
        <p className="qa-desc">{desc}</p>
      </div>
      <div className="qa-arrow" style={{ transform: hovered ? "translateX(4px)" : "translateX(0)", opacity: hovered ? 1 : 0.4, transition: "transform 0.2s, opacity 0.2s" }}>
        <ChevronRight size={16} color={iconColor} />
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const router   = useRouter();
  const { user } = useSelector((s: RootState) => s.auth);

  const [jobs,        setJobs]        = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [weeklyData,  setWeeklyData]  = useState<{ day: string; candidates: number; jobs: number }[]>([]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.push("/"); return; }
    getAllJobs()
      .then((d) => {
        const list = d.jobs || [];
        setJobs(list);
        setWeeklyData(buildWeeklyData(list));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const firstName = user?.name?.split(" ")[0] || "there";

  const totalJobs       = jobs.length;
  const openJobs        = jobs.filter((j) => j.status === "open").length;
  const totalCandidates = jobs.reduce((s, j) => s + (j.applicantsCount || 0), 0);
  const screeningJobs   = jobs.filter((j) => j.status === "screening").length;

  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      open:      { bg: "rgba(22,163,74,0.12)",  color: "#15803d", label: "Open"      },
      screening: { bg: "rgba(124,58,237,0.12)", color: "#7c3aed", label: "Screening" },
      closed:    { bg: "rgba(100,116,139,0.12)",color: "#64748b", label: "Closed"    },
    };
    const s = map[status] || map.closed;
    return (
      <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11.5, fontWeight: 700, background: s.bg, color: s.color }}>
        {s.label}
      </span>
    );
  };

  return (
    <>
      <style>{`
        .dash-root { display:flex; font-family:var(--font-body,'Inter',system-ui); }
        /* ✅ FIX: Use CSS variable instead of hardcoded #f8fafc */
        .dash-main { margin-left:var(--sidebar-width,260px); min-height:100vh; background:var(--surface-base); flex:1; display:flex; flex-direction:column; }
        .dash-body { padding:28px 32px 80px; flex:1; }

        @keyframes greetIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cardIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes qaIn    { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }

        /* ── Greeting ── */
        .dash-greeting {
          border-radius: 20px; overflow: hidden; position: relative;
          background: linear-gradient(130deg, #0d1a3a 0%, #1e3a8a 55%, #2563eb 100%);
          padding: 36px 36px; display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 24px; animation: greetIn 0.5s ease both; min-height: 148px;
        }
        .dash-greeting::before {
          content:''; position:absolute; right:-40px; top:-40px;
          width:260px; height:260px; border-radius:50%;
          background:radial-gradient(circle,rgba(255,255,255,0.07) 0%,transparent 65%);
          pointer-events:none;
        }
        .dash-greeting-date { font-size:12.5px; color:rgba(255,255,255,0.5); font-weight:500; margin-bottom:7px; }
        .dash-greeting-h { font-size:27px; font-weight:800; color:#ffffff; line-height:1.2; margin-bottom:7px; letter-spacing:-0.5px; }
        .dash-greeting-sub { font-size:14px; color:rgba(255,255,255,0.6); margin-bottom:24px; }
        .dash-greeting-btns { display:flex; gap:10px; flex-wrap:wrap; }
        .dash-btn-primary {
          display:inline-flex; align-items:center; gap:7px;
          padding:11px 20px; border-radius:10px; border:none;
          background:#ffffff; color:#1e3a8a; font-weight:700; font-size:14px;
          cursor:pointer; font-family:inherit; text-decoration:none;
          transition:all 0.15s; box-shadow:0 4px 14px rgba(0,0,0,0.15);
        }
        .dash-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(0,0,0,0.2); }
        .dash-btn-ghost {
          display:inline-flex; align-items:center; gap:7px;
          padding:11px 20px; border-radius:10px;
          border:1.5px solid rgba(255,255,255,0.25);
          background:rgba(255,255,255,0.1);
          color:rgba(255,255,255,0.9); font-weight:600; font-size:14px;
          cursor:pointer; font-family:inherit; text-decoration:none;
          transition:all 0.15s;
        }
        .dash-btn-ghost:hover { background:rgba(255,255,255,0.18); border-color:rgba(255,255,255,0.4); }

        .dash-illus { flex-shrink:0; width:110px; height:110px; position:relative; z-index:1; opacity:0.85; }

        /* ── Stat cards — use CSS vars for dark mode ── */
        .dash-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
        .dash-stat {
          background:var(--surface-card); border-radius:16px; border:1px solid var(--border-muted);
          padding:20px 22px; display:flex; align-items:center; gap:16px;
          box-shadow:var(--shadow-card); transition:all 0.2s;
          animation:cardIn 0.4s ease both;
        }
        .dash-stat:hover { transform:translateY(-2px); box-shadow:var(--shadow-card-hover); border-color:var(--border-soft); }
        .dash-stat-icon { width:46px; height:46px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        /* ✅ FIX: Use CSS var for text colors */
        .dash-stat-val { font-size:28px; font-weight:900; color:var(--text-primary); line-height:1; letter-spacing:-1px; }
        .dash-stat-lbl { font-size:13px; color:var(--text-muted); font-weight:500; margin-top:3px; }

        /* ── Layout ── */
        .dash-2col { display:grid; grid-template-columns:1fr 340px; gap:20px; align-items:start; }
        /* ✅ FIX: CSS vars for card backgrounds */
        .dash-card {
          background:var(--surface-card); border-radius:18px; border:1px solid var(--border-muted);
          box-shadow:var(--shadow-card); overflow:hidden;
        }
        .dash-card-hd {
          padding:18px 22px; border-bottom:1px solid var(--border-muted);
          display:flex; align-items:center; justify-content:space-between;
        }
        .dash-card-title { font-size:15px; font-weight:800; color:var(--text-primary); display:flex; align-items:center; gap:8px; }
        .dash-card-body  { padding:16px 22px; }

        /* ── Job list rows ── */
        .dash-job-row {
          display:flex; align-items:center; gap:12px;
          padding:13px 0; border-bottom:1px solid var(--border-muted);
          text-decoration:none; transition:background 0.15s; border-radius:0;
        }
        .dash-job-row:last-child { border-bottom:none; }
        .dash-job-row:hover { background:var(--surface-hover); margin:0 -22px; padding:13px 22px; border-radius:8px; }
        .dash-job-icon { width:38px; height:38px; border-radius:10px; background:rgba(37,99,235,0.08); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .dash-job-title { font-size:13.5px; font-weight:700; color:var(--text-primary); margin-bottom:3px; }
        .dash-job-meta  { font-size:12px; color:var(--text-muted); display:flex; align-items:center; gap:6px; flex-wrap:wrap; }

        /* ── Quick actions ── */
        .qa-item {
          display:flex; align-items:center; gap:12px;
          padding:14px 0; border-bottom:1px solid var(--border-muted);
          text-decoration:none; transition:background 0.15s; border-radius:0;
          animation:qaIn 0.35s ease both;
        }
        .qa-item:last-child { border-bottom:none; }
        .qa-item:hover { background:var(--surface-hover); margin:0 -22px; padding:14px 22px; border-radius:8px; }
        .qa-icon  { width:40px; height:40px; border-radius:11px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .qa-label { font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:2px; }
        .qa-desc  { font-size:12px; color:var(--text-muted); }
        .qa-arrow { display:flex; align-items:center; flex-shrink:0; }

        /* ── Chart card ── */
        .dash-chart-card {
          background:var(--surface-card); border-radius:18px; border:1px solid var(--border-muted);
          box-shadow:var(--shadow-card); margin-bottom:20px; overflow:hidden;
        }

        /* ── Insight chips ── */
        .dash-insight {
          display:flex; align-items:center; gap:10px;
          padding:12px 16px; border-radius:12px;
          background:var(--surface-hover); border:1px solid var(--border-muted);
          margin-bottom:10px; font-size:13px; color:var(--text-secondary);
          line-height:1.5;
        }

        @keyframes spin { to { transform:rotate(360deg); } }
        @media(max-width:1100px) { .dash-2col { grid-template-columns:1fr; } .dash-stats { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:640px)  { .dash-main { margin-left:0; } .dash-body { padding:16px 12px 60px; } .dash-stats { grid-template-columns:1fr 1fr; } }
      `}</style>

      <div className="dash-root">
        <Sidebar />
        <div className="dash-main">
          <AppHeader title="Dashboard" subtitle="Your AI recruiting overview" />
          <div className="dash-body">

            {/* ── Greeting ── */}
            <div className="dash-greeting">
              <div style={{ flex: 1 }}>
                <p className="dash-greeting-date">{dateStr}</p>
                <h1 className="dash-greeting-h">{greeting}, {firstName} 👋</h1>
                <p className="dash-greeting-sub">
                  {loading ? "Loading your data…" : `You have ${openJobs} open job${openJobs !== 1 ? "s" : ""} and ${totalCandidates} candidates in the pipeline.`}
                </p>
                <div className="dash-greeting-btns">
                  <Link href="/jobs/create" className="dash-btn-primary">
                    <Plus size={15} /> Post a Job
                  </Link>
                  <Link href="/applicants" className="dash-btn-ghost">
                    <Users size={15} /> Upload Candidates
                  </Link>
                </div>
              </div>
              <div className="dash-illus" aria-hidden>
                <svg viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="55" cy="55" r="50" fill="rgba(255,255,255,0.06)" />
                  <circle cx="55" cy="55" r="36" fill="rgba(255,255,255,0.08)" />
                  <rect x="32" y="38" width="46" height="34" rx="6" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <rect x="38" y="46" width="14" height="10" rx="7" fill="white" fillOpacity="0.6" />
                  <rect x="56" y="48" width="16" height="2" rx="1" fill="white" fillOpacity="0.5" />
                  <rect x="56" y="52" width="10" height="2" rx="1" fill="white" fillOpacity="0.35" />
                  <rect x="38" y="60" width="34" height="2" rx="1" fill="white" fillOpacity="0.2" />
                  <circle cx="80" cy="34" r="8" fill="rgba(99,255,150,0.35)" stroke="rgba(99,255,150,0.6)" strokeWidth="1.5" />
                  <path d="M76.5 34l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* ── Stat cards ── */}
            <div className="dash-stats">
              {[
                { label: "Total Jobs",    val: totalJobs,       icon: Briefcase,  bg: "rgba(37,99,235,0.1)",  color: "#2563eb", delay: 0 },
                { label: "Open Jobs",     val: openJobs,        icon: Target,     bg: "rgba(22,163,74,0.1)",  color: "#16a34a", delay: 0.05 },
                { label: "Candidates",    val: totalCandidates, icon: Users,      bg: "rgba(124,58,237,0.1)", color: "#7c3aed", delay: 0.1 },
                { label: "In Screening",  val: screeningJobs,   icon: Zap,        bg: "rgba(245,158,11,0.1)", color: "#d97706", delay: 0.15 },
              ].map((s, i) => (
                <div key={i} className="dash-stat" style={{ animationDelay: `${s.delay}s` }}>
                  <div className="dash-stat-icon" style={{ background: s.bg }}>
                    <s.icon size={20} color={s.color} />
                  </div>
                  <div>
                    <p className="dash-stat-val">
                      {loading ? (
                        <span style={{ display: "inline-block", width: 40, height: 24, borderRadius: 6, background: "var(--border-muted)", animation: "shimmer 1.5s infinite" }} />
                      ) : s.val}
                    </p>
                    <p className="dash-stat-lbl">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Chart ── */}
            <div className="dash-chart-card">
              <div className="dash-card-hd">
                <span className="dash-card-title"><BarChart2 size={16} color="#2563eb" /> Weekly Activity</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Last 7 days</span>
              </div>
              <div style={{ padding: "20px 22px 8px" }}>
                {weeklyData.length > 0
                  ? <BarChart data={weeklyData} />
                  : <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>No data yet</div>
                }
              </div>
            </div>

            {/* ── 2-col layout ── */}
            <div className="dash-2col">

              {/* Recent jobs */}
              <div className="dash-card">
                <div className="dash-card-hd">
                  <span className="dash-card-title"><Briefcase size={15} color="#2563eb" /> Recent Jobs</span>
                  <Link href="/jobs" style={{ fontSize: 13, fontWeight: 600, color: "#2563eb", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                    View all <ArrowRight size={13} />
                  </Link>
                </div>
                <div className="dash-card-body">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} style={{ padding: "13px 0", borderBottom: "1px solid var(--border-muted)" }}>
                        <div style={{ width: "60%", height: 14, borderRadius: 4, background: "var(--border-muted)", marginBottom: 6 }} />
                        <div style={{ width: "40%", height: 12, borderRadius: 4, background: "var(--border-muted)" }} />
                      </div>
                    ))
                  ) : recentJobs.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 16px" }}>
                      <Briefcase size={28} style={{ margin: "0 auto 10px", display: "block", opacity: 0.3 }} />
                      <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No jobs yet — <Link href="/jobs/create" style={{ color: "#2563eb" }}>create your first one</Link></p>
                    </div>
                  ) : (
                    recentJobs.map((job) => (
                      <Link key={job._id} href={`/jobs/${job._id}`} className="dash-job-row">
                        <div className="dash-job-icon">
                          <Briefcase size={16} color="#2563eb" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="dash-job-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.title}</p>
                          <p className="dash-job-meta">
                            {job.location && <><MapPin size={11} />{job.location}</>}
                            <span>·</span>
                            <Users size={11} />{job.applicantsCount || 0} candidates
                          </p>
                        </div>
                        {statusBadge(job.status)}
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* Quick actions + insights */}
              <div>
                <div className="dash-card" style={{ marginBottom: 16 }}>
                  <div className="dash-card-hd">
                    <span className="dash-card-title"><Sparkles size={15} color="#7c3aed" /> Quick Actions</span>
                  </div>
                  <div className="dash-card-body">
                    <QuickAction href="/jobs/create"   icon={Plus}       label="Post New Job"        desc="Create a job posting"          iconBg="rgba(37,99,235,0.09)"  iconColor="#2563eb" delay={0}    />
                    <QuickAction href="/applicants"    icon={Users}      label="Upload Candidates"   desc="Add CVs for AI screening"      iconBg="rgba(22,163,74,0.09)"  iconColor="#16a34a" delay={0.05} />
                    <QuickAction href="/screenings"    icon={Zap}        label="Run AI Screening"    desc="Let Gemini AI rank candidates" iconBg="rgba(124,58,237,0.09)" iconColor="#7c3aed" delay={0.1}  />
                    <QuickAction href="/candidates"    icon={TrendingUp} label="Compare Candidates"  desc="Side-by-side comparison"       iconBg="rgba(245,158,11,0.09)" iconColor="#d97706" delay={0.15} />
                  </div>
                </div>

                {/* Insights */}
                <div className="dash-card">
                  <div className="dash-card-hd">
                    <span className="dash-card-title"><Target size={15} color="#16a34a" /> Pipeline Health</span>
                  </div>
                  <div className="dash-card-body">
                    <div className="dash-insight">
                      <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                      <span>{totalCandidates > 0 ? `${totalCandidates} candidates ready for AI ranking` : "Upload candidates to get started"}</span>
                    </div>
                    <div className="dash-insight">
                      <Clock size={18} color="#d97706" style={{ flexShrink: 0 }} />
                      <span>{openJobs > 0 ? `${openJobs} active job${openJobs !== 1 ? "s" : ""} accepting applications` : "No active jobs — post one to start"}</span>
                    </div>
                    <div className="dash-insight">
                      <Zap size={18} color="#7c3aed" style={{ flexShrink: 0 }} />
                      <span>{screeningJobs > 0 ? `${screeningJobs} job${screeningJobs !== 1 ? "s" : ""} in AI screening` : "No active screenings running"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}