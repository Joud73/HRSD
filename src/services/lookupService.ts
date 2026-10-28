/** Reference lists used by the registration form and the organization profile. */
import { supabase } from "@/integrations/supabase/client";

export interface SubClassification {
  id: string;
  code: string;
  name: string;
}

export interface SocialDevCenter {
  id: string;
  code: string;
  name: string;
  region: string | null;
}

export async function getSubClassifications(): Promise<SubClassification[]> {
  const { data, error } = await supabase
    .from("sub_classifications")
    .select("id, code, name")
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return data;
}

export async function getSocialDevCenters(): Promise<SocialDevCenter[]> {
  const { data, error } = await supabase.from("social_dev_centers").select("id, code, name, region").order("name");
  if (error) throw error;
  return data;
}
