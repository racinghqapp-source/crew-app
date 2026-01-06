import { supabase } from "../lib/supabase";

export async function fetchMyEvents(ownerId) {
  const { data, error } = await supabase
    .from("events")
    .select("id,title,start_date,end_date,location_text,status,created_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchApplicationsForEvent(eventId) {
  const { data, error } = await supabase
    .from("applications")
    .select("id,event_id,sailor_id,preferred_role,note,status,created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchProfilesByIds(ids) {
  if (!ids?.length) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id,display_name,profile_type,verified_participations_count,reliability_score,competence_band,would_sail_again_pct"
    )
    .in("id", ids);

  if (error) throw error;
  return data ?? [];
}

export async function setApplicationStatus(applicationId, status) {
  const { error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", applicationId);

  if (error) throw error;
}
