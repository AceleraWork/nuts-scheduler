import { supabase } from "@/lib/supabase/client";
import { publicHolidayFromRow, publicHolidayToRow } from "@/lib/supabase/mappers";
import type { PublicHoliday } from "@/types";

export async function getPublicHolidays(): Promise<PublicHoliday[]> {
  const { data, error } = await supabase.from("public_holidays").select("*").order("date");
  if (error) throw error;
  return (data ?? []).map(publicHolidayFromRow);
}

export async function getPublicHolidaysForYear(year: number): Promise<PublicHoliday[]> {
  const { data, error } = await supabase
    .from("public_holidays")
    .select("*")
    .gte("date", `${year}-01-01`)
    .lte("date", `${year}-12-31`);
  if (error) throw error;
  return (data ?? []).map(publicHolidayFromRow);
}

export async function insertPublicHolidays(holidays: PublicHoliday[]): Promise<void> {
  if (holidays.length === 0) return;
  const { error } = await supabase.from("public_holidays").upsert(holidays.map(publicHolidayToRow));
  if (error) throw error;
}
