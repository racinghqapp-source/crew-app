import { supabase } from "../lib/supabase";

export async function fetchMyInvites() {
  const { data, error } = await supabase
    .from("participations")
    .select(
      `
      id,
      created_at,
      updated_at,
      event_id,
      owner_id,
      sailor_id,
      role,
      owner_confirmed,
      sailor_confirmed,
      completion_status,
      event:events (
        id,
        title,
        start_date,
        end_date,
        location_text,
        status,
        crew_required,
        boat_id,
        boat:boats (
          id,
          name,
          boat_type,
          class_name,
          length_m,
          home_port,
          offshore_capable
        ),
        owner:profiles!events_owner_id_fkey (
          id,
          display_name,
          home_port,
          bio
        )
      )
    `
    )
    .eq("sailor_confirmed", false)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchMyApplicationUpdates() {
  const { data, error } = await supabase
    .from("applications")
    .select(
      `
      id,
      created_at,
      updated_at,
      event_id,
      sailor_id,
      preferred_role,
      note,
      status,
      direction,
      event:events (
        id,
        title,
        start_date,
        end_date,
        location_text,
        status,
        crew_required,
        boat_id,
        boat:boats (
          id,
          name,
          boat_type,
          class_name,
          length_m,
          home_port
        ),
        owner:profiles!events_owner_id_fkey (
          id,
          display_name
        )
      )
    `
    )
    .in("status", ["shortlisted", "accepted", "declined"])
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchInbox() {
  const [invites, updates] = await Promise.all([fetchMyInvites(), fetchMyApplicationUpdates()]);

  return {
    invites,
    updates,
    counts: {
      invites: invites.length,
      updates: updates.length,
    },
  };
}

export async function fetchUnreadInviteCount(userId) {
  if (!userId) throw new Error("fetchUnreadInviteCount: missing userId");

  const { count, error } = await supabase
    .from("participations")
    .select("id", { count: "exact", head: true })
    .eq("sailor_id", userId)
    .eq("sailor_confirmed", false);

  if (error) throw error;
  return count ?? 0;
}
