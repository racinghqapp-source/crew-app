// src/components/Badge.jsx
export default function Badge({ tone = "muted", children, className = "" }) {
  const cls =
    tone === "green"
      ? "badge badgeGreen"
      : tone === "orange"
      ? "badge badgeOrange"
      : tone === "red"
      ? "badge badgeRed"
      : "badge badgeMuted";

  return <span className={`${cls} ${className}`.trim()}>{children}</span>;
}
