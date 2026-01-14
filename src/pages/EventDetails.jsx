// src/pages/EventDetails.jsx
import { useEffect, useState } from "react";
import { useSession } from "../hooks/useSession";
import { fetchEventDetails } from "../api/eventDetails";
import { applyToEvent, fetchMyApplications } from "../api/applications";
import { needsSailorOnboarding } from "../api/profile";

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

function prettyBoatType(t) {
  if (!t) return "";
  const map = {
    dinghy: "Dinghy",
    keelboat: "Keelboat",
    yacht: "Yacht",
    sportsboat: "Sportsboat",
    multihull: "Multihull",
    skiff: "Skiff",
    other: "Other",
  };
  return map[String(t).toLowerCase().trim()] ?? t;
}

function fmtLen(m) {
  if (m === null || m === undefined || m === "") return "";
  const n = Number(m);
  if (Number.isNaN(n)) return "";
  return `${n.toFixed(1)}m`;
}

const ROLE_OPTIONS = ["Helm", "Trim", "Bow", "Pit", "Mast", "Navigator", "Tactician", "Grinder"];

function getApplyBlockReason({ profile, event }) {
  if (!profile) return "Loading profile…";
  if (needsSailorOnboarding(profile)) return "Complete your profile to apply";
  if (profile?.is_suspended || profile?.sailor_suspended) return "Your account is suspended";
  if (String(event?.status) !== "published") return "Event is not open";
  return "";
}

export default function EventDetails({ eventId, profileType, profile, onBack, onGoApplications }) {
  const { user } = useSession();

  const [e, setE] = useState(null);
  const [myApp, setMyApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [preferredRole, setPreferredRole] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!eventId) return;
    setErr(null);
    setLoading(true);
    try {
      const data = await fetchEventDetails(eventId);
      setE(data);

      if (user?.id) {
        const apps = await fetchMyApplications(user.id);
        const match = apps.find((a) => (a.event?.id ?? a.event_id) === eventId) ?? null;
        setMyApp(match);
      }
    } catch (ex) {
      setErr(ex.message ?? String(ex));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, user?.id]);

  async function onApply() {
    if (!user?.id || !eventId) return;
    if (needsSailorOnboarding(profile)) {
      onBack?.();
      return;
    }
    if (profile?.is_suspended || profile?.sailor_suspended) {
      alert("Your account is suspended. Contact support.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await applyToEvent({
        eventId,
        preferredRole: preferredRole || null,
        note: note || null,
      });
      await load();
    } catch (ex) {
      setErr(ex.message ?? String(ex));
    } finally {
      setBusy(false);
    }
  }

  if (!eventId) return <div className="card">No event selected.</div>;
  if (loading) return <div className="card">Loading event…</div>;

  if (err) {
    return (
      <div className="card">
        <div style={{ fontWeight: 800 }}>Couldn't load event</div>
        <div style={{ marginTop: 8, color: "crimson" }}>{err}</div>
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button className="btn btnGhost" onClick={onBack}>
            Back
          </button>
          <button className="btn btnGhost" onClick={load}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const boat = e?.boat;
  const owner = e?.owner;

  const isPublished = e?.status === "published";
  const isSailor = profileType === "sailor" || profileType === "both";
  const blockReason = getApplyBlockReason({ profile, event: e });
  const isBlocked = Boolean(blockReason);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{e?.title ?? "Event"}</div>
            <div className="subtle" style={{ marginTop: 6 }}>
              {e?.location_text ? <span>{e.location_text} • </span> : null}
              {e?.start_date ? <span>{fmtDate(e.start_date)}</span> : null}
              {e?.end_date ? <span> – {fmtDate(e.end_date)}</span> : null}
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {e?.event_type ? <Badge tone="muted">{e.event_type}</Badge> : null}
              {e?.status ? <Badge tone={isPublished ? "green" : "orange"}>{e.status}</Badge> : null}
              {e?.paid ? <Badge tone="blue">Paid</Badge> : <Badge tone="muted">Unpaid</Badge>}
              {e?.accommodation_provided ? <Badge tone="blue">Accommodation</Badge> : null}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <button className="btn btnGhost" onClick={onBack}>
              Back
            </button>
          </div>
        </div>

        {e?.compensation_notes ? (
          <div style={{ marginTop: 12, fontSize: 13, opacity: 0.9 }}>{e.compensation_notes}</div>
        ) : null}
      </div>

      <div className="card">
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Boat</div>
        {boat ? (
          <>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{boat.name}</div>

            <div className="subtle" style={{ marginTop: 6 }}>
              {[boat.class_name, fmtLen(boat.length_m), prettyBoatType(boat.boat_type)]
                .filter(Boolean)
                .join(" • ")}
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {boat.home_port ? <span className="badge badgeMuted">Home: {boat.home_port}</span> : null}
              {boat.offshore_capable ? (
                <span className="badge badgeGreen">Offshore capable</span>
              ) : (
                <span className="badge badgeMuted">Inshore</span>
              )}
            </div>
          </>
        ) : (
          <div className="subtle">No boat details available.</div>
        )}
      </div>

      <div className="card">
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Skipper / Owner</div>
        {owner ? (
          <>
            <div style={{ fontWeight: 700 }}>{owner.display_name || "Skipper"}</div>
            <div className="subtle" style={{ marginTop: 6 }}>
              {owner.home_port ? <span>{owner.home_port} • </span> : null}
              {owner.offshore_qualified ? <span>Offshore qualified</span> : null}
            </div>
            {owner.bio ? <div style={{ marginTop: 10, fontSize: 13, opacity: 0.9 }}>{owner.bio}</div> : null}
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {typeof owner.reliability_score === "number" ? (
                <Badge tone="muted">Reliability: {owner.reliability_score}</Badge>
              ) : null}
              {typeof owner.would_sail_again_pct === "number" ? (
                <Badge tone="muted">Would sail again: {owner.would_sail_again_pct}%</Badge>
              ) : null}
            </div>
          </>
        ) : (
          <div className="subtle">No skipper profile linked.</div>
        )}
      </div>

      {isSailor ? (
        <div className="card">
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Application</div>

          {myApp ? (
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 700 }}>You've applied</div>
                  <Badge tone="blue">{myApp.status}</Badge>
                </div>
                <div className="subtle" style={{ marginTop: 6 }}>
                  Applied: {fmtDate(myApp.created_at)}
                </div>
              </div>
              <button className="btn btnGhost" onClick={onGoApplications}>
                View in Applications
              </button>
            </div>
          ) : (
            <>
              <div className="subtle" style={{ marginBottom: 10 }}>
                Add a preferred role + short note. You can withdraw later in Applications.
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <div>
                  <label className="subtle" style={{ fontWeight: 700 }}>
                    Preferred position
                  </label>
                  <select
                    value={preferredRole}
                    onChange={(ev) => setPreferredRole(ev.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #e5e7eb",
                      marginTop: 6,
                    }}
                  >
                    <option value="">No preference</option>
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="subtle" style={{ marginBottom: 6 }}>Note (optional)</div>
                  <textarea
                    className="input"
                    value={note}
                    onChange={(ev) => setNote(ev.target.value)}
                    placeholder="Short intro + relevant experience"
                    rows={3}
                  />
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    className="btn btnPrimary"
                    onClick={onApply}
                    disabled={busy || isBlocked}
                    title={isBlocked ? blockReason : ""}
                  >
                    {busy ? "Applying…" : isBlocked ? "Not open" : "Apply"}
                  </button>
                  <button className="btn btnGhost" onClick={onBack} disabled={busy}>
                    Back
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
