import { useEffect, useMemo, useState } from "react";
import { useSession } from "../hooks/useSession";
import { fetchOwnerInvites } from "../api/ownerInvites";

function toneForStatus(s) {
  const v = String(s || "").toLowerCase();
  // app constraint: applied, shortlisted, accepted, declined, withdrawn
  if (v === "shortlisted") return { bg: "#ecfeff", border: "#a5f3fc", text: "#155e75" }; // invited
  if (v === "applied") return { bg: "#fef9c3", border: "#fde68a", text: "#854d0e" }; // applied
  if (v === "accepted") return { bg: "#dcfce7", border: "#86efac", text: "#166534" }; // yes
  if (v === "declined") return { bg: "#fee2e2", border: "#fecaca", text: "#991b1b" }; // no
  if (v === "withdrawn") return { bg: "#f3f4f6", border: "#e5e7eb", text: "#374151" }; // neutral
  return { bg: "#f3f4f6", border: "#e5e7eb", text: "#374151" };
}

function labelForStatus(s) {
  const v = String(s || "").toLowerCase();
  if (v === "shortlisted") return "Invited";
  if (v === "applied") return "Applied";
  if (v === "accepted") return "Accepted";
  if (v === "declined") return "Declined";
  if (v === "withdrawn") return "Withdrawn";
  return s || "—";
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

function Card({ children }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 14, background: "white" }}>
      {children}
    </div>
  );
}

function fmtBoat(r) {
  const name = r.boat_name ? String(r.boat_name) : null;
  const klass = r.boat_class ? String(r.boat_class) : null;
  const len = r.boat_length_m != null ? Number(r.boat_length_m) : null;
  const parts = [];
  if (name) parts.push(name);
  const meta = [];
  if (klass) meta.push(klass);
  if (Number.isFinite(len)) meta.push(`${len}m`);
  if (!parts.length && !meta.length) return "—";
  if (!meta.length) return parts.join(" • ");
  if (!parts.length) return meta.join(" • ");
  return `${parts.join(" • ")} (${meta.join(" • ")})`;
}

function fmtWhen(r) {
  const d1 = r.event_start_date ? String(r.event_start_date) : null;
  const d2 = r.event_end_date ? String(r.event_end_date) : null;
  const loc = r.event_location_text ? String(r.event_location_text) : null;
  const date = d1 && d2 ? `${d1} → ${d2}` : d1 || d2;
  if (date && loc) return `${date} • ${loc}`;
  return date || loc || "—";
}

export default function OwnerInvites({ profileType }) {
  const { user } = useSession();
  const isOwner = profileType === "owner" || profileType === "both";

  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!user?.id || !isOwner) return;
    setErr(null);
    setLoading(true);
    try {
      const data = await fetchOwnerInvites();
      setRows(data);
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profileType]);

  const grouped = useMemo(() => {
    const buckets = {
      invited: [],
      accepted: [],
      declined: [],
      applied: [],
      withdrawn: [],
      other: [],
    };

    for (const r of rows) {
      const s = String(r.status || "").toLowerCase();
      if (s === "shortlisted") buckets.invited.push(r);
      else if (s === "accepted") buckets.accepted.push(r);
      else if (s === "declined") buckets.declined.push(r);
      else if (s === "applied") buckets.applied.push(r);
      else if (s === "withdrawn") buckets.withdrawn.push(r);
      else buckets.other.push(r);
    }

    return buckets;
  }, [rows]);

  if (!user) return null;

  if (!isOwner) {
    return (
      <Card>
        <h3 style={{ margin: 0 }}>Invites</h3>
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
          This Section Appears For <b>Owner</b> Accounts.
        </div>
      </Card>
    );
  }

  const Section = ({ title, items, toneStatus }) => {
    if (!items.length) return null;
    return (
      <div style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4 style={{ margin: 0 }}>{title}</h4>
          <Chip tone={toneForStatus(toneStatus)}>{items.length}</Chip>
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 12 }}>
          {items.map((r) => {
            const tone = toneForStatus(r.status);
            const band = String(r.sailor_competence_band ?? "unknown").toUpperCase();
            return (
              <Card key={r.application_id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <div style={{ fontWeight: 900, color: "#0b2440", fontSize: 16 }}>
                        {r.sailor_display_name ?? r.sailor_id?.slice(0, 8) ?? "Sailor"}
                      </div>
                      <Chip tone={tone}>{labelForStatus(r.status)}</Chip>
                      {!!r.boat_offshore_capable && (
                        <Chip tone={{ bg: "#eef2ff", border: "#c7d2fe", text: "#3730a3" }}>Offshore</Chip>
                      )}
                      {r.preferred_role ? <Chip>Role: {r.preferred_role}</Chip> : null}
                    </div>

                    <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
                      {r.sailor_location_text ?? "—"}
                    </div>

                    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Chip>Reliability: {Number(r.sailor_reliability_score ?? 0)}</Chip>
                      <Chip>Would Again: {Number(r.sailor_would_sail_again_pct ?? 0)}%</Chip>
                      <Chip>Verified: {Number(r.sailor_verified_participations_count ?? 0)}</Chip>
                      <Chip>Band: {band}</Chip>
                    </div>

                      <div style={{ marginTop: 10, padding: 10, borderRadius: 12, border: "1px solid #eee" }}>
                        <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 700 }}>
                        {r.event_title ?? "Untitled Event"}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>{fmtWhen(r)}</div>
                      <div style={{ marginTop: 6, fontSize: 13 }}>
                        Boat: <b>{fmtBoat(r)}</b>
                      </div>
                    </div>

                    {r.note ? (
                      <div style={{ marginTop: 10, padding: 10, borderRadius: 12, background: "#f9fafb" }}>
                        <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 700, marginBottom: 4 }}>
                          Your Message
                        </div>
                        <div style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{r.note}</div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0 }}>Invites</h3>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
            Track Who You’ve Invited And Their Responses (Uses Status <b>Shortlisted</b> As “Invited”).
          </div>
        </div>

        <button onClick={load} disabled={loading} style={{ padding: "8px 12px", borderRadius: 10 }}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {err && <div style={{ color: "crimson", marginTop: 12 }}>{err}</div>}

      {!rows.length && !loading && (
        <div style={{ marginTop: 12, opacity: 0.75, padding: 14, border: "1px dashed #ddd", borderRadius: 12 }}>
          No Invites Yet. Go To <b>Discovery</b> → Invite A Sailor.
        </div>
      )}

      <Section title="Invited (Waiting On Sailor)" items={grouped.invited} toneStatus="shortlisted" />
      <Section title="Accepted" items={grouped.accepted} toneStatus="accepted" />
      <Section title="Declined" items={grouped.declined} toneStatus="declined" />

      {/* Optional buckets (nice for later) */}
      <Section title="Applied (Sailors Applied To You)" items={grouped.applied} toneStatus="applied" />
      <Section title="Withdrawn" items={grouped.withdrawn} toneStatus="withdrawn" />
      <Section title="Other" items={grouped.other} toneStatus="other" />
    </div>
  );
}
