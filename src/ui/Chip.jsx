// src/ui/Chip.jsx
export default function Chip({ children, tone = "neutral" }) {
  const tones = {
    neutral: { bg: "#f3f4f6", border: "#e5e7eb", text: "#374151" },
    info: { bg: "#ecfeff", border: "#a5f3fc", text: "#155e75" },
    success: { bg: "#dcfce7", border: "#86efac", text: "#166534" },
    warning: { bg: "#fef9c3", border: "#fde68a", text: "#854d0e" },
    danger: { bg: "#fee2e2", border: "#fecaca", text: "#991b1b" },
  };

  const t = tones[tone] ?? tones.neutral;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 999,
        border: `1px solid ${t.border}`,
        background: t.bg,
        color: t.text,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
