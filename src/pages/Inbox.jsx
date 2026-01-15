// src/pages/Inbox.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchInbox } from "../api/inbox";
import { acceptInvite, declineInvite } from "../api/participations";

function fmtDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return String(d);
  }
}

function updateMessage(status, skipperName, direction) {
  const s = skipperName ? ` (${skipperName})` : "";
  switch (status) {
    case "accepted":
      return `✅ Accepted${s}`;
    case "declined":
      return `❌ Declined${s}`;
    case "shortlisted":
      return `⭐ Invited${s}`;
    case "withdrawn":
      return "↩️ You Withdrew";
    default:
      return "Update";
  }
}

export default function Inbox({ userId, onOpenEvent }) {
  const [invites, setInvites] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  async function load() {
    if (!userId) return;
    setErr(null);
    setLoading(true);
    try {
      const data = await fetchInbox();
      setInvites(data?.invites ?? []);
      setUpdates(data?.updates ?? []);
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [userId]);

  const counts = useMemo(() => ({ invites: invites.length, updates: updates.length }), [invites, updates]);

  if (!userId) return <div className="card">Sign In To View Your Inbox.</div>;
  if (loading) return <div className="card">Loading Inbox…</div>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <h2 style={{ margin: 0 }}>Inbox</h2>
            <div className="subtle" style={{ marginTop: 6 }}>Invites And Application Updates.</div>
          </div>
          <button className="btn btnGhost" onClick={load}>Refresh</button>
        </div>

        <div className="subtle" style={{ marginTop: 10 }}>
          Invites: <b>{counts.invites}</b> · Updates: <b>{counts.updates}</b>
        </div>

        {err ? (
          <div style={{ marginTop: 12, color: "crimson" }}>
            {err}
            <div className="subtle" style={{ marginTop: 6 }}>
              If this is an RLS error, check SELECT policies for <b>applications</b>, <b>participations</b>,
              plus linked <b>events</b>, <b>boats</b>, <b>profiles</b>.
            </div>
          </div>
        ) : null}
      </div>

      {invites.length === 0 && updates.length === 0 ? (
        <div className="card">
          <div style={{ fontWeight: 600 }}>No Inbox Items Yet</div>
          <div className="subtle" style={{ marginTop: 6 }}>Invites And Application Updates Will Show Up Here.</div>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: "grid", gap: 14 }}>
            {invites.length ? (
              <div>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>Invites</div>
                <div style={{ display: "grid", gap: 10 }}>
                  {invites.map((r) => {
                    const ev = r.event;
                    return (
                      <div
                        key={`invite-${r.id}`}
                        onClick={() => onOpenEvent?.(ev?.id)}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: 12,
                          padding: 12,
                          border: "1px solid rgba(0,0,0,0.08)",
                          borderRadius: 12,
                          cursor: "pointer",
                        }}
                        title="Open Event Details"
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800 }}>{ev?.title ?? "Event"}</div>

                          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span className="badge badgeBlue">Invite</span>
                            <span className="badge badgeOrange">Action Required</span>
                          </div>

                          <div className="subtle" style={{ marginTop: 6 }}>
                            {ev?.location_text ? <span>{ev.location_text} • </span> : null}
                            {ev?.start_date ? <span>{fmtDate(ev.start_date)}</span> : null}
                            {ev?.end_date ? <span> – {fmtDate(ev.end_date)}</span> : null}
                          </div>

                          <div className="subtle" style={{ marginTop: 6 }}>
                            Skipper: <b>{ev?.owner?.display_name ?? "—"}</b>
                            {ev?.boat?.name ? <> • Boat: <b>{ev.boat.name}</b></> : null}
                            <> • Role: <b>{r?.role ?? "Any"}</b></>
                          </div>

                          <div className="subtle" style={{ marginTop: 6 }}>
                            Invite Pending Your Confirmation
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <button
                            className="btn btnSmall btnPrimary"
                            onClick={(e) => {
                              e.stopPropagation();
                              acceptInvite(r.id).then(load);
                            }}
                          >
                            Accept
                          </button>

                          <button
                            className="btn btnSmall btnGhost"
                            onClick={(e) => {
                              e.stopPropagation();
                              declineInvite(r.id).then(load);
                            }}
                          >
                            Decline
                          </button>

                          <span className="badge badgeMuted">
                            Received {fmtDate(r.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {updates.length ? (
              <div>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>Updates</div>
                <div style={{ display: "grid", gap: 10 }}>
                  {updates.map((r) => {
                    const ev = r.event;
                    return (
                      <div
                        key={`update-${r.id}`}
                        onClick={() => onOpenEvent?.(ev?.id)}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: 12,
                          padding: 12,
                          border: "1px solid rgba(0,0,0,0.08)",
                          borderRadius: 12,
                          cursor: "pointer",
                        }}
                        title="Open Event Details"
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800 }}>{ev?.title ?? "Event"}</div>

                          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span className="badge badgeMuted">Update</span>
                          </div>

                          <div className="subtle" style={{ marginTop: 6 }}>
                            {ev?.location_text ? <span>{ev.location_text} • </span> : null}
                            {ev?.start_date ? <span>{fmtDate(ev.start_date)}</span> : null}
                            {ev?.end_date ? <span> – {fmtDate(ev.end_date)}</span> : null}
                          </div>

                          <div className="subtle" style={{ marginTop: 6 }}>
                            Skipper: <b>{ev?.owner?.display_name ?? "—"}</b>
                            {ev?.boat?.name ? <> • Boat: <b>{ev.boat.name}</b></> : null}
                          </div>

                          <div className="subtle" style={{ marginTop: 6 }}>
                            {updateMessage(r.status, ev?.owner?.display_name, r.direction)}
                            {r.preferred_role ? <> • You Requested: <b>{r.preferred_role}</b></> : null}
                          </div>

                          {r.note ? (
                            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.9 }}>
                              <b>Your Note:</b> {r.note}
                            </div>
                          ) : null}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="badge badgeMuted">
                            {r.updated_at ? `Updated ${fmtDate(r.updated_at)}` : `Received ${fmtDate(r.created_at)}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
