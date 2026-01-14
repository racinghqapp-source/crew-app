// src/api/sailorDetail.js
import { supabase } from "../lib/supabase";

/**
 * Fetch all invites/applications for a given sailor for events owned by the logged-in owner.
 * Returns rows including event + boat context.
 */
export async function fetchOwnerSailorContext({ ownerId, sailorId }) {
  if (!ownerId) throw new Error("fetchOwnerSailorContext: missing ownerId");
  if (!sailorId) throw new Error("fetchOwnerSailorContext: missing sailorId");

  // applications -> events (inner) -> boats
  const { data, error } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      preferred_role,
      note,
      created_at,
      event:events!inner(
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
      )
    `
    )
    .eq("sailor_id", sailorId)
    .eq("event.owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
