"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import { getJob } from "../../../services/jobService";
import Link from "next/link";
import {
  ArrowLeft, Brain, MapPin, Users, BookOpen,
  Clock, Briefcase, ChevronRight,
} from "lucide-react";

export default function JobDetailPage() {
  const { id }     = useParams();
  const router     = useRouter();
  const [job, setJob]         = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) getJob(id as string).then((d) => setJob(d.job)).finally(() => setLoading(false));
  }, [id]);

  const statusMap: Record<string, { bg: string; color: string }> = {
    open:      { bg: "#dcfce7", color: "#16a34a" },
    screening: { bg: "#dbeafe", color: "#2563eb" },
    closed:    { bg: "#f1f5f9", color: "#64748b" },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

        .jd-root { display: flex; font-family: 'DM Sans', sans-serif; }
        .jd-main { margin-left: 260px; min-height: 100vh; padding: 36px 40px; background: #f1f5f9; flex: 1; }

        .back-btn {
          display: inline-flex; align-items: center; gap: 7px;
          color: #64748b; font-size: 13.5px; font-weight: 600;
          background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          margin-bottom: 24px; padding: 0; transition: color 0.15s;
        }
        .back-btn:hover { color: #1e293b; }

        .jd-card { background: white; border-radius: 18px; border: 1px solid #e2e8f0; padding: 32px; margin-bottom: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); max-width: 800px; }

        .jd-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
        .jd-title  { font-family: 'Sora', sans-serif; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
        .status-badge { padding: 5px 14px; border-radius: 20px; font-size: 12.5px; font-weight: 700; }

        .jd-desc { color: #475569; line-height: 1.7; font-size: 14px; margin-bottom: 24px; }

        .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
        .meta-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
        .meta-icon { width: 34px; height: 34px; border-radius: 9px; background: #eff6ff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .meta-label { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
        .meta-value { font-size: 14px; font-weight: 700; color: #1e293b; margin-top: 1px; }

        .skills-section { margin-bottom: 24px; }
        .skills-label   { font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 10px; }
        .skill-chips    { display: flex; flex-wrap: wrap; gap: 7px; }
        .skill-chip { padding: 5px 13px; background: #eff6ff; color: #2563eb; border-radius: 9px; font-size: 12.5px; font-weight: 600; border: 1px solid #bfdbfe; }

        .action-row { display: flex; gap: 12px; max-width: 800px; }
        .btn-add {
          flex: 1; padding: 13px; border-radius: 12px;
          border: 2px solid #2563eb; background: white;
          color: #2563eb; font-weight: 700; font-size: 14px;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.15s;
        }
        .btn-add:hover { background: #eff6ff; }
        .btn-screen {
          flex: 2; padding: 13px; border-radius: 12px; border: none;
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          color: white; font-weight: 700; font-size: 14px;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 14px rgba(124,58,237,0.25);
          transition: all 0.15s;
        }
        .btn-screen:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,58,237,0.35); }

        .state-card { background: white; border-radius: 18px; border: 1px solid #e2e8f0; padding: 72px 40px; text-align: center; }
      `}</style>

      <div className="jd-root">
        <Sidebar />
        <main className="jd-main">
          <button className="back-btn" onClick={() => router.back()}>
            <ArrowLeft size={15} /> Back to Jobs
          </button>

          {loading ? (
            <div className="state-card">
              <p style={{ color: "#94a3b8" }}>Loading job details…</p>
            </div>
          ) : !job ? (
            <div className="state-card">
              <p style={{ color: "#64748b", fontWeight: 600 }}>Job not found</p>
            </div>
          ) : (
            <>
              <div className="jd-card">
                <div className="jd-header">
                  <h1 className="jd-title">{job.title}</h1>
                  <span
                    className="status-badge"
                    style={statusMap[job.status] ?? statusMap.closed}
                  >
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                </div>

                {job.description && (
                  <p className="jd-desc">{job.description}</p>
                )}

                <div className="meta-grid">
                  {[
                    { icon: MapPin,    label: "Location",   value: job.location || "—"                     },
                    { icon: Clock,     label: "Experience", value: `${job.yearsOfExperience}+ years`        },
                    { icon: BookOpen,  label: "Education",  value: job.educationLevel || "—"                },
                    { icon: Briefcase, label: "Job Type",   value: job.jobType || "Full-time"               },
                    { icon: Users,     label: "Applicants", value: `${job.applicantsCount || 0} applied`    },
                  ].map((m) => (
                    <div key={m.label} className="meta-item">
                      <div className="meta-icon"><m.icon size={16} color="#2563eb" /></div>
                      <div>
                        <p className="meta-label">{m.label}</p>
                        <p className="meta-value">{m.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {job.requiredSkills?.length > 0 && (
                  <div className="skills-section">
                    <p className="skills-label">Required Skills</p>
                    <div className="skill-chips">
                      {job.requiredSkills.map((s: string) => (
                        <span key={s} className="skill-chip">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="action-row">
                <Link href="/applicants/upload" style={{ flex: 1 }}>
                  <button className="btn-add" style={{ width: "100%" }}>
                    <Users size={16} /> Add Applicants
                  </button>
                </Link>
                <Link href={`/screening/${job._id}`} style={{ flex: 2 }}>
                  <button className="btn-screen" style={{ width: "100%" }}>
                    <Brain size={16} /> Run AI Screening
                    <ChevronRight size={15} />
                  </button>
                </Link>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}