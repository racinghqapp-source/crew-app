// src/pages/Discovery.jsx
import { useEffect, useMemo, useState } from "react";
import { useSession } from "../hooks/useSession";
import { fetchPublishedEvents } from "../api/events";
import { fetchMyApplications } from "../api/applications";

// --- existing owner mock (leave for now) ---
const mockCrew = [
  { id: 1, name: "Alex Morgan", experience: "Offshore · Bow", availability: "available" },
  { id: 2, name: "Jamie Lee", experience: "Inshore · Trim", availability: "unavailable" },
  { id: 3, name: "Chris Nolan", experience: "Navigator", availability: "unknown" },
];

function Badge({ tone = "muted", children }) {
  const cls =
    tone === "green"
      ? "badge badgeGreen"
      : tone === "orange"
      ? "badge badgeOrange"
      : tone === "red"
      ? "badge badgeRed"
      : tone === "blue"
      ? "badge badgeBlue"
      : "badge badgeMuted";
  return <span className={cls}>{children}</span>;
}

function fmtDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return String(d);
  }
}

function canActAsSailor(profileType) {
  return profileType === "sailor" || profileType === "both";
}

export default function Discovery({ profileType, profile, onOpenEvent }) {
  const { user } = useSession();

  // ----- Sailor: events -----
  const [events, setEvents] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);


  async function loadSailorData() {
    if (!user?.id) return;
    setErr(null);
    setLoading(true);
    try {
      const [ev, apps] = await Promise.all([fetchPublishedEvents(), fetchMyApplications(user.id)]);
      setEvents(ev);
      setMyApps(apps);
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!canActAsSailor(profileType)) return;
    loadSailorData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profileType]);

  const myAppByEventId = useMemo(() => {
    const m = new Map();
    for (const a of myApps) m.set(a.event?.id ?? a.event_id, a);
    return m;
  }, [myApps]);

  // ----- Owner: crew mock (existing) -----
  const [filter, setFilter] = useState("all");
  const crew = mockCrew.filter((c) => {
    if (filter === "available") return c.availability === "available";
    if (filter === "unavailable") return c.availability === "unavailable";
    return true;
  });

  function availabilityBadge(avail) {
    if (avail === "available") return "badge badgeGreen";
    if (avail === "unavailable") return "badge badgeRed";
    return "badge badgeMuted";
  }

  // =========================
  // Render: sailor discovery
  // =========================
  if (canActAsSailor(profileType)) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Event Discovery</div>
              <div className="subtle">Browse published events and apply in one click.</div>
            </div>
            <button className="btn btnGhost" onClick={loadSailorData} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {err ? (
            <div style={{ marginTop: 12, color: "crimson" }}>
              {err}
              <div className="subtle" style={{ marginTop: 6 }}>
                If this is an RLS error, confirm you can select from <b>events</b> and{" "}
                <b>applications</b>.
              </div>
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="card">Loading events…</div>
        ) : events.length === 0 ? (
          <div className="card">
            <div style={{ fontWeight: 700 }}>No published events yet</div>
            <div className="subtle" style={{ marginTop: 6 }}>
              Check back soon — skippers will publish events here.
            </div>
          </div>
        ) : (
          <div className="card">
            <div style={{ display: "grid", gap: 10 }}>
              {events.map((e) => {
                const existingApp = myAppByEventId.get(e.id);
                const alreadyApplied = Boolean(existingApp);
                const appStatus = existingApp?.status;

                const crewFilled = Number(e.crew_filled ?? 0);
                const crewReq = Number(e.crew_required ?? 0);
                const full = crewReq > 0 && crewFilled >= crewReq;

                return (
                  <div
                    key={e.id}
                    onClick={() => onOpenEvent?.(e.id)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 12,
                      padding: 12,
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 12,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <div style={{ fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {e.title || "Untitled event"}
                        </div>
                        <Badge tone="muted">{e.event_type || "Event"}</Badge>
                        {full ? <Badge tone="red">Full</Badge> : <Badge tone="green">Open</Badge>}
                        {alreadyApplied ? (
                          <span
                            className="badge badgeGreen"
                            style={{
                              padding: "4px 10px",
                              borderRadius: 999,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            }}
                          >
                            Applied
                          </span>
                        ) : null}
                      </div>

                      <div className="subtle" style={{ marginTop: 6 }}>
                        {e.boat?.name ? <span>{e.boat.name} • </span> : null}
                        {e.location_text ? <span>{e.location_text} • </span> : null}
                        {e.start_date ? <span>{fmtDate(e.start_date)}</span> : null}
                        {e.end_date ? <span> – {fmtDate(e.end_date)}</span> : null}
                      </div>

                      <div className="subtle" style={{ marginTop: 6 }}>
                        Crew: <b>{crewFilled}</b> / <b>{crewReq || "?"}</b>
                        {e.paid ? <> • <b>Paid</b></> : null}
                        {e.accommodation_provided ? <> • Accommodation</> : null}
                      </div>

                      {e.compensation_notes ? (
                        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                          {e.compensation_notes}
                        </div>
                      ) : null}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    );
  }

  // =========================
  // Render: owner discovery (existing mock)
  // =========================
  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 700 }}>Crew Discovery</div>
          <div className="subtle">Find and invite crew for upcoming events</div>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            className={`btn btnSmall ${filter === "all" ? "btnPrimary" : "btnGhost"}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`btn btnSmall ${filter === "available" ? "btnPrimary" : "btnGhost"}`}
            onClick={() => setFilter("available")}
          >
            Available
          </button>
          <button
            className={`btn btnSmall ${filter === "unavailable" ? "btnPrimary" : "btnGhost"}`}
            onClick={() => setFilter("unavailable")}
          >
            Unavailable
          </button>
        </div>
      </div>

      {crew.length === 0 ? (
        <div className="alert">No crew match this filter.</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {crew.map((c) => (
            <div
              key={c.id}
              className="card"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                <div className="subtle">{c.experience}</div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className={availabilityBadge(c.availability)}>
                  {c.availability === "available"
                    ? "Available"
                    : c.availability === "unavailable"
                    ? "Unavailable"
                    : "No response"}
                </span>
                <button className="btn btnSmall">Invite</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
