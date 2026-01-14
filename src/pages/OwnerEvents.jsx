import { useEffect, useMemo, useState } from "react";
import { useSession } from "../hooks/useSession";
import { fetchMyBoats } from "../api/boats";
import { ownerCreateEvent, ownerGetMyEvents } from "../api/events";

function Card({ children }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 14, background: "white" }}>
      {children}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", width: "100%" }}
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", width: "100%" }}
    />
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

function Pill({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        padding: "4px 10px",
        borderRadius: 999,
        border: "1px solid #ddd",
        background: "#f9fafb",
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export default function OwnerEvents({ profileType, onEventChanged }) {
  const { user } = useSession();
  const isOwner = profileType === "owner" || profileType === "both";

  const [boats, setBoats] = useState([]);
  const [events, setEvents] = useState([]);

  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    boat_id: "",
    start_date: "",
    end_date: "",
    location_text: "",
    event_type: "regatta",
    status: "published",
  });

  const canCreate = useMemo(() => {
    return (
      String(form.title || "").trim().length >= 2 &&
      !!form.boat_id &&
      !!form.start_date &&
      !!form.end_date
    );
  }, [form]);

  async function load() {
    if (!user?.id || !isOwner) return;
    setErr(null);
    setLoading(true);
    try {
      const [b, e] = await Promise.all([fetchMyBoats(), ownerGetMyEvents()]);
      setBoats(b);
      setEvents(e);
      if (!form.boat_id && b.length) {
        setForm((f) => ({ ...f, boat_id: b[0].id }));
      }
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

  async function onCreate() {
    if (!canCreate) return;
    setErr(null);
    setSaving(true);
    try {
      await ownerCreateEvent({
        title: form.title.trim(),
        boat_id: form.boat_id,
        start_date: form.start_date,
        end_date: form.end_date,
        location_text: form.location_text?.trim() || null,
        event_type: form.event_type || "regatta",
        status: form.status || "published",
      });

      setForm((f) => ({ ...f, title: "", location_text: "" }));
      await load();
      onEventChanged?.();
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  if (!isOwner) {
    return (
      <Card>
        <h3 style={{ margin: 0 }}>Events</h3>
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
          This section appears for <b>owner</b> accounts.
        </div>
      </Card>
    );
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0 }}>Events</h3>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
            Create an event (choose a boat) → then invite sailors from Discovery.
          </div>
        </div>

        <button onClick={load} disabled={loading} style={{ padding: "8px 12px", borderRadius: 10 }}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {err && <div style={{ color: "crimson", marginTop: 12 }}>{err}</div>}

      {/* Create */}
      <Card>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Create event</div>

        {!boats.length ? (
          <div style={{ opacity: 0.75 }}>
            You need at least <b>one boat</b> before creating an event. Go to the <b>Boats</b> tab first.
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
              <Field label="Event title (required)">
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Australia Day Regatta"
                />
              </Field>

              <Field label="Boat (required)">
                <Select value={form.boat_id} onChange={(e) => setForm((f) => ({ ...f, boat_id: e.target.value }))}>
                  {boats.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.class ? `(${b.class})` : ""}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Start date (required)">
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                />
              </Field>

              <Field label="End date (required)">
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                />
              </Field>

              <Field label="Location">
                <Input
                  value={form.location_text}
                  onChange={(e) => setForm((f) => ({ ...f, location_text: e.target.value }))}
                  placeholder="e.g. Melbourne, VIC"
                />
              </Field>

              <Field label="Type / format">
                <Select value={form.event_type} onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value }))}>
                  <option value="regatta">Regatta</option>
                  <option value="delivery">Delivery</option>
                  <option value="offshore">Offshore</option>
                  <option value="training">Training</option>
                </Select>
              </Field>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
              <button
                onClick={onCreate}
                disabled={!boats.length || !canCreate || saving}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #0b2440",
                  background: "#0b2440",
                  color: "white",
                  fontWeight: 800,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Creating…" : "Create event"}
              </button>

              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Tip: keep it <b>published</b> so it shows in Discovery.
              </div>
            </div>
          </>
        )}
      </Card>

      {/* List */}
      <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
        {events.map((e) => (
          <Card key={e.event_id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 900, color: "#0b2440", fontSize: 16 }}>
                  {e.title}
                </div>
                <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
                  {e.start_date ?? "—"} → {e.end_date ?? "—"} • {e.location_text ?? "—"}
                </div>
                <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Pill>{String(e.status ?? "draft").toUpperCase()}</Pill>
                  <Pill>{String(e.event_type ?? "regatta")}</Pill>
                  <Pill>
                    Boat: {e.boat_name}
                    {e.boat_class ? ` (${e.boat_class})` : ""}
                    {e.boat_length_m != null ? ` • ${e.boat_length_m}m` : ""}
                  </Pill>
                  {e.boat_offshore_capable ? <Pill>Offshore capable</Pill> : null}
                </div>
              </div>
            </div>
          </Card>
        ))}

        {!events.length && (
          <div style={{ opacity: 0.75, padding: 14, border: "1px dashed #ddd", borderRadius: 12 }}>
            No events yet — create your first event above.
          </div>
        )}
      </div>
    </div>
  );
}
