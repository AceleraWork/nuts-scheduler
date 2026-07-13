import { supabase } from "@/lib/supabase/client";
import { siteFromRow, siteToRow } from "@/lib/supabase/mappers";
import type { Site } from "@/types";

export async function getSites(): Promise<Site[]> {
  const { data, error } = await supabase.from("sites").select("*");
  if (error) throw error;
  return (data ?? []).map(siteFromRow);
}

export async function insertSiteRow(site: Site): Promise<void> {
  const { error } = await supabase.from("sites").insert(siteToRow(site));
  if (error) throw error;
}

export async function updateSiteRow(site: Site): Promise<void> {
  const { error } = await supabase.from("sites").update(siteToRow(site)).eq("id", site.id);
  if (error) throw error;
}
