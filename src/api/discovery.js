import { supabase } from "../lib/supabase";

/**
 * MVP: discovery returns only safe/basic fields.
 * We'll add Pro-only trust metrics later via RPC.
 */
export async function fetchDiscoverProfiles({
  search = "",
  role = "",
  availableOnly = false,
  type = "sailor",
  limit = 50,
}) {
  let q = supabase
    .from("profiles")
    .select("id, display_name, profile_type, location_text, roles, is_available")
    .order("display_name", { ascending: true })
    .limit(limit);

  if (type) q = q.eq("profile_type", type);
  if (availableOnly) q = q.eq("is_available", true);

  // roles is text[]; we can filter by "contains" if your column is truly text[]
  // Using .contains requires roles to be an array type in Postgres.
  if (role) q = q.contains("roles", [role]);

  // simple search on display_name
  if (search?.trim()) {
    const s = search.trim();
    // ilike with wildcard
    q = q.ilike("display_name", `%${s}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
