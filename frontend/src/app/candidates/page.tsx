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
  ChevronRight, ArrowRight,
} from "lucide-react";

function scoreLabel(score: number): { label: string; bg: string; color: string } {
  if (score >= 80) return { label: "Strong Fit", bg: "#dcfce7", color: "#15803d" };
  if (score >= 65) return { label: "Good Fit", bg: "#dbeafe", color: "#2563eb" };
  if (score >= 50) return { label: "Moderate Fit", bg: "#fef9c3", color: "#ca8a04" };
  return { label: "Weak Fit", bg: "#fee2e2", color: "#dc2626" };
}

function CandidatesInner() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState(searchParams.get("jobId") || "");
  // FIX 4: candidatesLoaded state — candidates only load when button is clicked
  const [candidatesLoaded, setCandidatesLoaded] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.push("/"); return; }
    getAllJobs()
      .then((d) => setJobs(d.jobs || []))
      .catch(() => {})
      .finally(() => setLoadingJobs(false));
  }, [router]);

  // FIX 4: When job changes, reset loaded state — don't auto-load
  const handleJobChange = (jobId: string) => {
    setSelectedJobId(jobId);
    setCandidates([]);
    setCandidatesLoaded(false);
    if (jobId) router.replace(`/candidates?jobId=${encodeURIComponent(jobId)}`, { scroll: false });
    else router.replace("/candidates", { scroll: false });
  };

  // FIX 4: Load only called when user clicks the button
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

  const filtered = candidates.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return `${c.firstName} ${c.lastName} ${c.email} ${c.headline}`.toLowerCase().includes(s) ||
      (c.skills || []).some((sk: any) => sk.name?.toLowerCase().includes(s));
  });

  return (
    <>
      <style>{`
        .cnd-root { display: flex; font-family: var(--font-body, system-ui); }
        .cnd-main { margin-left: var(--sidebar-width); min-height: 100vh; background: var(--surface-base); flex: 1; display: flex; flex-direction: column; }
        .cnd-body { padding: 28px 40px 100px; flex: 1; animation: fadeIn 0.28s ease; }

        /* Selector card */
        .cnd-selector {
          background: var(--surface-card); border: 1.5px solid var(--border-soft);
          border-radius: 18px; padding: 24px 28px; margin-bottom: 20px;
          box-shadow: var(--shadow-card);
        }
        .cnd-selector-title { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
        .cnd-selector-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 18px; line-height: 1.5; }
        .cnd-select-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .cnd-select-wrap { position: relative; flex: 1; min-width: 220px; max-width: 440px; }
        .cnd-select-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
        .cnd-select {
          width: 100%; padding: 11px 36px 11px 38px; border-radius: 11px;
          border: 1.5px solid var(--border-input); background: var(--surface-input);
          font-family: var(--font-body); font-size: 14px; color: var(--text-primary);
          cursor: pointer; outline: none; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 12px center;
          transition: all var(--transition-fast);
        }
        .cnd-select:focus { border-color: var(--brand-primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }

        /* FIX 4: Load Applicants button */
        .cnd-load-btn {
          padding: 11px 22px; border-radius: 11px; border: none;
          background: linear-gradient(135deg, #2563eb, #7c3aed); color: white;
          font-weight: 700; font-size: 14px; font-family: var(--font-body);
          cursor: pointer; box-shadow: var(--shadow-button);
          display: flex; align-items: center; gap: 7px; white-space: nowrap;
          transition: all var(--transition-fast);
        }
        .cnd-load-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.4); }
        .cnd-load-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }

        .cnd-job-info {
          margin-top: 14px; padding: 11px 14px; border-radius: 10px;
          background: rgba(37,99,235,0.06); border: 1px solid rgba(37,99,235,0.12);
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          font-size: 13px; color: var(--text-secondary);
        }

        /* Toolbar */
        .cnd-toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }
        .cnd-search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 320px; }
        .cnd-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
        .cnd-search {
          width: 100%; padding: 10px 14px 10px 38px; border-radius: 11px;
          border: 1.5px solid var(--border-input); background: var(--surface-card);
          color: var(--text-primary); font-size: 14px; font-family: var(--font-body); outline: none;
          transition: all var(--transition-fast);
        }
        .cnd-search:focus { border-color: var(--brand-primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }

        /* Candidate table */
        .cnd-table-wrap { background: var(--surface-card); border: 1.5px solid var(--border-soft); border-radius: 18px; overflow: hidden; box-shadow: var(--shadow-card); }
        .cnd-table { width: 100%; border-collapse: collapse; }
        .cnd-table th { padding: 12px 16px; text-align: left; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); border-bottom: 1px solid var(--border-muted); background: var(--surface-hover); white-space: nowrap; }
        .cnd-table td { padding: 14px 16px; border-bottom: 1px solid var(--border-muted); vertical-align: middle; }
        .cnd-table tr:last-child td { border-bottom: none; }
        .cnd-table tr { transition: background var(--transition-fast); }
        .cnd-table tbody tr:hover { background: var(--surface-hover); }
        .cnd-td-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #7c3aed); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: 700; flex-shrink: 0; }
        .cnd-skill-tag { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11.5px; font-weight: 600; background: rgba(37,99,235,0.07); color: #2563eb; }
        .cnd-view-link { display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; font-weight: 700; color: var(--brand-primary); text-decoration: none; transition: gap var(--transition-fast); }
        .cnd-view-link:hover { gap: 7px; }

        @media (max-width: 768px) { .cnd-main { margin-left: 0; } .cnd-body { padding: 20px 16px 80px; } .cnd-table th:nth-child(3), .cnd-table td:nth-child(3) { display: none; } }
      `}</style>

      <div className="cnd-root">
        <Sidebar />
        <div className="cnd-main">
          <AppHeader title="Candidates" subtitle="Browse and filter candidates by job" />
          <div className="cnd-body">

            {/* FIX 4: Job selector + Load Applicants button */}
            <div className="cnd-selector">
              <p className="cnd-selector-title">
                <Briefcase size={17} color="#2563eb" /> Select a Job
              </p>
              <p className="cnd-selector-sub">
                Choose a job, then click <strong>Load Applicants</strong> to see the candidates for that position.
              </p>
              <div className="cnd-select-row">
                <div className="cnd-select-wrap">
                  <span className="cnd-select-icon"><Briefcase size={15} /></span>
                  <select
                    className="cnd-select"
                    value={selectedJobId}
                    onChange={(e) => handleJobChange(e.target.value)}
                    disabled={loadingJobs}
                  >
                    <option value="">{loadingJobs ? "Loading jobs…" : "Choose a job…"}</option>
                    {jobs.map((j) => (
                      <option key={j._id} value={j._id}>{j.title}</option>
                    ))}
                  </select>
                </div>
                <button
                  className="cnd-load-btn"
                  onClick={handleLoadApplicants}
                  disabled={!selectedJobId || loadingCandidates}
                >
                  <Users size={15} />
                  {loadingCandidates ? "Loading…" : "Load Applicants"}
                </button>
              </div>
              {selectedJob && candidatesLoaded && (
                <div className="cnd-job-info">
                  <Briefcase size={14} color="#2563eb" />
                  <strong>{selectedJob.title}</strong>
                  <span>·</span>
                  <span>{candidates.length} candidate{candidates.length !== 1 ? "s" : ""} loaded</span>
                  <Link href={`/applicants?jobId=${selectedJobId}`} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 700, color: "#2563eb", textDecoration: "none" }}>
                    <Upload size={12} /> Add candidates <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </div>

            {/* Search toolbar — only shown when candidates loaded */}
            {candidatesLoaded && candidates.length > 0 && (
              <div className="cnd-toolbar">
                <div className="cnd-search-wrap">
                  <span className="cnd-search-icon"><Search size={15} /></span>
                  <input className="cnd-search" placeholder="Search by name, email, skill…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <p style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>
                  {filtered.length} candidate{filtered.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            {/* Loading state */}
            {loadingCandidates && <LoadingSpinner label="Loading candidates…" />}

            {/* FIX 4: Instructional empty states */}
            {!loadingCandidates && !candidatesLoaded && !selectedJobId && (
              <div className="empty-state" style={{ background: "var(--surface-card)", border: "1.5px solid var(--border-soft)", borderRadius: 18 }}>
                <div className="empty-icon" style={{ background: "rgba(37,99,235,0.07)" }}>
                  <Users size={28} color="#2563eb" />
                </div>
                <p style={{ fontWeight: 700, fontSize: 17, color: "var(--text-primary)" }}>Select a job above</p>
                <p style={{ color: "var(--text-muted)", fontSize: 14, maxWidth: 320, textAlign: "center", lineHeight: 1.6 }}>
                  Choose a job from the dropdown, then click <strong>Load Applicants</strong> to view candidates for that position.
                </p>
              </div>
            )}

            {!loadingCandidates && !candidatesLoaded && selectedJobId && (
              <div className="empty-state" style={{ background: "var(--surface-card)", border: "1.5px solid var(--border-soft)", borderRadius: 18 }}>
                <div className="empty-icon" style={{ background: "rgba(37,99,235,0.07)" }}>
                  <Users size={28} color="#2563eb" />
                </div>
                <p style={{ fontWeight: 700, fontSize: 17, color: "var(--text-primary)" }}>
                  {selectedJob?.title || "Job"} selected
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: 14, maxWidth: 320, textAlign: "center", lineHeight: 1.6 }}>
                  Click <strong>Load Applicants</strong> to view candidates for this position.
                </p>
              </div>
            )}

            {/* Empty after load */}
            {!loadingCandidates && candidatesLoaded && candidates.length === 0 && (
              <div className="empty-state" style={{ background: "var(--surface-card)", border: "1.5px solid var(--border-soft)", borderRadius: 18 }}>
                <div className="empty-icon">
                  <Users size={28} color="var(--text-muted)" />
                </div>
                <p style={{ fontWeight: 700, fontSize: 17, color: "var(--text-primary)" }}>No candidates yet</p>
                <p style={{ color: "var(--text-muted)", fontSize: 14, maxWidth: 320, textAlign: "center", lineHeight: 1.6 }}>
                  Upload candidates to this job to start AI screening.
                </p>
                <Link href={`/applicants?jobId=${selectedJobId}`} className="btn-primary" style={{ marginTop: 10 }}>
                  <Upload size={14} /> Upload Candidates
                </Link>
              </div>
            )}

            {/* Candidates table */}
            {!loadingCandidates && candidatesLoaded && filtered.length > 0 && (
              <div className="cnd-table-wrap">
                <table className="cnd-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Email</th>
                      <th>Location</th>
                      <th>Skills</th>
                      <th>AI Score</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c, i) => {
                      const name = `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Unknown";
                      const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
                      const skills = c.skills?.slice(0, 3) || [];
                      const scoreInfo = c.aiScore != null ? scoreLabel(c.aiScore) : null;
                      return (
                        <tr key={c._id || i}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div className="cnd-td-avatar">{initials || <User size={14} />}</div>
                              <div>
                                <p style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{name}</p>
                                {c.headline && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{c.headline}</p>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)" }}>
                              <Mail size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                              {c.email || "—"}
                            </div>
                          </td>
                          <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                            {c.location ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <MapPin size={12} style={{ color: "var(--text-muted)" }} />
                                {c.location}
                              </div>
                            ) : "—"}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                              {skills.length > 0
                                ? skills.map((s: any, si: number) => (
                                    <span key={si} className="cnd-skill-tag">
                                      {typeof s === "string" ? s : s.name}
                                    </span>
                                  ))
                                : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                              }
                            </div>
                          </td>
                          <td>
                            {scoreInfo ? (
                              <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11.5, fontWeight: 700, background: scoreInfo.bg, color: scoreInfo.color }}>
                                {c.aiScore} · {scoreInfo.label}
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
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

            {/* Search no results */}
            {!loadingCandidates && candidatesLoaded && candidates.length > 0 && filtered.length === 0 && (
              <div className="empty-state" style={{ background: "var(--surface-card)", border: "1.5px solid var(--border-soft)", borderRadius: 18 }}>
                <div className="empty-icon"><Search size={24} color="var(--text-muted)" /></div>
                <p style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>No matches found</p>
                <p style={{ color: "var(--text-muted)", fontSize: 14, textAlign: "center" }}>Try a different name, email or skill.</p>
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