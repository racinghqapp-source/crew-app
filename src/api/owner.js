// src/api/owner.js
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

// ✅ Free tier: applicants + display_name only (no trust metrics)
export async function fetchApplicantsBasic(eventId) {
  const { data, error } = await supabase.rpc("owner_get_event_applicants_basic", {
    p_event_id: eventId,
  });
  if (error) throw error;
  return data ?? [];
}

// ✅ Pro tier: applicants + metrics + score
export async function fetchApplicantsPro(eventId) {
  const { data, error } = await supabase.rpc("owner_get_event_applicants_pro", {
    p_event_id: eventId,
  });
  if (error) throw error;
  return data ?? [];
}

// ✅ Pro-only: accept/reject enforced server-side
export async function setApplicationStatus(applicationId, status) {
  const { error } = await supabase.rpc("owner_set_application_status", {
    p_application_id: applicationId,
    p_status: status,
  });
  if (error) throw error;
}
