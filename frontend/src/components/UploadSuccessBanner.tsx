import Link from "next/link";
import { CheckCircle2, ChevronRight, Brain } from "lucide-react";

interface Props {
  count: number;
  jobId: string;
  onReset: () => void;
}

export default function UploadSuccessBanner({ count, jobId, onReset }: Props) {
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(240,253,244,0.9), rgba(239,246,255,0.9))",
      border: "1.5px solid #bbf7d0",
      borderRadius: 16,
      padding: "22px 26px",
      display: "flex",
      alignItems: "center",
      gap: 18,
      flexWrap: "wrap",
      animation: "slideUp 0.28s ease",
    }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div style={{ width: 46, height: 46, borderRadius: 13, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1.5px solid #bbf7d0" }}>
        <CheckCircle2 size={22} color="#15803d" />
      </div>
      <div style={{ flex: 1, minWidth: 160 }}>
        <p style={{ fontWeight: 800, fontSize: 15, color: "#14532d", marginBottom: 3 }}>
          {count} candidate{count !== 1 ? "s" : ""} added successfully!
        </p>
        <p style={{ fontSize: 13, color: "#16a34a", lineHeight: 1.5 }}>
          Your candidates are ready. Run AI screening to get a ranked shortlist.
        </p>
      </div>
      <div style={{ display: "flex", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
        <Link
          href={`/screenings?jobId=${jobId}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "10px 18px", borderRadius: 11, border: "none",
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            color: "white", fontWeight: 700, fontSize: 13.5,
            textDecoration: "none", boxShadow: "0 4px 14px rgba(37,99,235,0.28)",
            transition: "all 0.15s",
          }}
        >
          <Brain size={15} /> Run AI Screening <ChevronRight size={14} />
        </Link>
        <button
          onClick={onReset}
          style={{
            padding: "10px 16px", borderRadius: 11, border: "1.5px solid #86efac",
            background: "white", color: "#15803d", fontWeight: 700, fontSize: 13,
            cursor: "pointer", fontFamily: "var(--font-body, system-ui)",
            transition: "all 0.15s",
          }}
        >
          Add More
        </button>
      </div>
    </div>
  );
}