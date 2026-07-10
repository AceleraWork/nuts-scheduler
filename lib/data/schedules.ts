import { supabase } from "@/lib/supabase/client";
import {
  scheduleOptionFromRow,
  scheduleOptionToRow,
  scheduleOptionRowId,
  shiftFromRow,
  shiftToRow,
} from "@/lib/supabase/mappers";
import type { ScheduleOption, Shift } from "@/types";

/** Opciones guardadas para una semana específica (identificada por su lunes, YYYY-MM-DD).
 * Devuelve [] si esa semana nunca se ha generado/guardado — la UI la muestra vacía. */
export async function getScheduleOptionsForWeek(weekStartDate: string): Promise<ScheduleOption[]> {
  const { data: optionRows, error: optionsError } = await supabase
    .from("schedule_options")
    .select("*")
    .eq("week_start_date", weekStartDate)
    .order("option_id");
  if (optionsError) throw optionsError;
  if (!optionRows || optionRows.length === 0) return [];

  const rowIds = optionRows.map((row) => row.id as string);
  const { data: shiftRows, error: shiftsError } = await supabase
    .from("shifts")
    .select("*")
    .in("schedule_option_id", rowIds);
  if (shiftsError) throw shiftsError;

  const shiftsByRowId = new Map<string, Shift[]>();
  for (const row of shiftRows ?? []) {
    const rowId = row.schedule_option_id as string;
    const list = shiftsByRowId.get(rowId) ?? [];
    list.push(shiftFromRow(row));
    shiftsByRowId.set(rowId, list);
  }

  return optionRows.map((row) => scheduleOptionFromRow(row, shiftsByRowId.get(row.id as string) ?? []));
}

/** Reemplaza por completo una o más opciones de horario y sus turnos (usado al regenerar
 * la semana completa, o al guardar una sola opción activa). */
export async function saveScheduleOptions(options: ScheduleOption[]): Promise<void> {
  if (options.length === 0) return;
  const optionRows = options.map(scheduleOptionToRow);
  const { error: upsertError } = await supabase.from("schedule_options").upsert(optionRows);
  if (upsertError) throw upsertError;

  const rowIds = optionRows.map((row) => row.id as string);
  const { error: deleteError } = await supabase.from("shifts").delete().in("schedule_option_id", rowIds);
  if (deleteError) throw deleteError;

  const shiftRows = options.flatMap((option) =>
    option.shifts.map((shift) => shiftToRow(shift, scheduleOptionRowId(option.weekStartDate, option.id)))
  );
  if (shiftRows.length > 0) {
    const { error: insertError } = await supabase.from("shifts").insert(shiftRows);
    if (insertError) throw insertError;
  }
}

/** Guarda (upsert) una sola opción — usado por el botón "Guardar" para dejar un checkpoint
 * explícito de la opción activa sin tocar las otras dos variantes de esa semana. */
export async function saveScheduleOption(option: ScheduleOption): Promise<void> {
  await saveScheduleOptions([option]);
}
