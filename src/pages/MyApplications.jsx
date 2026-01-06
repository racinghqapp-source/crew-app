import { useEffect, useState } from "react";
import { useSession } from "../hooks/useSession";
import { acceptApplication, declineApplication, fetchMyApplications } from "../api/myApplications";

export default function MyApplications() {
  const { user } = useSession();
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    if (!user?.id) return;
    setErr(null);
    setLoading(true);
    try {
      const data = await fetchMyApplications();
      setRows(data);
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function onAccept(id) {
    setBusyId(id);
    setErr(null);
    try {
      await acceptApplication(id);
      await load();
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setBusyId(null);
    }
  }

  async function onDecline(id) {
    setBusyId(id);
    setErr(null);
    try {
      await declineApplication(id);
      await load();
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setBusyId(null);
    }
  }

  if (!user) return null;

  return (
    <div style={{ marginTop: 24, border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h3 style={{ margin: 0 }}>My Applications</h3>
        <button onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>
        Invites and applications for events. Accept/Decline is only allowed while status is invited/pending.
      </div>

      {err && <div style={{ color: "crimson", marginTop: 10 }}>{err}</div>}

      <div style={{ marginTop: 12 }}>
        <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th>Event</th>
              <th>Date</th>
              <th>Owner</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => {
              const isBusy = busyId === r.application_id;
              const status = String(r.status || "").toLowerCase();
              const actionable = status === "invited" || status === "pending";

              return (
                <tr key={r.application_id} style={{ borderBottom: "1px solid #eee" }}>
                  <td>
                    <b>{r.event_title ?? "Untitled"}</b>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      {r.event_location_text ?? "—"}
                    </div>
                  </td>
                  <td>{r.event_start_date ?? "—"}</td>
                  <td>{r.owner_display_name ?? String(r.owner_id).slice(0, 8)}</td>
                  <td>{r.preferred_role ?? "—"}</td>
                  <td>{r.status ?? "—"}</td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <button disabled={!actionable || isBusy} onClick={() => onAccept(r.application_id)}>
                      Accept
                    </button>
                    <button disabled={!actionable || isBusy} onClick={() => onDecline(r.application_id)}>
                      Decline
                    </button>
                  </td>
                </tr>
              );
            })}

            {!rows.length && (
              <tr>
                <td colSpan="6" style={{ opacity: 0.7, paddingTop: 12 }}>
                  No applications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
        Next: when accepted, we can optionally create a participation automatically (or keep it separate).
      </div>
    </div>
  );
}
