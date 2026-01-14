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
  const { data, error } = await supabase
    .from("boats")
    .update(patch)
    .eq("id", id)
    .select("id, name, boat_type, class, length_m, home_port, is_offshore_capable")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBoat(id) {
  const { error } = await supabase.from("boats").delete().eq("id", id);
  if (error) throw error;
}
