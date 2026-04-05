"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  LogOut,
  Brain,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/applicants/upload", icon: Users, label: "Applicants" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    router.push("/");
  };

  return (
    <aside
      style={{
        background: "#0f172a",
        width: "260px",
        minHeight: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div
        className="p-6"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            }}
          >
            <Brain size={20} color="white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">
              Umurava
            </p>
            <p style={{ color: "#94a3b8", fontSize: "12px" }}>
              AI Screening
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "12px",
                background: active ? "rgba(37,99,235,0.2)" : "transparent",
                color: active ? "#60a5fa" : "#94a3b8",
                textDecoration: "none",
                fontWeight: "500",
                transition: "all 0.2s",
              }}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div
        className="p-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
      >
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 16px",
            borderRadius: "12px",
            width: "100%",
            background: "transparent",
            color: "#94a3b8",
            border: "none",
            cursor: "pointer",
            fontWeight: "500",
            transition: "all 0.2s",
          }}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}