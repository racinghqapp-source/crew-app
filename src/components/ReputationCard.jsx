import { useEffect, useState } from "react";
import { fetchMyProfile } from "../api/profileRead";

function pillStyle(bg) {
  return {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: 999,
    background: bg,
    fontSize: 12,
    lineHeight: "18px",
  };
}

function bandPill(band) {
  const v = (band || "unknown").toLowerCase();
  if (v === "high") return pillStyle("#d1fae5");
  if (v === "medium") return pillStyle("#e0f2fe");
  if (v === "low") return pillStyle("#fee2e2");
  return pillStyle("#f3f4f6");
}

export default function ReputationCard({ userId, bump = 0 }) {
  const [p, setP] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const prof = await fetchMyProfile(userId);
      setP(prof);
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (userId) load();
    // bump lets parent force a refresh (e.g., after rating submit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, bump]);

  if (!userId) return null;

  return (
    <div style={{ marginTop: 16, border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Reputation</h3>
        <button onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {err && <div style={{ color: "crimson", marginTop: 10 }}>{err}</div>}

      {!err && (
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Verified Sails</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              {p?.verified_participations_count ?? 0}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Reliability</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              {p?.reliability_score ?? 0}
              <span style={{ fontSize: 12, opacity: 0.7 }}> / 100</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Competence Band</div>
            <div style={{ marginTop: 6 }}>
              <span style={bandPill(p?.competence_band)}>
                {(p?.competence_band ?? "unknown").toUpperCase()}
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Would Sail Again</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              {p?.would_sail_again_pct ?? 0}
              <span style={{ fontSize: 12, opacity: 0.7 }}>%</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
        Ratings Only Count After A Verified Participation.
      </div>
    </div>
  );
}
