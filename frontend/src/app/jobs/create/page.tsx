"use client";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { addJob } from "../../../store/slices/jobSlice";
import { AppDispatch } from "../../../store";
import Sidebar from "../../../components/Sidebar";
import toast from "react-hot-toast";
import { X, Plus, ArrowLeft, Briefcase, MapPin, GraduationCap, Clock, ChevronRight } from "lucide-react";

export default function CreateJobPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router   = useRouter();
  const [loading, setLoading]       = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.requiredSkills.length === 0) { toast.error("Add at least one required skill"); return; }
    setLoading(true);
    try {
      await dispatch(addJob(form)).unwrap();
      toast.success("Job created successfully!");
      router.push("/jobs");
    } catch (err: any) {
      toast.error(err || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

        .cj-root { display: flex; font-family: 'DM Sans', sans-serif; }

        .cj-main {
          margin-left: 260px;
          min-height: 100vh;
          padding: 36px 40px;
          background: #f1f5f9;
          flex: 1;
        }

        .cj-back {
          display: inline-flex; align-items: center; gap: 7px;
          color: #64748b; font-size: 13.5px; font-weight: 600;
          background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          margin-bottom: 24px;
          padding: 0;
          transition: color 0.15s;
        }
        .cj-back:hover { color: #1e293b; }

        .cj-header { margin-bottom: 28px; }
        .cj-title  { font-family: 'Sora', sans-serif; font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
        .cj-sub    { color: #64748b; font-size: 14px; font-weight: 500; margin-top: 4px; }

        .cj-layout { display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }

        .cj-form {
          background: white;
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          padding: 32px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        .section-title {
          font-size: 11px; font-weight: 700; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.1em;
          margin-bottom: 16px; padding-bottom: 10px;
          border-bottom: 1px solid #f1f5f9;
        }

        .form-section { margin-bottom: 28px; }

        .field-label {
          display: block; font-size: 13px; font-weight: 600;
          color: #374151; margin-bottom: 7px;
        }

        .field-input {
          width: 100%;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          font-size: 14px;
          color: #1e293b;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          background: #fafafa;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .field-input::placeholder { color: #c4cdd6; }
        .field-input:focus { border-color: #2563eb; background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }

        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

        /* Skills */
        .skill-row { display: flex; gap: 8px; margin-bottom: 10px; }
        .skill-add-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 0 16px; height: 44px; border-radius: 10px;
          background: #2563eb; color: white;
          border: none; cursor: pointer; font-weight: 700; font-size: 13px;
          font-family: 'DM Sans', sans-serif; white-space: nowrap;
          transition: background 0.15s;
        }
        .skill-add-btn:hover { background: #1d4ed8; }

        .skill-tags { display: flex; flex-wrap: wrap; gap: 7px; min-height: 34px; }
        .skill-tag {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 10px; border-radius: 8px;
          background: #eff6ff; color: #2563eb;
          font-size: 12.5px; font-weight: 600; border: 1px solid #bfdbfe;
        }
        .skill-remove {
          background: none; border: none; cursor: pointer;
          color: #60a5fa; display: flex; align-items: center;
          padding: 0; transition: color 0.15s;
        }
        .skill-remove:hover { color: #dc2626; }

        /* Sidebar card */
        .cj-sidebar-card {
          background: white; border-radius: 18px;
          border: 1px solid #e2e8f0;
          padding: 24px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        .preview-heading { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }

        .preview-item {
          display: flex; align-items: flex-start; gap: 11px;
          padding: 10px 0;
          border-bottom: 1px solid #f8fafc;
        }
        .preview-item:last-of-type { border-bottom: none; }
        .preview-icon { width: 28px; height: 28px; border-radius: 8px; background: #eff6ff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
        .preview-label { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
        .preview-value { font-size: 13.5px; color: #1e293b; font-weight: 600; margin-top: 2px; }

        /* Tip box */
        .tip-box {
          margin-top: 16px; padding: 14px 16px;
          background: linear-gradient(135deg, rgba(37,99,235,0.04), rgba(124,58,237,0.04));
          border: 1px solid rgba(37,99,235,0.12);
          border-radius: 12px;
        }
        .tip-title { font-size: 12px; font-weight: 700; color: #2563eb; margin-bottom: 4px; }
        .tip-text  { font-size: 12px; color: #64748b; line-height: 1.55; }

        /* Submit buttons */
        .form-actions { display: flex; gap: 10px; padding-top: 8px; }

        .btn-cancel {
          flex: 1; padding: 13px; border-radius: 11px;
          border: 1.5px solid #e2e8f0; background: white;
          font-weight: 600; font-size: 14px; color: #64748b;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }
        .btn-cancel:hover { background: #f8fafc; border-color: #cbd5e1; }

        .btn-submit {
          flex: 2; padding: 13px; border-radius: 11px;
          border: none;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white; font-weight: 700; font-size: 14.5px;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 14px rgba(37,99,235,0.28);
          transition: all 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.36); }
        .btn-submit:disabled { background: #e2e8f0; color: #94a3b8; box-shadow: none; cursor: not-allowed; transform: none; }
      `}</style>

      <div className="cj-root">
        <Sidebar />
        <main className="cj-main">
          <button className="cj-back" onClick={() => router.back()}>
            <ArrowLeft size={15} /> Back
          </button>

          <div className="cj-header">
            <h1 className="cj-title">Create New Job</h1>
            <p className="cj-sub">Fill in the details — AI will use these to screen candidates</p>
          </div>

          <div className="cj-layout">
            {/* Main form */}
            <form onSubmit={handleSubmit} className="cj-form">

              <div className="form-section">
                <p className="section-title">Basic Information</p>
                <div style={{ marginBottom: "14px" }}>
                  <label className="field-label">Job Title *</label>
                  <input
                    className="field-input"
                    type="text"
                    placeholder="e.g. Senior React Developer"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Job Description *</label>
                  <textarea
                    className="field-input"
                    placeholder="Describe the role, responsibilities, and what success looks like…"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                    rows={4}
                    style={{ resize: "none" }}
                  />
                </div>
              </div>

              <div className="form-section">
                <p className="section-title">Required Skills</p>
                <div className="skill-row">
                  <input
                    className="field-input"
                    type="text"
                    placeholder="Type a skill and press Enter or click Add…"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="skill-add-btn" onClick={addSkill}>
                    <Plus size={15} /> Add
                  </button>
                </div>
                <div className="skill-tags">
                  {form.requiredSkills.length === 0 ? (
                    <span style={{ color: "#94a3b8", fontSize: "13px", alignSelf: "center" }}>No skills added yet</span>
                  ) : (
                    form.requiredSkills.map((s) => (
                      <span key={s} className="skill-tag">
                        {s}
                        <button type="button" className="skill-remove" onClick={() => removeSkill(s)}>
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="form-section">
                <p className="section-title">Requirements</p>
                <div className="two-col" style={{ marginBottom: "14px" }}>
                  <div>
                    <label className="field-label">Years of Experience *</label>
                    <input
                      className="field-input"
                      type="number" min={0} max={20}
                      value={form.yearsOfExperience}
                      onChange={(e) => setForm({ ...form, yearsOfExperience: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="field-label">Education Level *</label>
                    <select
                      className="field-input"
                      value={form.educationLevel}
                      onChange={(e) => setForm({ ...form, educationLevel: e.target.value })}
                    >
                      <option>High School</option>
                      <option>Bachelor</option>
                      <option>Master</option>
                      <option>PhD</option>
                      <option>Any</option>
                    </select>
                  </div>
                </div>
                <div className="two-col">
                  <div>
                    <label className="field-label">Location *</label>
                    <input
                      className="field-input"
                      type="text"
                      placeholder="e.g. Kigali, Rwanda"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label">Job Type</label>
                    <select
                      className="field-input"
                      value={form.jobType}
                      onChange={(e) => setForm({ ...form, jobType: e.target.value })}
                    >
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Contract</option>
                      <option>Remote</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => router.back()}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-submit">
                  {loading ? "Creating…" : <><span>Create Job</span><ChevronRight size={16} /></>}
                </button>
              </div>
            </form>

            {/* Right sidebar card */}
            <div>
              <div className="cj-sidebar-card">
                <p className="preview-heading">Job Preview</p>

                <div className="preview-item">
                  <div className="preview-icon"><Briefcase size={14} color="#2563eb" /></div>
                  <div>
                    <p className="preview-label">Title</p>
                    <p className="preview-value">{form.title || "—"}</p>
                  </div>
                </div>

                <div className="preview-item">
                  <div className="preview-icon"><MapPin size={14} color="#2563eb" /></div>
                  <div>
                    <p className="preview-label">Location · Type</p>
                    <p className="preview-value">{form.location || "—"} · {form.jobType}</p>
                  </div>
                </div>

                <div className="preview-item">
                  <div className="preview-icon"><Clock size={14} color="#2563eb" /></div>
                  <div>
                    <p className="preview-label">Experience</p>
                    <p className="preview-value">{form.yearsOfExperience}+ years</p>
                  </div>
                </div>

                <div className="preview-item">
                  <div className="preview-icon"><GraduationCap size={14} color="#2563eb" /></div>
                  <div>
                    <p className="preview-label">Education</p>
                    <p className="preview-value">{form.educationLevel}</p>
                  </div>
                </div>

                {form.requiredSkills.length > 0 && (
                  <div style={{ marginTop: "12px" }}>
                    <p className="preview-label" style={{ marginBottom: "8px" }}>Skills</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                      {form.requiredSkills.map((s) => (
                        <span key={s} style={{ padding: "3px 9px", background: "#eff6ff", color: "#2563eb", borderRadius: "7px", fontSize: "11.5px", fontWeight: 600 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="tip-box">
                  <p className="tip-title">💡 AI Screening Tip</p>
                  <p className="tip-text">The more specific your skills list, the more accurate the AI shortlist will be. Add 5–10 skills for best results.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}