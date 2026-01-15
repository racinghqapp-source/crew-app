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
  title,
  boatId,
  startDate,
  endDate = null,
  locationText,
  locationId,
  crewRequired = 5,
}) {
  if (!ownerId) throw new Error("createOwnerEvent: missing ownerId");
  if (!title?.trim()) throw new Error("createOwnerEvent: missing title");
  if (!boatId) throw new Error("createOwnerEvent: missing boatId");
  if (!startDate) throw new Error("createOwnerEvent: missing startDate");

  const locText = String(locationText ?? "").trim();
  if (!locText) {
    throw new Error("createOwnerEvent: location_text is required");
  }

  const payload = {
    owner_id: ownerId,
    boat_id: boatId,
    title: title.trim(),
    start_date: startDate, // expects YYYY-MM-DD
    end_date: endDate || null,
    location_text: locText,
    location_id: locationId ?? null,
    crew_required: Number(crewRequired) || 1,
    status: "draft",
  };

  const { data, error } = await supabase
    .from("events")
    .insert([payload])
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
