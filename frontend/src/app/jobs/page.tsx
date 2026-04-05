"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { fetchJobs, removeJob } from "../../store/slices/jobSlice";
import { AppDispatch, RootState } from "../../store";
import Sidebar from "../../components/Sidebar";
import toast from "react-hot-toast";
import { Plus, MapPin, Users, Trash2, Eye, Brain } from "lucide-react";
export default function JobsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { jobs, loading } = useSelector((state: RootState) => state.jobs);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchJobs());
  }, []);

  const filtered = jobs.filter((j) =>
    j.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    await dispatch(removeJob(id));
    toast.success("Job deleted");
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b" }}>
              Jobs
            </h1>
            <p style={{ color: "#64748b", marginTop: "4px" }}>
              {jobs.length} total positions
            </p>
          </div>
          <Link href="/jobs/create">
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              <Plus size={18} /> Create Job
            </button>
          </Link>
        </div>

        <input
          type="text"
          placeholder="Search jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "12px 16px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            marginBottom: "24px",
            fontSize: "14px",
            outline: "none",
          }}
        />

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
            Loading jobs...
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px",
              background: "white",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
            }}
          >
            <p style={{ color: "#64748b" }}>No jobs found</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filtered.map((job) => (
              <div
                key={job._id}
                style={{
                  background: "white",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  padding: "24px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                      <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>
                        {job.title}
                      </h3>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                          background: job.status === "open" ? "#dcfce7" : "#dbeafe",
                          color: job.status === "open" ? "#16a34a" : "#2563eb",
                        }}
                      >
                        {job.status}
                      </span>
                    </div>
                    <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "12px" }}>
                      {job.description?.substring(0, 120)}...
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                      {job.requiredSkills?.slice(0, 5).map((skill: string) => (
                        <span
                          key={skill}
                          style={{
                            padding: "4px 12px",
                            background: "#eff6ff",
                            color: "#2563eb",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "16px", color: "#94a3b8", fontSize: "13px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={13} /> {job.location}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Users size={13} /> {job.applicantsCount || 0} applicants
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginLeft: "16px" }}>
                    <Link href={`/screening/${job._id}`}>
                      <button
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "10px 16px",
                          borderRadius: "10px",
                          background: "#7c3aed",
                          color: "white",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "600",
                        }}
                      >
                        <Brain size={15} /> Screen
                      </button>
                    </Link>
                    <Link href={`/jobs/${job._id}`}>
                      <button
                        style={{
                          padding: "10px",
                          borderRadius: "10px",
                          border: "1px solid #e2e8f0",
                          background: "transparent",
                          cursor: "pointer",
                          color: "#64748b",
                        }}
                      >
                        <Eye size={18} />
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(job._id)}
                      style={{
                        padding: "10px",
                        borderRadius: "10px",
                        border: "1px solid #fee2e2",
                        background: "transparent",
                        cursor: "pointer",
                        color: "#ef4444",
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}