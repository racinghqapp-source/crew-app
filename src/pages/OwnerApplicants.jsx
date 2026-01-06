// src/pages/OwnerApplicants.jsx
import { useEffect, useMemo, useState } from "react";
import { useSession } from "../hooks/useSession";
import { isPro } from "../hooks/usePlan";
import {
  fetchMyEvents,
  fetchApplicationsForEvent,
  fetchProfilesByIds,
  setApplicationStatus,
} from "../api/owner";

function bandBonus(band) {
  const v = (band || "unknown").toLowerCase();
  if (v === "high") return 15;
  if (v === "medium") return 7;
  if (v === "low") return -5;
  return 0;
}

function scoreProfile(p) {
  const reliability = Number(p?.reliability_score ?? 0); // 0..100
  const wouldAgain = Number(p?.would_sail_again_pct ?? 0); // 0..100
  const verified = Number(p?.verified_participations_count ?? 0); // count
  const band = bandBonus(p?.competence_band);

  const score = reliability + wouldAgain * 0.35 + Math.min(verified, 20) * 2 + band;
  return Math.round(score);
}

export default function OwnerApplicants({ profileType, planTier }) {
  const { user } = useSession();
  const pro = isPro(planTier);

  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [apps, setApps] = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [err, setErr] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const [busyAppId, setBusyAppId] = useState(null);

  async function loadEvents() {
    setErr(null);
    setLoadingEvents(true);
    try {
      const data = await fetchMyEvents(user.id);
      setEvents(data);
      if (!eventId && data.length) setEventId(data[0].id);
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setLoadingEvents(false);
    }
  }

  async function loadApps(eid) {
    if (!eid) {
      setApps([]);
      setProfilesById({});
      return;
    }

    setErr(null);
    setLoadingApps(true);
    try {
      const a = await fetchApplicationsForEvent(eid);
      setApps(a);

      const sailorIds = Array.from(
        new Set((a ?? []).map((x) => x.sailor_id).filter(Boolean))
      );
      const profs = await fetchProfilesByIds(sailorIds);

      const map = {};
      for (const p of profs) map[p.id] = p;
      setProfilesById(map);
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setLoadingApps(false);
    }
  }

  useEffect(() => {
    if (!user?.id) return;
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    loadApps(eventId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, user?.id]);

  const ranked = useMemo(() => {
    const rows = (apps ?? []).map((a) => {
      const p = profilesById[a.sailor_id];
      const score = p ? scoreProfile(p) : 0;
      return { a, p, score };
    });

    // ✅ Free tier: keep arrival order (or newest-first as loaded)
    // ✅ Pro tier: rank by trust score
    if (pro) rows.sort((x, y) => y.score - x.score);

    return rows;
  }, [apps, profilesById, pro]);

  async function updateStatus(appId, status) {
    setBusyAppId(appId);
    setErr(null);
    try {
      await setApplicationStatus(appId, status);
      await loadApps(eventId);
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setBusyAppId(null);
    }
  }

  if (!user) return null;

  if (profileType !== "owner") {
    return (
      <div
        style={{
          marginTop: 24,
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 14,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Owner Applicants</h3>
        <div style={{ fontSize: 12, opacity: 0.75 }}>
          This section appears for <b>owner</b> accounts.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 24,
        border: "1px solid #eee",
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <h3 style={{ margin: 0 }}>Owner Applicants</h3>
        <button onClick={loadEvents} disabled={loadingEvents}>
          {loadingEvents ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {!pro && (
        <div
          style={{
            marginTop: 10,
            padding: 12,
            borderRadius: 10,
            background: "#fff7ed",
            border: "1px solid #fed7aa",
          }}
        >
          <b>Owner Pro unlocks:</b> ranked applicants + trust metrics + accept/reject.
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
            (Dev tip) Set <code>profiles.plan_tier</code> to <code>'pro'</code> in Supabase to simulate
            upgrade.
          </div>
        </div>
      )}

      {err && <div style={{ color: "crimson", marginTop: 10 }}>{err}</div>}

      <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Event</div>
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          style={{ padding: 10, minWidth: 280 }}
        >
          {!events.length && <option value="">No events found</option>}
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title ?? "Untitled"} ({ev.start_date ?? "?"})
            </option>
          ))}
        </select>

        <button onClick={() => loadApps(eventId)} disabled={loadingApps || !eventId}>
          {loadingApps ? "Loading…" : "Load applicants"}
        </button>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, opacity: 0.75 }}>
        {pro
          ? "Ranked by reliability + would-sail-again + verified sails + competence band."
          : "Upgrade to Owner Pro to rank applicants and view trust metrics."}
      </div>

      <div style={{ marginTop: 12 }}>
        <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th>#</th>
              <th>Sailor</th>
              {pro && <th>Score</th>}
              {pro && <th>Reliability</th>}
              {pro && <th>Would again</th>}
              {pro && <th>Verified</th>}
              {pro && <th>Band</th>}
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map(({ a, p, score }, idx) => {
              const isBusy = busyAppId === a.id;
              return (
                <tr key={a.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td>{idx + 1}</td>
                  <td>{p?.display_name ?? a.sailor_id?.slice(0, 8) ?? "—"}</td>

                  {pro && (
                    <>
                      <td>
                        <b>{score}</b>
                      </td>
                      <td>{p?.reliability_score ?? 0}</td>
                      <td>{p?.would_sail_again_pct ?? 0}%</td>
                      <td>{p?.verified_participations_count ?? 0}</td>
                      <td>{(p?.competence_band ?? "unknown").toUpperCase()}</td>
                    </>
                  )}

                  <td>{a.preferred_role ?? "—"}</td>
                  <td>{a.status ?? "—"}</td>

                  <td style={{ display: "flex", gap: 8 }}>
                    {pro ? (
                      <>
                        <button disabled={isBusy} onClick={() => updateStatus(a.id, "accepted")}>
                          Accept
                        </button>
                        <button disabled={isBusy} onClick={() => updateStatus(a.id, "rejected")}>
                          Reject
                        </button>
                      </>
                    ) : (
                      <span style={{ fontSize: 12, opacity: 0.75 }}>Upgrade to act</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {!ranked.length && (
              <tr>
                <td colSpan={pro ? 10 : 5} style={{ opacity: 0.7, paddingTop: 12 }}>
                  {eventId ? "No applications yet for this event." : "Select an event to view applications."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
        Next paid upgrade: show last 5 ratings + no-show flags + crew-fit filters.
      </div>
    </div>
  );
}
