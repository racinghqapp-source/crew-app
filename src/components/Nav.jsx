export default function Nav({ current, onChange, isOwner }) {
  const tabs = [
    { id: "discover", label: "Discover" },
    { id: "applications", label: "Applications" },
    { id: "sailing", label: "Sailing" },
    ...(isOwner ? [{ id: "manage", label: "Manage" }] : []),
    { id: "upgrade", label: "Upgrade" },
  ];

  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: current === t.id ? "#0b2440" : "#fff",
            color: current === t.id ? "#fff" : "#000",
            fontWeight: current === t.id ? 600 : 400,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
