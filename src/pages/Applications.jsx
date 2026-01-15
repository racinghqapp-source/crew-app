// src/pages/Applications.jsx
import { useMemo, useState } from "react";
import Badge from "../components/Badge";

const mockApplications = [
  {
    id: "a1",
    crewName: "Alex Morgan",
    eventName: "Saturday Twilight",
    boat: "Racing Yacht 32",
    role: "Helm",
    status: "invited", // invited | accepted | shortlisted | declined | withdrawn
    updated: "Today 9:12am",
  },
  {
    id: "a2",
    crewName: "Jamie Lee",
    eventName: "Saturday Twilight",
    boat: "Racing Yacht 32",
    role: "Trim",
    status: "accepted",
    updated: "Yesterday 6:40pm",
  },
  {
    id: "a3",
    crewName: "Chris Nolan",
    eventName: "Coastal Sprint",
    boat: "J/70",
    role: "Navigator",
    status: "shortlisted",
    updated: "Fri 2:15pm",
  },
];

function statusTone(status) {
  switch (status) {
    case "accepted":
      return "green";
    case "shortlisted":
      return "orange";
    case "declined":
      return "red";
    case "withdrawn":
      return "orange";
    case "invited":
    default:
      return "muted";
  }
}

function statusLabel(status) {
  if (!status) return "—";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function Applications() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all"); // all | invited | accepted | shortlisted | declined | withdrawn

  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    return mockApplications
      .filter((a) => {
        if (!s) return true;
        return (
          a.crewName.toLowerCase().includes(s) ||
          a.eventName.toLowerCase().includes(s) ||
          a.boat.toLowerCase().includes(s) ||
          a.role.toLowerCase().includes(s)
        );
      })
      .filter((a) => {
        if (filter === "all") return true;
        return a.status === filter;
      });
  }, [q, filter]);

  return (
    <div className="card">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 750, fontSize: 16 }}>Applications</div>
          <div className="subtle">
            Track Invites And Responses. Accepted Is The Only State That Counts Toward Readiness.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn btnGhost btnSmall" type="button">
            Export
          </button>
          <button className="btn btnSmall" type="button">
            New Invite
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Crew, Events, Boats, Roles…"
          style={{
            flex: 1,
            minWidth: 240,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.92)",
            outline: "none",
          }}
        />

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", "invited", "accepted", "shortlisted", "declined", "withdrawn"].map((k) => (
            <button
              key={k}
              className={`btn btnSmall ${filter === k ? "btnPrimary" : "btnGhost"}`}
              type="button"
              onClick={() => setFilter(k)}
            >
              {k === "all" ? "All" : statusLabel(k)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <div className="alert">No Applications Match Your Filters.</div>
      ) : (
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Crew</th>
                <th>Event</th>
                <th style={{ width: 220 }}>Boat</th>
                <th style={{ width: 140 }}>Role</th>
                <th style={{ width: 150 }}>Status</th>
                <th style={{ width: 140 }}>Updated</th>
                <th style={{ width: 200 }} />
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ fontWeight: 650 }}>{a.crewName}</div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600 }}>{a.eventName}</div>
                    <div className="subtle">{a.updated}</div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600 }}>{a.boat}</div>
                  </td>

                  <td>
                    <Badge tone="muted">{a.role}</Badge>
                  </td>

                  <td>
                    <Badge tone={statusTone(a.status)}>{statusLabel(a.status)}</Badge>
                  </td>

                  <td>
                    <div className="subtle">{a.updated}</div>
                  </td>

                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button className="btn btnGhost btnSmall" type="button">
                        Open
                      </button>

                      {a.status === "invited" || a.status === "shortlisted" ? (
                        <button className="btn btnSmall" type="button">
                          Nudge
                        </button>
                      ) : null}

                      {a.status === "accepted" ? (
                        <button className="btn btnSmall" type="button">
                          Withdraw
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="subtle" style={{ marginTop: 10 }}>
        UI Rule: Accepted Is Green. Everything Else Is Secondary (Muted/Orange/Red).
      </div>
    </div>
  );
}
