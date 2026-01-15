// src/pages/MyEvents.jsx
import { useEffect, useMemo, useState } from "react";
import { useSession } from "../hooks/useSession";
import { supabase } from "../lib/supabase";

function Card({ children }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 14, background: "white" }}>
      {children}
    </div>
  );
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid #0b2440",
        background: props.disabled ? "#f3f4f6" : "#0b2440",
        color: props.disabled ? "#6b7280" : "white",
        fontWeight: 800,
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.9 : 1,
      }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid #ddd",
        background: "white",
        color: "#111827",
        fontWeight: 700,
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, opacity: 0.75 }}>{label}</div>
      {children}
    </div>
  );
}

export default function MyEvents({ profileType, onNavigate }) {
  const { user } = useSession();
  const isOwner = profileType === "owner" || profileType === "both";

  const [boats, setBoats] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // form state
  const [boatId, setBoatId] = useState("");
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("regatta");
  const [locationText, setLocationText] = useState("Melbourne, VIC");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("draft"); // draft | published

  const canCreate = useMemo(() => {
    return !!boatId && !!title && !!locationText && !!startDate && !!endDate;
  }, [boatId, title, locationText, startDate, endDate]);

  async function load() {
    if (!user?.id || !isOwner) return;
    setErr(null);
    setLoading(true);
    try {
      const { data: b, error: bErr } = await supabase
        .from("boats")
        .select("id, name, class, length_m, boat_type, is_offshore_capable")
        .order("created_at", { ascending: false });

      if (bErr) throw bErr;

      const { data: ev, error: eErr } = await supabase
        .from("events")
        .select("id, boat_id, title, event_type, location_text, start_date, end_date, status, created_at")
        .order("created_at", { ascending: false });

      if (eErr) throw eErr;

      setBoats(b ?? []);
      setEvents(ev ?? []);
      if (!boatId && (b ?? []).length) setBoatId(b[0].id);
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

  async function createEvent() {
    if (!user?.id) return;
    setErr(null);
    setLoading(true);
    try {
      const payload = {
        owner_id: user.id,
        boat_id: boatId,
        title,
        event_type: eventType,
        location_text: locationText,
        start_date: startDate,
        end_date: endDate,
        status,
      };

      const { error } = await supabase.from("events").insert(payload);
      if (error) throw error;

      // reset lightweight
      setTitle("");
      setStartDate("");
      setEndDate("");
      setStatus("draft");

      await load();
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function setEventStatus(eventId, nextStatus) {
    setErr(null);
    setLoading(true);
    try {
      const { error } = await supabase.from("events").update({ status: nextStatus }).eq("id", eventId);
      if (error) throw error;
      await load();
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  if (!isOwner) {
    return (
      <div style={{ marginTop: 12 }}>
        <Card>
        <h3 style={{ marginTop: 0 }}>Events</h3>
        <div style={{ fontSize: 12, opacity: 0.75 }}>
            Events Are For <b>Owner</b> Accounts.
        </div>
      </Card>
    </div>
  );
  }

  return (
    <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
      <div>
        <h3 style={{ margin: 0 }}>Events</h3>
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
          Step 2 For Owners: Pick A Boat → Create An Event → Publish → Invite Sailors From Discovery.
        </div>
      </div>

      {err && <div style={{ color: "crimson" }}>{err}</div>}

      {/* Create event */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ fontWeight: 900, color: "#0b2440" }}>Create Event</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{loading ? "Working…" : ""}</div>
        </div>

        {!boats.length ? (
          <div style={{ marginTop: 12, padding: 12, border: "1px dashed #ddd", borderRadius: 12, opacity: 0.85 }}>
            You Need A Boat Before You Can Create Events.
            <div style={{ marginTop: 10 }}>
              <PrimaryButton onClick={() => onNavigate?.("boats")}>Go To Boats</PrimaryButton>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            <Field label="Boat">
              <select value={boatId} onChange={(e) => setBoatId(e.target.value)} style={{ padding: 10, borderRadius: 10 }}>
                {boats.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name ?? "Boat"}{b.class ? ` • ${b.class}` : ""}{b.length_m != null ? ` • ${b.length_m}m` : ""}
                  </option>
                ))}
              </select>
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Title">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. ORCV Coastal Sprint"
                  style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                />
              </Field>

              <Field label="Event Type">
                <select value={eventType} onChange={(e) => setEventType(e.target.value)} style={{ padding: 10, borderRadius: 10 }}>
                  <option value="regatta">Regatta</option>
                  <option value="race_week">Race Week</option>
                  <option value="delivery">Delivery</option>
                  <option value="training">Training</option>
                  <option value="offshore">Offshore</option>
                </select>
              </Field>
            </div>

            <Field label="Location">
              <input
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="e.g. Sydney, NSW"
                style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Field label="Start Date">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: 10, borderRadius: 10 }} />
              </Field>
              <Field label="End Date">
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: 10, borderRadius: 10 }} />
              </Field>
              <Field label="Status">
                <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: 10, borderRadius: 10 }}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </Field>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <PrimaryButton disabled={!canCreate || loading} onClick={createEvent}>
                Create Event
              </PrimaryButton>
              <SecondaryButton onClick={() => onNavigate?.("discover")}>
                Go To Discovery
              </SecondaryButton>
            </div>

            {!canCreate && (
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Required: Boat, Title, Location, Start Date, End Date.
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Existing events */}
      <Card>
        <div style={{ fontWeight: 900, color: "#0b2440" }}>Your Events</div>

        {!events.length ? (
          <div style={{ marginTop: 10, opacity: 0.75 }}>No Events Yet.</div>
        ) : (
          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {events.map((ev) => {
              const s = String(ev.status || "draft").toLowerCase();
              const isPublished = s === "published";
              return (
                <div
                  key={ev.id}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 12,
                    padding: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900 }}>{ev.title ?? "Untitled"}</div>
                    <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                      {ev.start_date ?? "?"} → {ev.end_date ?? "?"} • {ev.location_text ?? "—"} •{" "}
                      <b style={{ color: isPublished ? "#166534" : "#854d0e" }}>
                        {isPublished ? "PUBLISHED" : "DRAFT"}
                      </b>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    {isPublished ? (
                      <SecondaryButton disabled={loading} onClick={() => setEventStatus(ev.id, "draft")}>
                        Unpublish
                      </SecondaryButton>
                    ) : (
                      <PrimaryButton disabled={loading} onClick={() => setEventStatus(ev.id, "published")}>
                        Publish
                      </PrimaryButton>
                    )}
                    <SecondaryButton onClick={() => onNavigate?.("discover")}>Invite</SecondaryButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
