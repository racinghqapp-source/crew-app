// src/pages/OwnerApplicants.jsx
import { useEffect, useMemo, useState } from "react";
import { useSession } from "../hooks/useSession";
import { isPro } from "../hooks/usePlan";
import { fetchMyEvents, fetchApplicantsBasic, fetchApplicantsPro, setApplicationStatus } from "../api/owner";

export default function OwnerApplicants({ profileType, planTier }) {
  const { user } = useSession();
  const pro = isPro(planTier);

  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
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

  async function loadApplicants(eid) {
    if (!eid) {
      setRows([]);
      return;
    }

    setErr(null);
    setLoadingRows(true);
    try {
      const data = pro ? await fetchApplicantsPro(eid) : await fetchApplicantsBasic(eid);
      setRows(data);
    } catch (e) {
      setErr(e.message ?? String(e));
      setRows([]);
    } finally {
      setLoadingRows(false);
    }
  }

  useEffect(() => {
    if (!user?.id) return;
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    loadApplicants(eventId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, user?.id, pro]);

  const ranked = useMemo(() => {
    // Pro comes pre-ranked from DB (score desc), but keep safe in UI too
    if (!pro) return rows;
    return [...rows].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }, [rows, pro]);

  async function updateStatus(applicationId, status) {
    setBusyAppId(applicationId);
    setErr(null);
    try {
      await setApplicationStatus(applicationId, status);
      await loadApplicants(eventId);
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setBusyAppId(null);
    }
  }

  if (!user) return null;

  if (profileType !== "owner") {
    return (
      <div style={{ marginTop: 24, border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
        <h3 style={{ marginTop: 0 }}>Owner Applicants</h3>
        <div style={{ fontSize: 12, opacity: 0.75 }}>
          This section appears for <b>owner</b> accounts.
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24, border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
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
            (Dev) Set <code>profiles.plan_tier</code> to <code>'pro'</code> in Supabase to simulate upgrade.
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

        <button onClick={() => loadApplicants(eventId)} disabled={loadingRows || !eventId}>
          {loadingRows ? "Loading…" : "Load applicants"}
        </button>
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
            {ranked.map((r, idx) => {
              const isBusy = busyAppId === r.application_id;
              return (
                <tr key={r.application_id} style={{ borderBottom: "1px solid #eee" }}>
                  <td>{idx + 1}</td>
                  <td>{r.sailor_display_name ?? String(r.sailor_id).slice(0, 8)}</td>

                  {pro && (
                    <>
                      <td><b>{r.score ?? 0}</b></td>
                      <td>{r.reliability_score ?? 0}</td>
                      <td>{r.would_sail_again_pct ?? 0}%</td>
                      <td>{r.verified_participations_count ?? 0}</td>
                      <td>{(r.competence_band ?? "unknown").toUpperCase()}</td>
                    </>
                  )}

                  <td>{r.preferred_role ?? "—"}</td>
                  <td>{r.status ?? "—"}</td>

                  <td style={{ display: "flex", gap: 8 }}>
                    {pro ? (
                      <>
                        <button disabled={isBusy} onClick={() => updateStatus(r.application_id, "accepted")}>
                          Accept
                        </button>
                        <button disabled={isBusy} onClick={() => updateStatus(r.application_id, "rejected")}>
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
        Server-enforced paywall: Free owners cannot access trust metrics or accept/reject.
      </div>
    </div>
  );
}
