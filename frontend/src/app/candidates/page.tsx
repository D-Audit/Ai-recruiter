"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import Sidebar from "../../components/Sidebar";
import AppHeader from "../../components/AppHeader";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getAllJobs } from "../../services/jobService";
import { getApplicants } from "../../services/applicantService";
import { AppDispatch } from "../../store";
import {
  Users, Briefcase, MapPin, Upload, Search, User, Mail,
  ChevronRight, ArrowRight, Sparkles, Star, TrendingUp,
} from "lucide-react";

function scoreLabel(score: number): { label: string; bg: string; color: string; bar: string } {
  if (score >= 80) return { label: "Strong Fit",   bg: "rgba(22,163,74,0.1)",  color: "#15803d", bar: "#22c55e" };
  if (score >= 65) return { label: "Good Fit",     bg: "rgba(37,99,235,0.1)",  color: "#1d4ed8", bar: "#3b82f6" };
  if (score >= 50) return { label: "Moderate Fit", bg: "rgba(234,179,8,0.1)",  color: "#a16207", bar: "#eab308" };
  return              { label: "Weak Fit",      bg: "rgba(239,68,68,0.1)",  color: "#b91c1c", bar: "#ef4444" };
}

function CandidatesInner() {
  const dispatch    = useDispatch<AppDispatch>();
  const router      = useRouter();
  const searchParams = useSearchParams();

  const [jobs, setJobs]                       = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs]         = useState(true);
  const [selectedJobId, setSelectedJobId]     = useState(searchParams.get("jobId") || "");
  const [candidatesLoaded, setCandidatesLoaded] = useState(false);
  const [candidates, setCandidates]           = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [search, setSearch]                   = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.push("/"); return; }
    getAllJobs().then((d) => setJobs(d.jobs || [])).catch(() => {}).finally(() => setLoadingJobs(false));
  }, [router]);

  const handleJobChange = (jobId: string) => {
    setSelectedJobId(jobId);
    setCandidates([]);
    setCandidatesLoaded(false);
    if (jobId) router.replace(`/candidates?jobId=${encodeURIComponent(jobId)}`, { scroll: false });
    else router.replace("/candidates", { scroll: false });
  };

  const handleLoadApplicants = useCallback(async () => {
    if (!selectedJobId) return;
    setLoadingCandidates(true);
    try {
      const data = await getApplicants(selectedJobId);
      setCandidates(data.applicants || []);
      setCandidatesLoaded(true);
    } catch {
      setCandidates([]);
      setCandidatesLoaded(true);
    } finally {
      setLoadingCandidates(false);
    }
  }, [selectedJobId]);

  const selectedJob = jobs.find((j) => j._id === selectedJobId);
  const filtered    = candidates.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return `${c.firstName} ${c.lastName} ${c.email} ${c.headline}`.toLowerCase().includes(s) ||
      (c.skills || []).some((sk: any) => sk.name?.toLowerCase().includes(s));
  });

  const avgScore = candidates.length > 0 && candidates.some(c => c.aiScore != null)
    ? Math.round(candidates.filter(c => c.aiScore != null).reduce((s, c) => s + c.aiScore, 0) / candidates.filter(c => c.aiScore != null).length)
    : null;

  const topCandidates = candidates.filter(c => c.aiScore >= 80).length;

  return (
    <>
      <style>{`
        .cnd-root { display:flex; font-family:var(--font-body); }
        .cnd-main { margin-left:var(--sidebar-width); min-height:100vh; background:var(--surface-base); flex:1; display:flex; flex-direction:column; }
        .cnd-body { padding:24px 32px 100px; flex:1; }

        /* ── Job selector ── */
        .cnd-selector {
          background:var(--surface-card); border:1.5px solid var(--border-soft);
          border-radius:18px; padding:22px 26px; margin-bottom:18px;
          box-shadow:var(--shadow-card);
          border-left:4px solid var(--brand-primary);
        }
        .cnd-selector-title { font-size:15px; font-weight:800; color:var(--text-primary); margin-bottom:3px; display:flex; align-items:center; gap:8px; }
        .cnd-selector-sub   { font-size:13px; color:var(--text-secondary); margin-bottom:16px; }
        .cnd-select-row     { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
        .cnd-select-wrap    { position:relative; flex:1; min-width:220px; max-width:460px; }
        .cnd-select-icon    { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none; }
        .cnd-select {
          width:100%; padding:11px 36px 11px 40px; border-radius:11px;
          border:1.5px solid var(--border-input); background:var(--surface-input);
          font-family:var(--font-body); font-size:14px; color:var(--text-primary);
          cursor:pointer; outline:none; appearance:none;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:right 12px center;
          transition:all 0.15s; box-shadow:var(--shadow-card);
        }
        .cnd-select:focus { border-color:var(--brand-primary); box-shadow:0 0 0 3px rgba(37,99,235,0.1); }
        .cnd-load-btn {
          padding:11px 22px; border-radius:11px; border:none;
          background:linear-gradient(135deg,#2563eb,#4f46e5); color:white;
          font-weight:700; font-size:14px; font-family:var(--font-body);
          cursor:pointer; box-shadow:var(--shadow-button);
          display:flex; align-items:center; gap:7px; white-space:nowrap;
          transition:all 0.15s;
        }
        .cnd-load-btn:hover { transform:translateY(-1px); box-shadow:0 6px 22px rgba(37,99,235,0.42); }
        .cnd-load-btn:disabled { opacity:0.55; cursor:not-allowed; transform:none; box-shadow:none; }

        /* ── Stats row (shown after load) ── */
        .cnd-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:16px; }
        .cnd-stat {
          background:var(--surface-card); border:1px solid var(--border-soft);
          border-radius:13px; padding:14px 16px;
          display:flex; align-items:center; gap:11px;
          box-shadow:var(--shadow-card);
        }
        .cnd-stat-icon { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .cnd-stat-val  { font-size:20px; font-weight:900; color:var(--text-primary); line-height:1; font-family:var(--font-display,'Syne',sans-serif); }
        .cnd-stat-lbl  { font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.07em; }

        /* ── Job info banner ── */
        .cnd-job-info {
          margin-top:14px; padding:11px 16px; border-radius:11px;
          background:rgba(22,163,74,0.07); border:1px solid rgba(22,163,74,0.18);
          display:flex; align-items:center; gap:10px; flex-wrap:wrap;
          font-size:13px; color:var(--text-secondary); font-weight:500;
        }

        /* ── Toolbar ── */
        .cnd-toolbar { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
        .cnd-search-wrap { position:relative; flex:1; min-width:200px; max-width:360px; }
        .cnd-search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none; }
        .cnd-search {
          width:100%; padding:11px 14px 11px 40px; border-radius:11px;
          border:1.5px solid var(--border-input); background:var(--surface-card);
          color:var(--text-primary); font-size:14px; font-family:var(--font-body); outline:none;
          box-shadow:var(--shadow-card); transition:all 0.15s;
        }
        .cnd-search:focus { border-color:var(--brand-primary); box-shadow:0 0 0 3px rgba(37,99,235,0.1); }

        /* ── Table ── */
        .cnd-table-wrap { background:var(--surface-card); border:1.5px solid var(--border-soft); border-radius:18px; overflow:hidden; box-shadow:var(--shadow-card); }
        .cnd-table { width:100%; border-collapse:collapse; }
        .cnd-table th { padding:11px 16px; text-align:left; font-size:10.5px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-muted); border-bottom:1px solid var(--border-muted); background:var(--surface-subtle); white-space:nowrap; }
        .cnd-table td { padding:14px 16px; border-bottom:1px solid var(--border-muted); vertical-align:middle; }
        .cnd-table tr:last-child td { border-bottom:none; }
        .cnd-table tbody tr { transition:background 0.12s; }
        .cnd-table tbody tr:hover { background:var(--surface-hover); }

        .cnd-avatar { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,#2563eb,#7c3aed); display:flex; align-items:center; justify-content:center; color:white; font-size:12px; font-weight:800; flex-shrink:0; box-shadow:0 2px 6px rgba(37,99,235,0.25); }
        .cnd-name { font-size:14px; font-weight:700; color:var(--text-primary); }
        .cnd-headline { font-size:12px; color:var(--text-secondary); margin-top:1px; }
        .cnd-email { font-size:13px; color:var(--text-secondary); font-weight:500; display:flex; align-items:center; gap:5px; }
        .cnd-location { font-size:13px; color:var(--text-secondary); font-weight:500; display:flex; align-items:center; gap:5px; }
        .cnd-skill { display:inline-block; padding:2px 9px; border-radius:6px; font-size:11.5px; font-weight:600; background:rgba(37,99,235,0.07); color:#2563eb; border:1px solid rgba(37,99,235,0.12); }

        /* Score cell */
        .cnd-score-cell { display:flex; flex-direction:column; gap:4px; }
        .cnd-score-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:99px; font-size:12px; font-weight:700; white-space:nowrap; }
        .cnd-score-num { font-size:15px; font-weight:900; }
        .cnd-score-bar-wrap { width:72px; height:4px; border-radius:99px; background:var(--border-soft); overflow:hidden; }
        .cnd-score-bar { height:100%; border-radius:99px; transition:width 0.6s ease; }

        .cnd-view-link { display:inline-flex; align-items:center; gap:4px; padding:6px 12px; border-radius:8px; background:rgba(37,99,235,0.08); color:#2563eb; font-size:12.5px; font-weight:700; text-decoration:none; border:1px solid rgba(37,99,235,0.14); transition:all 0.12s; }
        .cnd-view-link:hover { background:rgba(37,99,235,0.15); }

        /* ── Empty states ── */
        .cnd-empty { padding:64px 20px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:12px; background:var(--surface-card); border:1.5px solid var(--border-soft); border-radius:18px; box-shadow:var(--shadow-card); }
        .cnd-empty-icon { width:68px; height:68px; border-radius:20px; display:flex; align-items:center; justify-content:center; margin-bottom:4px; }

        @media(max-width:900px){ .cnd-table th:nth-child(3),.cnd-table td:nth-child(3){ display:none } }
        @media(max-width:768px){ .cnd-main{margin-left:0} .cnd-body{padding:16px 14px 80px} .cnd-stats{grid-template-columns:1fr 1fr} }
      `}</style>

      <div className="cnd-root">
        <Sidebar />
        <div className="cnd-main">
          <AppHeader title="Candidates" subtitle="Browse and filter candidates by job" />
          <div className="cnd-body">

            {/* Job selector */}
            <div className="cnd-selector">
              <p className="cnd-selector-title">
                <Briefcase size={17} color="#2563eb" /> Select a Job
              </p>
              <p className="cnd-selector-sub">
                Choose a job posting then click <strong>Load Applicants</strong> to view and filter candidates.
              </p>
              <div className="cnd-select-row">
                <div className="cnd-select-wrap">
                  <span className="cnd-select-icon"><Briefcase size={15} /></span>
                  <select className="cnd-select" value={selectedJobId} onChange={(e) => handleJobChange(e.target.value)} disabled={loadingJobs}>
                    <option value="">{loadingJobs ? "Loading jobs…" : "Choose a job posting…"}</option>
                    {jobs.map((j) => (
                      <option key={j._id} value={j._id}>{j.title} {j.applicantsCount ? `(${j.applicantsCount} candidates)` : "(0 candidates)"}</option>
                    ))}
                  </select>
                </div>
                <button className="cnd-load-btn" onClick={handleLoadApplicants} disabled={!selectedJobId || loadingCandidates}>
                  <Users size={15} />
                  {loadingCandidates ? "Loading…" : "Load Applicants"}
                </button>
                {selectedJobId && (
                  <Link href={`/applicants?jobId=${selectedJobId}`} className="btn-secondary" style={{ fontSize: 13, padding: "10px 16px" }}>
                    <Upload size={14} /> Upload More
                  </Link>
                )}
              </div>
              {selectedJob && candidatesLoaded && (
                <div className="cnd-job-info">
                  <Briefcase size={14} color="#16a34a" />
                  <strong>{selectedJob.title}</strong>
                  <span>·</span>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{candidates.length}</span>
                  <span>candidate{candidates.length !== 1 ? "s" : ""} loaded</span>
                  {selectedJob.location && <span>· {selectedJob.location}</span>}
                  <Link href={`/screenings?jobId=${selectedJobId}`} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 700, color: "#2563eb", textDecoration: "none", padding: "4px 12px", borderRadius: 8, background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.15)" }}>
                    <Sparkles size={12} /> Run AI Screening <ArrowRight size={11} />
                  </Link>
                </div>
              )}
            </div>

            {/* Stats row */}
            {candidatesLoaded && candidates.length > 0 && (
              <div className="cnd-stats">
                <div className="cnd-stat">
                  <div className="cnd-stat-icon" style={{ background: "rgba(37,99,235,0.1)" }}>
                    <Users size={16} color="#2563eb" />
                  </div>
                  <div>
                    <p className="cnd-stat-val">{candidates.length}</p>
                    <p className="cnd-stat-lbl">Total Candidates</p>
                  </div>
                </div>
                <div className="cnd-stat">
                  <div className="cnd-stat-icon" style={{ background: "rgba(22,163,74,0.1)" }}>
                    <Star size={16} color="#16a34a" />
                  </div>
                  <div>
                    <p className="cnd-stat-val">{topCandidates}</p>
                    <p className="cnd-stat-lbl">Strong Fits (80+)</p>
                  </div>
                </div>
                <div className="cnd-stat">
                  <div className="cnd-stat-icon" style={{ background: "rgba(124,58,237,0.1)" }}>
                    <TrendingUp size={16} color="#7c3aed" />
                  </div>
                  <div>
                    <p className="cnd-stat-val">{avgScore ?? "—"}</p>
                    <p className="cnd-stat-lbl">Avg AI Score</p>
                  </div>
                </div>
              </div>
            )}

            {/* Toolbar */}
            {candidatesLoaded && candidates.length > 0 && (
              <div className="cnd-toolbar">
                <div className="cnd-search-wrap">
                  <span className="cnd-search-icon"><Search size={15} /></span>
                  <input className="cnd-search" placeholder="Search name, email, skill…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600, marginLeft: "auto" }}>
                  {filtered.length} of {candidates.length}
                </p>
              </div>
            )}

            {/* Loading */}
            {loadingCandidates && <LoadingSpinner label="Loading candidates…" />}

            {/* Empty states */}
            {!loadingCandidates && !candidatesLoaded && (
              <div className="cnd-empty">
                <div className="cnd-empty-icon" style={{ background: "rgba(37,99,235,0.08)", border: "1.5px solid rgba(37,99,235,0.12)" }}>
                  <Users size={28} color="#2563eb" />
                </div>
                <p style={{ fontWeight: 800, fontSize: 18, color: "var(--text-primary)" }}>
                  {selectedJobId ? `${selectedJob?.title || "Job"} selected` : "Select a job above"}
                </p>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 320, textAlign: "center", lineHeight: 1.6 }}>
                  {selectedJobId ? "Click Load Applicants to view candidates for this position." : "Choose a job from the dropdown, then click Load Applicants."}
                </p>
                {selectedJobId && (
                  <button className="btn-primary" onClick={handleLoadApplicants} style={{ marginTop: 4 }}>
                    <Users size={14} /> Load Applicants
                  </button>
                )}
              </div>
            )}

            {!loadingCandidates && candidatesLoaded && candidates.length === 0 && (
              <div className="cnd-empty">
                <div className="cnd-empty-icon" style={{ background: "rgba(124,58,237,0.08)", border: "1.5px solid rgba(124,58,237,0.12)" }}>
                  <Users size={28} color="#7c3aed" />
                </div>
                <p style={{ fontWeight: 800, fontSize: 18, color: "var(--text-primary)" }}>No candidates yet</p>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 300, textAlign: "center", lineHeight: 1.6 }}>
                  Upload candidate CVs to this job to begin AI-powered screening.
                </p>
                <Link href={`/applicants?jobId=${selectedJobId}`} className="btn-primary" style={{ marginTop: 4 }}>
                  <Upload size={14} /> Upload Candidates
                </Link>
              </div>
            )}

            {/* Table */}
            {!loadingCandidates && candidatesLoaded && filtered.length > 0 && (
              <div className="cnd-table-wrap">
                <table className="cnd-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Contact</th>
                      <th>Location</th>
                      <th>Skills</th>
                      <th>AI Score</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c, i) => {
                      const name     = `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Unknown";
                      const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
                      const skills   = c.skills?.slice(0, 3) || [];
                      const si       = c.aiScore != null ? scoreLabel(c.aiScore) : null;
                      return (
                        <tr key={c._id || i}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                              <div className="cnd-avatar">{initials || <User size={14} />}</div>
                              <div>
                                <p className="cnd-name">{name}</p>
                                {c.headline && <p className="cnd-headline">{c.headline}</p>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <p className="cnd-email"><Mail size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />{c.email || "—"}</p>
                          </td>
                          <td>
                            {c.location
                              ? <p className="cnd-location"><MapPin size={12} style={{ color: "var(--text-muted)" }} />{c.location}</p>
                              : <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                              {skills.length > 0
                                ? skills.map((s: any, idx: number) => <span key={idx} className="cnd-skill">{typeof s === "string" ? s : s.name}</span>)
                                : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>}
                            </div>
                          </td>
                          <td>
                            {si ? (
                              <div className="cnd-score-cell">
                                <span className="cnd-score-badge" style={{ background: si.bg, color: si.color }}>
                                  <span className="cnd-score-num">{c.aiScore}</span>
                                  <span style={{ fontSize: 11 }}>{si.label}</span>
                                </span>
                                <div className="cnd-score-bar-wrap">
                                  <div className="cnd-score-bar" style={{ width: `${c.aiScore}%`, background: si.bar }} />
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: "var(--text-muted)", fontSize: 12, fontStyle: "italic" }}>Not screened</span>
                            )}
                          </td>
                          <td>
                            <Link href={`/candidates/${c._id}?jobId=${selectedJobId}`} className="cnd-view-link">
                              View <ChevronRight size={13} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loadingCandidates && candidatesLoaded && candidates.length > 0 && filtered.length === 0 && (
              <div className="cnd-empty">
                <div className="cnd-empty-icon" style={{ background: "var(--surface-subtle)" }}><Search size={24} color="var(--text-muted)" /></div>
                <p style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>No matches</p>
                <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Try a different name, email or skill.</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

export default function CandidatesPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage label="Loading candidates…" />}>
      <CandidatesInner />
    </Suspense>
  );
}