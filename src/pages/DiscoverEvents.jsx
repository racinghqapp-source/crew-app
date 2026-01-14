import { useEffect, useMemo, useState } from "react";
import {
  applyToEvent,
  fetchDiscoverEvents,
  fetchEventFill,
  fetchMyApplications,
} from "../api/discover";
import { needsSailorOnboarding } from "../api/profile";
import { ROUTES } from "../routes";

function formatDateRange(start, end) {
  if (!start) return "Date TBC";
  if (!end || end === start) return String(start);
  return `${start} -> ${end}`;
}

export default function DiscoverEvents({ user, profile, setRoute }) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [fillByEvent, setFillByEvent] = useState(new Map());
  const [err, setErr] = useState(null);
  const [applyingId, setApplyingId] = useState(null);

  const myAppByEvent = useMemo(() => {
    const m = new Map();
    for (const a of myApps) m.set(a.event_id, a);
    return m;
  }, [myApps]);

  function getFilled(e) {
    const joined = e?.v_event_fill?.[0];
    if (joined && typeof joined.crew_filled === "number") return joined.crew_filled;
    return fillByEvent.get(e.id) ?? 0;
  }

  function spotsLeft(e) {
    const filled = getFilled(e);
    const required = e.crew_required ?? 0;
    return Math.max(0, required - filled);
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      setErr(null);
      setLoading(true);

      try {
        const evs = await fetchDiscoverEvents();
        if (!mounted) return;
        setEvents(evs);

        const ids = evs.map((e) => e.id);

        const apps = await fetchMyApplications({ sailorId: user.id, eventIds: ids });
        if (!mounted) return;
        setMyApps(apps);

        const anyJoined = evs.some((e) => Array.isArray(e.v_event_fill) && e.v_event_fill.length);
        if (!anyJoined && ids.length) {
          const fills = await fetchEventFill(ids);
          if (!mounted) return;
          const map = new Map(fills.map((f) => [f.event_id, f.crew_filled]));
          setFillByEvent(map);
        }
      } catch (e) {
        if (!mounted) return;
        setErr(e.message || String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user.id]);

  async function onApply(event) {
    if (needsSailorOnboarding(profile)) {
      setRoute?.(ROUTES.SAILOR_ONBOARDING);
      return;
    }

    if (profile?.sailor_suspended || profile?.is_suspended) {
      alert("Your account is currently suspended.");
      return;
    }

    if (spotsLeft(event) <= 0) return;
    if (myAppByEvent.get(event.id)) return;

    setApplyingId(event.id);
    try {
      const created = await applyToEvent({ eventId: event.id, sailorId: user.id });
      setMyApps((prev) => [...prev, created]);
    } catch (e) {
      alert(e.message || String(e));
    } finally {
      setApplyingId(null);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading events...</div>;
  if (err) return <div style={{ padding: 24, color: "crimson" }}>{err}</div>;

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "end" }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>Discover events</h1>
          <div style={{ opacity: 0.8 }}>Published events looking for crew.</div>
        </div>

        {needsSailorOnboarding(profile) && (
          <button
            onClick={() => setRoute?.(ROUTES.SAILOR_ONBOARDING)}
            style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ccc", background: "white" }}
          >
            Finish profile to apply
          </button>
        )}
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        {events.map((e) => {
          const boat = e.boats;
          const app = myAppByEvent.get(e.id);
          const left = spotsLeft(e);
          const full = left <= 0;

          const ctaLabel = app ? `Applied (${app.status})` : full ? "Full" : "Apply";
          const disabled = !!app || full || applyingId === e.id;

          return (
            <div
              key={e.id}
              style={{
                border: "1px solid #e7e7e7",
                borderRadius: 16,
                padding: 14,
                background: "white",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 750, fontSize: 16 }}>{e.title || "Sailing event"}</div>

                  <div style={{ opacity: 0.75, marginTop: 6 }}>
                    {formatDateRange(e.start_date, e.end_date)} · {e.location_text || "Location TBC"}
                  </div>

                  <div style={{ opacity: 0.75, marginTop: 6 }}>
                    {e.event_type ? e.event_type : "Event"}{" "}
                    {boat?.name ? `· ${boat.name}${boat.class ? ` (${boat.class})` : ""}` : ""}
                  </div>

                  {(e.paid || e.accommodation_provided) && (
                    <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {e.paid && (
                        <span
                          style={{
                            border: "1px solid #cfd8ff",
                            background: "#eef2ff",
                            padding: "4px 8px",
                            borderRadius: 999,
                          }}
                        >
                          Paid
                        </span>
                      )}
                      {e.accommodation_provided && (
                        <span
                          style={{
                            border: "1px solid #cfeee0",
                            background: "#ecfdf5",
                            padding: "4px 8px",
                            borderRadius: 999,
                          }}
                        >
                          Accommodation
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: "right", minWidth: 140 }}>
                  <div style={{ fontWeight: 650 }}>
                    {left} spot{left === 1 ? "" : "s"} left
                  </div>

                  <button
                    onClick={() => onApply(e)}
                    disabled={disabled}
                    style={{
                      marginTop: 10,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid #ccc",
                      background: disabled ? "#f3f3f3" : "white",
                      cursor: disabled ? "not-allowed" : "pointer",
                      width: "100%",
                    }}
                  >
                    {applyingId === e.id ? "Applying..." : ctaLabel}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {events.length === 0 && <div style={{ marginTop: 18, opacity: 0.8 }}>No published events yet.</div>}
    </div>
  );
}
