"use client";

type Props = {
  label?: string;
  fullPage?: boolean;
};

export default function LoadingSpinner({ label, fullPage }: Props) {
  const inner = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: "48px 24px",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "3px solid #e2e8f0",
          borderTopColor: "#2563eb",
          borderRadius: "50%",
          animation: "spin 0.75s linear infinite",
        }}
      />
      {label && (
        <p
          style={{
            color: "#64748b",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {label}
        </p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.85)",
          zIndex: 999,
        }}
      >
        {inner}
      </div>
    );
  }

  return inner;
}