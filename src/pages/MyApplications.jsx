// src/pages/MyApplications.jsx
import { useEffect, useMemo, useState } from "react";
import { useSession } from "../hooks/useSession";
import { acceptApplication, declineApplication, fetchMyApplications } from "../api/myApplications";

function statusLabel(s) {
  const v = String(s || "").toLowerCase();
  if (v === "invited") return "Invite";
  if (v === "pending") return "Pending";
  if (v === "accepted") return "Accepted";
  if (v === "declined") return "Declined";
  return s || "—";
}

function statusTone(s) {
  const v = String(s || "").toLowerCase();
  if (v === "invited") return { bg: "#ecfeff", border: "#a5f3fc", text: "#155e75" }; // cyan-ish
  if (v === "pending") return { bg: "#fef9c3", border: "#fde68a", text: "#854d0e" }; // amber-ish
  if (v === "accepted") return { bg: "#dcfce7", border: "#86efac", text: "#166534" }; // green-ish
  if (v === "declined") return { bg: "#fee2e2", border: "#fecaca", text: "#991b1b" }; // red-ish
  return { bg: "#f3f4f6", border: "#e5e7eb", text: "#374151" };
}

function Chip({ children, tone }) {
  const t = tone || { bg: "#f3f4f6", border: "#e5e7eb", text: "#374151" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 999,
        border: `1px solid ${t.border}`,
        background: t.bg,
        color: t.text,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Card({ children }) {
  return (
    <div
      style={{
        border: "1px solid #eee",
        borderRadius: 14,
        padding: 14,
        background: "white",
      }}
    >
      {children}
    </div>
  );
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid #0b2440",
        background: "#0b2440",
        color: "white",
        fontWeight: 700,
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid #ddd",
        background: "white",
        color: "#111827",
        fontWeight: 600,
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

function formatWhen(r) {
  const date = r.event_start_date ? String(r.event_start_date) : null;
  const loc = r.event_location_text ? String(r.event_location_text) : null;
  if (date && loc) return `${date} • ${loc}`;
  return date || loc || "—";
}

function InviteCard({ r, busy, onAccept, onDecline }) {
  const tone = statusTone(r.status);
  const canAct = ["invited", "pending"].includes(String(r.status || "").toLowerCase());

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0b2440" }}>
              {r.event_title ?? "Untitled event"}
            </div>
            <Chip tone={tone}>{statusLabel(r.status)}</Chip>
          </div>

          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8 }}>
            {formatWhen(r)}
          </div>

          <div style={{ marginTop: 10, fontSize: 13 }}>
            <div>
              From <b>{r.owner_display_name ?? String(r.owner_id).slice(0, 8)}</b>
              {r.preferred_role ? (
                <>
                  {" "}
                  • Role: <b>{r.preferred_role}</b>
                </>
              ) : null}
            </div>

            {r.note ? (
              <div style={{ marginTop: 8, padding: 10, borderRadius: 10, background: "#f9fafb" }}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Message</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{r.note}</div>
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 160 }}>
          <PrimaryButton disabled={!canAct || busy} onClick={onAccept}>
            {busy ? "Working…" : "Accept"}
          </PrimaryButton>
          <SecondaryButton disabled={!canAct || busy} onClick={onDecline}>
            Decline
          </SecondaryButton>
        </div>
      </div>
    </Card>
  );
}

export default function MyApplications() {
  const { user } = useSession();

  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [showDeclined, setShowDeclined] = useState(false);

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

  const { actionRequired, accepted, declined, other } = useMemo(() => {
    const a = [];
    const ac = [];
    const d = [];
    const o = [];

    for (const r of rows) {
      const s = String(r.status || "").toLowerCase();
      if (s === "invited" || s === "pending") a.push(r);
      else if (s === "accepted") ac.push(r);
      else if (s === "declined") d.push(r);
      else o.push(r);
    }
    return { actionRequired: a, accepted: ac, declined: d, other: o };
  }, [rows]);

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
    <div style={{ marginTop: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0 }}>Applications</h3>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
            Your invites and applications. Action-required items stay on top.
          </div>
        </div>

        <button onClick={load} disabled={loading} style={{ padding: "8px 12px", borderRadius: 10 }}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {err && <div style={{ color: "crimson", marginTop: 12 }}>{err}</div>}

      {/* Action Required */}
      <div style={{ marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h4 style={{ margin: 0 }}>Action required</h4>
          <Chip tone={actionRequired.length ? statusTone("pending") : statusTone("accepted")}>
            {actionRequired.length} items
          </Chip>
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 12 }}>
          {actionRequired.map((r) => (
            <InviteCard
              key={r.application_id}
              r={r}
              busy={busyId === r.application_id}
              onAccept={() => onAccept(r.application_id)}
              onDecline={() => onDecline(r.application_id)}
            />
          ))}

          {!actionRequired.length && (
            <div style={{ opacity: 0.75, padding: 14, border: "1px dashed #ddd", borderRadius: 12 }}>
              Nothing waiting on you right now ✅
            </div>
          )}
        </div>
      </div>

      {/* Accepted */}
      {!!accepted.length && (
        <div style={{ marginTop: 18 }}>
          <h4 style={{ margin: 0 }}>Accepted</h4>
          <div style={{ marginTop: 10, display: "grid", gap: 12 }}>
            {accepted.map((r) => (
              <InviteCard
                key={r.application_id}
                r={r}
                busy={busyId === r.application_id}
                onAccept={() => {}}
                onDecline={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other statuses (future-proof) */}
      {!!other.length && (
        <div style={{ marginTop: 18 }}>
          <h4 style={{ margin: 0 }}>Other</h4>
          <div style={{ marginTop: 10, display: "grid", gap: 12 }}>
            {other.map((r) => (
              <InviteCard
                key={r.application_id}
                r={r}
                busy={busyId === r.application_id}
                onAccept={() => {}}
                onDecline={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* Declined (collapsed) */}
      {!!declined.length && (
        <div style={{ marginTop: 18 }}>
          <button
            onClick={() => setShowDeclined((v) => !v)}
            style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #ddd", background: "white" }}
          >
            {showDeclined ? "Hide" : "Show"} declined ({declined.length})
          </button>

          {showDeclined && (
            <div style={{ marginTop: 10, display: "grid", gap: 12 }}>
              {declined.map((r) => (
                <InviteCard
                  key={r.application_id}
                  r={r}
                  busy={busyId === r.application_id}
                  onAccept={() => {}}
                  onDecline={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
