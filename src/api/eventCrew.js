// src/api/eventCrew.js
import { supabase } from "../lib/supabase";

/**
 * Owner-only: fetch one event + boat + all applications with sailor profile attached.
 * Uses events!inner so we can filter by event.owner_id safely.
 */
export async function fetchOwnerEventCrew({ ownerId, eventId }) {
  if (!ownerId) throw new Error("fetchOwnerEventCrew: missing ownerId");
  if (!eventId) throw new Error("fetchOwnerEventCrew: missing eventId");

  // 1) fetch event (with boat)
  const { data: ev, error: evErr } = await supabase
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
    .eq("id", eventId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (evErr) throw evErr;
  if (!ev) throw new Error("Event not found or you are not the owner.");

  // 2) fetch applications for that event (with sailor profile)
  const { data: apps, error: appErr } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      preferred_role,
      note,
      created_at,
      sailor_id,
      sailor:profiles!applications_sailor_id_fkey(
        id,
        display_name,
        location_text,
        roles,
        offshore_qualified,
        reliability_score,
        competence_band,
        would_sail_again_pct,
        verified_participations_count
      )
    `
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  // ⚠️ If the FK alias name differs, Supabase will error.
  // If it does, tell me the exact error + your applications table FKs and I’ll adjust.
  if (appErr) throw appErr;

  return { event: ev, applications: apps ?? [] };
}
