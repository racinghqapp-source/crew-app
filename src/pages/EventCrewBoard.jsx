// src/pages/EventCrewBoard.jsx
import { useEffect, useMemo, useState } from "react";
import { useSession } from "../hooks/useSession";
import { fetchOwnerEventCrew } from "../api/eventCrew";
import { setApplicationStatus } from "../api/owner";
import InviteToEventModal from "../components/InviteToEventModal";
import { updateEventCrewRequired } from "../api/events";

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
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function toneForStatus(s) {
  const v = String(s || "").toLowerCase();
  if (v === "shortlisted") return { bg: "#ecfeff", border: "#a5f3fc", text: "#155e75" };
  if (v === "applied") return { bg: "#fef9c3", border: "#fde68a", text: "#854d0e" };
  if (v === "accepted") return { bg: "#dcfce7", border: "#86efac", text: "#166534" };
  if (v === "declined") return { bg: "#fee2e2", border: "#fecaca", text: "#991b1b" };
  if (v === "withdrawn") return { bg: "#f3f4f6", border: "#e5e7eb", text: "#374151" };
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

function fmtBoat(b) {
  if (!b) return "—";
  const name = b.name ? String(b.name) : null;
  const klass = b.class ? String(b.class) : null;
  const len = b.length_m != null ? Number(b.length_m) : null;

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

function Card({ children }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 16, padding: 14, background: "white" }}>
      {children}
    </div>
  );
}

function Row({ a, onAccept, onDecline, busy, isFull }) {
  const p = a.sailor;
  const status = String(a.status || "").toLowerCase();
  const canDecide = ["shortlisted", "applied"].includes(status);
  const isAccepted = status === "accepted";

  // ✅ accept disabled if crew is full AND this row isn't already accepted
  const acceptDisabled = busy || (!isAccepted && isFull);
  const declineDisabled = busy;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontWeight: 900, color: "#0b2440" }}>
            {p?.display_name ?? a.sailor_id?.slice(0, 8) ?? "Sailor"}
          </div>
          <Chip tone={toneForStatus(a.status)}>{labelForStatus(a.status)}</Chip>
          {a.preferred_role ? <Chip>{a.preferred_role}</Chip> : null}
          {!!p?.offshore_qualified && <Chip>Offshore qualified</Chip>}
        </div>

        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
          {p?.location_text ?? "—"} • Reliability {p?.reliability_score ?? 0} • Band{" "}
          {(p?.competence_band ?? "unknown").toUpperCase()} • Verified {p?.verified_participations_count ?? 0}
        </div>

        {isFull && canDecide && !isAccepted && (
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
            Crew is currently full — increase <b>crew_required</b> to accept more.
          </div>
        )}

        {a.note ? (
          <div style={{ marginTop: 8, fontSize: 13, background: "#f9fafb", borderRadius: 12, padding: 10 }}>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Message</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{a.note}</div>
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        {canDecide ? (
          <>
            <button
              disabled={acceptDisabled}
              onClick={onAccept}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: acceptDisabled ? "1px solid #ddd" : "1px solid #0b2440",
                background: acceptDisabled ? "#f9fafb" : "#0b2440",
                color: acceptDisabled ? "#6b7280" : "white",
                fontWeight: 900,
                cursor: acceptDisabled ? "not-allowed" : "pointer",
              }}
              title={isFull && !isAccepted ? "Crew is full" : "Accept sailor"}
            >
              {busy ? "Working…" : "Accept"}
            </button>

            <button
              disabled={declineDisabled}
              onClick={onDecline}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid #ddd",
                background: "white",
                fontWeight: 800,
                cursor: declineDisabled ? "not-allowed" : "pointer",
                opacity: declineDisabled ? 0.6 : 1,
              }}
            >
              Decline
            </button>
          </>
        ) : (
          <div style={{ fontSize: 11, opacity: 0.7, width: 170, textAlign: "right" }}>
            Decisions available for <b>Invited</b> and <b>Applied</b>.
          </div>
        )}

        {isAccepted && (
          <button
            disabled={busy}
            onClick={() => {
              const ok = window.confirm("Remove this sailor from the crew list?");
              if (!ok) return;
              onDecline();
            }}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #fecaca",
              background: "#fee2e2",
              color: "#991b1b",
              fontWeight: 900,
            }}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

export default function EventCrewBoard({ eventId, profileType, onBack }) {
  const { user } = useSession();
  const isOwner = profileType === "owner" || profileType === "both";

  const [event, setEvent] = useState(null);
  const [apps, setApps] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busyAppId, setBusyAppId] = useState(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);

  async function load() {
    if (!user?.id || !eventId) return;
    setErr(null);
    setLoading(true);
    try {
      const res = await fetchOwnerEventCrew({ ownerId: user.id, eventId });
      setEvent(res.event);
      setApps(res.applications ?? []);
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.id && eventId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, eventId, profileType]);


  const groups = useMemo(() => {
    const g = { shortlisted: [], applied: [], accepted: [], declined: [], withdrawn: [], other: [] };
    for (const a of apps ?? []) {
      const s = String(a.status || "").toLowerCase();
      if (g[s]) g[s].push(a);
      else g.other.push(a);
    }
    return g;
  }, [apps]);

  // ✅ sailors already associated to this event (any status) — exclude from invite picker
  const existingSailorIds = useMemo(() => {
    const set = new Set();
    for (const a of apps ?? []) {
      if (a?.sailor_id) set.add(a.sailor_id);
    }
    return set;
  }, [apps]);

  // ✅ Unique accepted sailors (so duplicates don’t inflate filled spots)
  const acceptedUniqueCount = useMemo(() => {
    const set = new Set();
    for (const a of groups.accepted ?? []) {
      if (a?.sailor_id) set.add(a.sailor_id);
    }
    return set.size;
  }, [groups.accepted]);

  const crewRequired = event?.crew_required != null ? Number(event.crew_required) : 0;
  const hasCap = Number.isFinite(crewRequired) && crewRequired > 0;
  const isFull = hasCap && acceptedUniqueCount >= crewRequired;

  async function onEditCrewRequired() {
    const current = event?.crew_required ?? "";
    const next = window.prompt("Crew required (number). Leave blank to unset.", String(current));

    if (next === null) return;

    setErr(null);
    try {
      const value = next.trim() === "" ? null : Number(next);
      if (value !== null && (!Number.isFinite(value) || value < 0)) {
        setErr("Crew required must be a positive number (or blank to unset).");
        return;
      }
      await updateEventCrewRequired({ eventId, crewRequired: value });
      await load();
    } catch (e) {
      setErr(e.message ?? String(e));
    }
  }

  async function updateStatus(appId, status) {
    setBusyAppId(appId);
    setErr(null);
    try {
      await setApplicationStatus(appId, status);
      await load();
    } catch (e) {
      // ✅ show DB-enforced capacity message cleanly
      const msg = e?.message ?? String(e);
      setErr(msg);
    } finally {
      setBusyAppId(null);
    }
  }

  if (!user) return null;

  if (!isOwner) {
    return (
      <div style={{ marginTop: 12 }}>
        <h3 style={{ margin: 0 }}>Event crew</h3>
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
          This page is for <b>owners</b>.
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0 }}>Event crew</h3>

            {event?.status ? <Chip>Status: {String(event.status).toUpperCase()}</Chip> : null}

            {hasCap ? (
              <>
                <Chip
                  tone={
                    isFull
                      ? { bg: "#fee2e2", border: "#fecaca", text: "#991b1b" }
                      : { bg: "#dcfce7", border: "#86efac", text: "#166534" }
                  }
                >
                  Spots: {acceptedUniqueCount} / {crewRequired}
                </Chip>
                <button
                  onClick={onEditCrewRequired}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    background: "white",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Edit spots
                </button>
              </>
            ) : (
              <>
                <Chip>Spots: —</Chip>
                <button
                  onClick={onEditCrewRequired}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    background: "white",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Set spots
                </button>
              </>
            )}

            {isFull && <Chip tone={{ bg: "#fff7ed", border: "#fed7aa", text: "#9a3412" }}>Crew full</Chip>}
          </div>

          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
            <b>{event?.title ?? "Untitled event"}</b> • {event?.location_text ?? "—"} • Boat:{" "}
            <b>{fmtBoat(event?.boat)}</b>
            {!!event?.boat?.is_offshore_capable && (
              <>
                {" "}
                • <b>Offshore</b>
              </>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onBack}
            style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #ddd", background: "white" }}
          >
            ← Back
          </button>

          <button
            onClick={() => {
              setInviteOpen(true);
            }}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #0b2440",
              background: "#0b2440",
              color: "white",
              fontWeight: 900,
            }}
          >
            + Invite sailor
          </button>

          <button onClick={load} disabled={loading} style={{ padding: "8px 12px", borderRadius: 10 }}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {err && <div style={{ color: "crimson", marginTop: 12 }}>{err}</div>}
      {loading && <div style={{ marginTop: 12, opacity: 0.7 }}>Loading…</div>}

      <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
        <Card>
          <div style={{ fontWeight: 900, color: "#0b2440" }}>Invited</div>
          <div style={{ marginTop: 8 }}>
            {groups.shortlisted.length ? (
              groups.shortlisted.map((a) => (
                <Row
                  key={a.id}
                  a={a}
                  isFull={isFull}
                  busy={busyAppId === a.id}
                  onAccept={() => updateStatus(a.id, "accepted")}
                  onDecline={() => updateStatus(a.id, "declined")}
                />
              ))
            ) : (
              <div style={{ opacity: 0.7, fontSize: 13 }}>No invited sailors yet.</div>
            )}
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 900, color: "#0b2440" }}>Applied</div>
          <div style={{ marginTop: 8 }}>
            {groups.applied.length ? (
              groups.applied.map((a) => (
                <Row
                  key={a.id}
                  a={a}
                  isFull={isFull}
                  busy={busyAppId === a.id}
                  onAccept={() => updateStatus(a.id, "accepted")}
                  onDecline={() => updateStatus(a.id, "declined")}
                />
              ))
            ) : (
              <div style={{ opacity: 0.7, fontSize: 13 }}>No applications yet.</div>
            )}
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 900, color: "#0b2440" }}>Accepted</div>
          <div style={{ marginTop: 8 }}>
            {groups.accepted.length ? (
              groups.accepted.map((a) => (
                <Row
                  key={a.id}
                  a={a}
                  isFull={isFull}
                  busy={busyAppId === a.id}
                  onAccept={() => {}}
                  onDecline={() => updateStatus(a.id, "declined")}
                />
              ))
            ) : (
              <div style={{ opacity: 0.7, fontSize: 13 }}>No accepted crew yet.</div>
            )}
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 900, color: "#0b2440" }}>Declined / Withdrawn</div>
          <div style={{ marginTop: 8 }}>
            {groups.declined.concat(groups.withdrawn).length ? (
              groups.declined
                .concat(groups.withdrawn)
                .map((a) => <Row key={a.id} a={a} isFull={isFull} busy={false} onAccept={() => {}} onDecline={() => {}} />)
            ) : (
              <div style={{ opacity: 0.7, fontSize: 13 }}>Nothing here.</div>
            )}
          </div>
        </Card>
      </div>

      <InviteToEventModal
        isOpen={inviteOpen}
        onClose={() => {
          if (inviteBusy) return;
          setInviteOpen(false);
        }}
        busy={inviteBusy}
        eventId={eventId}
        existingSailorIds={existingSailorIds}
        onInvited={async () => {
          setInviteBusy(false);
          await load();
        }}
      />
    </div>
  );
}
