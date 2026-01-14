import { supabase } from "../lib/supabase";

export async function searchYachtClubs(q = "") {
  const query = (q || "").trim();

  let req = supabase
    .from("locations")
    .select("id, name, state")
    .eq("kind", "yacht_club")
    .eq("country_code", "AU")
    .eq("is_active", true)
    .order("state", { ascending: true })
    .order("name", { ascending: true })
    .limit(50);

  if (query) req = req.ilike("name", `%${query}%`);

  const { data, error } = await req;
  if (error) throw error;
  return data || [];
}

export async function fetchYachtClubById(id) {
  if (!id) return null;

  const { data, error } = await supabase
    .from("locations")
    .select("id, name, state")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}
