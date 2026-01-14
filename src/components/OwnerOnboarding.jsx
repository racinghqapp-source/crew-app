// src/components/OwnerOnboarding.jsx
function Card({ title, desc, actionLabel, onAction, tone = "neutral", disabled = false }) {
  const tones = {
    neutral: { bg: "#ffffff", border: "#e5e7eb", title: "#0b2440" },
    info: { bg: "#ecfeff", border: "#a5f3fc", title: "#155e75" },
    good: { bg: "#dcfce7", border: "#86efac", title: "#166534" },
  };
  const t = tones[tone] || tones.neutral;

  return (
    <div
      style={{
        border: `1px solid ${t.border}`,
        background: t.bg,
        borderRadius: 14,
        padding: 14,
      }}
    >
      <div style={{ fontWeight: 900, color: t.title, fontSize: 15 }}>{title}</div>
      <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85, lineHeight: 1.35 }}>{desc}</div>

      <button
        onClick={onAction}
        disabled={disabled}
        style={{
          marginTop: 12,
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #0b2440",
          background: disabled ? "#f3f4f6" : "#0b2440",
          color: disabled ? "#6b7280" : "white",
          fontWeight: 800,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {actionLabel}
      </button>
    </div>
  );
}

export default function OwnerOnboarding({ boatCount, eventCount, onGoBoats, onGoEvents }) {
  // Only show if owner is missing setup steps
  const needsBoats = (boatCount ?? 0) === 0;
  const needsEvents = !needsBoats && (eventCount ?? 0) === 0;

  if (!needsBoats && !needsEvents) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
        <b>Owner setup</b> — do these once, then inviting is 2 clicks.
      </div>

      {needsBoats && (
        <Card
          tone="info"
          title="1) Create your first boat"
          desc="Your boat appears on events so sailors know what they’re sailing on (class, length, offshore capability)."
          actionLabel="Create boat"
          onAction={onGoBoats}
        />
      )}

      {needsEvents && (
        <Card
          tone="info"
          title="2) Create your first event"
          desc="Events are what you invite sailors to. Pick the boat, dates, location, and what roles you need."
          actionLabel="Create event"
          onAction={onGoEvents}
        />
      )}
    </div>
  );
}
