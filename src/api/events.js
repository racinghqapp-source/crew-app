// src/api/events.js
import { supabase } from "../lib/supabase";

/**
 * Fetch an owner's events with boat context + pipeline counts.
 * Defensive: if ownerId is missing, return [] (avoids transient render errors).
 */
export async function fetchOwnerEventsSummary(ownerId) {
  if (!ownerId) return [];

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
      crew_required,
      boat:boats (
        id,
        name,
        class,
        length_m,
        is_offshore_capable
      ),
      applications:applications (
        id,
        status
      )
    `
    )
    .eq("owner_id", ownerId)
    .order("start_date", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []).map((e) => {
    const apps = e.applications ?? [];
    const counts = {
      invited: apps.filter((a) => String(a.status || "").toLowerCase() === "shortlisted").length,
      applied: apps.filter((a) => String(a.status || "").toLowerCase() === "applied").length,
      accepted: apps.filter((a) => String(a.status || "").toLowerCase() === "accepted").length,
      declined: apps.filter((a) => String(a.status || "").toLowerCase() === "declined").length,
      withdrawn: apps.filter((a) => String(a.status || "").toLowerCase() === "withdrawn").length,
    };

    return {
      id: e.id,
      title: e.title,
      start_date: e.start_date,
      end_date: e.end_date,
      location_text: e.location_text,
      status: e.status,
      crew_required: e.crew_required ?? null,
      boat: e.boat ?? null,
      counts,
    };
  });

  return rows;
}

/**
 * Owner-only status change (Draft/Open/Closed) via RPC.
 */
export async function ownerSetEventStatus({ eventId, status }) {
  if (!eventId) throw new Error("ownerSetEventStatus: missing eventId");
  if (!status) throw new Error("ownerSetEventStatus: missing status");

  const { error } = await supabase.rpc("owner_set_event_status", {
    p_event_id: eventId,
    p_status: status,
  });

  if (error) throw error;
}

/**
 * Update crew_required for an event (owner only).
 * Uses direct update on events table (RLS must allow owner to update their event).
 */
export async function updateEventCrewRequired({ eventId, crewRequired }) {
  if (!eventId) throw new Error("updateEventCrewRequired: missing eventId");

  const value =
    crewRequired === null || crewRequired === undefined || crewRequired === ""
      ? null
      : Number(crewRequired);

  if (value !== null && (!Number.isFinite(value) || value < 1 || value > 50)) {
    throw new Error("Crew required must be a number between 1 and 50 (or blank).");
  }

  const { error } = await supabase
    .from("events")
    .update({ crew_required: value })
    .eq("id", eventId);

  if (error) throw error;
}

export async function fetchPublishedEvents() {
  const { data, error } = await supabase
    .from("v_events_discovery")
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
      crew_filled,
      boat:boats ( id, name )
    `
    )
    .eq("status", "published")
    .order("start_date", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((e) => {
    return { ...e, crew_filled: Number(e.crew_filled ?? 0) };
  });
}
