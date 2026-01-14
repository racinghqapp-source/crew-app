// src/pages/MyApplications.jsx
import { useEffect, useMemo, useState } from "react";
import { useSession } from "../hooks/useSession";
import { fetchMyApplications, withdrawApplication } from "../api/applications";

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

function prettyStatus(status) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
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

  async function onWithdraw(appId) {
    if (!user?.id) return;
    setBusyId(appId);
    setErr(null);
    try {
      await withdrawApplication({ userId: user.id, applicationId: appId });
      await load();
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="card">Loading applications…</div>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="card">
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0 }}>My Applications</h2>
            <div className="subtle" style={{ marginTop: 6 }}>
              Track invitations and applications. Withdraw if plans change.
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
          <div style={{ fontWeight: 600 }}>No applications yet</div>
          <div className="subtle" style={{ marginTop: 6 }}>
            Head to Discover and apply to an event that suits you.
          </div>
        </div>
      ) : (
        <>
          <Section title="Applied" items={groups.applied} busyId={busyId} onWithdraw={onWithdraw} />
          <Section
            title="Shortlisted"
            items={groups.shortlisted}
            busyId={busyId}
            onWithdraw={onWithdraw}
          />
          <Section title="Accepted" items={groups.accepted} busyId={busyId} onWithdraw={onWithdraw} />
          <Section title="Closed" items={groups.closed} busyId={busyId} onWithdraw={onWithdraw} />
        </>
      )}
    </div>
  );

  function Section({ title, items, busyId, onWithdraw }) {
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
            const canWithdraw = r.status === "applied" || r.status === "shortlisted";
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
                    <Badge tone={statusTone(r.status)}>{prettyStatus(r.status)}</Badge>
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
                        Preferred role: <b>{r.preferred_role}</b> •{" "}
                      </>
                    ) : null}
                    Applied: {fmtDate(r.created_at)}
                  </div>

                  {r.note ? <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>{r.note}</div> : null}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {canWithdraw ? (
                    <button
                      className="btn btnGhost"
                      disabled={busyId === r.id}
                      onClick={() => onWithdraw(r.id)}
                      title="Withdraw application"
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
