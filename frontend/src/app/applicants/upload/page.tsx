"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route — candidates are managed under `/applicants`. */
export default function LegacyApplicantsUploadRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/applicants");
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
