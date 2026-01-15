// src/pages/Events.jsx
import { useEffect, useMemo, useState } from "react";
import { useSession } from "../hooks/useSession";
import { supabase } from "../lib/supabase";
import { fetchOwnerEventsSummary, ownerSetEventStatus } from "../api/events";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import YachtClubPicker from "../components/YachtClubPicker";

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

function statusTone(status) {
  const s = String(status || "draft").toLowerCase();
  if (s === "published") return "success";
  if (s === "closed") return "muted";
  return "warning";
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

  const sLower = String(e.status ?? "draft").toLowerCase();
  const statusText = sLower ? sLower[0].toUpperCase() + sLower.slice(1) : "Draft";

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em" }}>
              {e.title ?? "Untitled Event"}
            </div>
            <Badge tone={statusTone(e.status)}>Status: {statusText}</Badge>
            {!!e.boat?.is_offshore_capable && <Badge tone="info">Offshore</Badge>}
          </div>

          <div className="subtle" style={{ marginTop: 6 }}>
            {fmtWhen(e)} • {e.location_text ?? "—"} • Boat: {fmtBoat(e.boat)}
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>Crew</div>
            {reqNum != null && Number.isFinite(reqNum) ? (
              <div style={{ marginTop: 6 }}>
                <b>{filled}</b> / {reqNum} Filled{" "}
                <span className="subtle">
                  ({spotsLeft === 0 ? "0 Spots Left" : `${spotsLeft} Spots Left`})
                </span>
              </div>
            ) : (
              <div style={{ marginTop: 6 }}>
                <b>{filled}</b> Accepted{" "}
                <span className="subtle">(Crew Required Not Set)</span>
              </div>
            )}

            <div
              aria-hidden="true"
              style={{
                marginTop: 8,
                height: 10,
                borderRadius: 999,
                background: "var(--panel-2)",
                overflow: "hidden",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  background: "var(--accent)",
                  borderRadius: 999,
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Badge tone="info">Invited: {invited}</Badge>
            <Badge tone="warning">Applied: {applied}</Badge>
            <Badge tone="success">Accepted: {accepted}</Badge>
            <Badge tone="danger">Declined: {declined}</Badge>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 180 }}>
          <Button variant="secondary" onClick={() => onManageCrew?.(e.id)}>
            Manage Crew
          </Button>

          {sLower !== "published" ? (
            <Button
              variant="secondary"
              disabled={busyEventId === e.id}
              onClick={() => onSetStatus?.(e.id, "published")}
            >
              {busyEventId === e.id ? "Publishing…" : "Publish"}
            </Button>
          ) : (
            <Button
              variant="ghost"
              disabled={busyEventId === e.id}
              onClick={() => onSetStatus?.(e.id, "closed")}
            >
              {busyEventId === e.id ? "Closing…" : "Close Event"}
            </Button>
          )}

          <div className="subtle" style={{ fontSize: 11, lineHeight: 1.2 }}>
            Draft Events Are Hidden. Publish Makes Them Open And Actionable.
          </div>
        </div>
      </div>
    </Card>
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
      <Card
        style={{
          width: "min(720px, 100%)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: 14,
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontWeight: 900 }}>{title}</div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        <div style={{ padding: 14 }}>{children}</div>
      </Card>
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
  const [locationId, setLocationId] = useState(null);
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
      setErr("Create A Boat First, Then You Can Create An Event.");
      return;
    }
    // reset form defaults
    setTitle("");
    setLocationText("");
    setLocationId(null);
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

    const locText = (locationText ?? "").trim();

    if (!boatId) {
      setErr("Pick A Boat For This Event.");
      return;
    }
    if (!title.trim()) {
      setErr("Event Title Is Required.");
      return;
    }
    if (!locText) {
      setErr("Please Choose A Location (Club/Port).");
      return;
    }

    const cr = Number(crewRequired);
    if (!Number.isFinite(cr) || cr < 0) {
      setErr("Crew Required Must Be 0 Or More.");
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
        location_text: locText,
        location_id: locationId ?? null,
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
      <div style={{ display: "grid", gap: 12 }}>
        <Card>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Events</div>
            <div className="subtle" style={{ marginTop: 6 }}>
              Events Are Managed By <b>Owners</b>. Switch Your Profile Type To Owner (Or Both) To Create Events.
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Events</div>
            <div className="subtle" style={{ marginTop: 6 }}>
              Draft → Publish (Open) → Close. Build Crew Without Chaos.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="ghost" onClick={openCreate}>
              + New Event
            </Button>
            <Button variant="ghost" onClick={load} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </Button>
          </div>
        </div>
      </Card>

      {err && (
        <Card>
          <div style={{ color: "var(--danger)", fontWeight: 700 }}>{err}</div>
        </Card>
      )}

      {!hasEvents && !loading && (
        <Card>
          No Events Yet. Create A Boat First, Then Create An Event To Start Building Crew.
        </Card>
      )}

      <div style={{ display: "grid", gap: 12 }}>
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
        title="Create Event"
        onClose={() => {
          if (createBusy) return;
          setCreateOpen(false);
        }}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 800 }}>Title</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Saturday Bay Race"
            />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 800 }}>Boat</div>
            <select
              value={boatId}
              onChange={(e) => setBoatId(e.target.value)}
            >
              {!boats.length && <option value="">No Boats Found</option>}
              {boats.map((b) => (
                <option key={b.id} value={b.id}>
                  {fmtBoat(b)}{b.is_offshore_capable ? " • Offshore" : ""}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 800 }}>Start Date</div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 800 }}>End Date</div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 800 }}>Location</div>
            <YachtClubPicker
              value={locationText}
              onChangeText={setLocationText}
              onSelectLocation={(loc) => {
                setLocationId(loc?.id ?? null);
                setLocationText(loc?.name ?? "");
              }}
              placeholder="Search Clubs Or Locations..."
            />
            {locationText ? (
              <div className="subtle" style={{ marginTop: 6 }}>
                Selected Location: <b>{locationText}</b>
              </div>
            ) : null}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 800 }}>Crew Required</div>
              <input
                type="number"
                min={0}
                value={crewRequired}
                onChange={(e) => setCrewRequired(Number(e.target.value))}
              />
              <div style={{ fontSize: 11, opacity: 0.7 }}>
                Used For “Filled / Required” And To Prevent Over-Accepting.
              </div>
            </div>

            <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
              <div style={{ fontSize: 12, fontWeight: 800 }}>Visibility</div>
              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={publishNow}
                  onChange={(e) => setPublishNow(e.target.checked)}
                />
                <div>
                  <div style={{ fontWeight: 800 }}>Publish Now (Open)</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>
                    If Off, Event Is Draft (Hidden) Until You Publish.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
            <Button variant="ghost" disabled={createBusy} onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button disabled={createBusy} onClick={createEvent}>
              {createBusy ? "Creating…" : publishNow ? "Create & Publish" : "Create Draft"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
