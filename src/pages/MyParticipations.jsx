import { useEffect, useState } from "react";
import { useSession } from "../hooks/useSession";
import {
  fetchMyParticipations,
  confirmAsOwner,
  confirmAsSailor,
  ownerSetCompleted,
} from "../api/participations";
import { hasMyRatingForParticipation, submitSimpleRating } from "../api/ratings";
import RatingModal from "../components/RatingModal";

export default function MyParticipations() {
  const { user } = useSession();
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState(null); // participation row
  const [ratingBusy, setRatingBusy] = useState(false);

  async function load() {
    setErr(null);
    if (!user?.id) return;
    try {
      const data = await fetchMyParticipations();
      setRows(data);
    } catch (e) {
      setErr(e.message ?? String(e));
    }
  }

  useEffect(() => {
    if (user?.id) load();
  }, [user?.id]);

  async function onConfirm(p) {
    setBusyId(p.id);
    setErr(null);
    try {
      if (p.owner_id === user.id && p.completion_status !== "completed") {
        await ownerSetCompleted(p.id);
      }
      if (p.owner_id === user.id) await confirmAsOwner(p.id);
      if (p.sailor_id === user.id) await confirmAsSailor(p.id);
      await load();
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setBusyId(null);
    }
  }

  async function openRating(p) {
    setErr(null);
    try {
      // prevent duplicate rating per rater per participation
      const already = await hasMyRatingForParticipation(p.id, user.id);
      if (already) {
        setErr("You have already rated this participation.");
        return;
      }
      setRatingTarget(p);
      setRatingOpen(true);
    } catch (e) {
      setErr(e.message ?? String(e));
    }
  }

  async function onSubmitRating(values) {
    if (!ratingTarget) return;
    setRatingBusy(true);
    setErr(null);

    try {
      const isOwner = ratingTarget.owner_id === user.id;
      const direction = isOwner ? "owner_to_sailor" : "sailor_to_owner";
      const rateeId = isOwner ? ratingTarget.sailor_id : ratingTarget.owner_id;

      await submitSimpleRating({
        participationId: ratingTarget.id,
        raterId: user.id,
        rateeId,
        direction,
        reliability: values.reliability,
        competence: values.competence,
        teamwork: values.teamwork,
        would_sail_again: values.would_sail_again,
      });

      setRatingOpen(false);
      setRatingTarget(null);
      await load();
      // Reputation trigger should run automatically if installed.
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setRatingBusy(false);
    }
  }

  if (!user) return null;

  return (
    <div style={{ marginTop: 24 }}>
      <h3>My Participations</h3>

      {err && <div style={{ color: "crimson", marginBottom: 12 }}>{err}</div>}

      <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th>Role</th>
            <th>Status</th>
            <th>Owner</th>
            <th>Sailor</th>
            <th>Verified</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const isBusy = busyId === p.id;

            const canConfirm =
              (p.owner_id === user.id && !p.owner_confirmed) ||
              (p.sailor_id === user.id && !p.sailor_confirmed);

            const canRate = !!p.verified_at; // enforced by DB too
            const canOpenRate = canRate && !isBusy;

            return (
              <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                <td>{p.role ?? "—"}</td>
                <td>{p.completion_status}</td>
                <td>{p.owner_confirmed ? "✅" : "—"}</td>
                <td>{p.sailor_confirmed ? "✅" : "—"}</td>
                <td>{p.verified_at ? "✅" : "—"}</td>
                <td style={{ display: "flex", gap: 8 }}>
                  {canConfirm && (
                    <button disabled={isBusy} onClick={() => onConfirm(p)}>
                      {isBusy ? "Working…" : "Confirm"}
                    </button>
                  )}
                  <button disabled={!canOpenRate} onClick={() => openRating(p)}>
                    Rate
                  </button>
                </td>
              </tr>
            );
          })}
          {!rows.length && (
            <tr>
              <td colSpan="6" style={{ opacity: 0.7, paddingTop: 12 }}>
                No participations found for your user.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
        “Rate” becomes available after verification (both parties confirm + completed).
      </div>

      <RatingModal
        isOpen={ratingOpen}
        onClose={() => {
          if (ratingBusy) return;
          setRatingOpen(false);
          setRatingTarget(null);
        }}
        onSubmit={onSubmitRating}
        busy={ratingBusy}
        title="Leave a rating (1–5)"
      />
    </div>
  );
}
