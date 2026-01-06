import { useEffect, useMemo, useState } from "react";
import { fetchDiscoverProfiles } from "../api/discovery";
import { fetchMyEvents } from "../api/owner";
import { ownerInviteSailor } from "../api/invites";
import { useSession } from "../hooks/useSession";
import InviteModal from "../components/InviteModal";

function safeArr(v) {
  return Array.isArray(v) ? v : [];
}

function Pill({ children }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 8px",
        borderRadius: 999,
        background: "#f3f4f6",
        fontSize: 12,
        marginRight: 6,
        marginBottom: 6,
      }}
    >
      {children}
    </span>
  );
}

export default function Discovery({ profileType }) {
  const { user } = useSession();

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);

  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  // Owner invite state
  const [events, setEvents] = useState([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteTarget, setInviteTarget] = useState(null);
  const [inviteBusy, setInviteBusy] = useState(false);

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const data = await fetchDiscoverProfiles({
        search,
        role,
        availableOnly,
        type: "sailor",
      });
      setRows(data);
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function loadOwnerEvents() {
    if (!user?.id) return;
    try {
      const data = await fetchMyEvents(user.id);
      setEvents(data);
    } catch {
      // ignore; owner may have no events or no access
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, role, availableOnly]);

  useEffect(() => {
    if (profileType === "owner") loadOwnerEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileType, user?.id]);

  const allRoles = useMemo(() => {
    const set = new Set();
    for (const r of rows) {
      for (const x of safeArr(r.roles)) set.add(String(x));
    }
    return Array.from(set).sort();
  }, [rows]);

  function openInvite(sailor) {
    setErr(null);
    setInviteTarget(sailor);
    setInviteOpen(true);
  }

  async function submitInvite({ eventId, preferredRole, note }) {
    if (!inviteTarget?.id) return;
    setInviteBusy(true);
    setErr(null);
    try {
      await ownerInviteSailor({
        eventId,
        sailorId: inviteTarget.id,
        preferredRole,
        note,
      });
      setInviteOpen(false);
      setInviteTarget(null);
      alert("Invite sent ✅");
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setInviteBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 24, border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h3 style={{ margin: 0 }}>Discovery</h3>
        <button onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>
        Find sailors by name, role, and availability. Owners can invite sailors to an event.
      </div>

      {err && <div style={{ color: "crimson", marginTop: 10 }}>{err}</div>}

      {/* Filters */}
      <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name…"
          style={{ padding: 10, minWidth: 220 }}
        />

        <select value={role} onChange={(e) => setRole(e.target.value)} style={{ padding: 10, minWidth: 200 }}>
          <option value="">All roles</option>
          {allRoles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
          />
          Available only
        </label>

        {profileType === "owner" && (
          <span style={{ fontSize: 12, opacity: 0.75 }}>
            {events.length ? "Invite enabled." : "Create an event to invite sailors."}
          </span>
        )}
      </div>

      {/* Results */}
      <div style={{ marginTop: 14 }}>
        <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th>Name</th>
              <th>Location</th>
              <th>Roles</th>
              <th>Available</th>
              {profileType === "owner" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                <td><b>{p.display_name ?? "—"}</b></td>
                <td>{p.location_text ?? "—"}</td>
                <td>
                  {safeArr(p.roles).length ? safeArr(p.roles).map((r) => <Pill key={r}>{r}</Pill>) : "—"}
                </td>
                <td>{p.is_available ? "✅" : "—"}</td>

                {profileType === "owner" && (
                  <td>
                    <button
                      disabled={!events.length}
                      onClick={() => openInvite(p)}
                      title={!events.length ? "Create an event first" : "Invite to event"}
                    >
                      Invite
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {!rows.length && (
              <tr>
                <td colSpan={profileType === "owner" ? 5 : 4} style={{ opacity: 0.7, paddingTop: 12 }}>
                  No sailors found for these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <InviteModal
        isOpen={inviteOpen}
        onClose={() => {
          if (inviteBusy) return;
          setInviteOpen(false);
          setInviteTarget(null);
        }}
        onSubmit={submitInvite}
        busy={inviteBusy}
        sailor={inviteTarget}
        events={events}
      />
    </div>
  );
}
