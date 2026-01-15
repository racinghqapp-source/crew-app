// src/pages/MyApplications.jsx
import { useEffect, useMemo, useState } from "react";
import { useSession } from "../hooks/useSession";
import { fetchMyApplications } from "../api/applications";
import { supabase } from "../lib/supabase";

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

function statusTone(status) {
  switch (status) {
    case "accepted":
      return "green";
    case "shortlisted":
      return "blue";
    case "applied":
      return "orange";
    case "declined":
    case "withdrawn":
      return "red";
    default:
      return "muted";
  }
}

function prettyStatus(status, direction) {
  if (!status) return "Unknown";
  const s = String(status);
  if (s === "shortlisted") return "Invited";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmtDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return String(d);
  }
}

export default function MyApplications() {
  const { user } = useSession();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    if (!user?.id) return;
    setErr(null);
    setLoading(true);
    try {
      const data = await fetchMyApplications(user.id);
      setRows(data);
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const groups = useMemo(() => {
    const applied = [];
    const shortlisted = [];
    const accepted = [];
    const closed = [];

    for (const r of rows) {
      if (r.status === "accepted") accepted.push(r);
      else if (r.status === "shortlisted") shortlisted.push(r);
      else if (r.status === "applied") applied.push(r);
      else closed.push(r);
    }
    return { applied, shortlisted, accepted, closed };
  }, [rows]);

  async function handleAccept(app) {
    const eventId = app?.event?.id ?? app?.event_id;
    if (!eventId) {
      setErr("Missing Event For This Application.");
      return;
    }
    setBusyId(app.id);
    setErr(null);
    try {
      const { error } = await supabase.rpc("accept_invite", { p_event_id: eventId });
      if (error) throw error;
      setRows((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: "accepted" } : a)));
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDecline(app) {
    const eventId = app?.event?.id ?? app?.event_id;
    if (!eventId) {
      setErr("Missing Event For This Application.");
      return;
    }
    setBusyId(app.id);
    setErr(null);
    try {
      const { error } = await supabase.rpc("decline_invite", { p_event_id: eventId });
      if (error) throw error;
      setRows((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: "declined" } : a)));
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setBusyId(null);
    }
  }

  async function handleWithdraw(app) {
    setBusyId(app.id);
    setErr(null);
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: "withdrawn" })
        .eq("id", app.id);
      if (error) throw error;
      setRows((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: "withdrawn" } : a)));
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="card">Loading Applications…</div>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="card">
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0 }}>My Applications</h2>
            <div className="subtle" style={{ marginTop: 6 }}>
              Track Invitations And Applications. Withdraw If Plans Change.
            </div>
          </div>
          <button className="btn btnGhost" onClick={load}>
            Refresh
          </button>
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

      {rows.length === 0 ? (
        <div className="card">
          <div style={{ fontWeight: 600 }}>No Applications Yet</div>
          <div className="subtle" style={{ marginTop: 6 }}>
            Head To Discover And Apply To An Event That Suits You.
          </div>
        </div>
      ) : (
        <>
          <Section title="Applied" items={groups.applied} busyId={busyId} />
          <Section
            title="Shortlisted"
            items={groups.shortlisted}
            busyId={busyId}
          />
          <Section title="Accepted" items={groups.accepted} busyId={busyId} />
          <Section title="Closed" items={groups.closed} busyId={busyId} />
        </>
      )}
    </div>
  );

  function Section({ title, items, busyId }) {
    if (!items?.length) return null;

    return (
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <div className="subtle">{items.length}</div>
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          {items.map((r) => {
            const e = r.event;
            const status = String(r.status || "");
            const isInvited = status === "invited" || status === "shortlisted";
            const isAccepted = status === "accepted";
            return (
              <div
                key={r.id}
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
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {e?.title ?? "Event"}
                    </div>
                    <Badge tone={statusTone(r.status)}>{prettyStatus(r.status, r.direction)}</Badge>
                    {e?.status ? <Badge tone="muted">{String(e.status)}</Badge> : null}
                  </div>

                  <div className="subtle" style={{ marginTop: 6 }}>
                    {e?.boat?.name ? <span>{e.boat.name} • </span> : null}
                    {e?.location_text ? <span>{e.location_text} • </span> : null}
                    {e?.start_date ? <span>{fmtDate(e.start_date)}</span> : null}
                    {e?.end_date ? <span> – {fmtDate(e.end_date)}</span> : null}
                  </div>

                  <div className="subtle" style={{ marginTop: 6 }}>
                    {r.preferred_role ? (
                      <>
                        Preferred Role: <b>{r.preferred_role}</b> •{" "}
                      </>
                    ) : null}
                    Applied: {fmtDate(r.created_at)}
                  </div>

                  {r.note ? <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>{r.note}</div> : null}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isInvited ? (
                    <>
                      <button
                        className="btn btnPrimary"
                        disabled={busyId === r.id}
                        onClick={() => handleAccept(r)}
                      >
                        {busyId === r.id ? "Working…" : "Accept"}
                      </button>
                      <button
                        className="btn btnGhost"
                        disabled={busyId === r.id}
                        onClick={() => handleDecline(r)}
                      >
                        {busyId === r.id ? "Working…" : "Decline"}
                      </button>
                    </>
                  ) : null}

                  {isAccepted ? (
                    <button
                      className="btn btnGhost"
                      disabled={busyId === r.id}
                      onClick={() => handleWithdraw(r)}
                      title="Withdraw Application"
                    >
                      {busyId === r.id ? "Withdrawing…" : "Withdraw"}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
