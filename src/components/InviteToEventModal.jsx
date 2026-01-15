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

function Backdrop({ children, onClose }) {
  return (
    <div
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2, 6, 23, 0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
        zIndex: 1000,
      }}
    >
      <div onMouseDown={(e) => e.stopPropagation()} style={{ width: "min(1100px, 100%)" }}>
        {children}
      </div>
    </div>
  );
}

export default function InviteToEventModal({
  isOpen,
  onClose,
  busy,
  eventId,
  existingSailorIds = new Set(),
  onInvited,
}) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);

  const [role, setRole] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState(null);

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const data = await fetchDiscoverySailors();
      setRows(data ?? []);
    } catch (e) {
      setErr(e?.message ?? String(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    load();
    setQ("");
    setSelected(null);
    setRole("");
    setNote("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const selectedId = selected?.id ?? "";

  useEffect(() => {
    if (!selectedId) return;
    if (existingSailorIds.has(selectedId)) setSelected(null);
  }, [existingSailorIds, selectedId]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const eligible = (rows ?? []).filter((p) => !existingSailorIds.has(p.id));
    if (!term) return eligible;

    return eligible.filter((p) => {
      const name = String(p.display_name ?? "").toLowerCase();
      const loc = String(p.location_text ?? "").toLowerCase();
      const roles = Array.isArray(p.roles) ? p.roles.join(" ").toLowerCase() : "";
      return name.includes(term) || loc.includes(term) || roles.includes(term);
    });
  }, [rows, q, existingSailorIds]);

  const canSend = !!eventId && !!selected?.id && !busy && !sending;

  async function send() {
    if (!eventId) {
      setErr("Missing EventId — Go Back And Open Invite From The Event Crew Page.");
      return;
    }
    if (!selected?.id) {
      setErr("Pick A Sailor First.");
      return;
    }

    setErr(null);
    setSending(true);
    try {
      await ownerInviteSailor({
        eventId,
        sailorId: selected.id,
        preferredRole: role?.trim() ? role.trim() : null,
        note: note?.trim() ? note.trim() : null,
      });

      onInvited?.(); // parent will reload crew board
      onClose?.();
    } catch (e) {
      setErr(e?.message ?? String(e));
    } finally {
      setSending(false);
    }
  }

  if (!isOpen) return null;

  return (
    <Backdrop onClose={() => (sending ? null : onClose?.())}>
      <div
        style={{
          background: "white",
          borderRadius: 18,
          border: "1px solid #e5e7eb",
          boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #eef2f7",
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 950, color: "#0b2440" }}>Invite Sailor</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
              Pick A Sailor, Add Role/Note, And Send The Invite.
            </div>
          </div>

          <button
            onClick={() => (sending ? null : onClose?.())}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "white",
              fontSize: 18,
              cursor: sending ? "not-allowed" : "pointer",
              opacity: sending ? 0.6 : 1,
            }}
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 16 }}>
          {/* Left: picker */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#0b2440" }}>Choose Sailor</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{filtered.length} Shown</div>
            </div>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Name, Location, Roles…"
              style={{
                marginTop: 10,
                width: "100%",
                padding: "12px 12px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                outline: "none",
              }}
            />

            {err && (
              <div style={{ marginTop: 10, color: "crimson", fontSize: 13 }}>
                {err}
              </div>
            )}

            <div
              style={{
                marginTop: 12,
                maxHeight: 420,
                overflow: "auto",
                borderRadius: 14,
                border: "1px solid #eef2f7",
              }}
            >
              {loading ? (
                <div style={{ padding: 14, opacity: 0.75 }}>Loading Sailors…</div>
              ) : filtered.length ? (
                filtered.map((p) => {
                  const isSel = selected?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelected(p)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: 14,
                        border: "none",
                        borderBottom: "1px solid #eef2f7",
                        background: isSel ? "#eff6ff" : "white",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 18, fontWeight: 950, color: "#0b2440" }}>
                            {p.display_name ?? p.id?.slice(0, 8) ?? "Sailor"}
                          </div>
                          <div style={{ marginTop: 3, fontSize: 13, opacity: 0.8 }}>
                            {p.location_text ?? "—"}
                          </div>

                          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <Chip>Reliability {p.reliability_score ?? 0}</Chip>
                            <Chip>Verified {p.verified_participations_count ?? 0}</Chip>
                            <Chip>Band {(p.competence_band ?? "unknown").toUpperCase()}</Chip>
                            {!!p.is_available && <Chip>Available</Chip>}
                            {!!(p.roles?.length) && <Chip>Roles: {p.roles.join(", ")}</Chip>}
                          </div>
                        </div>

                        <div style={{ fontSize: 13, fontWeight: 800, color: "#0b2440", opacity: 0.9 }}>
                          {isSel ? "Selected ✓" : "Pick"}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div style={{ padding: 14, opacity: 0.75 }}>No Sailors Found.</div>
              )}
            </div>
          </div>

          {/* Right: details */}
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#0b2440" }}>Invite Details</div>

            <div
              style={{
                marginTop: 10,
                padding: 14,
                borderRadius: 14,
                border: "1px solid #eef2f7",
                background: "white",
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.7 }}>Selected Sailor</div>
              <div style={{ marginTop: 8, fontSize: 18, fontWeight: 950, color: "#0b2440" }}>
                {selected?.display_name ?? "—"}
              </div>
              <div style={{ marginTop: 2, fontSize: 13, opacity: 0.8 }}>
                {selected?.location_text ?? "—"}
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Preferred Role (Optional)</div>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Bow / Trimmer / Navigator"
                style={{
                  width: "100%",
                  padding: "12px 12px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Note (Optional)</div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add A Short Message…"
                rows={6}
                style={{
                  width: "100%",
                  padding: "12px 12px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => (sending ? null : onClose?.())}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "white",
                  fontWeight: 800,
                  cursor: sending ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>

              <button
                disabled={!canSend}
                onClick={send}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: canSend ? "1px solid #0b2440" : "1px solid #e5e7eb",
                  background: canSend ? "#0b2440" : "#f3f4f6",
                  color: canSend ? "white" : "#9ca3af",
                  fontWeight: 950,
                  cursor: canSend ? "pointer" : "not-allowed",
                }}
                title={!eventId ? "Missing EventId" : !selected?.id ? "Pick A Sailor" : "Send Invite"}
              >
                {sending ? "Sending…" : "Send Invite"}
              </button>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.65 }}>
              Tip: If You Invite The Same Sailor Twice, The Backend Should Return The Existing Application Instead Of Creating Duplicates.
            </div>
          </div>
        </div>
      </div>
    </Backdrop>
  );
}
