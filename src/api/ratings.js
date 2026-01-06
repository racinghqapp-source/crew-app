import { supabase } from "../lib/supabase";

export async function hasMyRatingForParticipation(participationId, myUserId) {
  const { data, error } = await supabase
    .from("ratings")
    .select("id")
    .eq("participation_id", participationId)
    .eq("rater_id", myUserId)
    .limit(1);

  if (error) throw error;
  return (data ?? []).length > 0;
}

export async function submitSimpleRating({
  participationId,
  raterId,
  rateeId,
  direction, // 'owner_to_sailor' | 'sailor_to_owner'
  reliability,
  competence,
  teamwork,
  would_sail_again,
}) {
  const payload = {
    participation_id: participationId,
    rater_id: raterId,
    ratee_id: rateeId,
    direction,
    reliability,
    competence,
    teamwork,
    would_sail_again,
    // keep optional columns null
    organisation: null,
    boat_readiness: null,
    safety_culture: null,
  };

  const { error } = await supabase.from("ratings").insert(payload);
  if (error) throw error;
}
