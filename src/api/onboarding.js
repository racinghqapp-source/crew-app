// src/api/onboarding.js
import { supabase } from "../lib/supabase";

export async function fetchMyBoatCount() {
  const { count, error } = await supabase
    .from("boats")
    .select("id", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}

export async function fetchMyEventCount() {
  const { count, error } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}
