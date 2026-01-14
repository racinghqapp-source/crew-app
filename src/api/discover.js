import { supabase } from "../lib/supabase";

export async function fetchDiscoverEvents() {
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
      owner_id,
      boat_id,
      boats:boat_id ( id, name, class ),
      v_event_fill ( crew_required, crew_filled )
    `
    )
    .eq("status", "published")
    .order("start_date", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchMyApplications({ sailorId, eventIds }) {
  if (!sailorId) throw new Error("fetchMyApplications: missing sailorId");
  if (!eventIds?.length) return [];

  const { data, error } = await supabase
    .from("applications")
    .select("event_id, status, created_at")
    .eq("sailor_id", sailorId)
    .in("event_id", eventIds);

  if (error) throw error;
  return data || [];
}

export async function applyToEvent({ eventId, sailorId, note }) {
  const { data, error } = await supabase
    .from("applications")
    .insert({
      event_id: eventId,
      sailor_id: sailorId,
      status: "applied",
      note: note || null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function fetchEventFill(eventIds) {
  if (!eventIds?.length) return [];
  const { data, error } = await supabase
    .from("v_event_fill")
    .select("event_id, crew_required, crew_filled")
    .in("event_id", eventIds);
  if (error) throw error;
  return data || [];
}
