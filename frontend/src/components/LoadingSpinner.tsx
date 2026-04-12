"use client";

type Props = {
  label?: string;
  fullPage?: boolean;
};

export default function LoadingSpinner({ label, fullPage }: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: fullPage ? "100vh" : "200px",
        gap: 14,
        background: fullPage ? "#f8fafc" : "transparent",
        color: "#64748b",
        fontSize: 14,
        fontWeight: 500,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: "4px solid #e9d5ff",
          borderTopColor: "#7c3aed",
          borderRadius: "50%",
          animation: "um-spin 0.75s linear infinite",
        }}
      />
      <style>{`
        @keyframes um-spin { to { transform: rotate(360deg); } }
      `}</style>
      {label ? <p>{label}</p> : null}
    </div>
  );
}
