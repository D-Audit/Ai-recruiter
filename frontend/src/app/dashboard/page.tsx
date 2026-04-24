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

/**
 * Build last-7-days candidate intake from real job data.
 * Jobs have a `createdAt` field; applicants are counted via `applicantsCount`.
 * We distribute applicants proportionally across recent days as a best-effort
 * estimate since the backend doesn't expose per-day intake directly.
 */
function buildWeeklyData(jobs: any[]): { day: string; candidates: number; jobs: number }[] {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return {
      date: d,
      day: DAY_NAMES[d.getDay()],
      candidates: 0,
      jobs: 0,
    };
  });

  jobs.forEach((job) => {
    const created = new Date(job.createdAt || Date.now());
    const diffDays = Math.floor((today.getTime() - created.getTime()) / 86400000);
    if (diffDays >= 0 && diffDays < 7) {
      const idx = 6 - diffDays;
      days[idx].jobs += 1;
      // Spread applicants across the day the job was created and after
      const cands = job.applicantsCount || 0;
      for (let k = idx; k < 7 && cands > 0; k++) {
        days[k].candidates += Math.ceil(cands / (7 - idx));
      }
    }
  });

  return days;
}

// ── Animated SVG Bar Chart ────────────────────────────────────────────────────
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
      <div style={{ display: "flex", alignItems: "flex-end", gap: gap, paddingBottom: 24, paddingTop: 8, minWidth: totalW }}>
        {data.map((d, i) => {
          const candH = animated ? Math.round((d.candidates / maxCand) * chartH) : 0;
          const jobH  = animated ? Math.round((d.jobs / maxJobs) * chartH) : 0;
          const isToday = i === data.length - 1;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              {/* Bars */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: chartH }}>
                {/* Candidates bar */}
                <div
                  title={`${d.candidates} candidates`}
                  style={{
                    width: barW, borderRadius: "6px 6px 2px 2px",
                    height: candH || 3,
                    background: isToday
                      ? "linear-gradient(180deg,#3b82f6,#1d4ed8)"
                      : "linear-gradient(180deg,#93c5fd,#60a5fa)",
                    transition: "height 0.7s cubic-bezier(0.34,1.56,0.64,1)",
                    cursor: "default",
                    boxShadow: isToday ? "0 2px 8px rgba(59,130,246,0.35)" : "none",
                  }}
                />
                {/* Jobs bar */}
                <div
                  title={`${d.jobs} jobs`}
                  style={{
                    width: barW, borderRadius: "6px 6px 2px 2px",
                    height: jobH || 3,
                    background: isToday
                      ? "linear-gradient(180deg,#a78bfa,#7c3aed)"
                      : "linear-gradient(180deg,#c4b5fd,#a78bfa)",
                    transition: `height 0.7s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.04}s`,
                    cursor: "default",
                    boxShadow: isToday ? "0 2px 8px rgba(124,58,237,0.3)" : "none",
                  }}
                />
              </div>
              {/* Day label */}
              <span style={{
                fontSize: 11, fontWeight: isToday ? 700 : 500,
                color: isToday ? "#2563eb" : "#94a3b8",
                marginTop: 2,
              }}>
                {d.day}
              </span>
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 16, paddingBottom: 4 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#64748b", fontWeight: 600 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "#60a5fa", display: "inline-block" }} />
          Candidates
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#64748b", fontWeight: 600 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "#a78bfa", display: "inline-block" }} />
          Jobs posted
        </span>
      </div>
    </div>
  );
}

// ── Quick Action item with hover animation ────────────────────────────────────
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
      <div
        className="qa-icon"
        style={{
          background: hovered ? iconColor : iconBg,
          transition: "background 0.22s",
        }}
      >
        <Icon size={18} color={hovered ? "#fff" : iconColor} style={{ transition: "color 0.22s" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="qa-label">{label}</p>
        <p className="qa-desc">{desc}</p>
      </div>
      <div
        className="qa-arrow"
        style={{
          transform: hovered ? "translateX(4px)" : "translateX(0)",
          opacity: hovered ? 1 : 0.4,
          transition: "transform 0.2s, opacity 0.2s",
        }}
      >
        <ChevronRight size={16} color={iconColor} />
      </div>
    </Link>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router   = useRouter();
  const { user } = useSelector((s: RootState) => s.auth);
  const [jobs,    setJobs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.push("/"); return; }
    getAllJobs()
      .then((d) => setJobs(d.jobs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const totalCandidates  = jobs.reduce((s, j) => s + (j.applicantsCount || 0), 0);
  const activeJobs       = jobs.filter((j) => j.status === "open").length;
  const screeningJobs    = jobs.filter((j) => j.status === "screening").length;
  const shortlisted      = jobs.reduce((s, j) => s + (j.shortlistedCount || 0), 0);
  const recentJobs       = [...jobs].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 5);
  const weeklyData       = buildWeeklyData(jobs);
  const weekCandidates   = weeklyData.reduce((s, d) => s + d.candidates, 0);
  const weekJobs         = weeklyData.reduce((s, d) => s + d.jobs, 0);
  const firstName        = user?.name?.split(" ")[0] || "there";
  const hour             = new Date().getHours();
  const greeting         = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const stats = [
    { label: "Total Jobs",   value: jobs.length,     icon: Briefcase,   color: "#2563eb", iconBg: "#dbeafe" },
    { label: "Total Candidates", value: totalCandidates, icon: Users,   color: "#7c3aed", iconBg: "#ede9fe" },
    { label: "AI Screenings", value: screeningJobs,  icon: Sparkles,    color: "#0891b2", iconBg: "#cffafe" },
    { label: "Shortlisted",   value: shortlisted,    icon: CheckCircle2,color: "#16a34a", iconBg: "#dcfce7" },
  ];

  const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
    open:      { bg: "#dcfce7", color: "#16a34a", label: "Open" },
    screening: { bg: "#dbeafe", color: "#2563eb", label: "Screening" },
    closed:    { bg: "#f1f5f9", color: "#64748b", label: "Closed" },
    draft:     { bg: "#fef9c3", color: "#a16207", label: "Draft" },
  };

  const quickActions = [
    { href: "/jobs/create",  icon: Plus,      label: "Post New Job",      desc: "Create a new job listing",         iconBg: "#dbeafe", iconColor: "#2563eb", delay: 0.05 },
    { href: "/applicants",   icon: Users,     label: "Upload Candidates",  desc: "Add CVs or import from CSV",       iconBg: "#ede9fe", iconColor: "#7c3aed", delay: 0.10 },
    { href: "/screenings",   icon: Sparkles,  label: "Run AI Screening",   desc: "Screen candidates with Gemini AI", iconBg: "#cffafe", iconColor: "#0891b2", delay: 0.15 },
    { href: "/candidates/compare", icon: BarChart2, label: "Compare Candidates", desc: "Side-by-side AI comparison", iconBg: "#dcfce7", iconColor: "#16a34a", delay: 0.20 },
  ];

  return (
    <>
      <style>{`
        .dash-root { display:flex; font-family:var(--font-body,'Inter',system-ui); }
        .dash-main { margin-left:var(--sidebar-width,260px); min-height:100vh; background:#f8fafc; flex:1; display:flex; flex-direction:column; }
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

        /* Greeting illustration */
        .dash-illus { flex-shrink:0; width:110px; height:110px; position:relative; z-index:1; opacity:0.85; }

        /* ── Stat cards ── */
        .dash-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
        .dash-stat {
          background:#ffffff; border-radius:16px; border:1px solid #f1f5f9;
          padding:20px 22px; display:flex; align-items:center; gap:16px;
          box-shadow:0 1px 3px rgba(0,0,0,0.04); transition:all 0.2s;
          animation:cardIn 0.4s ease both;
        }
        .dash-stat:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,0.07); border-color:#e2e8f0; }
        .dash-stat-icon { width:46px; height:46px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .dash-stat-val { font-size:28px; font-weight:900; color:#0f172a; line-height:1; letter-spacing:-1px; }
        .dash-stat-lbl { font-size:13px; color:#64748b; font-weight:500; margin-top:3px; }

        /* ── Layout ── */
        .dash-2col { display:grid; grid-template-columns:1fr 340px; gap:20px; align-items:start; }
        .dash-card {
          background:#ffffff; border-radius:18px; border:1px solid #f1f5f9;
          box-shadow:0 1px 3px rgba(0,0,0,0.04); overflow:hidden;
        }
        .dash-card-hd {
          padding:18px 22px 14px;
          display:flex; align-items:center; justify-content:space-between;
          border-bottom:1px solid #f8fafc;
        }
        .dash-card-title { font-size:15px; font-weight:700; color:#0f172a; }
        .dash-card-link  { font-size:13px; font-weight:600; color:#2563eb; text-decoration:none; display:flex; align-items:center; gap:3px; }
        .dash-card-link:hover { text-decoration:underline; }

        /* Recent jobs */
        .dash-job-row {
          display:flex; align-items:center; gap:14px;
          padding:14px 22px; border-bottom:1px solid #f8fafc;
          transition:background 0.14s; text-decoration:none;
        }
        .dash-job-row:last-child { border-bottom:none; }
        .dash-job-row:hover { background:#fafbfc; }
        .dash-job-icon { width:38px; height:38px; border-radius:10px; background:#eff6ff; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .dash-job-name { font-size:14px; font-weight:600; color:#0f172a; margin-bottom:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dash-job-loc  { font-size:12px; color:#94a3b8; display:flex; align-items:center; gap:3px; }
        .dash-status   { font-size:11.5px; font-weight:700; padding:3px 10px; border-radius:99px; white-space:nowrap; flex-shrink:0; }
        .dash-cand-cnt { font-size:12px; color:#64748b; font-weight:600; display:flex; align-items:center; gap:4px; white-space:nowrap; flex-shrink:0; }

        /* Right column */
        .dash-right { display:flex; flex-direction:column; gap:20px; }

        /* Weekly chart card */
        .dash-chart-pad { padding:16px 20px 10px; }
        .dash-chart-meta { display:flex; gap:16px; margin-bottom:4px; flex-wrap:wrap; }
        .dash-chart-num { font-size:22px; font-weight:800; color:#0f172a; letter-spacing:-0.5px; }
        .dash-chart-lbl { font-size:11.5px; color:#94a3b8; font-weight:600; margin-top:2px; }

        /* Quick actions */
        .qa-item {
          display:flex; align-items:center; gap:14px;
          padding:14px 20px; border-bottom:1px solid #f8fafc;
          cursor:pointer; transition:background 0.15s; text-decoration:none;
          animation:qaIn 0.4s ease both;
        }
        .qa-item:last-child { border-bottom:none; }
        .qa-item:hover { background:#fafbfc; }
        .qa-icon { width:38px; height:38px; border-radius:11px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .qa-label { font-size:14px; font-weight:700; color:#0f172a; margin-bottom:2px; }
        .qa-desc  { font-size:12px; color:#94a3b8; font-weight:400; }
        .qa-arrow { flex-shrink:0; display:flex; align-items:center; }

        /* AI banner */
        .dash-ai-banner {
          background:linear-gradient(135deg,#eff6ff 0%,#ede9fe 100%);
          border:1.5px solid #c7d2fe; border-radius:16px;
          padding:20px 24px; margin-bottom:24px;
          display:flex; align-items:center; justify-content:space-between; gap:20px; flex-wrap:wrap;
        }
        .dash-ai-tag { font-size:10.5px; font-weight:800; color:#4f46e5; text-transform:uppercase; letter-spacing:1.2px; margin-bottom:4px; display:flex; align-items:center; gap:5px; }
        .dash-ai-title { font-size:15px; font-weight:700; color:#1e1b4b; margin-bottom:2px; }
        .dash-ai-sub { font-size:13px; color:#6366f1; }

        /* Empty state */
        .dash-empty { padding:48px 24px; text-align:center; }
        .dash-empty-ico { width:52px; height:52px; border-radius:14px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; }

        @media(max-width:1100px){
          .dash-stats { grid-template-columns:repeat(2,1fr); }
          .dash-2col  { grid-template-columns:1fr; }
        }
        @media(max-width:640px){
          .dash-stats { grid-template-columns:1fr 1fr; }
          .dash-body  { padding:20px 16px 60px; }
          .dash-greeting { padding:24px 20px; }
          .dash-greeting-h { font-size:22px; }
          .dash-illus { display:none; }
        }
        @media(max-width:768px){ .dash-main{margin-left:0;} }
      `}</style>

      <div className="dash-root">
        <Sidebar />
        <div className="dash-main">
          <AppHeader title="Dashboard" subtitle="Overview of your recruitment activity" />
          <div className="dash-body">

            {/* ── Greeting ── */}
            <div className="dash-greeting">
              <div style={{ position: "relative", zIndex: 1 }}>
                <p className="dash-greeting-date">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
                <h1 className="dash-greeting-h">{greeting}, {firstName} 👋</h1>
                <p className="dash-greeting-sub">
                  You have{" "}
                  <strong style={{ color: "#fff" }}>{activeJobs} active</strong> job{activeJobs !== 1 ? "s" : ""} and{" "}
                  <strong style={{ color: "#fff" }}>{totalCandidates} candidate{totalCandidates !== 1 ? "s" : ""}</strong> in pipeline.
                </p>
                <div className="dash-greeting-btns">
                  <Link href="/jobs/create" className="dash-btn-primary">
                    <Plus size={15} /> Post Job
                  </Link>
                  <Link href="/jobs" className="dash-btn-ghost">
                    View Jobs <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
              <div className="dash-illus">
                <svg viewBox="0 0 110 110" fill="none" width="110" height="110">
                  <rect x="10" y="20" width="90" height="70" rx="10" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                  <rect x="20" y="32" width="45" height="5" rx="2.5" fill="rgba(255,255,255,0.35)" />
                  <rect x="20" y="42" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.2)" />
                  <rect x="20" y="55" width="70" height="3" rx="1.5" fill="rgba(255,255,255,0.12)" />
                  <rect x="20" y="62" width="55" height="3" rx="1.5" fill="rgba(255,255,255,0.12)" />
                  <rect x="20" y="69" width="65" height="3" rx="1.5" fill="rgba(255,255,255,0.12)" />
                  <circle cx="80" cy="35" r="12" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
                  <path d="M74 35l4 4 8-8" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="dash-stats">
              {stats.map((s, i) => (
                <div key={i} className="dash-stat" style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="dash-stat-icon" style={{ background: s.iconBg }}>
                    <s.icon size={20} color={s.color} />
                  </div>
                  <div>
                    <p className="dash-stat-val">{loading ? "—" : s.value}</p>
                    <p className="dash-stat-lbl">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── AI promo banner ── */}
            <div className="dash-ai-banner">
              <div>
                <p className="dash-ai-tag"><Zap size={11} /> AI-Powered</p>
                <p className="dash-ai-title">Screen candidates in seconds</p>
                <p className="dash-ai-sub">Upload resumes and let Umurava AI rank and shortlist the best fits automatically.</p>
              </div>
              {/* "Get Started" now goes to /jobs as requested */}
              <Link
                href="/jobs"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "11px 22px", borderRadius: 10,
                  background: "#4f46e5", color: "white",
                  fontWeight: 700, fontSize: 14, textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(79,70,229,0.38)",
                  transition: "all .15s", whiteSpace: "nowrap", flexShrink: 0,
                }}
              >
                Get Started <ArrowRight size={14} />
              </Link>
            </div>

            {/* ── Two column ── */}
            <div className="dash-2col">

              {/* Recent Jobs */}
              <div className="dash-card">
                <div className="dash-card-hd">
                  <p className="dash-card-title">Recent Jobs</p>
                  <Link href="/jobs" className="dash-card-link">View All <ChevronRight size={14} /></Link>
                </div>
                {loading ? (
                  <div className="dash-empty"><p style={{ color: "#94a3b8", fontSize: 14 }}>Loading…</p></div>
                ) : recentJobs.length === 0 ? (
                  <div className="dash-empty">
                    <div className="dash-empty-ico"><Briefcase size={24} color="#94a3b8" /></div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#475569", marginBottom: 6 }}>No jobs yet</p>
                    <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>Post your first job to get started</p>
                    <Link href="/jobs/create" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 10, background: "#2563eb", color: "white", fontWeight: 700, fontSize: 13.5, textDecoration: "none" }}>
                      <Plus size={14} /> Post a Job
                    </Link>
                  </div>
                ) : (
                  recentJobs.map((job) => {
                    const s = statusStyle[job.status] || statusStyle.open;
                    return (
                      <Link key={job._id} href={`/jobs/${job._id}`} className="dash-job-row">
                        <div className="dash-job-icon"><Briefcase size={17} color="#2563eb" /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="dash-job-name">{job.title}</p>
                          <p className="dash-job-loc"><MapPin size={11} />{job.location || "Remote"}</p>
                        </div>
                        <span className="dash-cand-cnt">
                          <Users size={12} />{job.applicantsCount || 0}
                        </span>
                        <span className="dash-status" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                      </Link>
                    );
                  })
                )}
              </div>

              {/* Right column */}
              <div className="dash-right">

                {/* Weekly Activity — REAL DATA BAR CHART */}
                <div className="dash-card">
                  <div className="dash-card-hd">
                    <p className="dash-card-title">Weekly Activity</p>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", background: "#f0fdf4", padding: "3px 9px", borderRadius: 99 }}>
                      Last 7 days
                    </span>
                  </div>
                  <div className="dash-chart-pad">
                    <div className="dash-chart-meta">
                      <div>
                        <p className="dash-chart-num">{weekCandidates}</p>
                        <p className="dash-chart-lbl">Candidates this week</p>
                      </div>
                      <div>
                        <p className="dash-chart-num" style={{ color: "#7c3aed" }}>{weekJobs}</p>
                        <p className="dash-chart-lbl">Jobs posted</p>
                      </div>
                    </div>
                    {loading ? (
                      <p style={{ fontSize: 13, color: "#94a3b8", padding: "20px 0" }}>Loading chart…</p>
                    ) : (
                      <BarChart data={weeklyData} />
                    )}
                  </div>
                </div>

                {/* Quick Actions — animated */}
                <div className="dash-card">
                  <div className="dash-card-hd">
                    <p className="dash-card-title">Quick Actions</p>
                  </div>
                  {quickActions.map((qa, i) => (
                    <QuickAction key={i} {...qa} />
                  ))}
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}