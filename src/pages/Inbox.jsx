// src/pages/Inbox.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchInbox } from "../api/inbox";

function fmtDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return String(d);
  }
}

export default function Inbox({ userId }) {
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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const counts = useMemo(() => {
    return { invites: invites.length, updates: updates.length };
  }, [invites, updates]);

  if (!userId) return <div className="card">Sign in to view your inbox.</div>;
  if (loading) return <div className="card">Loading inbox…</div>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <h2 style={{ margin: 0 }}>Inbox</h2>
            <div className="subtle" style={{ marginTop: 6 }}>
              Invites and application updates.
            </div>
          </div>
          <button className="btn btnGhost" onClick={load}>
            Refresh
          </button>
        </div>

        <div className="subtle" style={{ marginTop: 10 }}>
          Invites: <b>{counts.invites}</b> · Updates: <b>{counts.updates}</b>
        </div>

        {err ? (
          <div style={{ marginTop: 12, color: "crimson" }}>
            {err}
            <div className="subtle" style={{ marginTop: 6 }}>
              If this is an RLS error, your applications select policy isn’t allowing reads.
            </div>
          </div>
        ) : null}
      </div>

      {invites.length === 0 && updates.length === 0 ? (
        <div className="card">
          <div style={{ fontWeight: 600 }}>No inbox items yet</div>
          <div className="subtle" style={{ marginTop: 6 }}>
            Invites and application updates will show up here.
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: "grid", gap: 10 }}>
            {invites.map((r) => (
              <div
                key={`invite-${r.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 12,
                  padding: 12,
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 12,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{r.event?.title ?? "Event"}</div>
                  <div className="subtle" style={{ marginTop: 6 }}>
                    {r.event?.location_text ? <span>{r.event.location_text} • </span> : null}
                    {r.event?.start_date ? <span>{fmtDate(r.event.start_date)}</span> : null}
                    {r.event?.end_date ? <span> – {fmtDate(r.event.end_date)}</span> : null}
                  </div>
                  {r.event?.owner?.display_name ? (
                    <div className="subtle" style={{ marginTop: 4 }}>
                      Skipper: <b>{r.event.owner.display_name}</b>
                    </div>
                  ) : null}
                  {r.event?.boat?.name ? (
                    <div className="subtle" style={{ marginTop: 4 }}>
                      Boat: <b>{r.event.boat.name}</b>
                    </div>
                  ) : null}
                  <div className="subtle" style={{ marginTop: 6 }}>
                    Invite pending your confirmation
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="badge badgeMuted">{fmtDate(r.created_at)}</span>
                </div>
              </div>
            ))}

            {updates.map((r) => (
              <div
                key={`update-${r.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 12,
                  padding: 12,
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 12,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{r.event?.title ?? "Event"}</div>
                  <div className="subtle" style={{ marginTop: 6 }}>
                    {r.event?.location_text ? <span>{r.event.location_text} • </span> : null}
                    {r.event?.start_date ? <span>{fmtDate(r.event.start_date)}</span> : null}
                    {r.event?.end_date ? <span> – {fmtDate(r.event.end_date)}</span> : null}
                  </div>
                  {r.event?.boat?.name ? (
                    <div className="subtle" style={{ marginTop: 4 }}>
                      Boat: <b>{r.event.boat.name}</b>
                    </div>
                  ) : null}
                  <div className="subtle" style={{ marginTop: 6 }}>
                    Status: <b>{r.status}</b> · Direction: <b>{r.direction}</b>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="badge badgeMuted">{fmtDate(r.updated_at || r.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
