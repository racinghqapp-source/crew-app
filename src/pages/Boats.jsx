// src/pages/Boats.jsx
import { useMemo, useState } from "react";
import Badge from "../components/Badge";

const mockBoats = [
  {
    id: "b1",
    name: "Racing Yacht 32",
    class: "Yacht",
    length: "32ft",
    offshoreCapable: true,
    activeEvents: 1,
  },
  {
    id: "b2",
    name: "J/70",
    class: "Keelboat",
    length: "23ft",
    offshoreCapable: false,
    activeEvents: 2,
  },
];

export default function Boats() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all"); // all | offshore | inshore

  const boats = useMemo(() => {
    const s = q.trim().toLowerCase();
    return mockBoats
      .filter((b) => {
        if (!s) return true;
        return (
          b.name.toLowerCase().includes(s) ||
          (b.class || "").toLowerCase().includes(s) ||
          (b.length || "").toLowerCase().includes(s)
        );
      })
      .filter((b) => {
        if (filter === "all") return true;
        if (filter === "offshore") return b.offshoreCapable;
        if (filter === "inshore") return !b.offshoreCapable;
        return true;
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
          <div style={{ fontWeight: 750, fontSize: 16 }}>Boats</div>
          <div className="subtle">
            Manage Boats As Operational Containers. Events And Lineups Hang Off These.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn btnGhost btnSmall" type="button">
            Import
          </button>
          <button className="btn btnPrimary btnSmall" type="button">
            New Boat
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
          placeholder="Search Boats, Class, Length…"
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

        <div style={{ display: "flex", gap: 6 }}>
          <button
            className={`btn btnSmall ${filter === "all" ? "btnPrimary" : "btnGhost"}`}
            type="button"
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`btn btnSmall ${
              filter === "offshore" ? "btnPrimary" : "btnGhost"
            }`}
            type="button"
            onClick={() => setFilter("offshore")}
          >
            Offshore Capable
          </button>
          <button
            className={`btn btnSmall ${
              filter === "inshore" ? "btnPrimary" : "btnGhost"
            }`}
            type="button"
            onClick={() => setFilter("inshore")}
          >
            Inshore Only
          </button>
        </div>
      </div>

      {/* Table */}
      {boats.length === 0 ? (
        <div className="alert">No Boats Match Your Filters.</div>
      ) : (
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Boat</th>
                <th style={{ width: 160 }}>Class</th>
                <th style={{ width: 120 }}>Length</th>
                <th style={{ width: 180 }}>Capability</th>
                <th style={{ width: 160 }}>Active Events</th>
                <th style={{ width: 200 }} />
              </tr>
            </thead>
            <tbody>
              {boats.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div style={{ fontWeight: 650 }}>{b.name}</div>
                    <div className="subtle">Boat ID: {b.id}</div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600 }}>{b.class || "—"}</div>
                  </td>

                  <td>
                    <Badge tone="muted">{b.length || "—"}</Badge>
                  </td>

                  <td>
                    <Badge tone={b.offshoreCapable ? "green" : "muted"}>
                      {b.offshoreCapable ? "Offshore" : "Inshore"}
                    </Badge>
                  </td>

                  <td>
                    <Badge tone={b.activeEvents > 0 ? "orange" : "muted"}>
                      {b.activeEvents} Event{b.activeEvents === 1 ? "" : "s"}
                    </Badge>
                  </td>

                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button className="btn btnGhost btnSmall" type="button">
                        Open
                      </button>
                      <button className="btn btnSmall" type="button">
                        Edit
                      </button>
                      <button className="btn btnSmall" type="button">
                        Events
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="subtle" style={{ marginTop: 10 }}>
        UI Rule: Capability Is A Signal (Badge), Not A “Pretty” Feature.
      </div>
    </div>
  );
}
