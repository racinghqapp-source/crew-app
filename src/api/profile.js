// src/api/profile.js
import { supabase } from "../lib/supabase";

export async function ensureProfile({ user }) {
  if (!user?.id) throw new Error("ensureProfile: missing user");

  const { data: existing, error: selErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (selErr) throw selErr;
  if (existing) return existing;

  const fallbackName = user.email ? user.email.split("@")[0] : "New user";

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      display_name: fallbackName,
      profile_type: "sailor",
      // ===== Legacy (keep for now if other screens rely on them)
      roles: [],
      boat_experience: [],
      offshore_qualified: false,
      is_available: true,
      willing_to_travel: false,
      verified_participations_count: 0,
      reliability_score: 0,
      competence_band: "unknown",
      would_sail_again_pct: 0,
      is_suspended: false,
      plan_tier: "free",
      // ===== New Sailor Onboarding fields (MVP)
      sailor_roles: [],
      experience_level: null,
      availability_weekdays: false,
      availability_weekends: false,
      availability_short_notice: false,
      offshore_qualification: "none",
      bio: null,
      sailor_onboarding_complete: false,
      sailor_suspended: false,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export function needsSailorOnboarding(profile) {
  if (!profile) return false;

  const isSailor =
    profile.profile_type === "sailor" || profile.profile_type === "both";
  if (!isSailor) return false;

  // Use the new suspension field if present, otherwise fall back to old
  const suspended = !!profile.sailor_suspended || !!profile.is_suspended;
  if (suspended) return true;

  // If explicitly complete, let them through
  if (profile.sailor_onboarding_complete) return false;

  // Otherwise compute minimal completeness (works even if boolean not set yet)
  const nameOk = !!profile.display_name?.trim();

  const rolesArr =
    Array.isArray(profile.sailor_roles) && profile.sailor_roles.length
      ? profile.sailor_roles
      : Array.isArray(profile.roles)
      ? profile.roles
      : [];

  const rolesOk = rolesArr.length > 0;

  const expOk = !!profile.experience_level;

  const weekdays = !!profile.availability_weekdays;
  const weekends = !!profile.availability_weekends;

  // If you previously used `is_available` as a single toggle, you can treat it as "some availability"
  const legacyAvail = !!profile.is_available;

  const availOk = weekdays || weekends || legacyAvail;

  return !(nameOk && rolesOk && expOk && availOk);
}

export async function fetchMyProfile(userId) {
  if (!userId) throw new Error("fetchMyProfile: missing userId");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateMyProfile(userId, patch) {
  if (!userId) throw new Error("updateMyProfile: missing userId");

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
