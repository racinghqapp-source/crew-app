import { supabase } from "../lib/supabase";

export async function fetchMyProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      display_name,
      profile_type,
      verified_participations_count,
      reliability_score,
      competence_band,
      would_sail_again_pct
    `)
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}
