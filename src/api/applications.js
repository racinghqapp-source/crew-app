import { supabase } from "../lib/supabase";

export async function fetchMyApplications(userId) {
  if (!userId) throw new Error("fetchMyApplications: missing userId");

  const { data, error } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      preferred_role,
      note,
      direction,
      created_at,
      updated_at,
      event:events (
        id,
        title,
        start_date,
        end_date,
        location_text,
        status,
        crew_required,
        boat:boats (
          id,
          name
        )
      )
    `
    )
    .eq("sailor_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function withdrawApplication({ userId, applicationId }) {
  if (!userId) throw new Error("withdrawApplication: missing userId");
  if (!applicationId) throw new Error("withdrawApplication: missing applicationId");

  const { data, error } = await supabase
    .from("applications")
    .update({
      status: "withdrawn",
      direction: "sailor",
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId)
    .eq("sailor_id", userId)
    .select("id,status,updated_at")
    .single();

  if (error) throw error;
  return data;
}

export async function applyToEvent({ eventId, preferredRole = null, note = "" }) {
  if (!eventId) throw new Error("applyToEvent: missing eventId");

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) throw userErr;
  if (!user?.id) throw new Error("applyToEvent: not signed in");

  const { data, error } = await supabase
    .from("applications")
    .insert([
      {
        event_id: eventId,
        sailor_id: user.id,
        preferred_role: preferredRole ?? null,
        note: note ?? null,
        status: "applied",
        direction: "sailor",
      },
    ])
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
