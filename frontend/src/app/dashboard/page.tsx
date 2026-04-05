"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchJobs } from "../../store/slices/jobSlice";
import { AppDispatch, RootState } from "../../store";
import Sidebar from "../../components/Sidebar";
import {
  Briefcase,
  Users,
  Brain,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { jobs, loading } = useSelector((state: RootState) => state.jobs);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    dispatch(fetchJobs());
  }, []);

  const totalApplicants = jobs.reduce(
    (sum, j) => sum + (j.applicantsCount || 0),
    0
  );
  const openJobs = jobs.filter((j) => j.status === "open").length;
  const screenedJobs = jobs.filter((j) => j.status === "screening").length;

  const stats = [
    {
      label: "Total Jobs",
      value: jobs.length,
      icon: Briefcase,
      color: "#2563eb",
      bg: "#eff6ff",
    },
    {
      label: "Total Applicants",
      value: totalApplicants,
      icon: Users,
      color: "#7c3aed",
      bg: "#f5f3ff",
    },
    {
      label: "Open Positions",
      value: openJobs,
      icon: TrendingUp,
      color: "#16a34a",
      bg: "#f0fdf4",
    },
    {
      label: "AI Screened",
      value: screenedJobs,
      icon: Brain,
      color: "#d97706",
      bg: "#fffbeb",
    },
  ];

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
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#1e293b",
              }}
            >
              Welcome back{user?.name ? `, ${user.name}` : ""}! 👋
            </h1>
            <p style={{ color: "#64748b", marginTop: "4px" }}>
              Here is your recruitment overview
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
                fontSize: "14px",
              }}
            >
              <Plus size={18} /> Create New Job
            </button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "24px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: stat.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <stat.icon size={22} color={stat.color} />
                </div>
                <span
                  style={{
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "#1e293b",
                  }}
                >
                  {stat.value}
                </span>
              </div>
              <p
                style={{
                  color: "#64748b",
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Recent Jobs */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px 24px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#1e293b",
              }}
            >
              Recent Jobs
            </h2>
            <Link
              href="/jobs"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "#2563eb",
                fontWeight: "500",
                fontSize: "14px",
                textDecoration: "none",
              }}
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div
              style={{
                padding: "48px",
                textAlign: "center",
                color: "#94a3b8",
              }}
            >
              Loading...
            </div>
          ) : jobs.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center" }}>
              <Brain
                size={48}
                color="#cbd5e1"
                style={{ margin: "0 auto 12px" }}
              />
              <p
                style={{
                  color: "#64748b",
                  fontWeight: "500",
                  marginBottom: "4px",
                }}
              >
                No jobs yet
              </p>
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>
                Create your first job to get started
              </p>
              <Link href="/jobs/create">
                <button
                  style={{
                    marginTop: "16px",
                    padding: "10px 20px",
                    borderRadius: "10px",
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                >
                  Create Job
                </button>
              </Link>
            </div>
          ) : (
            jobs.slice(0, 5).map((job) => (
              <div
                key={job._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 24px",
                  borderBottom: "1px solid #f8fafc",
                }}
              >
                <div>
                  <p
                    style={{
                      fontWeight: "600",
                      color: "#1e293b",
                      fontSize: "15px",
                    }}
                  >
                    {job.title}
                  </p>
                  <p
                    style={{
                      color: "#64748b",
                      fontSize: "13px",
                      marginTop: "2px",
                    }}
                  >
                    {job.location} • {job.applicantsCount || 0} applicants
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                      background:
                        job.status === "open" ? "#dcfce7" : "#dbeafe",
                      color:
                        job.status === "open" ? "#16a34a" : "#2563eb",
                    }}
                  >
                    {job.status}
                  </span>
                  <Link href={`/jobs/${job._id}`}>
                    <button
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "1px solid #bfdbfe",
                        background: "transparent",
                        color: "#2563eb",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "500",
                      }}
                    >
                      View
                    </button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}