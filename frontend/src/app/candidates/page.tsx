"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy list route — screenings live under `/screenings`. */
export default function LegacyCandidatesIndexRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/screenings");
  }, [router]);
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        color: "#64748b",
      }}
    >
      Redirecting…
    </div>
  );
}
