"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import { getJob } from "../../../services/jobService";
import Link from "next/link";
import { ArrowLeft, Brain, MapPin, Users, BookOpen } from "lucide-react";

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getJob(id as string)
        .then((d) => setJob(d.job))
        .finally(() => setLoading(false));
    }
  }, [id]);

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
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "24px",
            background: "none",
            border: "none",
            color: "#64748b",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          <ArrowLeft size={18} /> Back
        </button>

        {loading ? (
          <p style={{ color: "#94a3b8" }}>Loading...</p>
        ) : !job ? (
          <p style={{ color: "#94a3b8" }}>Job not found</p>
        ) : (
          <div style={{ maxWidth: "720px" }}>
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                padding: "32px",
                marginBottom: "24px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#1e293b" }}>
                  {job.title}
                </h1>
                <span
                  style={{
                    padding: "6px 16px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: "600",
                    background: job.status === "open" ? "#dcfce7" : "#dbeafe",
                    color: job.status === "open" ? "#16a34a" : "#2563eb",
                    height: "fit-content",
                  }}
                >
                  {job.status}
                </span>
              </div>

              <p style={{ color: "#64748b", lineHeight: "1.7", marginBottom: "24px" }}>
                {job.description}
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                {[
                  { icon: MapPin, label: "Location", value: job.location },
                  { icon: Users, label: "Experience", value: `${job.yearsOfExperience}+ years` },
                  { icon: BookOpen, label: "Education", value: job.educationLevel },
                  { icon: Brain, label: "Job Type", value: job.jobType },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: "16px",
                      background: "#f8fafc",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <item.icon size={18} color="#2563eb" />
                    <div>
                      <p style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase" }}>
                        {item.label}
                      </p>
                      <p style={{ fontWeight: "600", color: "#1e293b" }}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <p style={{ fontWeight: "600", color: "#1e293b", marginBottom: "10px" }}>
                  Required Skills
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {job.requiredSkills?.map((skill: string) => (
                    <span
                      key={skill}
                      style={{
                        padding: "6px 14px",
                        background: "#eff6ff",
                        color: "#2563eb",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "500",
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <Link href={`/applicants/upload`} style={{ flex: 1 }}>
                <button
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "12px",
                    border: "2px solid #2563eb",
                    background: "transparent",
                    color: "#2563eb",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Add Applicants
                </button>
              </Link>
              <Link href={`/screening/${job._id}`} style={{ flex: 1 }}>
                <button
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                    color: "white",
                    border: "none",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <Brain size={18} /> Run AI Screening
                </button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}