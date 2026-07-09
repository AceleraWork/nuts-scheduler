import { supabase } from "@/lib/supabase/client";
import { siteFromRow } from "@/lib/supabase/mappers";
import type { Site } from "@/types";

export async function getSites(): Promise<Site[]> {
  const { data, error } = await supabase.from("sites").select("*");
  if (error) throw error;
  return (data ?? []).map(siteFromRow);
}
