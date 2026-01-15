import { useMemo, useState } from "react";

function clampInt(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export default function RatingModal({
  isOpen,
  onClose,
  onSubmit,
  title = "Leave A Rating",
  busy = false,
}) {
  const [reliability, setReliability] = useState(5);
  const [competence, setCompetence] = useState(5);
  const [teamwork, setTeamwork] = useState(5);
  const [wouldSailAgain, setWouldSailAgain] = useState(true);

  const canSubmit = useMemo(() => {
    return (
      reliability >= 1 && reliability <= 5 &&
      competence >= 1 && competence <= 5 &&
      teamwork >= 1 && teamwork <= 5
    );
  }, [reliability, competence, teamwork]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#fff",
          borderRadius: 12,
          padding: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} disabled={busy}>✕</button>
        </div>

        <div style={{ marginTop: 12 }}>
          <label><b>Reliability</b> (1–5)</label>
          <input
            type="number"
            min="1"
            max="5"
            value={reliability}
            onChange={(e) => setReliability(clampInt(e.target.value, 1, 5))}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label><b>Competence</b> (1–5)</label>
          <input
            type="number"
            min="1"
            max="5"
            value={competence}
            onChange={(e) => setCompetence(clampInt(e.target.value, 1, 5))}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label><b>Teamwork</b> (1–5)</label>
          <input
            type="number"
            min="1"
            max="5"
            value={teamwork}
            onChange={(e) => setTeamwork(clampInt(e.target.value, 1, 5))}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={wouldSailAgain}
              onChange={(e) => setWouldSailAgain(e.target.checked)}
              disabled={busy}
            />
            <span><b>Would Sail Again</b></span>
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={busy}>Cancel</button>
          <button
            onClick={() =>
              onSubmit({
                reliability,
                competence,
                teamwork,
                would_sail_again: wouldSailAgain,
              })
            }
            disabled={busy || !canSubmit}
          >
            {busy ? "Submitting…" : "Submit Rating"}
          </button>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
          Tip: Keep It Factual—This Is A Structured Score, Not A Public Review.
        </div>
      </div>
    </div>
  );
}
