// src/api/boats.js
import { supabase } from "../lib/supabase";

export async function fetchMyBoats() {
  const { data, error } = await supabase
    .from("boats")
    .select("id, name, boat_type, class, length_m, home_port, is_offshore_capable, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createBoat(payload) {
  const { data, error } = await supabase
    .from("boats")
    .insert(payload)
    .select("id, name, boat_type, class, length_m, home_port, is_offshore_capable")
    .single();

  if (error) throw error;
  return data;
}

export async function updateBoat(id, patch) {
  if (!id) throw new Error("updateBoat: missing id");

  const { data, error } = await supabase
    .from("boats")
    .update(patch)
    .eq("id", id)
    .select("id, name, boat_type, class, length_m, home_port, is_offshore_capable");

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("updateBoat: no rows updated (check RLS policy)");
  }
  return data[0];
}

export async function deleteBoat(id) {
  const { error } = await supabase.from("boats").delete().eq("id", id);
  if (error) throw error;
}
