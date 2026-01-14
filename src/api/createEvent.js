// src/api/createEvent.js
import { supabase } from "../lib/supabase";

/**
 * Get boats owned by the logged-in owner (for the "select boat" dropdown).
 */
export async function fetchOwnerBoats(ownerId) {
  if (!ownerId) return [];
  const { data, error } = await supabase
    .from("boats")
    .select("id, name, class, length_m, is_offshore_capable")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Create an event for the owner.
 * We only insert columns we *know* you have based on your earlier errors.
 */
export async function createOwnerEvent({
  ownerId,
  boatId,
  title,
  startDate,
  endDate,
  locationText,
  crewRequired,
}) {
  if (!ownerId) throw new Error("createOwnerEvent: missing ownerId");
  if (!boatId) throw new Error("createOwnerEvent: missing boatId");
  if (!title?.trim()) throw new Error("createOwnerEvent: missing title");
  if (!startDate) throw new Error("createOwnerEvent: missing start date");
  if (!endDate) throw new Error("createOwnerEvent: missing end date");
  if (!locationText?.trim()) throw new Error("createOwnerEvent: missing location");
  if (!Number.isFinite(Number(crewRequired)) || Number(crewRequired) <= 0) {
    throw new Error("createOwnerEvent: crew required must be > 0");
  }

  const payload = {
    owner_id: ownerId,
    boat_id: boatId,
    title: title.trim(),
    start_date: startDate, // expects YYYY-MM-DD
    end_date: endDate, // expects YYYY-MM-DD (NOT NULL in your schema)
    location_text: locationText.trim(),
    status: "published", // matches what you already use in UI
    crew_required: Number(crewRequired),
  };

  const { data, error } = await supabase
    .from("events")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw error;
  return data?.id;
}
