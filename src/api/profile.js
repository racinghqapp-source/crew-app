import { supabase } from "../lib/supabase";

/**
 * Ensures a profiles row exists for the logged-in user.
 * Safe to call repeatedly.
 */
export async function ensureProfile({ user }) {
  if (!user?.id) throw new Error("ensureProfile: missing user");

  const { data: existing, error: selErr } = await supabase
    .from("profiles")
    .select("id, display_name, profile_type")
    .eq("id", user.id)
    .maybeSingle();

  if (selErr) throw selErr;
  if (existing) return existing;

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    (user.email ? user.email.split("@")[0] : "New User");

  const payload = {
    id: user.id,
    display_name: displayName,
    profile_type: "sailor",
    location_text: "Melbourne, VIC",
    roles: [],
    boat_experience: [],
    is_available: false,
    willing_to_travel: true,
  };

  const { data: ins, error: insErr } = await supabase
    .from("profiles")
    .insert(payload)
    .select("id, display_name, profile_type")
    .single();

  if (insErr) throw insErr;
  return ins;
}
