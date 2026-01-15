// src/components/SailorDetailModal.jsx
import { useEffect, useMemo, useState } from "react";
import { useSession } from "../hooks/useSession";
import { fetchOwnerSailorContext } from "../api/sailorDetail.js";

function statusLabel(s) {
  const v = String(s || "").toLowerCase();
  if (v === "applied") return "Applied";
  if (v === "shortlisted") return "Shortlisted";
  if (v === "accepted") return "Accepted";
  if (v === "declined") return "Declined";
  if (v === "withdrawn") return "Withdrawn";
  return s || "—";
}

function statusTone(s) {
  const v = String(s || "").toLowerCase();
  if (v === "shortlisted") return { bg: "#ecfeff", border: "#a5f3fc", text: "#155e75" };
  if (v === "applied") return { bg: "#fef9c3", border: "#fde68a", text: "#854d0e" };
  if (v === "accepted") return { bg: "#dcfce7", border: "#86efac", text: "#166534" };
  if (v === "declined") return { bg: "#fee2e2", border: "#fecaca", text: "#991b1b" };
  if (v === "withdrawn") return { bg: "#f3f4f6", border: "#e5e7eb", text: "#374151" };
  return { bg: "#f3f4f6", border: "#e5e7eb", text: "#374151" };
}

function Chip({ children, tone }) {
  const t = tone || { bg: "#f3f4f6", border: "#e5e7eb", text: "#374151" };
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
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function fmtBoat(boat) {
  if (!boat) return "—";
  const name = boat.name ? String(boat.name) : null;
  const klass = boat.class ? String(boat.class) : null;
  const len = boat.length_m != null ? Number(boat.length_m) : null;

  const meta = [];
  if (klass) meta.push(klass);
  if (Number.isFinite(len)) meta.push(`${len}m`);

  if (name && meta.length) return `${name} (${meta.join(" • ")})`;
  if (name) return name;
  if (meta.length) return meta.join(" • ");
  return "—";
}

export default function SailorDetailModal({ isOpen, onClose, sailor, canInvite, onInvite }) {
  const { user } = useSession();
  const ownerId = user?.id;

  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const invitedEventIds = useMemo(() => {
    const set = new Set();
    for (const r of rows) {
      if (r?.event?.id) set.add(r.event.id);
    }
    return set;
  }, [rows]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!isOpen) return;
      setErr(null);
      setRows([]);

      if (!ownerId) return;
      if (!sailor?.id) return;

      setLoading(true);
      try {
        const data = await fetchOwnerSailorContext({ ownerId, sailorId: sailor.id });
        if (!mounted) return;
        setRows(data ?? []);
      } catch (e) {
        if (!mounted) return;
        setErr(e.message ?? String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [isOpen, ownerId, sailor?.id]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
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
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(920px, 100%)",
          background: "white",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          padding: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#0b2440" }}>
              {sailor?.display_name ?? sailor?.id?.slice(0, 8) ?? "Sailor"}
            </div>
            <div style={{ marginTop: 4, fontSize: 13, opacity: 0.8 }}>
              {sailor?.location_text ?? "—"}
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Chip>Reliability: {Number(sailor?.reliability_score ?? 0)}</Chip>
              <Chip>Would Again: {Number(sailor?.would_sail_again_pct ?? 0)}%</Chip>
              <Chip>Verified: {Number(sailor?.verified_participations_count ?? 0)}</Chip>
              <Chip>Band: {String(sailor?.competence_band ?? "unknown").toUpperCase()}</Chip>
              {!!sailor?.offshore_qualified && <Chip>Offshore Qualified</Chip>}
              {!!sailor?.is_available && <Chip>Available</Chip>}
              {!!(sailor?.roles?.length) && <Chip>Roles: {sailor.roles.join(", ")}</Chip>}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", background: "white", fontWeight: 800 }}
            >
              Close
            </button>
            <button
              disabled={!canInvite}
              onClick={() => onInvite?.(sailor)}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: canInvite ? "1px solid #0b2440" : "1px solid #ddd",
                background: canInvite ? "#0b2440" : "#f3f4f6",
                color: canInvite ? "white" : "#6b7280",
                fontWeight: 900,
                cursor: canInvite ? "pointer" : "not-allowed",
              }}
              title={canInvite ? "Invite To One Of Your Events" : "Create An Event First"}
            >
              Invite
            </button>
          </div>
        </div>

        <hr style={{ margin: "14px 0" }} />

        <div style={{ fontWeight: 900, color: "#0b2440" }}>Your Event History With This Sailor</div>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
          Shows Which Of <b>Your</b> Events They’ve Already Been Invited To / Applied To.
        </div>

        {loading && <div style={{ marginTop: 12, opacity: 0.75 }}>Loading…</div>}
        {err && <div style={{ marginTop: 12, color: "crimson" }}>{err}</div>}

        {!loading && !rows.length && !err && (
          <div style={{ marginTop: 12, padding: 12, border: "1px dashed #ddd", borderRadius: 12, opacity: 0.85 }}>
            No Invites/Applications Yet For This Sailor.
          </div>
        )}

        {!!rows.length && (
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {rows.map((r) => {
              const ev = r.event;
              const boat = ev?.boat;

              return (
                <div key={r.id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900 }}>{ev?.title ?? "Untitled Event"}</div>
                      <div style={{ marginTop: 4, fontSize: 12, opacity: 0.8 }}>
                        {(ev?.start_date ?? "?")} → {(ev?.end_date ?? "?")} • {ev?.location_text ?? "—"}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>
                        Boat: <b>{fmtBoat(boat)}</b>{" "}
                        {!!boat?.is_offshore_capable && (
                          <span style={{ marginLeft: 8 }}>
                            <Chip tone={{ bg: "#eef2ff", border: "#c7d2fe", text: "#3730a3" }}>Offshore Capable</Chip>
                          </span>
                        )}
                      </div>
                      {r.preferred_role ? (
                        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>
                          Role: <b>{r.preferred_role}</b>
                        </div>
                      ) : null}

                      {r.note ? (
                        <div style={{ marginTop: 8, padding: 10, borderRadius: 10, background: "#f9fafb" }}>
                          <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 4 }}>Message</div>
                          <div style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{r.note}</div>
                        </div>
                      ) : null}
                    </div>

                    <Chip tone={statusTone(r.status)}>{statusLabel(r.status)}</Chip>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* subtle signal that we can prevent duplicates */}
        {!!invitedEventIds.size && (
          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
            Tip: The Invite Flow Can Disable Events Already Used For This Sailor (Next Tweak).
          </div>
        )}
      </div>
    </div>
  );
}
