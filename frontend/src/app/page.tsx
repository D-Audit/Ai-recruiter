"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AnimatedLogo from "@/components/AnimatedLogo";
import {
  Brain, Zap, Users, BarChart3, FileText, CheckCircle2,
  ArrowRight, Star, Shield, Upload, ChevronDown, Play,
  Sparkles, ChevronRight, Menu, X, MessageSquare,
  Share2, Link2,
} from "lucide-react";

function useCounter(end: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let t0: number | null = null;
    const tick = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * end));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [end, duration, start]);
  return count;
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const features = [
  { icon: Brain,         title: "Gemini AI Screening",       desc: "Every resume is scored on a transparent 100-point rubric: skills match, work experience, education level, and extras like certifications and languages.", accent: "#2563eb", tag: "Core"    },
  { icon: Upload,        title: "Any Format, Any Source",    desc: "CSV, Excel, drag-and-drop PDFs, URL import, or the Umurava talent pool. Bulk or single — fully automated parsing with no manual data entry.", accent: "#7c3aed", tag: "Import"  },
  { icon: BarChart3,     title: "Instant Ranked Shortlists", desc: "Get a ranked list with AI scores, strengths, gaps, upskilling paths, and adjacent role recommendations — generated per candidate in seconds.", accent: "#059669", tag: "Results" },
  { icon: Users,         title: "Finalist Comparison",       desc: "Select up to 3 finalists for a head-to-head comparison: AI picks a clear winner with evidence-based reasoning and per-category breakdowns.", accent: "#d97706", tag: "Compare" },
  { icon: MessageSquare, title: "Recruiter AI Chat",         desc: "Ask plain-language questions about your screening results. Dig into gaps, surface near-misses, or request alternative rankings anytime.", accent: "#dc2626", tag: "Chat"    },
  { icon: Shield,        title: "Bias-Aware Scoring",        desc: "Built-in bias notices on every run. Scoring is skills-first, experience-verified, and never penalises candidates for missing optional fields.", accent: "#0891b2", tag: "Ethics"  },
];

const steps = [
  { n: "01", title: "Post a Job",       desc: "Define required skills, experience, education, and location. Takes under 2 minutes.", icon: FileText },
  { n: "02", title: "Add Candidates",   desc: "Upload PDFs in bulk, import a CSV, paste a URL, or draw from the Umurava talent pool. AI parses every profile.", icon: Upload },
  { n: "03", title: "Run AI Screening", desc: "One click. Gemini AI scores every candidate against your job and returns a ranked shortlist in seconds.", icon: Brain },
  { n: "04", title: "Hire Confidently", desc: "Review the shortlist, compare top finalists, chat with the AI assistant, and make your decision with real data.", icon: CheckCircle2 },
];

const testimonials = [
  {
    quote: "We cut our screening time from five days to under thirty minutes. The AI reasoning is detailed enough that I can defend every shortlist decision directly to our board.",
    name: "Sarah Mitchell",
    role: "Head of Talent · Andela · Nairobi",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
    stars: 5,
  },
  {
    quote: "The bias detection feature changed how our entire team approaches recruiting. We were unknowingly filtering out strong candidates — Umurava AI surfaced them.",
    name: "Marcus Johnson",
    role: "Recruitment Lead · Flutterwave · Lagos",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
    stars: 5,
  },
  {
    quote: "Our time-to-hire dropped from six weeks to just twelve days. For a company scaling as fast as we are, that speed advantage is enormous.",
    name: "Amira Osei",
    role: "People & Culture · M-Pesa Africa · Kigali",
    photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&crop=face",
    stars: 5,
  },
];

const stats = [
  { value: 12000, label: "Candidates Screened", suffix: "+" },
  { value: 98,    label: "Recruiter Satisfaction", suffix: "%" },
  { value: 600,   label: "Jobs Posted", suffix: "+" },
  { value: 90,    label: "Time Saved Per Hire", suffix: "%" },
];

const faqs = [
  { q: "What file formats does Umurava AI accept?",           a: "CSV, XLS, XLSX spreadsheets and PDF, DOC, DOCX, TXT resume files. You can also import via a direct URL or select candidates from the built-in Umurava talent pool." },
  { q: "How does the 100-point scoring rubric work?",         a: "Skills Match accounts for 40 points, Work Experience for 25, Education for 20, and Extras (certifications, languages, location) for 15. Scores are spread to ensure a meaningful ranking with no ties." },
  { q: "Is the AI evaluation fair and unbiased?",             a: "Every screening run includes a bias transparency notice. Scoring is strictly skills-first and never penalises candidates for missing optional fields like portfolio links or bios." },
  { q: "Can Umurava AI screen non-technical roles?",          a: "Yes. You define the required skills and the AI maps every candidate to them — accountants, designers, operations managers, logistics coordinators, any role." },
  { q: "How is this different from a traditional ATS?",       a: "An ATS does keyword matching. Umurava AI uses Gemini's semantic reasoning — it understands that 3 years of Django experience is relevant to a Python backend role even when those exact words don't appear." },
];

const mockCandidates = [
  { name: "Amara Uwimana",     role: "Senior Full Stack Engineer",  score: 94, badge: "Shortlist", color: "#059669" },
  { name: "Jean Nshimiyimana", role: "Senior Backend Engineer",     score: 87, badge: "Shortlist", color: "#059669" },
  { name: "Bob Mutabazi",      role: "Backend Engineer — Python",   score: 74, badge: "Consider",  color: "#d97706" },
  { name: "Eva Mukamana",      role: "Mobile Developer — Flutter",  score: 58, badge: "Consider",  color: "#d97706" },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{ background: "#fff", border: `1.5px solid ${open ? "rgba(37,99,235,0.25)" : "#e8edf3"}`, borderRadius: 16, marginBottom: 10, cursor: "pointer", transition: "border-color .2s,box-shadow .2s", boxShadow: open ? "0 4px 24px rgba(37,99,235,0.07)" : "0 1px 3px rgba(0,0,0,0.04)" }}
      onClick={() => setOpen(!open)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px", gap: 16 }}>
        <p style={{ fontSize: 15.5, fontWeight: 600, color: "#0d1525", lineHeight: 1.5, letterSpacing: "-0.1px" }}>{q}</p>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: open ? "rgba(37,99,235,0.08)" : "#f1f5f9", border: open ? "1px solid rgba(37,99,235,0.2)" : "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .25s", transform: open ? "rotate(180deg)" : "none" }}>
          <ChevronDown size={14} color={open ? "#2563eb" : "#64748b"} />
        </div>
      </div>
      {open && <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.8, padding: "0 28px 24px", letterSpacing: "-0.05px" }}>{a}</p>}
    </div>
  );
}

function StatCard({ value, label, suffix }: { value: number; label: string; suffix: string }) {
  const { ref, inView } = useInView();
  const count = useCounter(value, 1800, inView);
  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <p style={{ fontSize: "clamp(2rem,3.2vw,2.8rem)", fontWeight: 800, lineHeight: 1, color: "#0d1525", letterSpacing: "-2px", fontVariantNumeric: "tabular-nums" }}>
        {count.toLocaleString()}{suffix}
      </p>
      <p style={{ fontSize: 12, color: "#64748b", marginTop: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>{label}</p>
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const featuresInView     = useInView();
  const stepsInView        = useInView();
  const testimonialsInView = useInView();
  const statsInView        = useInView();
  const chatInView         = useInView();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveStep(p => (p + 1) % 3), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        /* ── Tokens ── */
        :root {
          --f-sans: 'Inter', var(--font-body, system-ui), -apple-system, sans-serif;
          --f-display: 'Inter', var(--font-display, system-ui), sans-serif;
          --blue: #2563eb;
          --violet: #7c3aed;
          --navy: #0d1525;
          --ink: #1e293b;
          --muted: #64748b;
          --border: #e8edf3;
          --surface: #f8fafc;
        }

        /* ── Keyframes ── */
        @keyframes lp-up    { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes lp-orb1  { 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(44px,-32px) scale(1.08); } }
        @keyframes lp-orb2  { 0%,100% { transform:translate(0,0); } 50% { transform:translate(-38px,44px); } }
        @keyframes lp-float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }
        @keyframes lp-floatB{ 0%,100% { transform:translateY(0); } 50% { transform:translateY(8px); } }
        @keyframes lp-pulse { 0%,100% { opacity:.5; transform:scale(1); } 50% { opacity:1; transform:scale(1.15); } }
        @keyframes lp-tick  { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
        @keyframes lp-grad  { 0%,100% { background-position:0% 50%; } 50% { background-position:100% 50%; } }
        @keyframes lp-shine { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
        @keyframes lp-scan  { 0% { top:-4px; } 100% { top:100%; } }
        @keyframes lp-logoPop { 0%,100% { box-shadow:0 4px 14px rgba(37,99,235,0.4); } 50% { box-shadow:0 6px 24px rgba(124,58,237,0.65); } }

        /* ── Reveal ── */
        .lp-a0 { animation:lp-up .7s cubic-bezier(.16,1,.3,1) both; }
        .lp-a1 { animation:lp-up .7s cubic-bezier(.16,1,.3,1) .08s both; }
        .lp-a2 { animation:lp-up .7s cubic-bezier(.16,1,.3,1) .18s both; }
        .lp-a3 { animation:lp-up .7s cubic-bezier(.16,1,.3,1) .28s both; }
        .lp-a4 { animation:lp-up .7s cubic-bezier(.16,1,.3,1) .42s both; }
        .lp-rev { opacity:0; transform:translateY(20px); transition:opacity .6s cubic-bezier(.16,1,.3,1),transform .6s cubic-bezier(.16,1,.3,1); }
        .lp-rev.on { opacity:1; transform:none; }

        /* ── Gradient text ── */
        .lp-g {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #a855f7 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: lp-grad 5s ease infinite;
        }

        /* ── Logo icon ── */

        /* ── Typography System ── */
        /* Hero H1 */
        .lp-hero-h1 {
          font-family: var(--f-display);
          font-size: clamp(2.4rem, 4.8vw, 4rem);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -2px;
          color: #ffffff;
          text-align: center;
          margin-bottom: 24px;
        }
        /* Section H2 */
        .lp-h2 {
          font-family: var(--f-display);
          font-size: clamp(1.7rem, 2.6vw, 2.2rem);
          font-weight: 800;
          color: var(--navy);
          line-height: 1.14;
          letter-spacing: -0.8px;
          margin-bottom: 16px;
        }
        /* Section subtitle */
        .lp-sub {
          font-family: var(--f-sans);
          font-size: 16px;
          color: var(--muted);
          line-height: 1.7;
          max-width: 540px;
          font-weight: 400;
          letter-spacing: -0.1px;
        }
        /* Eyebrow tag */
        .lp-tag {
          font-family: var(--f-sans);
          font-size: 11px; font-weight: 700;
          letter-spacing: 1.8px; text-transform: uppercase;
          color: var(--blue);
          display: inline-block; margin-bottom: 16px;
          padding: 5px 14px;
          background: rgba(37,99,235,0.07);
          border-radius: 99px;
          border: 1px solid rgba(37,99,235,0.15);
        }

        /* ── Nav ── */
        .lp-nav-a {
          font-family: var(--f-sans);
          font-size: 14px; font-weight: 500;
          text-decoration: none; transition: color .18s;
          letter-spacing: -0.1px;
        }
        .lp-pill {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 6px 16px; border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.07);
          font-family: var(--f-sans);
          font-size: 12px; font-weight: 500;
          color: rgba(255,255,255,0.85);
          backdrop-filter: blur(12px);
          letter-spacing: -0.1px;
        }

        /* ── Buttons ── */
        .lp-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 26px; border-radius: 10px; border: none;
          background: linear-gradient(135deg,#2563eb,#6d28d9);
          background-size: 200%;
          color: #fff;
          font-family: var(--f-sans);
          font-weight: 600; font-size: 14.5px;
          letter-spacing: -0.2px;
          cursor: pointer; text-decoration: none;
          box-shadow: 0 4px 20px rgba(37,99,235,0.35);
          transition: transform .18s, box-shadow .18s;
          animation: lp-grad 5s ease infinite;
          white-space: nowrap; position: relative; overflow: hidden;
        }
        .lp-btn::before { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent); background-size:200% 100%; animation:lp-shine 2.5s infinite; }
        .lp-btn:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(37,99,235,0.48); }

        .lp-ghost-dark {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 24px; border-radius: 10px;
          border: 1.5px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.88);
          font-family: var(--f-sans);
          font-weight: 500; font-size: 14.5px;
          letter-spacing: -0.2px;
          cursor: pointer; text-decoration: none;
          transition: all .18s; white-space: nowrap;
          backdrop-filter: blur(10px);
        }
        .lp-ghost-dark:hover { background:rgba(255,255,255,0.1); border-color:rgba(255,255,255,0.3); transform:translateY(-1px); }

        .lp-ghost-light {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 24px; border-radius: 10px;
          border: 1.5px solid var(--border); background: #fff;
          color: var(--ink);
          font-family: var(--f-sans);
          font-weight: 500; font-size: 14.5px;
          cursor: pointer; text-decoration: none;
          transition: all .18s; white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .lp-ghost-light:hover { background:#f8fafc; border-color:#cbd5e1; transform:translateY(-1px); }

        /* ── Layout ── */
        .lp-wrap    { max-width:1200px; margin:0 auto; padding:0 28px; }
        .lp-section { padding:96px 28px; max-width:1200px; margin:0 auto; }
        .lp-div     { height:1px; background:var(--border); }

        /* ── Feature cards ── */
        .lp-feat {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 18px; padding: 28px 24px;
          position: relative; overflow: hidden;
          transition: transform .22s cubic-bezier(.16,1,.3,1), box-shadow .22s, border-color .22s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .lp-feat::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:var(--ac,linear-gradient(90deg,transparent,#2563eb,transparent)); opacity:0; transition:opacity .22s; }
        .lp-feat:hover { transform:translateY(-4px); box-shadow:0 16px 40px rgba(0,0,0,0.09); border-color:rgba(37,99,235,0.2); }
        .lp-feat:hover::before { opacity:1; }

        /* ── Step cards ── */
        .lp-step {
          background: #fff; border: 1px solid var(--border);
          border-radius: 16px; padding: 32px 22px; text-align: center;
          transition: all .22s; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .lp-step:hover { background:#f0f5ff; border-color:rgba(37,99,235,0.25); transform:translateY(-4px); box-shadow:0 14px 36px rgba(37,99,235,0.09); }

        /* ── Testimonial cards ── */
        .lp-testi {
          background: #fff; border: 1px solid var(--border);
          border-radius: 18px; padding: 30px 26px;
          transition: transform .22s, box-shadow .22s, border-color .22s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .lp-testi:hover { transform:translateY(-3px); box-shadow:0 16px 40px rgba(0,0,0,0.07); border-color:#cbd5e1; }
        .lp-testi.hi { border-color:rgba(37,99,235,0.25); box-shadow:0 2px 12px rgba(37,99,235,0.06); }

        /* ── Mockup ── */
        .lp-mock { background:#fff; border-radius:16px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 28px 72px rgba(15,23,42,0.16),0 0 0 1px rgba(15,23,42,0.04); position:relative; }

        /* ── Grids ── */
        .lp-g3 { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
        .lp-g4 { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }

        /* ── Float ── */
        .lp-fa { animation:lp-float 5s ease-in-out infinite; }
        .lp-fb { animation:lp-floatB 6s ease-in-out infinite; }

        /* ── Ticker ── */
        .lp-ticker { display:flex; gap:48px; white-space:nowrap; animation:lp-tick 30s linear infinite; }
        .lp-ticker:hover { animation-play-state:paused; }

        /* ── CTA dark box ── */
        .lp-cta {
          border-radius: 24px; overflow:hidden; position:relative;
          background: linear-gradient(140deg,#06101f 0%,#0c1a38 50%,#120830 100%);
          padding: 88px 48px; text-align:center;
        }

        /* ── Chat card ── */
        .lp-chat-card { background:#fff; border-radius:18px; border:1px solid var(--border); box-shadow:0 10px 36px rgba(15,23,42,0.09); overflow:hidden; }
        .lp-chip { display:inline-flex; align-items:center; padding:6px 14px; border-radius:99px; border:1px solid var(--border); background:#fff; font-family:var(--f-sans); font-size:13px; font-weight:500; color:var(--ink); cursor:pointer; transition:all .15s; white-space:nowrap; }
        .lp-chip:hover { border-color:#bfdbfe; color:#2563eb; background:#eff6ff; }

        /* ── Check item ── */
        .lp-check { display:flex; align-items:flex-start; gap:10px; margin-bottom:13px; }
        .lp-check-ico { width:20px; height:20px; border-radius:50%; background:rgba(37,99,235,0.1); border:1.5px solid rgba(37,99,235,0.22); display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px; }

        /* ── Social btn ── */
        .lp-social { width:36px; height:36px; border-radius:9px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; color:#94a3b8; transition:all .18s; text-decoration:none; }
        .lp-social:hover { background:rgba(255,255,255,0.12); border-color:rgba(255,255,255,0.22); color:#e2e8f0; }

        /* ── Responsive ── */
        @media (max-width:768px) {
          .lp-section { padding:72px 20px; }
          .lp-g3      { grid-template-columns:1fr !important; }
          .lp-g4      { grid-template-columns:1fr 1fr !important; }
          .lp-hide-m  { display:none !important; }
          .lp-hero-btns { flex-direction:column; align-items:stretch; }
          .lp-spot    { grid-template-columns:1fr !important; }
          .lp-fgrid   { grid-template-columns:1fr !important; gap:32px !important; }
          .lp-cta     { padding:56px 24px !important; }
          .lp-hero-h1 { letter-spacing:-1.2px; }
        }
        @media (max-width:480px) { .lp-g4 { grid-template-columns:1fr !important; } }
      `}</style>

      {/* ════════ NAV ════════ */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:999, transition:"background .3s,box-shadow .3s,border-color .3s", background: scrolled?"rgba(8,14,26,0.96)":"transparent", backdropFilter: scrolled?"blur(20px)":"none", borderBottom: scrolled?"1px solid rgba(255,255,255,0.08)":"none", boxShadow: scrolled?"0 1px 24px rgba(0,0,0,0.3)":"none" }}>
        <div className="lp-wrap" style={{ height:68, display:"flex", alignItems:"center", justifyContent:"space-between", gap:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <AnimatedLogo size="sm" dark={true} noText={true} />
            <div>
              <p style={{ fontSize:16, fontWeight:700, fontFamily:"var(--f-display)", letterSpacing:"-0.5px", lineHeight:1.1, color:"#ffffff" }}>Umurava AI</p>
              <p style={{ fontSize:9, color:"rgba(255,255,255,0.4)", fontWeight:600, textTransform:"uppercase", letterSpacing:"1.4px" }}>Talent Screening</p>
            </div>
          </div>
          <div className="lp-hide-m" style={{ display:"flex", alignItems:"center", gap:28 }}>
            {["Features","How It Works","Testimonials","FAQ"].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g,"-")}`} className="lp-nav-a" style={{ color:"rgba(255,255,255,0.72)" }}>{item}</a>
            ))}
          </div>
          <div className="lp-hide-m" style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Link href="/login" style={{ fontFamily:"var(--f-sans)", fontSize:14, fontWeight:500, color:"rgba(255,255,255,0.72)", textDecoration:"none", padding:"8px 14px", borderRadius:8, transition:"color .18s" }}>Log in</Link>
            <Link href="/register" className="lp-btn" style={{ padding:"9px 20px", fontSize:13.5 }}>Get started</Link>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="lp-hide-desktop" style={{ width:36, height:36, borderRadius:8, cursor:"pointer", border:"1px solid rgba(255,255,255,0.18)", background:"rgba(255,255,255,0.07)", color:"#ffffff", display:"none", alignItems:"center", justifyContent:"center" }}>
            {menuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
        {menuOpen && (
          <div style={{ background:"#080e1a", borderTop:"1px solid rgba(255,255,255,0.07)", padding:"20px 24px 28px", display:"flex", flexDirection:"column", gap:4 }}>
            {["Features","How It Works","Testimonials","FAQ"].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g,"-")}`} className="lp-nav-a" style={{ fontSize:15, padding:"10px 0", color:"rgba(255,255,255,0.78)", borderBottom:"1px solid rgba(255,255,255,0.06)" }} onClick={() => setMenuOpen(false)}>{item}</a>
            ))}
            <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:10 }}>
              <Link href="/login"    className="lp-ghost-dark" style={{ justifyContent:"center" }}>Log in</Link>
              <Link href="/register" className="lp-btn"        style={{ justifyContent:"center" }}>Get started <ArrowRight size={15} /></Link>
            </div>
          </div>
        )}
      </nav>

      {/* ════════ HERO ════════ */}
      <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", paddingTop:120, paddingBottom:80, background:"linear-gradient(150deg, #06101f 0%, #0c1a38 55%, #080d1e 100%)" }}>
        <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
          <div style={{ position:"absolute", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle, rgba(37,99,235,0.16) 0%, transparent 65%)", top:-220, left:-220, animation:"lp-orb1 14s ease-in-out infinite" }} />
          <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle, rgba(109,40,217,0.12) 0%, transparent 65%)", bottom:-160, right:-160, animation:"lp-orb2 16s ease-in-out infinite" }} />
          <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize:"40px 40px" }} />
        </div>

        <div className="lp-wrap" style={{ width:"100%", position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:28 }} className="lp-a0">
            <div className="lp-pill"><Sparkles size={11} /> Built for African Talent Markets · Powered by Gemini AI <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80", animation:"lp-pulse 2s ease-in-out infinite", flexShrink:0 }} /></div>
          </div>

          <h1 className="lp-hero-h1 lp-a1">
            Screen Smarter.<br />
            <span className="lp-g">Hire Faster. Win More.</span>
          </h1>

          <p className="lp-a2" style={{ fontFamily:"var(--f-sans)", fontSize:"clamp(15.5px,1.5vw,17px)", color:"rgba(255,255,255,0.58)", textAlign:"center", maxWidth:560, margin:"0 auto 44px", lineHeight:1.72, letterSpacing:"-0.1px" }}>
            Umurava AI helps companies screen, rank, and shortlist top candidates — so your team spends time on people, not paperwork.
          </p>

          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }} className="lp-a3 lp-hero-btns">
            <Link href="/register" className="lp-btn" style={{ fontSize:15, padding:"14px 30px" }}>Start recruiting smarter <ArrowRight size={15} /></Link>
            <a href="#how-it-works" className="lp-ghost-dark" style={{ fontSize:15, padding:"13px 24px" }}><Play size={14} /> Watch a demo</a>
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:24, marginTop:32, flexWrap:"wrap" }} className="lp-a3">
            {["Free for 14 days","No credit card","Cancel anytime"].map((t,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <CheckCircle2 size={13} color="#4ade80" />
                <span style={{ fontFamily:"var(--f-sans)", fontSize:13, color:"rgba(255,255,255,0.48)", fontWeight:500 }}>{t}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop:72, maxWidth:880, margin:"72px auto 0", position:"relative" }} className="lp-a4">
            <div style={{ position:"absolute", inset:-50, background:"radial-gradient(ellipse at center, rgba(37,99,235,0.15) 0%, transparent 65%)", filter:"blur(20px)", pointerEvents:"none" }} />
            <div className="lp-mock">
              <div style={{ padding:"11px 16px", borderBottom:"1px solid #f1f5f9", display:"flex", alignItems:"center", gap:9, background:"#f8fafc" }}>
                <div style={{ display:"flex", gap:5 }}>{["#ef4444","#f59e0b","#22c55e"].map(c => <div key={c} style={{ width:10, height:10, borderRadius:"50%", background:c, opacity:.75 }} />)}</div>
                <div style={{ flex:1, background:"#fff", borderRadius:6, padding:"4px 12px", fontSize:11.5, color:"#94a3b8", border:"1px solid #e8edf3", fontFamily:"var(--f-sans)" }}>app.umurava.ai/screenings</div>
              </div>
              <div style={{ padding:"10px 20px", borderBottom:"1px solid #f1f5f9", display:"flex", alignItems:"center", justifyContent:"space-between", background:"#fff" }}>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <span style={{ width:7, height:7, borderRadius:"50%", background:"#22c55e", display:"inline-block", animation:"lp-pulse 2s ease-in-out infinite" }} />
                  <span style={{ fontFamily:"var(--f-sans)", fontSize:12, fontWeight:600, color:"#475569" }}>Live Screening</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 10px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:99 }}>
                  <Brain size={10} color="#16a34a" />
                  <span style={{ fontFamily:"var(--f-sans)", fontSize:10.5, fontWeight:600, color:"#16a34a" }}>Umurava AI · Live</span>
                </div>
              </div>
              <div style={{ display:"flex", borderBottom:"1px solid #f1f5f9", padding:"12px 20px", background:"#fafbfc", alignItems:"center" }}>
                {["Post Job","Upload Candidates","AI Results"].map((label,i) => (
                  <div key={i} style={{ flex:1, display:"flex", alignItems:"center", gap:7 }}>
                    <div style={{ width:26, height:26, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, background: i<activeStep?"#dcfce7":i===activeStep?"linear-gradient(135deg,#2563eb,#7c3aed)":"#f1f5f9", color: i<activeStep?"#16a34a":i===activeStep?"white":"#94a3b8", transition:"all .3s", border: i===activeStep?"none":i<activeStep?"1.5px solid #86efac":"1.5px solid #e2e8f0" }}>
                      {i<activeStep?"✓":i+1}
                    </div>
                    <span style={{ fontFamily:"var(--f-sans)", fontSize:11, fontWeight: i===activeStep?600:500, color: i===activeStep?"#1d4ed8":i<activeStep?"#16a34a":"#94a3b8", transition:"color .3s" }}>{label}</span>
                    {i<2 && <ChevronRight size={12} color="#e2e8f0" style={{ marginLeft:"auto", flexShrink:0 }} />}
                  </div>
                ))}
              </div>
              <div style={{ padding:"14px 20px", display:"flex", flexDirection:"column", gap:7, background:"#fff" }}>
                {mockCandidates.map((c,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:9, background: i===0?"#eff6ff":"#fafbfc", border:`1px solid ${i===0?"#bfdbfe":"#f1f5f9"}`, animation:`lp-up .35s ease ${i*.05+.1}s both` }}>
                    <div style={{ width:16, height:16, borderRadius:"50%", background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", fontSize:8.5, fontWeight:700, color:"#94a3b8", flexShrink:0, border:"1px solid #e2e8f0" }}>{i+1}</div>
                    <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#2563eb,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"white", flexShrink:0 }}>{c.name.split(" ").map(n=>n[0]).join("")}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontFamily:"var(--f-sans)", fontSize:12.5, fontWeight:600, color:"#0d1525", letterSpacing:"-0.1px" }}>{c.name}</p>
                      <p style={{ fontFamily:"var(--f-sans)", fontSize:10.5, color:"#94a3b8" }}>{c.role}</p>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:60, height:4, borderRadius:99, background:"#f1f5f9", overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${c.score}%`, borderRadius:99, background:c.color }} />
                      </div>
                      <span style={{ fontFamily:"var(--f-sans)", fontSize:12, fontWeight:700, color:c.color, minWidth:22 }}>{c.score}%</span>
                    </div>
                    <div style={{ padding:"2px 9px", borderRadius:99, background:`${c.color}15`, border:`1px solid ${c.color}28`, fontSize:10, fontWeight:600, color:c.color, whiteSpace:"nowrap", fontFamily:"var(--f-sans)" }}>{c.badge}</div>
                  </div>
                ))}
              </div>
              <div style={{ position:"absolute", left:0, right:0, height:2, background:"linear-gradient(transparent,rgba(37,99,235,0.09),transparent)", animation:"lp-scan 4s linear infinite", pointerEvents:"none" }} />
            </div>
            <div className="lp-fa" style={{ position:"absolute", top:-16, right:-18, background:"#fff", border:"1px solid #e8edf3", borderRadius:14, padding:"10px 14px", display:"flex", alignItems:"center", gap:9, boxShadow:"0 12px 32px rgba(15,23,42,0.11)" }}>
              <div style={{ position:"relative", width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#2563eb,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Brain size={16} color="white" />
                <div style={{ position:"absolute", top:-2, right:-2, width:9, height:9, borderRadius:"50%", background:"#22c55e", border:"2px solid #fff", animation:"lp-pulse 2s ease-in-out infinite" }} />
              </div>
              <div>
                <p style={{ fontFamily:"var(--f-sans)", fontSize:12.5, fontWeight:700, color:"#0d1525", letterSpacing:"-0.2px" }}>Best Match Found</p>
                <p style={{ fontFamily:"var(--f-sans)", fontSize:10.5, color:"#16a34a", fontWeight:600 }}>94% · Amara Uwimana</p>
              </div>
            </div>
            <div className="lp-fb" style={{ position:"absolute", bottom:22, left:-20, background:"#fff", border:"1px solid #e8edf3", borderRadius:14, padding:"10px 14px", boxShadow:"0 12px 32px rgba(15,23,42,0.11)" }}>
              <p style={{ fontFamily:"var(--f-sans)", fontSize:10.5, color:"#94a3b8", fontWeight:500, marginBottom:3 }}>Live Screening</p>
              <p style={{ fontFamily:"var(--f-display)", fontSize:22, fontWeight:800, color:"#0d1525", lineHeight:1, letterSpacing:"-1px" }}>247</p>
              <p style={{ fontFamily:"var(--f-sans)", fontSize:10.5, color:"#64748b", fontWeight:500 }}>candidates screened today</p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ TICKER ════════ */}
      <div style={{ borderTop:"1px solid #eef1f5", borderBottom:"1px solid #eef1f5", padding:"14px 0", overflow:"hidden", background:"#fafbfc" }}>
        <div className="lp-ticker" style={{ alignItems:"center" }}>
          {["AI Candidate Screening","Ranked Shortlists","Skills-First Scoring","PDF & CSV Import","Side-by-Side Comparison","Bias-Aware AI","Umurava Talent Pool","Recruiter AI Chat","Upskilling Paths","Gemini Powered","African Talent Market","Zero Guesswork","AI Candidate Screening","Ranked Shortlists","Skills-First Scoring","PDF & CSV Import","Side-by-Side Comparison","Bias-Aware AI","Umurava Talent Pool","Recruiter AI Chat","Upskilling Paths","Gemini Powered","African Talent Market","Zero Guesswork"].map((label,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
              <div style={{ width:4, height:4, borderRadius:"50%", background: i%3===0?"#2563eb":i%3===1?"#7c3aed":"#16a34a", flexShrink:0 }} />
              <span style={{ fontFamily:"var(--f-sans)", fontSize:13, color:"#64748b", fontWeight:500, whiteSpace:"nowrap", letterSpacing:"-0.1px" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ════════ STATS ════════ */}
      <section style={{ padding:"72px 28px", background:"#fff", borderBottom:"1px solid #eef1f5" }}>
        <div ref={statsInView.ref} style={{ maxWidth:880, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:48 }}>
          {stats.map((s,i) => (
            <div key={i} className={`lp-rev${statsInView.inView?" on":""}`} style={{ transitionDelay:`${i*.07}s` }}>
              <StatCard {...s} />
            </div>
          ))}
        </div>
      </section>

      {/* ════════ FEATURES ════════ */}
      <section id="features" style={{ padding:"96px 28px", background:"#f8fafc" }}>
        <div ref={featuresInView.ref} style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:60 }} className={`lp-rev${featuresInView.inView?" on":""}`}>
            <span className="lp-tag">Features</span>
            <h2 className="lp-h2">Everything your hiring team needs<br />to <span className="lp-g">screen smarter.</span></h2>
            <p className="lp-sub" style={{ margin:"0 auto" }}>Umurava AI handles the analysis. You make the decisions.</p>
          </div>
          <div className="lp-g3">
            {features.map((f,i) => (
              <div key={i} className={`lp-feat lp-rev${featuresInView.inView?" on":""}`} style={{ transitionDelay:`${i*.06}s`, "--ac":`linear-gradient(90deg,transparent,${f.accent}77,transparent)` } as React.CSSProperties}>
                <div style={{ position:"absolute", top:16, right:16, fontSize:9.5, fontWeight:700, color:f.accent, background:`${f.accent}10`, padding:"3px 8px", borderRadius:99, letterSpacing:".6px", textTransform:"uppercase", border:`1px solid ${f.accent}1a`, fontFamily:"var(--f-sans)" }}>{f.tag}</div>
                <div style={{ width:48, height:48, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:18, background:`${f.accent}0f`, border:`1px solid ${f.accent}1a`, flexShrink:0 }}>
                  <f.icon size={21} color={f.accent} />
                </div>
                <h3 style={{ fontFamily:"var(--f-display)", fontSize:16.5, fontWeight:700, color:"#0d1525", marginBottom:10, lineHeight:1.3, letterSpacing:"-0.3px" }}>{f.title}</h3>
                <p style={{ fontFamily:"var(--f-sans)", fontSize:14.5, color:"#475569", lineHeight:1.72, letterSpacing:"-0.05px" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="lp-div" />

      {/* ════════ AI CHAT SPOTLIGHT ════════ */}
      <section style={{ padding:"96px 28px", background:"#fff" }}>
        <div ref={chatInView.ref} style={{ maxWidth:1200, margin:"0 auto" }}>
          <div className="lp-spot" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:72, alignItems:"center" }}>
            <div className={`lp-rev${chatInView.inView?" on":""}`}>
              <span className="lp-tag">AI Chat Assistant</span>
              <h2 className="lp-h2">Ask your shortlist anything.<br />Get answers <span className="lp-g">instantly.</span></h2>
              <p style={{ fontFamily:"var(--f-sans)", fontSize:15.5, color:"#475569", lineHeight:1.75, marginBottom:26, letterSpacing:"-0.1px" }}>
                Once screening is complete, the AI assistant knows your entire candidate pool. Ask it to compare the top three, surface near-misses, or explain why someone ranked where they did.
              </p>
              {["Context-aware to your specific job and applicants","Suggestion chips for common recruiter questions","Streaming responses — no waiting for full answers"].map((p,i) => (
                <div key={i} className="lp-check">
                  <div className="lp-check-ico"><CheckCircle2 size={12} color="#2563eb" /></div>
                  <span style={{ fontFamily:"var(--f-sans)", fontSize:14.5, color:"#374151", lineHeight:1.6, letterSpacing:"-0.1px" }}>{p}</span>
                </div>
              ))}
            </div>
            <div className={`lp-rev${chatInView.inView?" on":""}`} style={{ transitionDelay:".1s" }}>
              <div className="lp-chat-card">
                <div style={{ padding:"14px 18px", borderBottom:"1px solid #f1f5f9", display:"flex", alignItems:"center", gap:7 }}>
                  <Sparkles size={14} color="#2563eb" />
                  <span style={{ fontFamily:"var(--f-sans)", fontSize:14, fontWeight:600, color:"#0d1525", letterSpacing:"-0.2px" }}>AI Assistant</span>
                </div>
                <div style={{ padding:"18px", background:"#f8fafc", minHeight:155 }}>
                  <div style={{ display:"flex", gap:9, marginBottom:14 }}>
                    <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#2563eb,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Sparkles size={13} color="white" />
                    </div>
                    <div style={{ background:"#fff", borderRadius:"0 12px 12px 12px", padding:"11px 15px", border:"1px solid #e8edf3", maxWidth:270 }}>
                      <p style={{ fontFamily:"var(--f-sans)", fontSize:13.5, color:"#374151", lineHeight:1.6 }}>Screening complete! Amara Uwimana is your top match at 94%. Shall I compare the top 3?</p>
                    </div>
                  </div>
                  <div style={{ display:"flex", justifyContent:"flex-end" }}>
                    <div style={{ background:"linear-gradient(135deg,#2563eb,#7c3aed)", borderRadius:"12px 0 12px 12px", padding:"10px 16px" }}>
                      <p style={{ fontFamily:"var(--f-sans)", fontSize:13.5, color:"white", fontWeight:500 }}>Compare top 3</p>
                    </div>
                  </div>
                </div>
                <div style={{ padding:"12px 18px", borderTop:"1px solid #f1f5f9", background:"#fff" }}>
                  <p style={{ fontFamily:"var(--f-sans)", fontSize:11, color:"#94a3b8", fontWeight:600, marginBottom:9, textTransform:"uppercase", letterSpacing:".8px" }}>Suggested</p>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                    {["Who almost qualified?","Show gaps","Summarize"].map(chip => (
                      <button key={chip} className="lp-chip">{chip}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="lp-div" />

      {/* ════════ HOW IT WORKS ════════ */}
      <section id="how-it-works" style={{ padding:"96px 28px", background:"#f8fafc" }}>
        <div ref={stepsInView.ref} style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:64 }} className={`lp-rev${stepsInView.inView?" on":""}`}>
            <span className="lp-tag">How It Works</span>
            <h2 className="lp-h2">From job post to hired — <span className="lp-g">in 4 steps</span></h2>
            <p className="lp-sub" style={{ margin:"0 auto" }}>No complex setup. No learning curve. Start screening in minutes.</p>
          </div>
          <div className="lp-g4" style={{ position:"relative" }}>
            <div className="lp-hide-m" style={{ position:"absolute", top:34, left:"12.5%", right:"12.5%", height:1, background:"linear-gradient(90deg,transparent,rgba(37,99,235,0.25),rgba(109,40,217,0.25),transparent)", zIndex:0 }} />
            {steps.map((step,i) => (
              <div key={i} className={`lp-step lp-rev${stepsInView.inView?" on":""}`} style={{ transitionDelay:`${i*.08}s`, position:"relative", zIndex:1 }}>
                <div style={{ width:68, height:68, borderRadius:18, background:"linear-gradient(135deg,rgba(37,99,235,0.09),rgba(109,40,217,0.07))", border:"1px solid rgba(37,99,235,0.18)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 18px", position:"relative" }}>
                  <step.icon size={26} color="#2563eb" />
                  <div style={{ position:"absolute", top:-9, right:-9, width:24, height:24, borderRadius:"50%", background:"linear-gradient(135deg,#2563eb,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10.5, fontWeight:700, color:"white" }}>{i+1}</div>
                </div>
                <p style={{ fontFamily:"var(--f-sans)", fontSize:11, fontWeight:700, color:"#2563eb", textTransform:"uppercase", letterSpacing:"1.8px", marginBottom:9 }}>{step.n}</p>
                <h3 style={{ fontFamily:"var(--f-display)", fontSize:17, fontWeight:700, color:"#0d1525", marginBottom:11, letterSpacing:"-0.3px", lineHeight:1.3 }}>{step.title}</h3>
                <p style={{ fontFamily:"var(--f-sans)", fontSize:14, color:"#475569", lineHeight:1.72, letterSpacing:"-0.05px" }}>{step.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop:56, textAlign:"center" }}>
            <Link href="/register" className="lp-btn" style={{ fontSize:15 }}>Try It Free — No Setup Required <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>

      <div className="lp-div" />

      {/* ════════ TESTIMONIALS ════════ */}
      <section id="testimonials" style={{ padding:"96px 28px", background:"#fff" }}>
        <div ref={testimonialsInView.ref} style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:60 }} className={`lp-rev${testimonialsInView.inView?" on":""}`}>
            <span className="lp-tag">Testimonials</span>
            <h2 className="lp-h2">Recruiters who&apos;ve made the switch.</h2>
            <p className="lp-sub" style={{ margin:"0 auto" }}>Real teams. Real results. Real hiring decisions.</p>
          </div>
          <div className="lp-g3">
            {testimonials.map((t,i) => (
              <div key={i} className={`lp-testi${i===0?" hi":""} lp-rev${testimonialsInView.inView?" on":""}`} style={{ transitionDelay:`${i*.08}s` }}>
                <div style={{ display:"flex", gap:2, marginBottom:16 }}>
                  {[...Array(t.stars)].map((_,s) => <Star key={s} size={14} color="#f59e0b" fill="#f59e0b" />)}
                </div>
                <div style={{ fontSize:48, lineHeight:1, color:"rgba(37,99,235,0.12)", fontFamily:"Georgia,serif", marginBottom:-6, marginLeft:-2 }}>&ldquo;</div>
                <p style={{ fontFamily:"var(--f-sans)", fontSize:15, color:"#374151", lineHeight:1.8, marginBottom:24, fontStyle:"italic", letterSpacing:"-0.1px" }}>{t.quote}</p>
                <div style={{ display:"flex", alignItems:"center", gap:12, paddingTop:18, borderTop:"1px solid #f1f5f9" }}>
                  <img src={t.photo} alt={t.name} style={{ width:44, height:44, borderRadius:"50%", objectFit:"cover", flexShrink:0, border:"2px solid #e8edf3" }} />
                  <div>
                    <p style={{ fontFamily:"var(--f-sans)", fontSize:14, fontWeight:700, color:"#0d1525", letterSpacing:"-0.2px" }}>{t.name}</p>
                    <p style={{ fontFamily:"var(--f-sans)", fontSize:12.5, color:"#64748b", letterSpacing:"-0.1px" }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="lp-div" />

      {/* ════════ FAQ ════════ */}
      <section id="faq" style={{ padding:"96px 28px", background:"#f8fafc" }}>
        <div style={{ maxWidth:720, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:52 }}>
            <span className="lp-tag">FAQ</span>
            <h2 className="lp-h2">Common questions</h2>
          </div>
          {faqs.map((f,i) => <FAQItem key={i} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* ════════ CTA ════════ */}
      <section style={{ padding:"80px 28px" }}>
        <div style={{ maxWidth:880, margin:"0 auto" }}>
          <div className="lp-cta">
            <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
              <div style={{ position:"absolute", width:560, height:560, borderRadius:"50%", background:"radial-gradient(circle, rgba(37,99,235,0.16) 0%, transparent 65%)", top:"50%", left:"50%", transform:"translate(-50%,-50%)" }} />
              <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize:"40px 40px" }} />
            </div>
            <div style={{ position:"relative", zIndex:1 }}>
              <div style={{ width:56, height:56, borderRadius:16, background:"linear-gradient(135deg,#2563eb,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 22px", boxShadow:"0 8px 28px rgba(37,99,235,0.45)" }}>
                <Brain size={26} color="white" />
              </div>
              <h2 style={{ fontFamily:"var(--f-display)", fontSize:"clamp(1.9rem,3.2vw,2.8rem)", fontWeight:800, color:"#ffffff", lineHeight:1.1, letterSpacing:"-1.5px", marginBottom:16 }}>
                Ready to hire smarter?
              </h2>
              <p style={{ fontFamily:"var(--f-sans)", fontSize:16.5, color:"rgba(255,255,255,0.52)", lineHeight:1.72, maxWidth:440, margin:"0 auto 36px", letterSpacing:"-0.1px" }}>
                Join growing companies across Africa using Umurava AI to find and hire top talent faster. Free to start. No credit card required.
              </p>
              <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
                <Link href="/register" className="lp-btn"        style={{ fontSize:15, padding:"14px 30px" }}>Start for free <ArrowRight size={15} /></Link>
                <Link href="/login"    className="lp-ghost-dark" style={{ fontSize:15 }}>Sign In to Dashboard</Link>
              </div>
              <p style={{ fontFamily:"var(--f-sans)", fontSize:12.5, color:"rgba(255,255,255,0.28)", marginTop:18, letterSpacing:"-0.1px" }}>No credit card · Free to start · Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer style={{ background:"#06101f", borderTop:"1px solid rgba(255,255,255,0.06)", padding:"60px 28px 32px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div className="lp-fgrid" style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:48, marginBottom:48 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:16 }}>
                <div style={{ width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#2563eb,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Brain size={16} color="white" />
                </div>
                <p style={{ fontFamily:"var(--f-display)", fontSize:15, fontWeight:700, color:"#f1f5f9", letterSpacing:"-0.3px" }}>Umurava AI</p>
              </div>
              <p style={{ fontFamily:"var(--f-sans)", fontSize:13.5, color:"#475569", lineHeight:1.7, maxWidth:260, marginBottom:20, letterSpacing:"-0.05px" }}>
                Built for Rwanda. Powered by AI. Screen hundreds of candidates in seconds, not days.
              </p>
              <div style={{ display:"flex", gap:9, marginBottom:24 }}>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="lp-social" aria-label="GitHub">
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="lp-social" aria-label="LinkedIn"><Link2 size={15} /></a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="lp-social" aria-label="Twitter/X"><Share2 size={15} /></a>
              </div>
              <p style={{ fontFamily:"var(--f-sans)", fontSize:11, fontWeight:700, color:"#334155", marginBottom:9, textTransform:"uppercase", letterSpacing:"1px" }}>Get Rwanda talent insights</p>
              <div style={{ display:"flex", gap:7 }}>
                <input type="email" placeholder="Enter your email" style={{ flex:1, padding:"8px 13px", borderRadius:8, border:"1px solid rgba(255,255,255,0.09)", background:"rgba(255,255,255,0.04)", color:"#e2e8f0", fontSize:13, outline:"none", fontFamily:"var(--f-sans)" }} />
                <button style={{ padding:"8px 14px", borderRadius:8, background:"linear-gradient(135deg,#2563eb,#7c3aed)", color:"white", border:"none", fontSize:12.5, fontWeight:600, cursor:"pointer", fontFamily:"var(--f-sans)", whiteSpace:"nowrap" }}>Subscribe</button>
              </div>
            </div>
            {[
              { title:"Product",  links:["Features","How It Works","Pricing","Changelog"] },
              { title:"Company",  links:["About","Blog","Careers","Press"] },
              { title:"Legal",    links:["Privacy Policy","Terms of Service","Cookie Policy","GDPR"] },
            ].map(col => (
              <div key={col.title}>
                <p style={{ fontFamily:"var(--f-sans)", fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"1.2px", marginBottom:18 }}>{col.title}</p>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {col.links.map(link => (
                    <a key={link} href="#" style={{ fontFamily:"var(--f-sans)", fontSize:13.5, color:"#475569", textDecoration:"none", transition:"color .15s", letterSpacing:"-0.1px" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#94a3b8")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
                    >{link}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:22, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
            <p style={{ fontFamily:"var(--f-sans)", fontSize:12.5, color:"#334155", letterSpacing:"-0.05px" }} suppressHydrationWarning>© {new Date().getFullYear()} Umurava AI · All rights reserved · Built in Kigali 🇷🇼</p>
            <p style={{ fontFamily:"var(--f-sans)", fontSize:12.5, color:"#334155", fontStyle:"italic" }}>Built by <span style={{ color:"#475569", fontWeight:600 }}>Debug Thugs</span> · Powered by Gemini AI</p>
          </div>
        </div>
      </footer>
    </>
  );
}