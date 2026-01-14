// src/pages/Events.jsx
import { useEffect, useMemo, useState } from "react";
import { useSession } from "../hooks/useSession";
import { supabase } from "../lib/supabase";
import { fetchOwnerEventsSummary, ownerSetEventStatus } from "../api/events";

function fmtBoat(b) {
  if (!b) return "—";
  const name = b.name ? String(b.name) : null;
  const klass = b.class ? String(b.class) : null;
  const len = b.length_m != null ? Number(b.length_m) : null;

  const meta = [];
  if (klass) meta.push(klass);
  if (Number.isFinite(len)) meta.push(`${len}m`);

  if (name && meta.length) return `${name} • ${meta.join(" • ")}`;
  return name || meta.join(" • ") || "—";
}

function fmtWhen(e) {
  const d1 = e.start_date ? String(e.start_date) : null;
  const d2 = e.end_date ? String(e.end_date) : null;
  if (d1 && d2) return `${d1} → ${d2}`;
  return d1 || d2 || "—";
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function Pill({ children, tone = "muted" }) {
  const cls =
    tone === "status"
      ? "pill pillStatus"
      : tone === "good"
      ? "pill pillGood"
      : tone === "warn"
      ? "pill pillWarn"
      : tone === "bad"
      ? "pill pillBad"
      : "pill pillMuted";
  return <span className={cls}>{children}</span>;
}

function Chip({ children, tone }) {
  const t = tone || { bg: "#f3f4f6", border: "#e5e7eb", text: "#374151" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
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

function Metric({ label, value, tone }) {
  return (
    <div className={`metric metric-${tone || "muted"}`}>
      <div className="metricLabel">{label}</div>
      <div className="metricValue">{value}</div>
    </div>
  );
}

function statusTone(status) {
  const s = String(status || "draft").toLowerCase();
  if (s === "published") return { bg: "#dcfce7", border: "#86efac", text: "#166534" };
  if (s === "closed") return { bg: "#f3f4f6", border: "#e5e7eb", text: "#374151" };
  return { bg: "#eef2ff", border: "#c7d2fe", text: "#3730a3" };
}

function EventCard({ e, onManageCrew, onSetStatus, busyEventId }) {
  const invited = e.counts?.invited ?? 0;
  const applied = e.counts?.applied ?? 0;
  const accepted = e.counts?.accepted ?? 0;
  const declined = e.counts?.declined ?? 0;

  const required = e.crew_required ?? null;
  const reqNum = required != null ? Number(required) : null;

  const filled = accepted;
  const spotsLeft =
    reqNum != null && Number.isFinite(reqNum) ? Math.max(reqNum - filled, 0) : null;

  const progressPct =
    reqNum != null && Number.isFinite(reqNum) && reqNum > 0
      ? clamp((filled / reqNum) * 100, 0, 100)
      : 0;

  const statusText = String(e.status ?? "draft").toUpperCase();
  const sLower = String(e.status ?? "draft").toLowerCase();

  return (
    <div className="card eventCard">
      <div className="eventTop">
        <div className="eventMain">
          <div className="eventTitleRow">
            <div className="eventTitle">{e.title ?? "Untitled event"}</div>
            <Chip tone={statusTone(e.status)}>Status: {statusText}</Chip>
            {!!e.boat?.is_offshore_capable && <Pill tone="muted">Offshore</Pill>}
          </div>

          <div className="eventSub">
            <span className="eventSubItem">{fmtWhen(e)}</span>
            <span className="dot">•</span>
            <span className="eventSubItem">{e.location_text ?? "—"}</span>
            <span className="dot">•</span>
            <span className="eventSubItem">Boat: {fmtBoat(e.boat)}</span>
          </div>

          <div className="crewBlock">
            <div className="crewLine">
              <div className="crewLabel">Crew</div>
              {reqNum != null && Number.isFinite(reqNum) ? (
                <div className="crewValue">
                  <b>{filled}</b> / {reqNum} filled{" "}
                  <span className="crewMuted">
                    ({spotsLeft === 0 ? "0 spots left" : `${spotsLeft} spots left`})
                  </span>
                </div>
              ) : (
                <div className="crewValue">
                  <b>{filled}</b> accepted <span className="crewMuted">(crew required not set)</span>
                </div>
              )}
            </div>

            <div className="progressTrack" aria-hidden="true">
              <div className="progressFill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="metricsRow">
            <Metric label="Invited" value={invited} tone="info" />
            <Metric label="Applied" value={applied} tone="warn" />
            <Metric label="Accepted" value={accepted} tone="good" />
            <Metric label="Declined" value={declined} tone="bad" />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 180 }}>
          <button
            onClick={() => onManageCrew?.(e.id)}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #0b2440",
              background: "#0b2440",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Manage crew
          </button>

          {sLower !== "published" ? (
            <button
              disabled={busyEventId === e.id}
              onClick={() => onSetStatus?.(e.id, "published")}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #16a34a",
                background: "#dcfce7",
                color: "#166534",
                fontWeight: 900,
                cursor: busyEventId === e.id ? "not-allowed" : "pointer",
                opacity: busyEventId === e.id ? 0.7 : 1,
              }}
            >
              {busyEventId === e.id ? "Publishing…" : "Publish"}
            </button>
          ) : (
            <button
              disabled={busyEventId === e.id}
              onClick={() => onSetStatus?.(e.id, "closed")}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #ddd",
                background: "#f3f4f6",
                color: "#111827",
                fontWeight: 900,
                cursor: busyEventId === e.id ? "not-allowed" : "pointer",
                opacity: busyEventId === e.id ? 0.7 : 1,
              }}
            >
              {busyEventId === e.id ? "Closing…" : "Close event"}
            </button>
          )}

          <div style={{ fontSize: 11, opacity: 0.7, lineHeight: 1.2 }}>
            Draft events are hidden. Publish makes them Open and actionable.
          </div>
        </div>
      </div>
    </div>
  );
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(3, 7, 18, 0.45)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 50,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        style={{
          width: "min(720px, 100%)",
          background: "white",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 14, borderBottom: "1px solid #eef2f7", display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 900, color: "#0b2440" }}>{title}</div>
          <button className="btnGhost" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: 14 }}>{children}</div>
      </div>
    </div>
  );
}

export default function Events({ profileType, onManageCrew }) {
  const { user } = useSession();
  const isOwner = profileType === "owner" || profileType === "both";

  const [rows, setRows] = useState([]);
  const [boats, setBoats] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasBoats, setHasBoats] = useState(true);
  const [busyEventId, setBusyEventId] = useState(null);

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [boatId, setBoatId] = useState("");
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState("");
  const [locationText, setLocationText] = useState("");
  const [crewRequired, setCrewRequired] = useState(5);
  const [publishNow, setPublishNow] = useState(false);

  async function load() {
    if (!user?.id) return;
    setErr(null);
    setLoading(true);
    try {
      if (!isOwner) {
        setRows([]);
        setBoats([]);
        setHasBoats(true);
        return;
      }

      const { data: boatRows, error: boatsErr } = await supabase
        .from("boats")
        .select("id, name, class, length_m, is_offshore_capable")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (boatsErr) throw boatsErr;

      const b = boatRows ?? [];
      setBoats(b);
      setHasBoats(b.length > 0);

      // Default boat selection in modal
      if (!boatId && b.length) setBoatId(b[0].id);

      const data = await fetchOwnerEventsSummary(user.id);
      setRows(data ?? []);
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

  const hasEvents = useMemo(() => (rows?.length ?? 0) > 0, [rows]);

  async function setStatus(eventId, nextStatus) {
    setBusyEventId(eventId);
    setErr(null);
    try {
      await ownerSetEventStatus({ eventId, status: nextStatus });
      await load();
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setBusyEventId(null);
    }
  }

  function openCreate() {
    if (!hasBoats) {
      setErr("Create a boat first, then you can create an event.");
      return;
    }
    // reset form defaults
    setTitle("");
    setLocationText("");
    setStartDate("");
    setEndDate("");
    setCrewRequired(5);
    setPublishNow(false);
    if (boats.length && !boatId) setBoatId(boats[0].id);
    setCreateOpen(true);
  }

  async function createEvent() {
    if (!user?.id) return;
    setErr(null);

    if (!boatId) {
      setErr("Pick a boat for this event.");
      return;
    }
    if (!title.trim()) {
      setErr("Event title is required.");
      return;
    }

    const cr = Number(crewRequired);
    if (!Number.isFinite(cr) || cr < 0) {
      setErr("Crew required must be 0 or more.");
      return;
    }

    setCreateBusy(true);
    try {
      const status = publishNow ? "open" : "draft";

      const { error } = await supabase.from("events").insert({
        owner_id: user.id,
        boat_id: boatId,
        title: title.trim(),
        start_date: startDate || null,
        end_date: endDate || null,
        location_text: locationText.trim() || null,
        crew_required: cr,
        status,
      });

      if (error) throw error;

      setCreateOpen(false);
      await load();
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setCreateBusy(false);
    }
  }

  if (!user) return null;

  if (!isOwner) {
    return (
      <div className="page">
        <div className="pageHeader">
          <div>
            <h3 className="h3">Events</h3>
            <div className="subtext">
              Events are managed by <b>owners</b>. Switch your profile type to owner (or both) to create events.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h3 className="h3">Events</h3>
          <div className="subtext">Draft → Publish (Open) → Close. Build crew without chaos.</div>
        </div>

        <div className="headerActions">
          <button className="btnGhost" onClick={openCreate}>
            + New event
          </button>
          <button className="btnGhost" onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {err && <div className="error">{err}</div>}

      {!hasEvents && !loading && (
        <div className="empty">
          No events yet. Create a boat first, then create an event to start building crew.
        </div>
      )}

      <div className="grid">
        {rows.map((e) => (
          <EventCard
            key={e.id}
            e={e}
            onManageCrew={onManageCrew}
            onSetStatus={setStatus}
            busyEventId={busyEventId}
          />
        ))}
      </div>

      <Modal
        open={createOpen}
        title="Create event"
        onClose={() => {
          if (createBusy) return;
          setCreateOpen(false);
        }}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#0b2440" }}>Title</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Saturday Bay race"
              style={{ padding: 10, borderRadius: 12, border: "1px solid #e5e7eb" }}
            />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#0b2440" }}>Boat</div>
            <select
              value={boatId}
              onChange={(e) => setBoatId(e.target.value)}
              style={{ padding: 10, borderRadius: 12, border: "1px solid #e5e7eb" }}
            >
              {!boats.length && <option value="">No boats found</option>}
              {boats.map((b) => (
                <option key={b.id} value={b.id}>
                  {fmtBoat(b)}{b.is_offshore_capable ? " • Offshore" : ""}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#0b2440" }}>Start date</div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: 10, borderRadius: 12, border: "1px solid #e5e7eb" }}
              />
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#0b2440" }}>End date</div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: 10, borderRadius: 12, border: "1px solid #e5e7eb" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#0b2440" }}>Location</div>
            <input
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder="e.g. Sandringham Yacht Club"
              style={{ padding: 10, borderRadius: 12, border: "1px solid #e5e7eb" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#0b2440" }}>Crew required</div>
              <input
                type="number"
                min={0}
                value={crewRequired}
                onChange={(e) => setCrewRequired(Number(e.target.value))}
                style={{ padding: 10, borderRadius: 12, border: "1px solid #e5e7eb" }}
              />
              <div style={{ fontSize: 11, opacity: 0.7 }}>
                Used for “filled / required” and to prevent over-accepting.
              </div>
            </div>

            <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#0b2440" }}>Visibility</div>
              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={publishNow}
                  onChange={(e) => setPublishNow(e.target.checked)}
                />
                <div>
                  <div style={{ fontWeight: 800, color: "#0b2440" }}>Publish now (Open)</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>
                    If off, event is Draft (hidden) until you publish.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
            <button className="btnGhost" disabled={createBusy} onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button
              disabled={createBusy}
              onClick={createEvent}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #0b2440",
                background: "#0b2440",
                color: "white",
                fontWeight: 900,
                cursor: createBusy ? "not-allowed" : "pointer",
                opacity: createBusy ? 0.8 : 1,
              }}
            >
              {createBusy ? "Creating…" : publishNow ? "Create & Publish" : "Create draft"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
