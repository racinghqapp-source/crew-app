// src/api/discovery.js
import { supabase } from "../lib/supabase";

export async function fetchDiscoverySailors() {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, location_text, reliability_score, would_sail_again_pct, verified_participations_count, competence_band, offshore_qualified, is_available, roles"
    )
    .eq("profile_type", "sailor")
    .order("reliability_score", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data ?? [];
}

/**
 * Owner: fetch my events (with boat) so I can pick which event to invite a sailor to.
 */
export async function fetchOwnerEventsWithBoats() {
  const { data, error } = await supabase
    .from("events")
    .select(
      `
      id,
      title,
      start_date,
      end_date,
      location_text,
      status,
      boat:boats(
        id,
        name,
        class,
        length_m,
        is_offshore_capable
      )
    `
    )
    .order("start_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Owner: invite sailor to event (idempotent).
 * Creates/updates applications row as shortlisted.
 */
export async function ownerInviteSailor({ eventId, sailorId, preferredRole, note }) {
  const { data, error } = await supabase.rpc("owner_invite_sailor", {
    p_event_id: eventId,
    p_sailor_id: sailorId,
    p_preferred_role: preferredRole ?? null,
    p_note: note ?? null,
  });

  if (error) throw error;
  return data; // application id
}
