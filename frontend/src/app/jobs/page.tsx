"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { fetchJobs, removeJob } from "../../store/slices/jobSlice";
import { AppDispatch, RootState } from "../../store";
import Sidebar from "../../components/Sidebar";
import toast from "react-hot-toast";
import { Plus, MapPin, Users, Trash2, Eye, Brain, AlertTriangle, X } from "lucide-react";

function DeleteConfirmModal({
  jobTitle,
  onConfirm,
  onCancel,
}: {
  jobTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Inject keyframe animation once into <head>
  useEffect(() => {
    const id = "delete-modal-anim";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes popIn {
        from { opacity: 0; transform: scale(0.95) translateY(8px); }
        to   { opacity: 1; transform: scale(1)    translateY(0);   }
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "20px",
          padding: "32px",
          width: "100%",
          maxWidth: "420px",
          margin: "16px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          animation: "popIn 0.2s ease",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "#fee2e2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <AlertTriangle size={28} color="#ef4444" />
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
            Delete Job
          </h2>
         
        </div>

        <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
          Are you sure you want to delete{" "}
          <span style={{ fontWeight: "600", color: "#1e293b" }}>"{jobTitle}"</span>? This action
          cannot be undone and all associated applicants will be affected.
        </p>

        {/* Actions */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              background: "white",
              color: "#64748b",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "white",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <Trash2 size={15} /> Delete Job
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { jobs, loading } = useSelector((state: RootState) => state.jobs);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    dispatch(fetchJobs());
  }, []);

  const filtered = jobs.filter((j) =>
    j.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await dispatch(removeJob(deleteTarget.id));
    toast.success("Job deleted");
    setDeleteTarget(null);
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
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b" }}>Jobs</h1>
            <p style={{ color: "#64748b", marginTop: "4px" }}>{jobs.length} total positions</p>
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
                      onClick={() => setDeleteTarget({ id: job._id, title: job.title })}
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

      {deleteTarget && (
        <DeleteConfirmModal
          jobTitle={deleteTarget.title}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}