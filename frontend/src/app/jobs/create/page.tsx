"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { addJob } from "../../../store/slices/jobSlice";
import { AppDispatch } from "../../../store";
import Sidebar from "../../../components/Sidebar";
import AppHeader from "../../../components/AppHeader";
import toast from "react-hot-toast";
import { X, Plus, ArrowLeft, Briefcase, MapPin, GraduationCap, Clock, ChevronRight, Sparkles } from "lucide-react";

export default function CreateJobPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    requiredSkills: [] as string[],
    yearsOfExperience: 1,
    educationLevel: "Bachelor",
    location: "",
    jobType: "Full-time",
  });

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.requiredSkills.includes(s)) {
      setForm({ ...form, requiredSkills: [...form.requiredSkills, s] });
    }
    setSkillInput("");
  };

  const removeSkill = (s: string) =>
    setForm({ ...form, requiredSkills: form.requiredSkills.filter((x) => x !== s) });

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    if (form.requiredSkills.length === 0) {
      toast.error("Add at least one required skill");
      return;
    }
    setLoading(true);
    try {
      const job = await dispatch(addJob(form)).unwrap();
      toast.success("Job created!");
      router.push(`/jobs/${job._id}`);
    } catch (err: unknown) {
      toast.error(typeof err === "string" ? err : "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .cj-root { display: flex; font-family: var(--font-body, system-ui); }
        .cj-main { margin-left: var(--sidebar-width); min-height: 100vh; background: var(--surface-base); flex: 1; display: flex; flex-direction: column; }
        .cj-body { padding: 28px 40px 100px; flex: 1; animation: fadeIn 0.28s ease; }
        .cj-back {
          display: inline-flex; align-items: center; gap: 7px; color: var(--text-muted); font-size: 13px; font-weight: 600;
          background: none; border: none; cursor: pointer; margin-bottom: 24px; padding: 0; transition: color var(--transition-fast);
        }
        .cj-back:hover { color: var(--text-primary); }
        .cj-layout { display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: start; max-width: 1000px; }
        .cj-form { background: var(--surface-card); border-radius: 18px; border: 1.5px solid var(--border-soft); padding: 32px; box-shadow: var(--shadow-card); }
        .cj-section-title {
          font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em;
          margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid var(--border-muted);
        }
        .cj-label { display: block; font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.06em; }
        .cj-input {
          width: 100%; padding: 11px 14px; border-radius: 10px; border: 1.5px solid var(--border-input);
          font-size: 14px; color: var(--text-primary); outline: none; background: var(--surface-input);
          font-family: var(--font-body); transition: all var(--transition-fast);
        }
        .cj-input:focus { border-color: var(--brand-primary); background: var(--surface-card); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .cj-input::placeholder { color: var(--text-muted); }
        .cj-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .cj-skill-row { display: flex; gap: 8px; margin-bottom: 10px; }
        .cj-skill-add {
          padding: 0 16px; height: 44px; border-radius: 10px; background: var(--brand-primary); color: white;
          border: none; cursor: pointer; font-weight: 700; font-size: 13px; white-space: nowrap;
          font-family: var(--font-body); transition: all var(--transition-fast); display: flex; align-items: center; gap: 5px;
        }
        .cj-skill-add:hover { background: #1d4ed8; transform: translateY(-1px); }
        .cj-skill-tag {
          display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 8px;
          background: rgba(37,99,235,0.08); color: #2563eb; font-size: 12px; font-weight: 600; border: 1px solid rgba(37,99,235,0.15);
        }
        .cj-skill-remove { background: none; border: none; cursor: pointer; color: #60a5fa; padding: 0; display: flex; transition: color var(--transition-fast); }
        .cj-skill-remove:hover { color: #dc2626; }
        .cj-actions { display: flex; gap: 10px; margin-top: 28px; }
        .cj-cancel {
          flex: 1; padding: 13px; border-radius: 12px; border: 1.5px solid var(--border-soft);
          background: var(--surface-card); font-weight: 600; color: var(--text-secondary);
          cursor: pointer; font-family: var(--font-body); transition: all var(--transition-fast);
        }
        .cj-cancel:hover { background: var(--surface-hover); }
        .cj-submit {
          flex: 2; padding: 13px; border-radius: 12px; border: none;
          background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; font-weight: 700;
          cursor: pointer; font-family: var(--font-body); display: flex; align-items: center; justify-content: center; gap: 8px;
          font-size: 14px; box-shadow: 0 4px 14px rgba(37,99,235,0.3); transition: all var(--transition-fast);
        }
        .cj-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.4); }
        .cj-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

        /* Preview sidebar */
        .cj-side { background: var(--surface-card); border-radius: 18px; border: 1.5px solid var(--border-soft); padding: 22px; box-shadow: var(--shadow-card); position: sticky; top: 80px; }
        .cj-preview-title { font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px; display: flex; align-items: center; gap: 7px; }
        .cj-preview-item { display: flex; gap: 10px; padding: 11px 0; border-bottom: 1px solid var(--border-muted); }
        .cj-preview-label { font-size: 10.5px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
        .cj-preview-value { font-size: 13px; font-weight: 600; color: var(--text-primary); margin-top: 3px; }

        @media (max-width: 900px) { .cj-layout { grid-template-columns: 1fr; } .cj-main { margin-left: 0; } .cj-body { padding: 20px 16px 80px; } }
      `}</style>

      <div className="cj-root">
        <Sidebar />
        <div className="cj-main">
          <AppHeader title="Post a Job" subtitle="Define role requirements for AI screening" />
          <div className="cj-body">
            <button type="button" className="cj-back" onClick={() => router.back()}>
              <ArrowLeft size={15} /> Back
            </button>

            <div className="cj-layout">
              <div className="cj-form">
                <div style={{ marginBottom: 28 }}>
                  <p className="cj-section-title">Basics</p>
                  <div style={{ marginBottom: 14 }}>
                    <span className="cj-label">Job title</span>
                    <input className="cj-input" type="text" placeholder="e.g. Senior React Developer" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div>
                    <span className="cj-label">Job description</span>
                    <textarea
                      className="cj-input"
                      rows={5}
                      placeholder="Role, responsibilities, success criteria…"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      style={{ resize: "none" }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 28 }}>
                  <p className="cj-section-title">Required skills</p>
                  <div className="cj-skill-row">
                    <input
                      className="cj-input"
                      type="text"
                      placeholder="Type a skill and press Add or Enter"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                      style={{ flex: 1 }}
                    />
                    <button type="button" className="cj-skill-add" onClick={addSkill}>
                      <Plus size={14} /> Add
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {form.requiredSkills.map((s) => (
                      <span key={s} className="cj-skill-tag">
                        {s}
                        <button type="button" className="cj-skill-remove" onClick={() => removeSkill(s)}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    {form.requiredSkills.length === 0 && (
                      <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No skills added yet</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="cj-section-title">Requirements</p>
                  <div className="cj-two-col" style={{ marginBottom: 14 }}>
                    <div>
                      <span className="cj-label">Years of experience</span>
                      <input className="cj-input" type="number" min={0} max={40} value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: parseInt(e.target.value, 10) || 0 })} />
                    </div>
                    <div>
                      <span className="cj-label">Education level</span>
                      <select className="cj-input" value={form.educationLevel} onChange={(e) => setForm({ ...form, educationLevel: e.target.value })} style={{ cursor: "pointer" }}>
                        <option>High School</option>
                        <option>Bachelor</option>
                        <option>Master</option>
                        <option>PhD</option>
                        <option>Any</option>
                      </select>
                    </div>
                  </div>
                  <div className="cj-two-col">
                    <div>
                      <span className="cj-label">Location</span>
                      <input className="cj-input" type="text" placeholder="City, country or Remote" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                    </div>
                    <div>
                      <span className="cj-label">Job type</span>
                      <select className="cj-input" value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })} style={{ cursor: "pointer" }}>
                        <option>Full-time</option>
                        <option>Part-time</option>
                        <option>Contract</option>
                        <option>Remote</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="cj-actions">
                  <button type="button" className="cj-cancel" onClick={() => router.back()}>Cancel</button>
                  <button type="button" className="cj-submit" disabled={loading} onClick={submit}>
                    {loading ? (
                      <>
                        <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.75s linear infinite" }} />
                        Creating…
                      </>
                    ) : (
                      <><Sparkles size={15} /> Post Job <ChevronRight size={15} /></>
                    )}
                  </button>
                </div>
              </div>

              {/* Live preview */}
              <div className="cj-side">
                <p className="cj-preview-title">
                  <Briefcase size={15} color="#2563eb" /> Preview
                </p>
                {[
                  { icon: <Briefcase size={13} color="#2563eb" />, label: "Title", value: form.title || "—" },
                  { icon: <MapPin size={13} color="#2563eb" />, label: "Location · Type", value: `${form.location || "—"} · ${form.jobType}` },
                  { icon: <Clock size={13} color="#2563eb" />, label: "Experience", value: `${form.yearsOfExperience}+ years` },
                  { icon: <GraduationCap size={13} color="#2563eb" />, label: "Education", value: form.educationLevel },
                ].map((p) => (
                  <div key={p.label} className="cj-preview-item">
                    {p.icon}
                    <div>
                      <p className="cj-preview-label">{p.label}</p>
                      <p className="cj-preview-value">{p.value}</p>
                    </div>
                  </div>
                ))}
                {form.requiredSkills.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <p className="cj-preview-label" style={{ marginBottom: 8 }}>Skills</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {form.requiredSkills.map((s) => (
                        <span key={s} style={{ padding: "3px 9px", borderRadius: 6, background: "rgba(37,99,235,0.08)", color: "#2563eb", fontSize: 11.5, fontWeight: 600 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}