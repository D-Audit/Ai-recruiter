"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import { getAllJobs } from "../../services/jobService";
import { RootState } from "../../store";
import {
  Briefcase, Users, Brain, Plus,
  Sparkles, TrendingUp, ListChecks, Activity,
  ChevronRight, Target, Zap, BarChart3,
} from "lucide-react";

/* Sparkline */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 80, h = 32;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return [x, y] as [number, number];
  });
  const polyline = pts.map(p => p.join(",")).join(" ");
  const area = `0,${h} ${polyline} ${w},${h}`;
  const uid = color.replace("#","");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow:"visible" }}>
      <defs>
        <linearGradient id={`sg${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg${uid})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3" fill={color} />
    </svg>
  );
}

/* Area Chart */
function AreaChart({ data, labels }: { data: number[]; labels: string[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 300); return () => clearTimeout(t); }, []);
  const W = 520, H = 120, PL = 32, PR = 16, PT = 12, PB = 24;
  const cW = W - PL - PR, cH = H - PT - PB;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => ({ x: PL + (i / (data.length - 1)) * cW, y: PT + cH - (v / max) * cH, v }));
  const line = pts.map(p => `${p.x},${p.y}`).join(" ");
  const area = `${pts[0].x},${PT + cH} ${line} ${pts[pts.length-1].x},${PT + cH}`;
  return (
    <div style={{ position:"relative", width:"100%", height: H + 8 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:"100%", overflow:"visible" }}>
        <defs>
          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
          <clipPath id="ac"><rect x={PL} y={0} width={animated ? cW : 0} height={H} style={{ transition:"width 1.1s cubic-bezier(.16,1,.3,1)" }} /></clipPath>
        </defs>
        {[0,.25,.5,.75,1].map((t,i) => <line key={i} x1={PL} x2={PL+cW} y1={PT+cH*(1-t)} y2={PT+cH*(1-t)} stroke="#f1f5f9" strokeWidth="1" />)}
        <polygon points={area} fill="url(#ag)" clipPath="url(#ac)" />
        <polyline points={line} fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" clipPath="url(#ac)" />
        {labels.map((l,i) => <text key={i} x={pts[i].x} y={H-4} textAnchor="middle" style={{ fontSize:9, fill:"#94a3b8" }}>{l}</text>)}
        {pts.map((p,i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={hovered===i?5:3.5} fill={hovered===i?"#2563eb":"#fff"} stroke="#2563eb" strokeWidth="2" style={{ cursor:"pointer", transition:"r .15s" }} onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)} />
            {hovered===i && <g><rect x={p.x-22} y={p.y-28} width={44} height={20} rx={5} fill="#0f172a" /><text x={p.x} y={p.y-14} textAnchor="middle" style={{ fontSize:10.5, fill:"#fff", fontWeight:"700" }}>{p.v}</text></g>}
          </g>
        ))}
      </svg>
    </div>
  );
}

/* Donut Chart */
function DonutChart({ segments }: { segments: { label:string; value:number; color:string }[] }) {
  const [animated, setAnimated] = useState(false);
  const [hovered, setHovered] = useState<number|null>(null);
  useEffect(() => { const t = setTimeout(()=>setAnimated(true),400); return ()=>clearTimeout(t); }, []);
  const total = segments.reduce((s,sg)=>s+sg.value,0) || 1;
  const R=52, cx=64, cy=64, circ=2*Math.PI*R, thickness=20;
  let offset=0;
  const arcs = segments.map((sg,i) => {
    const pct=sg.value/total, dash=animated?pct*circ:0, gap=circ-dash;
    const arc = { dash, gap, offset, pct, ...sg, i };
    offset += pct*circ; return arc;
  });
  return (
    <div style={{ display:"flex", alignItems:"center", gap:20 }}>
      <svg width={128} height={128} viewBox="0 0 128 128">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
        {arcs.map((arc,i) => (
          <circle key={i} cx={cx} cy={cy} r={R} fill="none" stroke={arc.color}
            strokeWidth={hovered===i?thickness+4:thickness}
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset+circ/4}
            style={{ transition:"stroke-dasharray 1s cubic-bezier(.16,1,.3,1),stroke-width .2s", cursor:"pointer" }}
            onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)} />
        ))}
        <text x={cx} y={cy-5} textAnchor="middle" style={{ fontSize:22, fontWeight:800, fill:"#0f172a" }}>{total}</text>
        <text x={cx} y={cy+13} textAnchor="middle" style={{ fontSize:9, fill:"#94a3b8", fontWeight:600 }}>TOTAL JOBS</text>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
        {segments.map((sg,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8, cursor:"default", opacity:hovered!==null&&hovered!==i?0.45:1, transition:"opacity .18s" }}
            onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}>
            <div style={{ width:9, height:9, borderRadius:"50%", background:sg.color, flexShrink:0, boxShadow:hovered===i?`0 0 0 3px ${sg.color}30`:"none", transition:"box-shadow .18s" }} />
            <span style={{ fontSize:12.5, color:"#475569", fontWeight:600 }}>{sg.label}</span>
            <span style={{ fontSize:12.5, fontWeight:800, color:"#0f172a", marginLeft:"auto", paddingLeft:12 }}>{sg.value}</span>
            <span style={{ fontSize:11, color:"#94a3b8", minWidth:28 }}>{Math.round(sg.value/total*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Animated Progress Bar */
function ProgressBar({ pct, color, delay=0 }: { pct:number; color:string; delay?:number }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t=setTimeout(()=>setW(pct),400+delay); return ()=>clearTimeout(t); }, [pct,delay]);
  return (
    <div style={{ height:5, background:"#f1f5f9", borderRadius:99, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${w}%`, background:color, borderRadius:99, transition:"width 1s cubic-bezier(.16,1,.3,1)", boxShadow:w>0?`0 0 6px ${color}55`:"none" }} />
    </div>
  );
}

/* ── Main ── */
export default function DashboardPage() {
  const router = useRouter();
  const { user, restoring } = useSelector((s: RootState) => s.auth);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = typeof window!=="undefined"?localStorage.getItem("token"):null;
    if (!token) { router.push("/"); return; }
    getAllJobs().then(d=>setJobs(d.jobs||[])).catch(()=>{}).finally(()=>setLoading(false));
  }, [router]);

  const totalCandidates = jobs.reduce((s,j)=>s+(j.applicantsCount||0),0);
  const openJobs        = jobs.filter(j=>j.status==="open").length;
  const screeningJobs   = jobs.filter(j=>j.status==="screening").length;
  const closedJobs      = jobs.filter(j=>j.status==="closed").length;
  const recentJobs      = [...jobs].slice(0,6);
  const firstName       = user?.name?.split(" ")[0]||(restoring?"…":"there");
  const hour            = new Date().getHours();
  const greeting        = hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";

  const trends = {
    jobs:       [1,1,2,2,3,3,Math.max(jobs.length,1)],
    open:       [0,1,1,2,1,1,Math.max(openJobs,0)],
    candidates: [0,1,2,3,4,Math.max(totalCandidates-1,0),Math.max(totalCandidates,0)],
    screening:  [0,0,1,1,2,Math.max(screeningJobs-1,0),Math.max(screeningJobs,0)],
  };

  const areaData   = [0,0,1,2,3,Math.max(totalCandidates-1,0),totalCandidates];
  const areaLabels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  const stats = [
    { label:"Total Jobs",       value:jobs.length,     icon:Briefcase,  color:"#2563eb", bg:"rgba(37,99,235,0.09)",  trend:"+2 this week",   spark:trends.jobs       },
    { label:"Open Positions",   value:openJobs,        icon:TrendingUp, color:"#16a34a", bg:"rgba(22,163,74,0.09)",  trend:"Accepting apps", spark:trends.open       },
    { label:"Total Candidates", value:totalCandidates, icon:Users,      color:"#7c3aed", bg:"rgba(124,58,237,0.09)", trend:"Across all jobs",spark:trends.candidates },
    { label:"AI Screenings",    value:screeningJobs,   icon:Brain,      color:"#0891b2", bg:"rgba(8,145,178,0.09)",  trend:"Active now",     spark:trends.screening  },
  ];

  const quickActions = [
    { href:"/jobs/create",  icon:Plus,       color:"#2563eb", bg:"rgba(37,99,235,0.1)",  title:"Post a New Job",    desc:"Define role, skills & requirements" },
    { href:"/applicants",   icon:Users,      color:"#7c3aed", bg:"rgba(124,58,237,0.1)", title:"Upload Candidates", desc:"CSV, PDF, DOCX or manual entry"     },
    { href:"/screenings",   icon:Brain,      color:"#0891b2", bg:"rgba(8,145,178,0.1)",  title:"View Screenings",   desc:"See AI-ranked results"               },
    { href:"/candidates",   icon:ListChecks, color:"#16a34a", bg:"rgba(22,163,74,0.1)",  title:"Browse Candidates", desc:"Explore the talent pool"            },
  ];

  const statusMap: Record<string,{bg:string;color:string;dot:string;label:string}> = {
    open:      {bg:"#dcfce7",color:"#15803d",dot:"#16a34a",label:"Open"},
    screening: {bg:"#dbeafe",color:"#1d4ed8",dot:"#2563eb",label:"Screening"},
    closed:    {bg:"#f1f5f9",color:"#475569",dot:"#94a3b8",label:"Closed"},
  };

  const fade = (d: number) => ({ opacity: mounted?1:0, transform: mounted?"none":"translateY(14px)", transition:`opacity .4s ${d}s,transform .4s ${d}s` });

  return (
    <>
      <style>{`
        .db-root{display:flex;font-family:var(--font-body,system-ui);}
        .db-main{margin-left:var(--sidebar-width,260px);min-height:100vh;background:#eef2f7;flex:1;}
        .db-body{padding:28px 36px 100px;}
        .db-eyebrow{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:14px;display:flex;align-items:center;gap:7px;}
        .db-greet-title{font-family:var(--font-display,sans-serif);font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;line-height:1.2;}
        .db-greet-sub{font-size:14px;color:#64748b;margin-top:5px;}
        .db-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;}
        .db-stat{background:#fff;border-radius:20px;padding:22px 22px 18px;border:1.5px solid #e8edf3;box-shadow:0 1px 3px rgba(0,0,0,0.05);transition:transform .22s cubic-bezier(.16,1,.3,1),box-shadow .22s;position:relative;overflow:hidden;cursor:default;}
        .db-stat::after{content:"";position:absolute;bottom:0;left:0;right:0;height:3px;background:var(--sc,#2563eb);transform:scaleX(0);transform-origin:left;transition:transform .3s cubic-bezier(.16,1,.3,1);}
        .db-stat:hover{transform:translateY(-4px);box-shadow:0 14px 32px rgba(0,0,0,0.09);}
        .db-stat:hover::after{transform:scaleX(1);}
        .db-stat-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;}
        .db-stat-ico{width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .db-stat-live{display:flex;align-items:center;gap:5px;font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:99px;}
        .db-stat-val{font-family:var(--font-display,sans-serif);font-size:36px;font-weight:800;color:#0f172a;letter-spacing:-2px;line-height:1;margin-bottom:4px;}
        .db-stat-label{font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.06em;}
        .db-stat-bottom{display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:12px;border-top:1px solid #f8fafc;}
        .db-stat-trend{font-size:11px;font-weight:600;color:#94a3b8;}
        @keyframes dbPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,0.2);}50%{box-shadow:0 0 0 10px rgba(255,255,255,0);}}
        .db-banner{background:linear-gradient(135deg,#1535b8 0%,#2952e3 45%,#5b21b6 100%);border-radius:22px;padding:26px 32px;display:flex;align-items:center;gap:22px;margin-bottom:24px;position:relative;overflow:hidden;box-shadow:0 8px 32px rgba(37,99,235,0.28);}
        .db-banner::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 75% 50%,rgba(255,255,255,0.09) 0%,transparent 55%);}
        .db-banner-dots{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.07) 1px,transparent 1px);background-size:22px 22px;}
        .db-banner-ico{width:54px;height:54px;border-radius:15px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;animation:dbPulse 3s ease-in-out infinite;}
        .db-banner-title{font-family:var(--font-display,sans-serif);font-size:19px;font-weight:800;color:#fff;letter-spacing:-0.3px;margin-bottom:4px;}
        .db-banner-sub{font-size:13.5px;color:rgba(255,255,255,0.65);line-height:1.55;max-width:520px;}
        .db-banner-meta{display:flex;gap:20px;margin-top:10px;flex-wrap:wrap;}
        .db-banner-chip{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:rgba(255,255,255,0.8);}
        .db-banner-btn{margin-left:auto;flex-shrink:0;padding:12px 22px;border-radius:13px;border:none;background:#fff;color:#2952e3;font-family:var(--font-display,sans-serif);font-weight:700;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;transition:all .18s;text-decoration:none;box-shadow:0 4px 16px rgba(0,0,0,0.15);white-space:nowrap;position:relative;z-index:1;}
        .db-banner-btn:hover{transform:translateY(-2px) scale(1.02);box-shadow:0 8px 24px rgba(0,0,0,0.2);}
        .db-card{background:#fff;border-radius:20px;border:1.5px solid #e8edf3;box-shadow:0 1px 3px rgba(0,0,0,0.05);overflow:hidden;}
        .db-card-head{padding:18px 22px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;}
        .db-card-title{font-size:14.5px;font-weight:700;color:#0f172a;display:flex;align-items:center;gap:8px;}
        .db-card-link{font-size:12.5px;font-weight:600;color:#2563eb;text-decoration:none;display:flex;align-items:center;gap:3px;transition:gap .15s;}
        .db-card-link:hover{gap:6px;}
        .db-cols{display:grid;grid-template-columns:1fr 280px;gap:20px;align-items:start;margin-bottom:20px;}
        .db-bottom{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
        .db-job{display:flex;align-items:center;gap:14px;padding:13px 22px;text-decoration:none;border-bottom:1px solid #f8fafc;transition:background .15s;}
        .db-job:last-child{border-bottom:none;}
        .db-job:hover{background:#f8fafc;}
        .db-job-ico{width:40px;height:40px;border-radius:11px;background:rgba(37,99,235,0.07);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .db-job-name{font-size:13.5px;font-weight:700;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .db-job-meta{font-size:11.5px;color:#94a3b8;margin-top:2px;}
        .db-job-badge{padding:3px 11px;border-radius:99px;font-size:11px;font-weight:700;flex-shrink:0;display:flex;align-items:center;gap:5px;}
        .db-action{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:14px;background:#f8fafc;border:1.5px solid #f1f5f9;text-decoration:none;transition:all .18s;margin-bottom:10px;}
        .db-action:last-child{margin-bottom:0;}
        .db-action:hover{background:#fff;border-color:#e2e8f0;transform:translateX(4px);box-shadow:0 4px 14px rgba(0,0,0,0.06);}
        .db-action-ico{width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .db-action-title{font-size:13px;font-weight:700;color:#0f172a;}
        .db-action-desc{font-size:11px;color:#94a3b8;margin-top:1px;}
        .db-empty{padding:52px 24px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px;}
        .db-strip{background:#fff;border-radius:18px;border:1.5px solid #e8edf3;padding:16px 22px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:20px;}
        .db-strip-chip{display:flex;align-items:center;gap:7px;padding:7px 13px;border-radius:10px;background:#f8fafc;border:1px solid #f1f5f9;font-size:12px;font-weight:600;color:#475569;white-space:nowrap;}
        @media(max-width:1280px){.db-stats{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:1100px){.db-cols{grid-template-columns:1fr;}.db-bottom{grid-template-columns:1fr;}}
        @media(max-width:768px){.db-main{margin-left:0;}.db-body{padding:20px 16px 100px;}.db-stats{grid-template-columns:1fr 1fr;}}
      `}</style>

      <div className="db-root">
        <Sidebar />
        <div className="db-main">
          <AppHeader title="Dashboard" subtitle="Umurava AI — Talent Screening Platform" />
          <div className="db-body">

            {/* Greeting */}
            <div style={{ marginBottom:28, ...fade(.05) }}>
              <h1 className="db-greet-title">{greeting}, {firstName} 👋</h1>
              <p className="db-greet-sub">Here&apos;s your talent pipeline overview — {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</p>
            </div>

            {/* Stats */}
            <div className="db-stats">
              {stats.map((s,i) => (
                <div key={s.label} className="db-stat" style={{ "--sc":s.color, ...fade(.1+i*.07) } as any}>
                  <div className="db-stat-top">
                    <div className="db-stat-ico" style={{ background:s.bg }}><s.icon size={20} color={s.color} /></div>
                    <div className="db-stat-live" style={{ background:`${s.color}16`,color:s.color }}>
                      <span style={{ width:5,height:5,borderRadius:"50%",background:s.color,animation:"dbPulse 2.5s ease-in-out infinite" }} />
                      Live
                    </div>
                  </div>
                  <div className="db-stat-val">{loading?"—":s.value}</div>
                  <div className="db-stat-label">{s.label}</div>
                  <div className="db-stat-bottom">
                    <span className="db-stat-trend">{s.trend}</span>
                    <Sparkline data={s.spark} color={s.color} />
                  </div>
                </div>
              ))}
            </div>

            {/* Banner */}
            <div className="db-banner" style={fade(.38)}>
              <div className="db-banner-dots" />
              <div className="db-banner-ico" style={{ position:"relative",zIndex:1 }}><Sparkles size={26} color="white" /></div>
              <div style={{ flex:1,minWidth:0,position:"relative",zIndex:1 }}>
                <p className="db-banner-title">Umurava AI — Intelligent Talent Screening</p>
                <p className="db-banner-sub">Post a job, upload candidates, and let our AI rank them in seconds. Bias-aware scoring powered by Gemini.</p>
                <div className="db-banner-meta">
                  {[{icon:Briefcase,val:`${jobs.length} job${jobs.length!==1?"s":""} posted`},{icon:Users,val:`${totalCandidates} candidate${totalCandidates!==1?"s":""}`},{icon:Brain,val:`${screeningJobs} screening${screeningJobs!==1?"s":""} active`}].map((chip,i)=>(
                    <div key={i} className="db-banner-chip"><chip.icon size={12} color="rgba(255,255,255,0.7)" />{chip.val}</div>
                  ))}
                </div>
              </div>
              <Link href="/jobs/create" className="db-banner-btn"><Plus size={15} /> Post a Job</Link>
            </div>

            {/* 2-col */}
            <div className="db-cols">
              {/* Recent Jobs */}
              <div className="db-card">
                <div className="db-card-head">
                  <span className="db-card-title"><Briefcase size={16} color="#2563eb" /> Recent Jobs</span>
                  <Link href="/jobs" className="db-card-link">View all <ChevronRight size={13} /></Link>
                </div>
                {loading ? (
                  <div style={{ padding:"40px 22px",textAlign:"center",color:"#94a3b8",fontSize:14 }}>Loading…</div>
                ) : recentJobs.length===0 ? (
                  <div className="db-empty">
                    <div style={{ width:58,height:58,borderRadius:16,background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center" }}><Briefcase size={24} color="#94a3b8" /></div>
                    <p style={{ fontWeight:700,fontSize:15,color:"#0f172a" }}>No jobs yet</p>
                    <p style={{ color:"#64748b",fontSize:13,maxWidth:260,lineHeight:1.6 }}>Create your first job posting to start screening candidates with AI.</p>
                    <Link href="/jobs/create" style={{ marginTop:6,display:"inline-flex",alignItems:"center",gap:7,padding:"10px 20px",borderRadius:11,background:"linear-gradient(135deg,#2563eb,#7c3aed)",color:"#fff",fontWeight:700,fontSize:13.5,textDecoration:"none" }}>
                      <Plus size={14} /> Post a Job
                    </Link>
                  </div>
                ) : recentJobs.map((job,idx) => {
                  const st = statusMap[job.status]||statusMap.closed;
                  const pct = job.applicantsCount>0?Math.min(100,Math.round((job.applicantsCount/Math.max(job.applicantsCount,5))*100)):0;
                  return (
                    <Link key={job._id} href={`/jobs/${job._id}`} className="db-job">
                      <div className="db-job-ico"><Briefcase size={17} color="#2563eb" /></div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <p className="db-job-name">{job.title}</p>
                        <p className="db-job-meta">{job.applicantsCount||0} candidates · {job.location||"Remote"}</p>
                        <div style={{ marginTop:6 }}>
                          <ProgressBar pct={pct} color={st.dot} delay={idx*120} />
                        </div>
                      </div>
                      <span className="db-job-badge" style={{ background:st.bg,color:st.color }}>
                        <span style={{ width:5,height:5,borderRadius:"50%",background:st.dot }} />
                        {st.label}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div>
                <div className="db-eyebrow"><Zap size={13} color="#f59e0b" /> Quick Actions</div>
                {quickActions.map(a => (
                  <Link key={a.href} href={a.href} className="db-action">
                    <div className="db-action-ico" style={{ background:a.bg }}><a.icon size={17} color={a.color} /></div>
                    <div style={{ flex:1 }}>
                      <p className="db-action-title">{a.title}</p>
                      <p className="db-action-desc">{a.desc}</p>
                    </div>
                    <ChevronRight size={14} color="#cbd5e1" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Charts row */}
            <div className="db-bottom">
              {/* Area chart */}
              <div className="db-card">
                <div className="db-card-head">
                  <span className="db-card-title"><BarChart3 size={16} color="#2563eb" /> Candidate Growth</span>
                  <span style={{ fontSize:11.5,fontWeight:600,color:"#94a3b8" }}>Last 7 days</span>
                </div>
                <div style={{ padding:"20px 22px 16px" }}>
                  <div style={{ display:"flex",alignItems:"flex-end",gap:6,marginBottom:4 }}>
                    <span style={{ fontFamily:"var(--font-display,sans-serif)",fontSize:32,fontWeight:800,color:"#0f172a",letterSpacing:"-1.5px",lineHeight:1 }}>{totalCandidates}</span>
                    <span style={{ fontSize:13,color:"#16a34a",fontWeight:700,marginBottom:4 }}>total candidates</span>
                  </div>
                  <p style={{ fontSize:12.5,color:"#94a3b8",marginBottom:16 }}>Across all active job postings</p>
                  <AreaChart data={areaData} labels={areaLabels} />
                </div>
              </div>

              {/* Donut chart */}
              <div className="db-card">
                <div className="db-card-head">
                  <span className="db-card-title"><Target size={16} color="#7c3aed" /> Job Status</span>
                  <span style={{ fontSize:11.5,fontWeight:600,color:"#94a3b8" }}>Breakdown</span>
                </div>
                <div style={{ padding:"22px 24px" }}>
                  <DonutChart segments={[
                    {label:"Open",      value:openJobs,      color:"#16a34a"},
                    {label:"Screening", value:screeningJobs, color:"#2563eb"},
                    {label:"Closed",    value:closedJobs,    color:"#94a3b8"},
                  ]} />
                  <div style={{ marginTop:20,display:"flex",flexDirection:"column",gap:10 }}>
                    {[{label:"Open",value:openJobs,color:"#16a34a"},{label:"Screening",value:screeningJobs,color:"#2563eb"},{label:"Closed",value:closedJobs,color:"#94a3b8"}].map((sg,i)=>(
                      <div key={sg.label}>
                        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                          <span style={{ fontSize:12,fontWeight:600,color:"#475569" }}>{sg.label}</span>
                          <span style={{ fontSize:12,fontWeight:700,color:"#0f172a" }}>{sg.value}</span>
                        </div>
                        <ProgressBar pct={jobs.length>0?(sg.value/jobs.length)*100:0} color={sg.color} delay={i*150} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Activity strip */}
            <div className="db-strip">
              <Activity size={15} color="#2563eb" />
              <span style={{ fontSize:13,fontWeight:700,color:"#0f172a" }}>Platform Status</span>
              {[{icon:Brain,label:"AI Screening",val:"Online",color:"#16a34a"},{icon:Sparkles,label:"Gemini AI",val:"Active",color:"#7c3aed"},{icon:Users,label:"Candidates",val:`${totalCandidates}`,color:"#0891b2"},{icon:Briefcase,label:"Jobs",val:`${jobs.length}`,color:"#2563eb"}].map(chip=>(
                <div key={chip.label} className="db-strip-chip">
                  <chip.icon size={13} color={chip.color} />
                  <span style={{ color:"#94a3b8" }}>{chip.label}:</span>
                  <span style={{ color:chip.color,fontWeight:700 }}>{loading?"…":chip.val}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}