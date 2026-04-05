"use client";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { addJob } from "../../../store/slices/jobSlice";
import { AppDispatch } from "../../../store";
import Sidebar from "../../../components/Sidebar";
import toast from "react-hot-toast";
import { X, Plus } from "lucide-react";

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
    const skill = skillInput.trim();
    if (skill && !form.requiredSkills.includes(skill)) {
      setForm({ ...form, requiredSkills: [...form.requiredSkills, skill] });
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setForm({
      ...form,
      requiredSkills: form.requiredSkills.filter((s) => s !== skill),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.requiredSkills.length === 0) {
      toast.error("Add at least one required skill");
      return;
    }
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

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    outline: "none",
    color: "#1e293b",
  };

  const labelStyle = {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "6px",
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main
        style={{
          marginLeft: "260px",
          minHeight: "100vh",
          padding: "32px",
          background: "#f8fafc",
          flex: 1,
        }}
      >
        <div style={{ maxWidth: "640px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
            Create New Job
          </h1>
          <p style={{ color: "#64748b", marginBottom: "32px" }}>
            Fill in the job details for AI-powered screening
          </p>

          <form
            onSubmit={handleSubmit}
            style={{
              background: "white",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div>
              <label style={labelStyle}>Job Title *</label>
              <input
                type="text"
                placeholder="e.g. Senior React Developer"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Job Description *</label>
              <textarea
                placeholder="Describe the role and responsibilities..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                rows={4}
                style={{ ...inputStyle, resize: "none" }}
              />
            </div>

            <div>
              <label style={labelStyle}>Required Skills *</label>
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <input
                  type="text"
                  placeholder="Type a skill and press Add"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={addSkill}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "600",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Plus size={16} /> Add
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {form.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      background: "#eff6ff",
                      color: "#2563eb",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "500",
                    }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#2563eb", padding: 0 }}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Years of Experience *</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={form.yearsOfExperience}
                  onChange={(e) => setForm({ ...form, yearsOfExperience: parseInt(e.target.value) })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Education Level *</label>
                <select
                  value={form.educationLevel}
                  onChange={(e) => setForm({ ...form, educationLevel: e.target.value })}
                  style={inputStyle}
                >
                  <option>High School</option>
                  <option>Bachelor</option>
                  <option>Master</option>
                  <option>PhD</option>
                  <option>Any</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Location *</label>
                <input
                  type="text"
                  placeholder="e.g. Kigali, Rwanda"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Job Type</label>
                <select
                  value={form.jobType}
                  onChange={(e) => setForm({ ...form, jobType: e.target.value })}
                  style={inputStyle}
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Remote</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
              <button
                type="button"
                onClick={() => router.back()}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "12px",
                  border: "2px solid #e2e8f0",
                  background: "transparent",
                  fontWeight: "600",
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "12px",
                  background: loading ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #7c3aed)",
                  color: "white",
                  border: "none",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Creating..." : "Create Job"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}