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
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) throw userErr;
  if (!user?.id) throw new Error("fetchInbox: not signed in");

  const { data: invites, error: invErr } = await supabase
    .from("participations")
    .select(
      `
      id,
      created_at,
      sailor_confirmed,
      event:events (
        id,
        title,
        start_date,
        end_date,
        location_text,
        owner:profiles!events_owner_id_fkey (
          id,
          display_name
        ),
        boat:boats (
          id,
          name
        )
      )
    `
    )
    .eq("sailor_id", user.id)
    .eq("sailor_confirmed", false)
    .order("created_at", { ascending: false });

  if (invErr) throw invErr;

  const { data: updates, error: updErr } = await supabase
    .from("applications")
    .select(
      `
      id,
      created_at,
      updated_at,
      status,
      direction,
      preferred_role,
      note,
      event:events (
        id,
        title,
        start_date,
        end_date,
        location_text,
        owner:profiles!events_owner_id_fkey (
          id,
          display_name
        ),
        boat:boats (
          id,
          name
        )
      )
    `
    )
    .eq("sailor_id", user.id)
    .neq("status", "applied")
    .order("updated_at", { ascending: false });

  if (updErr) throw updErr;

  return {
    invites: invites ?? [],
    updates: updates ?? [],
  };
}

export async function fetchUnreadInviteCount(userId) {
  if (!userId) throw new Error("fetchUnreadInviteCount: missing userId");

  const { count: partCount, error: partErr } = await supabase
    .from("participations")
    .select("id", { count: "exact", head: true })
    .eq("sailor_id", userId)
    .or("sailor_confirmed.is.null,sailor_confirmed.eq.false");

  if (partErr) throw partErr;

  const { count: appCount, error: appErr } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("sailor_id", userId)
    .eq("status", "shortlisted")
    .eq("direction", "owner");

  if (appErr) throw appErr;

  return (partCount ?? 0) + (appCount ?? 0);
}
