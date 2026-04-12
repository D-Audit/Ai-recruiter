"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { addJob } from "../../../store/slices/jobSlice";
import { AppDispatch } from "../../../store";
import Sidebar from "../../../components/Sidebar";
import AppHeader from "../../../components/AppHeader";
import toast from "react-hot-toast";
import {
  X,
  Plus,
  ArrowLeft,
  Briefcase,
  MapPin,
  GraduationCap,
  Clock,
  ChevronRight,
} from "lucide-react";

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
    setForm({
      ...form,
      requiredSkills: form.requiredSkills.filter((x) => x !== s),
    });

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
        .cj-root { display: flex; font-family: system-ui, sans-serif; }
        .cj-main { margin-left: 260px; min-height: 100vh; background: #f8fafc; flex: 1; display: flex; flex-direction: column; }
        .cj-body { padding: 36px 40px; flex: 1; }
        .cj-back {
          display: inline-flex; align-items: center; gap: 7px; color: #64748b; font-size: 13px; font-weight: 600;
          background: none; border: none; cursor: pointer; margin-bottom: 20px; padding: 0;
        }
        .cj-back:hover { color: #1e293b; }
        .cj-layout { display: grid; grid-template-columns: 1fr 320px; gap: 24px; align-items: start; max-width: 1100px; }
        .cj-form {
          background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px;
        }
        .section-title {
          font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;
          margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9;
        }
        .field-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
        .field-input {
          width: 100%; padding: 11px 14px; border-radius: 10px; border: 1.5px solid #e2e8f0;
          font-size: 14px; color: #1e293b; outline: none; background: #fafafa;
        }
        .field-input:focus { border-color: #2563eb; background: #fff; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .skill-row { display: flex; gap: 8px; margin-bottom: 10px; }
        .skill-add-btn {
          padding: 0 16px; height: 44px; border-radius: 10px; background: #2563eb; color: white;
          border: none; cursor: pointer; font-weight: 700; font-size: 13px; white-space: nowrap;
        }
        .skill-tag {
          display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 8px;
          background: #eff6ff; color: #2563eb; font-size: 12px; font-weight: 600; border: 1px solid #bfdbfe;
        }
        .skill-remove { background: none; border: none; cursor: pointer; color: #60a5fa; padding: 0; }
        .skill-remove:hover { color: #dc2626; }
        .form-actions { display: flex; gap: 10px; margin-top: 24px; }
        .btn-cancel {
          flex: 1; padding: 13px; border-radius: 11px; border: 1.5px solid #e2e8f0; background: white;
          font-weight: 600; color: #64748b; cursor: pointer;
        }
        .btn-submit {
          flex: 2; padding: 13px; border-radius: 11px; border: none;
          background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; font-weight: 700;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .cj-side { background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 22px; }
        .preview-item { display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f8fafc; }
        .preview-label { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
        .preview-value { font-size: 13px; font-weight: 600; color: #1e293b; margin-top: 2px; }
        @media (max-width: 960px) { .cj-layout { grid-template-columns: 1fr; } .cj-main { margin-left: 0; } }
      `}</style>

      <div className="cj-root">
        <Sidebar />
        <div className="cj-main">
          <AppHeader title="Create Job" />
          <div className="cj-body">
            <button
              type="button"
              className="cj-back"
              onClick={() => router.back()}
            >
              <ArrowLeft size={15} /> Back
            </button>

            <div className="cj-layout">
              <div className="cj-form">
                <div style={{ marginBottom: 28 }}>
                  <p className="section-title">Basics</p>
                  <div style={{ marginBottom: 14 }}>
                    <span className="field-label">Job title</span>
                    <input
                      className="field-input"
                      type="text"
                      placeholder="e.g. Senior React Developer"
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <span className="field-label">Job description</span>
                    <textarea
                      className="field-input"
                      rows={5}
                      placeholder="Role, responsibilities, success criteria…"
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      style={{ resize: "none" }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 28 }}>
                  <p className="section-title">Required skills</p>
                  <div className="skill-row">
                    <input
                      className="field-input"
                      type="text"
                      placeholder="Type a skill, Enter or Add"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="skill-add-btn"
                      onClick={addSkill}
                    >
                      <Plus size={15} /> Add
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {form.requiredSkills.map((s) => (
                      <span key={s} className="skill-tag">
                        {s}
                        <button
                          type="button"
                          className="skill-remove"
                          onClick={() => removeSkill(s)}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="section-title">Requirements</p>
                  <div className="two-col" style={{ marginBottom: 14 }}>
                    <div>
                      <span className="field-label">Years of experience</span>
                      <input
                        className="field-input"
                        type="number"
                        min={0}
                        max={40}
                        value={form.yearsOfExperience}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            yearsOfExperience: parseInt(e.target.value, 10) || 0,
                          })
                        }
                      />
                    </div>
                    <div>
                      <span className="field-label">Education level</span>
                      <select
                        className="field-input"
                        value={form.educationLevel}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            educationLevel: e.target.value,
                          })
                        }
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
                      <span className="field-label">Location</span>
                      <input
                        className="field-input"
                        type="text"
                        placeholder="City, country"
                        value={form.location}
                        onChange={(e) =>
                          setForm({ ...form, location: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <span className="field-label">Job type</span>
                      <select
                        className="field-input"
                        value={form.jobType}
                        onChange={(e) =>
                          setForm({ ...form, jobType: e.target.value })
                        }
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
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-submit"
                    disabled={loading}
                    onClick={submit}
                  >
                    {loading ? "Creating…" : (
                      <>
                        Submit <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="cj-side">
                <p
                  style={{
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: 16,
                    fontSize: 15,
                  }}
                >
                  Preview
                </p>
                <div className="preview-item">
                  <Briefcase size={14} color="#2563eb" />
                  <div>
                    <p className="preview-label">Title</p>
                    <p className="preview-value">{form.title || "—"}</p>
                  </div>
                </div>
                <div className="preview-item">
                  <MapPin size={14} color="#2563eb" />
                  <div>
                    <p className="preview-label">Location · Type</p>
                    <p className="preview-value">
                      {form.location || "—"} · {form.jobType}
                    </p>
                  </div>
                </div>
                <div className="preview-item">
                  <Clock size={14} color="#2563eb" />
                  <div>
                    <p className="preview-label">Experience</p>
                    <p className="preview-value">
                      {form.yearsOfExperience}+ years
                    </p>
                  </div>
                </div>
                <div className="preview-item">
                  <GraduationCap size={14} color="#2563eb" />
                  <div>
                    <p className="preview-label">Education</p>
                    <p className="preview-value">{form.educationLevel}</p>
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
