import { supabase } from "@/lib/supabase/client";
import {
  scheduleOptionFromRow,
  scheduleOptionToRow,
  shiftFromRow,
  shiftToRow,
} from "@/lib/supabase/mappers";
import type { ScheduleOption, ScheduleOptionId, Shift } from "@/types";

export async function getScheduleOptions(): Promise<ScheduleOption[]> {
  const [{ data: optionRows, error: optionsError }, { data: shiftRows, error: shiftsError }] = await Promise.all([
    supabase.from("schedule_options").select("*").order("id"),
    supabase.from("shifts").select("*"),
  ]);
  if (optionsError) throw optionsError;
  if (shiftsError) throw shiftsError;

  const shiftsByOption = new Map<string, Shift[]>();
  for (const row of shiftRows ?? []) {
    const optionId = row.schedule_option_id as string;
    const shift = shiftFromRow(row);
    const list = shiftsByOption.get(optionId) ?? [];
    list.push(shift);
    shiftsByOption.set(optionId, list);
  }

  return (optionRows ?? []).map((row) =>
    scheduleOptionFromRow(row, shiftsByOption.get(row.id as string) ?? [])
  );
}

/** Reemplaza por completo las opciones de horario y sus turnos (usado al regenerar). */
export async function saveScheduleOptions(options: ScheduleOption[]): Promise<void> {
  const optionRows = options.map(scheduleOptionToRow);
  const { error: upsertError } = await supabase.from("schedule_options").upsert(optionRows);
  if (upsertError) throw upsertError;

  const optionIds = options.map((o) => o.id);
  const { error: deleteError } = await supabase.from("shifts").delete().in("schedule_option_id", optionIds);
  if (deleteError) throw deleteError;

  const shiftRows = options.flatMap((option) => option.shifts.map((shift) => shiftToRow(shift, option.id)));
  if (shiftRows.length > 0) {
    const { error: insertError } = await supabase.from("shifts").insert(shiftRows);
    if (insertError) throw insertError;
  }
}

export async function updateShiftRow(shift: Shift, scheduleOptionId: ScheduleOptionId): Promise<void> {
  const { error } = await supabase
    .from("shifts")
    .update(shiftToRow(shift, scheduleOptionId))
    .eq("id", shift.id);
  if (error) throw error;
}

export async function updateScheduleOptionMetaRow(option: ScheduleOption): Promise<void> {
  const { error } = await supabase
    .from("schedule_options")
    .update({ violations: option.violations, score: option.score })
    .eq("id", option.id);
  if (error) throw error;
}
