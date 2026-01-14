import { supabase } from "../lib/supabase";

export async function ownerInviteSailor({ eventId, sailorId, preferredRole, note }) {
  const { data, error } = await supabase.rpc("owner_invite_sailor", {
    p_event_id: eventId,
    p_sailor_id: sailorId,
    p_preferred_role: preferredRole ?? null,
    p_note: note ?? null,
  });
  if (error) throw error;
  return data; // application_id
}
