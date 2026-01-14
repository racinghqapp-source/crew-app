// src/ui/PageHeader.jsx
export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16,
        marginBottom: 16,
      }}
    >
      <div>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {subtitle && (
          <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
            {subtitle}
          </div>
        )}
      </div>

      {actions && <div style={{ display: "flex", gap: 10 }}>{actions}</div>}
    </div>
  );
}
