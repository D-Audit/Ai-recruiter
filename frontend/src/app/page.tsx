"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Brain, Zap, Users, BarChart3, FileText, CheckCircle2,
  ArrowRight, Star, Shield, Upload, ChevronDown, Play,
  Sparkles, ChevronRight, ChevronLeft, Menu, X, MessageSquare,
  Share2, Link2, Code2, TrendingUp, Award,
} from "lucide-react";

/* ── HOOKS ────────────────────────────────────────────────── */
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

/* ── DATA ─────────────────────────────────────────────────── */
const features = [
  { icon: Brain,         title: "Gemini AI Screening",       desc: "Every resume scored on a transparent 100-point rubric — skills, experience, education, and extras. Rigorous, fast, and explainable.", accent: "#2563eb", tag: "Core"    },
  { icon: Upload,        title: "Any Format, Any Source",    desc: "CSV, Excel, drag-and-drop PDFs, URL import, or the Umurava talent pool. Bulk or single — fully automated with zero manual entry.", accent: "#7c3aed", tag: "Import"  },
  { icon: BarChart3,     title: "Instant Ranked Shortlists", desc: "AI scores, strengths, skill gaps, upskilling paths, and adjacent role recommendations — generated per candidate in seconds.", accent: "#059669", tag: "Results" },
  { icon: Users,         title: "Finalist Comparison",       desc: "Head-to-head AI comparison of up to 3 finalists — clear winner with evidence-based reasoning and per-category breakdowns.", accent: "#d97706", tag: "Compare" },
  { icon: MessageSquare, title: "Recruiter AI Chat",         desc: "Ask plain-language questions about your results. Surface near-misses, dig into gaps, or request alternative rankings anytime.", accent: "#dc2626", tag: "Chat"    },
  { icon: Shield,        title: "Bias-Aware Scoring",        desc: "Built-in bias transparency on every run. Skills-first, experience-verified, never penalises missing optional fields.", accent: "#0891b2", tag: "Ethics"  },
];

const steps = [
  { n: "01", title: "Post a Job",       desc: "Define required skills, experience, education, and location. Takes under 2 minutes.", icon: FileText     },
  { n: "02", title: "Add Candidates",   desc: "Upload PDFs in bulk, import a CSV, paste a URL, or draw from the Umurava talent pool.", icon: Upload      },
  { n: "03", title: "Run AI Screening", desc: "One click. Gemini AI scores every candidate and returns a ranked shortlist in seconds.", icon: Brain       },
  { n: "04", title: "Hire Confidently", desc: "Review the shortlist, compare finalists, chat the AI assistant, decide with real data.", icon: CheckCircle2 },
];

const testimonials = [
  { quote: "We cut our screening time from five days to under thirty minutes. The AI reasoning is detailed enough that I can defend every shortlist decision directly to our board.", name: "Claudine Uwimana", role: "Head of Talent · Inyarwanda Ltd · Kigali", photo: "https://images.unsplash.com/photo-1573497019236-17f8177b81e8?w=80&h=80&fit=crop&crop=face", stars: 5 },
  { quote: "The bias detection feature changed how our entire team approaches recruiting. We were unknowingly filtering out strong candidates from rural provinces — Umurava AI surfaced them.", name: "Patrick Nshimiyimana", role: "Recruitment Lead · Kigali Tech Hub", photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face", stars: 5 },
  { quote: "Our time-to-hire dropped from six weeks to just twelve days. For a company scaling as fast as we are, that speed advantage is enormous.", name: "Diane Mukasine", role: "People & Culture · MTN Rwanda · Kigali", photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&crop=face", stars: 5 },
];

const stats = [
  { value: 12000, label: "Candidates Screened", suffix: "+" },
  { value: 98,    label: "Recruiter Satisfaction", suffix: "%" },
  { value: 600,   label: "Jobs Posted", suffix: "+" },
  { value: 90,    label: "Time Saved Per Hire", suffix: "%" },
];

const faqs = [
  { q: "What file formats does Umurava AI accept?", a: "CSV, XLS, XLSX spreadsheets and PDF, DOC, DOCX, TXT resume files. You can also import via a direct URL or select candidates from the built-in Umurava talent pool." },
  { q: "How does the 100-point scoring rubric work?", a: "Skills Match accounts for 40 points, Work Experience for 25, Education for 20, and Extras (certifications, languages, location) for 15. Scores are spread to ensure a meaningful ranking with no ties." },
  { q: "Is the AI evaluation fair and unbiased?", a: "Every screening run includes a bias transparency notice. Scoring is strictly skills-first and never penalises candidates for missing optional fields like portfolio links or bios." },
  { q: "Can Umurava AI screen non-technical roles?", a: "Yes. You define the required skills and the AI maps every candidate to them — accountants, designers, operations managers, logistics coordinators, any role." },
  { q: "How is this different from a traditional ATS?", a: "An ATS does keyword matching. Umurava AI uses Gemini's semantic reasoning — it understands that 3 years of Django is relevant to a Python backend role even when those exact words don't appear." },
];

const mockCandidates = [
  { name: "Amara Uwimana",     initials: "AU", role: "Senior Full Stack Engineer",  score: 94, color: "#059669" },
  { name: "Jean Nshimiyimana", initials: "JN", role: "Senior Backend Engineer",     score: 87, color: "#059669" },
  { name: "Bob Mutabazi",      initials: "BM", role: "Backend Engineer — Python",   score: 74, color: "#d97706" },
  { name: "Eva Mukamana",      initials: "EM", role: "Mobile Developer — Flutter",  score: 58, color: "#d97706" },
];

/* ── FAQ ITEM ─────────────────────────────────────────────── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(!open)} style={{ background:"#fff", border:`1.5px solid ${open?"rgba(37,99,235,0.3)":"#e2e8f0"}`, borderRadius:14, marginBottom:10, cursor:"pointer", transition:"border-color .2s,box-shadow .2s", boxShadow: open?"0 4px 20px rgba(37,99,235,0.08)":"0 1px 4px rgba(0,0,0,0.04)", overflow:"hidden" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 26px", gap:16 }}>
        <p style={{ fontSize:15.5, fontWeight:600, color:"#0f172a", lineHeight:1.5 }}>{q}</p>
        <div style={{ width:32, height:32, borderRadius:"50%", background: open?"rgba(37,99,235,0.08)":"#f1f5f9", border: open?"1px solid rgba(37,99,235,0.2)":"1px solid #e2e8f0", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .25s", transform: open?"rotate(180deg)":"none" }}>
          <ChevronDown size={15} color={open?"#2563eb":"#64748b"} />
        </div>
      </div>
      {open && <p style={{ fontSize:15, color:"#475569", lineHeight:1.8, padding:"0 26px 22px" }}>{a}</p>}
    </div>
  );
}

/* ── STAT CARD ────────────────────────────────────────────── */
function StatCard({ value, label, suffix }: { value: number; label: string; suffix: string }) {
  const { ref, inView } = useInView();
  const count = useCounter(value, 1800, inView);
  return (
    <div ref={ref} style={{ textAlign:"center" }}>
      <p style={{ fontSize:"clamp(2.6rem,4.5vw,3.6rem)", fontWeight:900, lineHeight:1, color:"#0f172a", fontFamily:"var(--font-display,sans-serif)", letterSpacing:"-2px" }}>
        {count.toLocaleString()}{suffix}
      </p>
      <p style={{ fontSize:12.5, color:"#64748b", marginTop:10, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px" }}>{label}</p>
    </div>
  );
}

/* ── PAGE ─────────────────────────────────────────────────── */
export default function LandingPage() {
  const [menuOpen, setMenuOpen]     = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [testiIdx, setTestiIdx]     = useState(0);
  const [scanPct, setScanPct]       = useState(0);
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

  // Auto-advance testimonial carousel
  useEffect(() => {
    const t = setInterval(() => setTestiIdx(p => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Animated scan percentage
  useEffect(() => {
    let pct = 0;
    const t = setInterval(() => {
      pct = pct >= 100 ? 0 : pct + 1;
      setScanPct(pct);
    }, 60);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <style>{`
        /* NO @import — fonts loaded in layout.tsx */
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        /* ── KEYFRAMES ── */
        @keyframes lp-up     { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lp-orb1   { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(44px,-32px) scale(1.08)} }
        @keyframes lp-orb2   { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-38px,44px)} }
        @keyframes lp-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes lp-floatB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }
        @keyframes lp-floatC { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
        @keyframes lp-pulse  { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.2)} }
        @keyframes lp-tick   { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes lp-grad   { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes lp-shine  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes lp-scan   { 0%{top:-4px} 100%{top:100%} }
        @keyframes lp-blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes lp-bar    { from{width:0} to{width:var(--w,70%)} }
        @keyframes lp-pop    { 0%{opacity:0;transform:scale(.92) translateY(8px)} 100%{opacity:1;transform:scale(1) translateY(0)} }

        /* ── ENTRANCE ── */
        .lp-a0 { animation:lp-up .85s cubic-bezier(.16,1,.3,1) both; }
        .lp-a1 { animation:lp-up .85s cubic-bezier(.16,1,.3,1) .1s both; }
        .lp-a2 { animation:lp-up .85s cubic-bezier(.16,1,.3,1) .22s both; }
        .lp-a3 { animation:lp-up .85s cubic-bezier(.16,1,.3,1) .34s both; }
        .lp-a4 { animation:lp-up .85s cubic-bezier(.16,1,.3,1) .5s both; }
        .lp-rev { opacity:0;transform:translateY(24px);transition:opacity .65s cubic-bezier(.16,1,.3,1),transform .65s cubic-bezier(.16,1,.3,1); }
        .lp-rev.on { opacity:1;transform:none; }

        /* ── GRADIENT TEXT ── */
        .lp-g { background:linear-gradient(130deg,#2563eb 0%,#7c3aed 55%,#a855f7 100%);background-size:220% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:lp-grad 6s ease infinite; }

        /* ── NAV ── */
        .lp-nav-pill { background:rgba(11,22,40,0.75);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:999px;padding:6px 6px 6px 20px;display:flex;align-items:center;gap:8px;box-shadow:0 8px 32px rgba(0,0,0,0.3); }
        .lp-nav-a { font-size:14px;font-weight:600;text-decoration:none;color:rgba(255,255,255,0.72);transition:color .18s;padding:8px 14px;border-radius:99px; }
        .lp-nav-a:hover { color:#fff;background:rgba(255,255,255,0.07); }

        /* ── BUTTONS ── */
        .lp-btn { display:inline-flex;align-items:center;gap:9px;padding:14px 28px;border-radius:12px;border:none;background:linear-gradient(135deg,#2563eb,#7c3aed);background-size:200%;color:#fff;font-weight:700;font-size:15px;font-family:var(--font-body,sans-serif);cursor:pointer;text-decoration:none;box-shadow:0 4px 22px rgba(37,99,235,0.38);transition:transform .2s,box-shadow .2s;animation:lp-grad 5s ease infinite;white-space:nowrap;position:relative;overflow:hidden; }
        .lp-btn::before { content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.13),transparent);background-size:200% 100%;animation:lp-shine 2.8s infinite; }
        .lp-btn:hover { transform:translateY(-2px);box-shadow:0 8px 32px rgba(37,99,235,0.52); }
        .lp-btn-sm { padding:9px 20px;font-size:13.5px; }

        .lp-ghost-dark { display:inline-flex;align-items:center;gap:9px;padding:13px 26px;border-radius:12px;border:1.5px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.88);font-weight:600;font-size:15px;font-family:var(--font-body,sans-serif);cursor:pointer;text-decoration:none;transition:all .2s;white-space:nowrap;backdrop-filter:blur(10px); }
        .lp-ghost-dark:hover { background:rgba(255,255,255,0.11);border-color:rgba(255,255,255,0.32);transform:translateY(-2px); }

        .lp-ghost-light { display:inline-flex;align-items:center;gap:9px;padding:13px 26px;border-radius:12px;border:1.5px solid #e2e8f0;background:#fff;color:#374151;font-weight:600;font-size:15px;font-family:var(--font-body,sans-serif);cursor:pointer;text-decoration:none;transition:all .2s;white-space:nowrap;box-shadow:0 1px 5px rgba(0,0,0,0.06); }
        .lp-ghost-light:hover { background:#f8fafc;border-color:#cbd5e1;transform:translateY(-2px); }

        /* ── PILL BADGE ── */
        .lp-pill { display:inline-flex;align-items:center;gap:8px;padding:7px 18px;border-radius:100px;border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.07);font-size:12.5px;font-weight:600;color:rgba(255,255,255,0.88);backdrop-filter:blur(10px); }

        /* ── LAYOUT ── */
        .lp-wrap    { max-width:1200px;margin:0 auto;padding:0 24px; }
        .lp-section { padding:100px 24px;max-width:1200px;margin:0 auto; }
        .lp-tag     { font-size:11px;font-weight:700;letter-spacing:2.6px;text-transform:uppercase;color:#2563eb;display:inline-block;margin-bottom:18px;padding:5px 14px;background:rgba(37,99,235,0.07);border-radius:99px;border:1px solid rgba(37,99,235,0.16); }
        .lp-h2      { font-family:var(--font-display,sans-serif);font-size:clamp(2rem,4vw,3rem);font-weight:800;color:#0f172a;line-height:1.12;letter-spacing:-1.2px;margin-bottom:18px; }
        .lp-sub     { font-size:17px;color:#64748b;line-height:1.78;max-width:580px;font-weight:400; }
        .lp-div     { height:1px;background:#f1f5f9; }

        /* ── CARDS ── */
        .lp-feat { background:#fff;border:1.5px solid #e2e8f0;border-radius:20px;padding:30px 26px;position:relative;overflow:hidden;transition:transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s,border-color .3s;box-shadow:0 2px 8px rgba(0,0,0,0.04); }
        .lp-feat::before { content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--ac,linear-gradient(90deg,transparent,#2563eb,transparent));opacity:0;transition:opacity .3s; }
        .lp-feat:hover { transform:translateY(-6px);box-shadow:0 24px 48px rgba(0,0,0,0.1);border-color:rgba(37,99,235,0.22); }
        .lp-feat:hover::before { opacity:1; }
        .lp-feat-icon { transition:transform .3s; }
        .lp-feat:hover .lp-feat-icon { transform:scale(1.12) rotate(-3deg); }

        .lp-step { background:#fff;border:1.5px solid #e2e8f0;border-radius:18px;padding:32px 24px;text-align:center;transition:all .3s;box-shadow:0 2px 8px rgba(0,0,0,0.04); }
        .lp-step:hover { background:#f0f5ff;border-color:rgba(37,99,235,0.28);transform:translateY(-5px);box-shadow:0 16px 40px rgba(37,99,235,0.12); }

        /* ── TESTIMONIAL CAROUSEL ── */
        .lp-testi-card { background:#fff;border:1.5px solid #e2e8f0;border-radius:24px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.06);animation:lp-pop .4s cubic-bezier(.16,1,.3,1) both; }
        .lp-testi-dot { width:8px;height:8px;border-radius:50%;background:#e2e8f0;transition:all .3s;cursor:pointer; }
        .lp-testi-dot.on { background:#2563eb;width:24px;border-radius:99px; }

        /* ── GRIDS ── */
        .lp-g3 { display:grid;grid-template-columns:repeat(3,1fr);gap:20px; }
        .lp-g4 { display:grid;grid-template-columns:repeat(4,1fr);gap:24px; }

        /* ── FLOAT ── */
        .lp-fa { animation:lp-float  5s ease-in-out infinite; }
        .lp-fb { animation:lp-floatB 6s ease-in-out infinite; }
        .lp-fc { animation:lp-floatC 7s ease-in-out infinite; }

        /* ── TICKER ── */
        .lp-ticker { display:flex;gap:48px;white-space:nowrap;animation:lp-tick 28s linear infinite; }
        .lp-ticker:hover { animation-play-state:paused; }

        /* ── CTA BOX ── */
        .lp-cta { border-radius:28px;overflow:hidden;position:relative;background:linear-gradient(140deg,#0b1628 0%,#0f1e38 50%,#190b3e 100%);padding:88px 48px;text-align:center; }

        /* ── MOCKUP ── */
        .lp-mock { background:#fff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 32px 80px rgba(15,23,42,0.18);position:relative; }

        /* ── SOCIAL ── */
        .lp-social { width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;color:#94a3b8;transition:all .2s;text-decoration:none; }
        .lp-social:hover { background:rgba(255,255,255,0.14);border-color:rgba(255,255,255,0.25);color:#e2e8f0; }

        /* ── LOGO ICON ── */
        .lp-logo-icon { width:40px;height:40px;border-radius:11px;flex-shrink:0;background:linear-gradient(135deg,#2563eb,#7c3aed);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;box-shadow:0 4px 14px rgba(37,99,235,0.4); }
        .lp-logo-icon::after { content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.2),transparent 55%);border-radius:inherit; }

        /* ── HERO BTNS ── */
        .lp-hero-btns { display:flex;gap:14px;justify-content:center;flex-wrap:wrap; }

        /* ── FOOTER ── */
        .lp-fgrid { display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;margin-bottom:52px; }

        /* ── PROGRESS BAR ── */
        .lp-bar-fill { border-radius:99px;height:100%;animation:lp-bar .8s cubic-bezier(.16,1,.3,1) both; }

        /* ── RESPONSIVE ── */
        @media (max-width:768px) {
          .lp-section { padding:72px 20px; }
          .lp-g3      { grid-template-columns:1fr !important; }
          .lp-g4      { grid-template-columns:1fr 1fr !important; }
          .lp-hide-m  { display:none !important; }
          .lp-hero-btns { flex-direction:column;align-items:stretch; }
          .lp-spot    { grid-template-columns:1fr !important; }
          .lp-fgrid   { grid-template-columns:1fr !important;gap:32px !important; }
          .lp-cta     { padding:56px 24px !important; }
          .lp-nav-pill { border-radius:16px !important; }
        }
        @media (max-width:480px) { .lp-g4 { grid-template-columns:1fr !important; } }
      `}</style>

      {/* ════════ NAV — floating glass pill ════════ */}
      <nav style={{ position:"fixed", top:20, left:0, right:0, zIndex:999, display:"flex", justifyContent:"center", padding:"0 24px", transition:"all .3s" }}>
        <div className="lp-nav-pill" style={{ width:"100%", maxWidth:900 }}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:10, marginRight:"auto" }}>
            <div className="lp-logo-icon"><Brain size={20} color="white" /></div>
            <p style={{ fontSize:16, fontWeight:800, fontFamily:"var(--font-display,sans-serif)", letterSpacing:"-0.4px", color:"#fff" }}>ScreenAI</p>
          </div>
          {/* Links */}
          <div className="lp-hide-m" style={{ display:"flex", alignItems:"center" }}>
            {["Features","How It Works","Testimonials","FAQ"].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g,"-")}`} className="lp-nav-a">{item}</a>
            ))}
          </div>
          {/* CTAs */}
          <div className="lp-hide-m" style={{ display:"flex", alignItems:"center", gap:8, marginLeft:8 }}>
            <Link href="/login" style={{ fontSize:14, fontWeight:600, color:"rgba(255,255,255,0.75)", textDecoration:"none", padding:"8px 14px", borderRadius:99, transition:"all .18s" }}>
              Log in
            </Link>
            <Link href="/register" className="lp-btn lp-btn-sm" style={{ borderRadius:99 }}>
              Get started
            </Link>
          </div>
          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="lp-hide-desktop" style={{ width:36, height:36, borderRadius:"50%", cursor:"pointer", border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.08)", color:"#fff", display:"none", alignItems:"center", justifyContent:"center" }}>
            {menuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ position:"absolute", top:"100%", left:24, right:24, marginTop:8, background:"rgba(11,22,40,0.97)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:"16px 20px 20px", display:"flex", flexDirection:"column", gap:4 }}>
            {["Features","How It Works","Testimonials","FAQ"].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g,"-")}`} className="lp-nav-a" style={{ fontSize:15, padding:"10px 14px" }} onClick={() => setMenuOpen(false)}>{item}</a>
            ))}
            <div style={{ height:1, background:"rgba(255,255,255,0.08)", margin:"8px 0" }} />
            <Link href="/login"    className="lp-ghost-dark" style={{ justifyContent:"center" }}>Log in</Link>
            <Link href="/register" className="lp-btn"        style={{ justifyContent:"center", marginTop:4 }}>Get started <ArrowRight size={15} /></Link>
          </div>
        )}
      </nav>

      {/* ════════ HERO ════════ */}
      <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", paddingTop:140, paddingBottom:100, background:"linear-gradient(148deg,#0b1628 0%,#0f1e38 52%,#0a0f22 100%)" }}>
        {/* BG */}
        <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
          <div style={{ position:"absolute", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle,rgba(37,99,235,0.18) 0%,transparent 68%)", top:-200, left:-200, animation:"lp-orb1 12s ease-in-out infinite" }} />
          <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,0.14) 0%,transparent 68%)", bottom:-140, right:-140, animation:"lp-orb2 14s ease-in-out infinite" }} />
          {/* Subtle grid */}
          <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />
        </div>

        <div className="lp-wrap" style={{ width:"100%", position:"relative", zIndex:1 }}>
          {/* Badge */}
          <div style={{ display:"flex", justifyContent:"center", marginBottom:28 }} className="lp-a0">
            <div className="lp-pill"><Sparkles size={12} /> Built for African Talent Markets · Powered by Gemini AI <span style={{ width:7, height:7, borderRadius:"50%", background:"#4ade80", animation:"lp-pulse 2s ease-in-out infinite", flexShrink:0 }} /></div>
          </div>

          {/* Headline */}
          <h1 className="lp-a1" style={{ fontFamily:"var(--font-display,sans-serif)", fontSize:"clamp(2.6rem,6vw,5rem)", fontWeight:900, lineHeight:1.05, letterSpacing:"-2px", textAlign:"center", color:"#fff", marginBottom:24 }}>
            Screen Smarter.<br />
            <span className="lp-g">Hire Faster. Win More.</span>
          </h1>

          {/* Sub */}
          <p className="lp-a2" style={{ fontSize:"clamp(16px,2vw,18.5px)", color:"rgba(255,255,255,0.62)", textAlign:"center", maxWidth:600, margin:"0 auto 44px", lineHeight:1.78 }}>
            Umurava AI helps companies screen, rank, and shortlist top candidates — so your team spends time on people, not paperwork.
          </p>

          {/* CTAs */}
          <div className="lp-a3 lp-hero-btns">
            <Link href="/register" className="lp-btn" style={{ fontSize:16, padding:"16px 36px" }}>Start recruiting smarter <ArrowRight size={16} /></Link>
            <a href="#how-it-works" className="lp-ghost-dark" style={{ fontSize:16, padding:"15px 28px" }}><Play size={15} /> Watch a demo</a>
          </div>

          {/* Trust */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:28, marginTop:32, flexWrap:"wrap" }} className="lp-a3">
            {["Free for 14 days","No credit card","Cancel anytime"].map((t,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:7 }}>
                <CheckCircle2 size={14} color="#4ade80" />
                <span style={{ fontSize:13.5, color:"rgba(255,255,255,0.55)", fontWeight:500 }}>{t}</span>
              </div>
            ))}
          </div>

          {/* ── MULTI-CARD HERO MOCKUP ── */}
          <div style={{ marginTop:72, position:"relative", maxWidth:1000, margin:"72px auto 0" }} className="lp-a4">

            {/* Central main card */}
            <div className="lp-mock" style={{ maxWidth:540, margin:"0 auto", position:"relative", zIndex:3 }}>
              {/* Header */}
              <div style={{ padding:"12px 18px", borderBottom:"1px solid #f1f5f9", display:"flex", alignItems:"center", justifyContent:"space-between", background:"#f8fafc" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <Brain size={14} color="#2563eb" />
                  <span style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>Umurava AI</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6, padding:"3px 10px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:99 }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", display:"inline-block", animation:"lp-pulse 2s ease-in-out infinite" }} />
                  <span style={{ fontSize:11, fontWeight:700, color:"#16a34a" }}>Live</span>
                </div>
              </div>
              {/* Scanning indicator */}
              <div style={{ padding:"16px 18px", borderBottom:"1px solid #f1f5f9", background:"#fff" }}>
                <p style={{ fontSize:16, fontWeight:800, color:"#0f172a", marginBottom:4 }}>Scanning {mockCandidates.length} candidates</p>
                <p style={{ fontSize:13, color:"#2563eb", fontWeight:700, marginBottom:12 }}>In Real-Time</p>
                {/* Progress ring simulation */}
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ position:"relative", width:52, height:52, flexShrink:0 }}>
                    <svg width="52" height="52" viewBox="0 0 52 52">
                      <circle cx="26" cy="26" r="22" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                      <circle cx="26" cy="26" r="22" fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(scanPct / 100) * 138} 138`} strokeDashoffset="34.5" transform="rotate(-90 26 26)" style={{ transition:"stroke-dasharray .1s" }} />
                    </svg>
                    <span style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#0f172a" }}>{scanPct}%</span>
                  </div>
                  <div>
                    <p style={{ fontSize:13, color:"#64748b", marginBottom:4 }}>AI match confidence</p>
                    <div style={{ display:"flex", gap:6 }}>
                      {["React","TS","Node"].map(s => <span key={s} style={{ fontSize:11, fontWeight:700, color:"#2563eb", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:6, padding:"2px 8px" }}>{s}</span>)}
                    </div>
                  </div>
                </div>
              </div>
              {/* Candidate rows */}
              <div style={{ padding:"12px 18px", background:"#fff", display:"flex", flexDirection:"column", gap:8 }}>
                {mockCandidates.map((c, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:10, background: i===0?"#eff6ff":"#fafbfc", border:`1px solid ${i===0?"#bfdbfe":"#f1f5f9"}` }}>
                    <div style={{ width:30, height:30, borderRadius:"50%", background:`linear-gradient(135deg,#2563eb,#7c3aed)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:"white", flexShrink:0 }}>{c.initials}</div>
                    <p style={{ fontSize:12.5, fontWeight:700, color:"#0f172a", flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.name}</p>
                    <div style={{ width:60, height:4, borderRadius:99, background:"#f1f5f9", overflow:"hidden", flexShrink:0 }}>
                      <div style={{ height:"100%", width:`${c.score}%`, borderRadius:99, background:c.color }} />
                    </div>
                    <span style={{ fontSize:12, fontWeight:800, color:c.color, minWidth:32, textAlign:"right" }}>{c.score}%</span>
                  </div>
                ))}
              </div>
              {/* Scan line */}
              <div style={{ position:"absolute", left:0, right:0, height:2, background:"linear-gradient(transparent,rgba(37,99,235,0.15),transparent)", animation:"lp-scan 3s linear infinite", pointerEvents:"none" }} />
            </div>

            {/* Floating card — top left: Live screening */}
            <div className="lp-fa" style={{ position:"absolute", top:10, left:0, background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:16, padding:"14px 16px", boxShadow:"0 12px 32px rgba(15,23,42,0.12)", zIndex:4, minWidth:170 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                <span style={{ width:7, height:7, borderRadius:"50%", background:"#22c55e", animation:"lp-pulse 2s ease-in-out infinite" }} />
                <span style={{ fontSize:11, fontWeight:700, color:"#475569" }}>Live Screening</span>
              </div>
              <p style={{ fontSize:28, fontWeight:900, color:"#0f172a", fontFamily:"var(--font-display,sans-serif)", lineHeight:1 }}>247</p>
              <p style={{ fontSize:11, color:"#64748b", marginTop:3 }}>candidates screened today</p>
            </div>

            {/* Floating card — top right: Best Match */}
            <div className="lp-fc" style={{ position:"absolute", top:0, right:0, background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:16, padding:"14px 16px", boxShadow:"0 12px 32px rgba(15,23,42,0.12)", zIndex:4, minWidth:190 }}>
              <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:6 }}>
                <Star size={12} color="#f59e0b" fill="#f59e0b" />
                <span style={{ fontSize:11, fontWeight:700, color:"#92400e" }}>Best Match Found</span>
              </div>
              <p style={{ fontSize:11, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".5px", marginBottom:4 }}>Last Update</p>
              <p style={{ fontSize:14, fontWeight:800, color:"#0f172a" }}>Amara Uwimana</p>
              <p style={{ fontSize:11, color:"#64748b", marginBottom:6 }}>Senior Software Engineer</p>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:22, fontWeight:900, color:"#059669", fontFamily:"var(--font-display,sans-serif)" }}>94%</span>
                <span style={{ fontSize:11, color:"#64748b", fontWeight:500 }}>Score</span>
              </div>
            </div>

            {/* Floating card — bottom left: Bias Check */}
            <div className="lp-fb" style={{ position:"absolute", bottom:20, left:0, background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:16, padding:"12px 16px", boxShadow:"0 12px 32px rgba(15,23,42,0.12)", zIndex:4, display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:"rgba(5,150,105,0.1)", border:"1px solid rgba(5,150,105,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Shield size={16} color="#059669" />
              </div>
              <div>
                <p style={{ fontSize:12, fontWeight:700, color:"#059669" }}>Bias Check Passed</p>
                <p style={{ fontSize:11, color:"#64748b" }}>AI Screened · Fair</p>
              </div>
            </div>

            {/* Floating card — bottom right: Speed stat */}
            <div className="lp-fa" style={{ position:"absolute", bottom:10, right:0, background:"linear-gradient(135deg,#0f1e38,#1a0b3e)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:"14px 16px", boxShadow:"0 12px 32px rgba(0,0,0,0.3)", zIndex:4, minWidth:160 }}>
              <p style={{ fontSize:28, fontWeight:900, color:"#fff", fontFamily:"var(--font-display,sans-serif)", lineHeight:1 }}>2.4×</p>
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.6)", marginTop:4 }}>Faster recruiting</p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>vs. manual screening</p>
              <div style={{ marginTop:8, display:"flex", gap:3 }}>
                {[1,2,3,4,5].map(b => <div key={b} style={{ height:18, width:6, borderRadius:3, background: b<=4?"#2563eb":"rgba(255,255,255,0.15)" }} />)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ TRUSTED BY ════════ */}
      <div style={{ background:"#0b1628", borderTop:"1px solid rgba(255,255,255,0.07)", borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"20px 24px", overflow:"hidden" }}>
        <div className="lp-ticker" style={{ alignItems:"center" }}>
          {["Umurava","Kigali Tech Hub","RwandAir","BK Capital","MTN Rwanda","Equity Bank Rwanda","Irembo","Andela","Umurava","Kigali Tech Hub","RwandAir","BK Capital","MTN Rwanda","Equity Bank Rwanda","Irembo","Andela"].map((label,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0, padding:"0 20px" }}>
              <span style={{ fontSize:14, fontWeight:700, color:"rgba(255,255,255,0.3)", whiteSpace:"nowrap", textTransform:"uppercase", letterSpacing:"1px" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ════════ STATS ════════ */}
      <section style={{ padding:"80px 24px", background:"#fff", borderBottom:"1px solid #f1f5f9" }}>
        <div ref={statsInView.ref} style={{ maxWidth:900, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:48 }}>
          {stats.map((s,i) => (
            <div key={i} className={`lp-rev${statsInView.inView?" on":""}`} style={{ transitionDelay:`${i*.08}s` }}>
              <StatCard {...s} />
            </div>
          ))}
        </div>
      </section>

      {/* ════════ FEATURES ════════ */}
      <section id="features" style={{ padding:"100px 24px", background:"#f8fafc" }}>
        <div ref={featuresInView.ref} style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:64 }} className={`lp-rev${featuresInView.inView?" on":""}`}>
            <span className="lp-tag">Features</span>
            <h2 className="lp-h2">Everything your hiring team needs<br />to <span className="lp-g">screen smarter.</span></h2>
            <p className="lp-sub" style={{ margin:"0 auto" }}>Umurava AI handles the analysis. You make the decisions.</p>
          </div>
          <div className="lp-g3">
            {features.map((f,i) => (
              <div key={i} className={`lp-feat lp-rev${featuresInView.inView?" on":""}`} style={{ transitionDelay:`${i*.07}s`, "--ac":`linear-gradient(90deg,transparent,${f.accent}88,transparent)` } as React.CSSProperties}>
                <div style={{ position:"absolute", top:18, right:18, fontSize:10, fontWeight:800, color:f.accent, background:`${f.accent}12`, padding:"3px 9px", borderRadius:99, letterSpacing:".6px", textTransform:"uppercase", border:`1px solid ${f.accent}20` }}>{f.tag}</div>
                <div className="lp-feat-icon" style={{ width:52, height:52, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20, background:`${f.accent}10`, border:`1px solid ${f.accent}20`, flexShrink:0 }}>
                  <f.icon size={24} color={f.accent} />
                </div>
                <h3 style={{ fontSize:18, fontWeight:800, color:"#0f172a", marginBottom:12, fontFamily:"var(--font-display,sans-serif)", lineHeight:1.3 }}>{f.title}</h3>
                <p style={{ fontSize:15, color:"#475569", lineHeight:1.75 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="lp-div" />

      {/* ════════ AI CHAT SPOTLIGHT ════════ */}
      <section style={{ padding:"100px 24px", background:"#fff" }}>
        <div ref={chatInView.ref} style={{ maxWidth:1200, margin:"0 auto" }}>
          <div className="lp-spot" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:72, alignItems:"center" }}>
            <div className={`lp-rev${chatInView.inView?" on":""}`}>
              <span className="lp-tag">AI Chat Assistant</span>
              <h2 className="lp-h2" style={{ fontSize:"clamp(1.8rem,3.5vw,2.6rem)" }}>Ask your shortlist anything.<br />Get answers <span className="lp-g">instantly.</span></h2>
              <p style={{ fontSize:16, color:"#475569", lineHeight:1.78, marginBottom:28 }}>
                Once screening is complete, Umurava AI&apos;s assistant knows your entire candidate pool. Ask it to compare the top three, surface near-misses, or explain why someone ranked where they did.
              </p>
              {["Context-aware to your specific job and applicants","Suggestion chips for common recruiter questions","Streaming responses — no waiting for full answers"].map((p,i) => (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:14 }}>
                  <div style={{ width:22, height:22, borderRadius:"50%", background:"rgba(37,99,235,0.1)", border:"1.5px solid rgba(37,99,235,0.25)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>
                    <CheckCircle2 size={13} color="#2563eb" />
                  </div>
                  <span style={{ fontSize:15, color:"#374151", lineHeight:1.6 }}>{p}</span>
                </div>
              ))}
            </div>
            <div className={`lp-rev${chatInView.inView?" on":""}`} style={{ transitionDelay:".12s" }}>
              <div style={{ background:"#fff", borderRadius:20, border:"1.5px solid #e2e8f0", boxShadow:"0 12px 40px rgba(15,23,42,0.1)", overflow:"hidden" }}>
                <div style={{ padding:"16px 20px", borderBottom:"1px solid #f1f5f9", display:"flex", alignItems:"center", gap:8 }}>
                  <Sparkles size={15} color="#2563eb" />
                  <span style={{ fontSize:14.5, fontWeight:700, color:"#0f172a" }}>AI Assistant</span>
                </div>
                <div style={{ padding:"20px", background:"#f8fafc", minHeight:160 }}>
                  <div style={{ display:"flex", gap:10, marginBottom:16 }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#2563eb,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Sparkles size={14} color="white" />
                    </div>
                    <div style={{ background:"#fff", borderRadius:"0 14px 14px 14px", padding:"12px 16px", border:"1px solid #e2e8f0", maxWidth:280 }}>
                      <p style={{ fontSize:14, color:"#374151", lineHeight:1.6 }}>Screening complete! Amara Uwimana is your top match at 94%. Shall I compare the top 3?</p>
                    </div>
                  </div>
                  <div style={{ display:"flex", justifyContent:"flex-end" }}>
                    <div style={{ background:"linear-gradient(135deg,#2563eb,#7c3aed)", borderRadius:"14px 0 14px 14px", padding:"11px 18px" }}>
                      <p style={{ fontSize:14, color:"white", fontWeight:600 }}>Compare top 3</p>
                    </div>
                  </div>
                </div>
                <div style={{ padding:"14px 20px", borderTop:"1px solid #f1f5f9", background:"#fff" }}>
                  <p style={{ fontSize:12, color:"#94a3b8", fontWeight:600, marginBottom:10, textTransform:"uppercase", letterSpacing:".6px" }}>Suggested</p>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {["Who almost qualified?","Show gaps","Summarize"].map(chip => (
                      <button key={chip} style={{ display:"inline-flex", alignItems:"center", padding:"7px 14px", borderRadius:99, border:"1.5px solid #e2e8f0", background:"#fff", fontSize:13, fontWeight:600, color:"#374151", cursor:"pointer", transition:"all .18s", whiteSpace:"nowrap" }}>{chip}</button>
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
      <section id="how-it-works" style={{ padding:"100px 24px", background:"#f8fafc" }}>
        <div ref={stepsInView.ref} style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:72 }} className={`lp-rev${stepsInView.inView?" on":""}`}>
            <span className="lp-tag">How It Works</span>
            <h2 className="lp-h2">From job post to hired — <span className="lp-g">in 4 steps</span></h2>
            <p className="lp-sub" style={{ margin:"0 auto" }}>No complex setup. No learning curve. Start screening in minutes.</p>
          </div>
          <div className="lp-g4" style={{ position:"relative" }}>
            <div className="lp-hide-m" style={{ position:"absolute", top:36, left:"12.5%", right:"12.5%", height:1, background:"linear-gradient(90deg,transparent,rgba(37,99,235,0.3),rgba(124,58,237,0.3),transparent)", zIndex:0 }} />
            {steps.map((step,i) => (
              <div key={i} className={`lp-step lp-rev${stepsInView.inView?" on":""}`} style={{ transitionDelay:`${i*.1}s`, position:"relative", zIndex:1 }}>
                <div style={{ width:72, height:72, borderRadius:20, background:"linear-gradient(135deg,rgba(37,99,235,0.1),rgba(124,58,237,0.08))", border:"1px solid rgba(37,99,235,0.2)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", position:"relative" }}>
                  <step.icon size={28} color="#2563eb" />
                  <div style={{ position:"absolute", top:-10, right:-10, width:26, height:26, borderRadius:"50%", background:"linear-gradient(135deg,#2563eb,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:"white" }}>{i+1}</div>
                </div>
                <p style={{ fontSize:11.5, fontWeight:800, color:"#2563eb", textTransform:"uppercase", letterSpacing:"1.6px", marginBottom:10 }}>{step.n}</p>
                <h3 style={{ fontSize:18, fontWeight:800, color:"#0f172a", marginBottom:12, fontFamily:"var(--font-display,sans-serif)" }}>{step.title}</h3>
                <p style={{ fontSize:14.5, color:"#475569", lineHeight:1.75 }}>{step.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop:60, textAlign:"center" }}>
            <Link href="/register" className="lp-btn" style={{ fontSize:15.5 }}>Try It Free — No Setup Required <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      <div className="lp-div" />

      {/* ════════ TESTIMONIALS — CAROUSEL ════════ */}
      <section id="testimonials" style={{ padding:"100px 24px", background:"#fff" }}>
        <div ref={testimonialsInView.ref} style={{ maxWidth:900, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:56 }} className={`lp-rev${testimonialsInView.inView?" on":""}`}>
            <span className="lp-tag">Testimonials</span>
            <h2 className="lp-h2">Recruiters who&apos;ve made the switch.</h2>
            <p className="lp-sub" style={{ margin:"0 auto" }}>Real teams. Real results. Real hiring decisions.</p>
          </div>

          {/* Carousel card */}
          <div key={testiIdx} className="lp-testi-card">
            <div style={{ display:"flex", gap:3, marginBottom:20 }}>
              {[...Array(testimonials[testiIdx].stars)].map((_,s) => <Star key={s} size={16} color="#f59e0b" fill="#f59e0b" />)}
            </div>
            <div style={{ fontSize:56, lineHeight:1, color:"rgba(37,99,235,0.12)", fontFamily:"Georgia,serif", marginBottom:-12, marginLeft:-4 }}>&ldquo;</div>
            <p style={{ fontSize:17, color:"#374151", lineHeight:1.85, marginBottom:32, fontStyle:"italic", fontWeight:400 }}>
              {testimonials[testiIdx].quote}
            </p>
            <div style={{ display:"flex", alignItems:"center", gap:14, paddingTop:24, borderTop:"1px solid #f1f5f9" }}>
              <img src={testimonials[testiIdx].photo} alt={testimonials[testiIdx].name} style={{ width:52, height:52, borderRadius:"50%", objectFit:"cover", flexShrink:0, border:"2px solid #e2e8f0" }} />
              <div>
                <p style={{ fontSize:15, fontWeight:700, color:"#0f172a" }}>{testimonials[testiIdx].name}</p>
                <p style={{ fontSize:13, color:"#64748b" }}>{testimonials[testiIdx].role}</p>
              </div>
            </div>
          </div>

          {/* Carousel controls */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16, marginTop:28 }}>
            <button onClick={() => setTestiIdx(p => (p-1+testimonials.length)%testimonials.length)} style={{ width:36, height:36, borderRadius:"50%", border:"1.5px solid #e2e8f0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s", color:"#64748b" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="#2563eb";(e.currentTarget as HTMLElement).style.color="#2563eb";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="#e2e8f0";(e.currentTarget as HTMLElement).style.color="#64748b";}}>
              <ChevronLeft size={16} />
            </button>
            <div style={{ display:"flex", gap:8 }}>
              {testimonials.map((_,i) => (
                <div key={i} className={`lp-testi-dot${i===testiIdx?" on":""}`} onClick={() => setTestiIdx(i)} />
              ))}
            </div>
            <button onClick={() => setTestiIdx(p => (p+1)%testimonials.length)} style={{ width:36, height:36, borderRadius:"50%", border:"1.5px solid #e2e8f0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s", color:"#64748b" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="#2563eb";(e.currentTarget as HTMLElement).style.color="#2563eb";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="#e2e8f0";(e.currentTarget as HTMLElement).style.color="#64748b";}}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <div className="lp-div" />

      {/* ════════ FAQ ════════ */}
      <section id="faq" style={{ padding:"100px 24px", background:"#f8fafc" }}>
        <div style={{ maxWidth:760, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:56 }}>
            <span className="lp-tag">FAQ</span>
            <h2 className="lp-h2">Common questions</h2>
          </div>
          {faqs.map((f,i) => <FAQItem key={i} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* ════════ CTA BAND ════════ */}
      <section style={{ padding:"80px 24px" }}>
        <div style={{ maxWidth:900, margin:"0 auto" }}>
          <div className="lp-cta">
            <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
              <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(37,99,235,0.18) 0%,transparent 65%)", top:"50%", left:"50%", transform:"translate(-50%,-50%)" }} />
              <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />
            </div>
            <div style={{ position:"relative", zIndex:1 }}>
              <div style={{ width:60, height:60, borderRadius:18, background:"linear-gradient(135deg,#2563eb,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", boxShadow:"0 8px 28px rgba(37,99,235,0.5)" }}>
                <Brain size={28} color="white" />
              </div>
              <h2 style={{ fontFamily:"var(--font-display,sans-serif)", fontSize:"clamp(1.8rem,4vw,3rem)", fontWeight:900, color:"#fff", lineHeight:1.1, letterSpacing:"-1.2px", marginBottom:16 }}>
                Ready to hire smarter?
              </h2>
              <p style={{ fontSize:17, color:"rgba(255,255,255,0.55)", lineHeight:1.75, maxWidth:480, margin:"0 auto 40px" }}>
                Join growing companies across Africa using Umurava AI to find and hire top talent faster. Free to start. No credit card required.
              </p>
              <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
                <Link href="/register" className="lp-btn" style={{ fontSize:15.5, padding:"15px 34px" }}>Start for free <ArrowRight size={16} /></Link>
                <Link href="/login"    className="lp-ghost-dark" style={{ fontSize:15 }}>Sign In to Dashboard</Link>
              </div>
              <p style={{ fontSize:13, color:"rgba(255,255,255,0.3)", marginTop:20 }}>No credit card · Free to start · Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer style={{ background:"#0b1628", borderTop:"1px solid rgba(255,255,255,0.07)", padding:"64px 24px 36px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div className="lp-fgrid">
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
                <div style={{ width:36, height:36, borderRadius:9, background:"linear-gradient(135deg,#2563eb,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Brain size={18} color="white" />
                </div>
                <p style={{ fontSize:16, fontWeight:800, color:"#f1f5f9", fontFamily:"var(--font-display,sans-serif)" }}>Umurava AI</p>
              </div>
              <p style={{ fontSize:14, color:"#475569", lineHeight:1.72, maxWidth:280, marginBottom:20 }}>
                Built for Rwanda. Powered by AI. Screen hundreds of candidates in seconds, not days.
              </p>
              <div style={{ display:"flex", gap:10, marginBottom:24 }}>
                {[Code2, Link2, Share2].map((Icon,i) => (
                  <a key={i} href="#" className="lp-social"><Icon size={16} /></a>
                ))}
              </div>
              <p style={{ fontSize:12, fontWeight:700, color:"#334155", marginBottom:10, textTransform:"uppercase", letterSpacing:".7px" }}>Get talent insights</p>
              <div style={{ display:"flex", gap:8 }}>
                <input type="email" placeholder="Enter your email" style={{ flex:1, padding:"9px 14px", borderRadius:9, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:"#e2e8f0", fontSize:13, outline:"none", fontFamily:"var(--font-body,sans-serif)" }} />
                <button style={{ padding:"9px 16px", borderRadius:9, background:"linear-gradient(135deg,#2563eb,#7c3aed)", color:"white", border:"none", fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>Subscribe</button>
              </div>
            </div>
            {[
              { title:"Product",  links:["Features","How It Works","Pricing","Changelog"]          },
              { title:"Company",  links:["About","Blog","Careers","Press"]                          },
              { title:"Legal",    links:["Privacy Policy","Terms of Service","Cookie Policy","GDPR"] },
            ].map(col => (
              <div key={col.title}>
                <p style={{ fontSize:11.5, fontWeight:800, color:"#e2e8f0", textTransform:"uppercase", letterSpacing:"1px", marginBottom:18 }}>{col.title}</p>
                <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
                  {col.links.map(link => (
                    <a key={link} href="#" style={{ fontSize:14, color:"#475569", textDecoration:"none", transition:"color .18s" }}
                      onMouseEnter={e=>(e.currentTarget.style.color="#94a3b8")}
                      onMouseLeave={e=>(e.currentTarget.style.color="#475569")}
                    >{link}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:24, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
            <p style={{ fontSize:13, color:"#334155" }}>© {new Date().getFullYear()} Umurava AI · All rights reserved · Built in Kigali 🇷🇼</p>
            <p style={{ fontSize:13, color:"#334155", fontStyle:"italic" }}>Built by <span style={{ color:"#475569", fontWeight:700 }}>Debug Thugs</span> · Powered by Gemini AI</p>
          </div>
        </div>
      </footer>
    </>
  );
}