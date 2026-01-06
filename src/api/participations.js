import { supabase } from "../lib/supabase";

export async function fetchMyParticipations() {
  const { data, error } = await supabase
    .from("participations")
    .select(`
      id,
      event_id,
      owner_id,
      sailor_id,
      role,
      completion_status,
      owner_confirmed,
      sailor_confirmed,
      verified_at,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function confirmAsOwner(participationId) {
  const { error } = await supabase.rpc("confirm_participation_owner", {
    p_participation_id: participationId,
  });
  if (error) throw error;
}

export async function confirmAsSailor(participationId) {
  const { error } = await supabase.rpc("confirm_participation_sailor", {
    p_participation_id: participationId,
  });
  if (error) throw error;
}

export async function ownerSetCompleted(participationId) {
  const { error } = await supabase.rpc("owner_set_completion_status", {
    p_participation_id: participationId,
    p_status: "completed",
  });
  if (error) throw error;
}
