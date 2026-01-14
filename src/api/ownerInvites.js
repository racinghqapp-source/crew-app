import { supabase } from "../lib/supabase";

export async function fetchOwnerInvites() {
  const { data, error } = await supabase.rpc("owner_get_my_invites");
  if (error) throw error;
  return data ?? [];
}
