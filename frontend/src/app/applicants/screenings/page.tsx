"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy path — screenings moved to `/screenings`. */
export default function LegacyApplicantsScreeningsRedirect() {
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
