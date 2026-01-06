import { supabase } from "../lib/supabase";

export async function fetchMyApplications() {
  const { data, error } = await supabase.rpc("sailor_get_my_applications");
  if (error) throw error;
  return data ?? [];
}

export async function acceptApplication(applicationId) {
  const { error } = await supabase.rpc("sailor_set_application_status", {
    p_application_id: applicationId,
    p_status: "accepted",
  });
  if (error) throw error;
}

export async function declineApplication(applicationId) {
  const { error } = await supabase.rpc("sailor_set_application_status", {
    p_application_id: applicationId,
    p_status: "declined",
  });
  if (error) throw error;
}
