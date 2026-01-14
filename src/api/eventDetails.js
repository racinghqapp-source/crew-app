import { supabase } from "../lib/supabase";

export async function fetchEventDetails(eventId) {
  if (!eventId) throw new Error("fetchEventDetails: missing eventId");

  const { data, error } = await supabase
    .from("events")
    .select(
      `
      id,
      title,
      event_type,
      location_text,
      start_date,
      end_date,
      paid,
      compensation_notes,
      accommodation_provided,
      status,
      crew_required,
      boat:boats (
        id,
        name,
        boat_type,
        class_name,
        length_m,
        home_port,
        offshore_capable
      ),
      owner:profiles (
        id,
        display_name,
        bio,
        home_port,
        home_club_id,
        experience_level,
        offshore_qualified,
        reliability_score,
        would_sail_again_pct
      )
    `
    )
    .eq("id", eventId)
    .single();

  if (error) throw error;
  return data;
}
