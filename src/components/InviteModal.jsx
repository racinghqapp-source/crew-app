import { useMemo, useState } from "react";

export default function InviteModal({
  isOpen,
  onClose,
  onSubmit,
  busy,
  sailor,
  events = [],
}) {
  const [eventId, setEventId] = useState("");
  const [role, setRole] = useState("");
  const [note, setNote] = useState("");

  const canSubmit = !!eventId && !!sailor?.id && !busy;

  const sailorName = useMemo(() => sailor?.display_name || sailor?.id?.slice(0, 8) || "Sailor", [sailor]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          width: "min(620px, 96vw)",
          background: "white",
          borderRadius: 12,
          padding: 14,
          border: "1px solid #eee",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h3 style={{ margin: 0 }}>Invite sailor</h3>
          <button onClick={onClose} disabled={busy}>
            Close
          </button>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
          Inviting: <b>{sailorName}</b>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Event</div>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              style={{ padding: 10, width: "100%" }}
            >
              <option value="">Select an event…</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title ?? "Untitled"} ({ev.start_date ?? "?"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Preferred role (optional)</div>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Bowman, Trimmer, Tactician"
              style={{ padding: 10, width: "100%" }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Note (optional)</div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Short message…"
              rows={4}
              style={{ padding: 10, width: "100%", resize: "vertical" }}
            />
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            disabled={!canSubmit}
            onClick={() => onSubmit({ eventId, preferredRole: role, note })}
          >
            {busy ? "Inviting…" : "Send invite"}
          </button>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
          This creates an application with status <code>invited</code>.
        </div>
      </div>
    </div>
  );
}
