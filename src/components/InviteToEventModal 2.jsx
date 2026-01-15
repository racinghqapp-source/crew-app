// src/components/InviteToEventModal.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchDiscoverySailors, ownerInviteSailor } from "../api/discovery";

function Chip({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 999,
        border: "1px solid #e5e7eb",
        background: "#f3f4f6",
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function SailorRow({ p, selected, onSelect }) {
  const rel = Number(p?.reliability_score ?? 0);
  const ver = Number(p?.verified_participations_count ?? 0);
  const band = String(p?.competence_band ?? "unknown").toUpperCase();

  return (
    <button
      onClick={() => onSelect(p)}
      style={{
        width: "100%",
        textAlign: "left",
        borderRadius: 14,
        border: selected ? "1px solid #0b2440" : "1px solid #e5e7eb",
        background: selected ? "#eef2ff" : "white",
        padding: 12,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900, color: "#0b2440" }}>
            {p.display_name ?? p.id?.slice(0, 8) ?? "Sailor"}
          </div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{p.location_text ?? "—"}</div>

          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Chip>Reliability {rel}</Chip>
            <Chip>Verified {ver}</Chip>
            <Chip>Band {band}</Chip>
            {!!p.offshore_qualified && <Chip>Offshore Qualified</Chip>}
            {!!p.is_available && <Chip>Available</Chip>}
            {!!(p.roles?.length) && <Chip>Roles: {p.roles.join(", ")}</Chip>}
          </div>
        </div>

        {selected ? (
          <div style={{ fontWeight: 900, color: "#0b2440" }}>Selected ✓</div>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.6 }}>Pick</div>
        )}
      </div>
    </button>
  );
}

export default function InviteToEventModal({
  isOpen,
  onClose,
  busy,
  eventId,
  onInvited,
  onSendStart,
  onSendError,
}) {
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const [sailors, setSailors] = useState([]);
  const [q, setQ] = useState("");

  const [selected, setSelected] = useState(null);
  const [role, setRole] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const s = await fetchDiscoverySailors();
      setSailors(s ?? []);
    } catch (e) {
      setErr(e.message ?? String(e));
      setSailors([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    setErr(null);
    setSelected(null);
    setRole("");
    setNote("");
    setQ("");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return sailors;

    return (sailors ?? []).filter((p) => {
      const name = String(p.display_name ?? "").toLowerCase();
      const loc = String(p.location_text ?? "").toLowerCase();
      const roles = Array.isArray(p.roles) ? p.roles.join(" ").toLowerCase() : "";
      return name.includes(term) || loc.includes(term) || roles.includes(term);
    });
  }, [sailors, q]);

  if (!isOpen) return null;

  const canSend = !!eventId && !!selected?.id && !busy;

  async function send() {
    if (!eventId) {
      setErr("Missing EventId.");
      return;
    }
    if (!selected?.id) {
      setErr("Pick A Sailor First.");
      return;
    }

    setErr(null);
    onSendStart?.();

    try {
      await ownerInviteSailor({
        eventId,
        sailorId: selected.id,
        preferredRole: role ? role : null,
        note: note ? note : null,
      });

      onInvited?.();
    } catch (e) {
      setErr(e.message ?? String(e));
      onSendError?.();
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 60,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        style={{
          width: "min(920px, 100%)",
          background: "white",
          borderRadius: 18,
          border: "1px solid #e5e7eb",
          boxShadow: "0 20px 60px rgba(0,0,0,0.20)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 14, borderBottom: "1px solid #eef2f7", display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 950, color: "#0b2440", fontSize: 16 }}>Invite Sailor</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
              Pick A Sailor, Add Role/Note, And Send The Invite.
            </div>
          </div>
          <button onClick={onClose} disabled={busy} style={{ padding: "8px 10px", borderRadius: 10 }}>
            ✕
          </button>
        </div>

        <div style={{ padding: 14 }}>
          {err && <div style={{ color: "crimson", marginBottom: 10 }}>{err}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 14 }}>
            <div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 900, color: "#0b2440" }}>Choose Sailor</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {loading ? "Loading…" : `${filtered.length} shown`}
                </div>
              </div>

              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search Name, Location, Roles…"
                style={{
                  width: "100%",
                  marginTop: 10,
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                }}
              />

              <div
                style={{
                  marginTop: 10,
                  maxHeight: 420,
                  overflow: "auto",
                  display: "grid",
                  gap: 10,
                  paddingRight: 4,
                }}
              >
                {filtered.map((p) => (
                  <SailorRow key={p.id} p={p} selected={selected?.id === p.id} onSelect={setSelected} />
                ))}

                {!loading && !filtered.length && (
                  <div style={{ opacity: 0.75, padding: 12, border: "1px dashed #e5e7eb", borderRadius: 14 }}>
                    No Sailors Match Your Search.
                  </div>
                )}
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 900, color: "#0b2440" }}>Invite Details</div>

              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Selected Sailor</div>
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 12,
                    background: "#f9fafb",
                  }}
                >
                  {selected ? (
                    <>
                      <div style={{ fontWeight: 900, color: "#0b2440" }}>
                        {selected.display_name ?? selected.id.slice(0, 8)}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                        {selected.location_text ?? "—"}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 12, opacity: 0.7 }}>Pick A Sailor On The Left.</div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Preferred Role (Optional)</div>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Bow, Grinder, Trimmer…"
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                  }}
                />
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Note (Optional)</div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={6}
                  placeholder="Short Message To The Sailor…"
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                  }}
                />
              </div>

              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 8 }}>
                debug: eventId={String(!!eventId)} • selected={String(!!selected?.id)} • busy={String(!!busy)}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  onClick={onClose}
                  disabled={busy}
                  style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #e5e7eb", background: "white" }}
                >
                  Cancel
                </button>

                <button
                  onClick={send}
                  disabled={!canSend}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid #0b2440",
                    background: "#0b2440",
                    color: "white",
                    fontWeight: 950,
                    cursor: canSend ? "pointer" : "not-allowed",
                    opacity: canSend ? 1 : 0.6,
                  }}
                >
                  {busy ? "Sending…" : "Send Invite"}
                </button>
              </div>

              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 10, lineHeight: 1.3 }}>
                Tip: If You Invite The Same Sailor Twice, The Backend Should Return The Existing Application Instead Of Creating Duplicates.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
