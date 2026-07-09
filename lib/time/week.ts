import type { DayOfWeek } from "@/types";
import { DAYS_OF_WEEK } from "@/types";

/** Fecha ISO (YYYY-MM-DD) del próximo lunes a partir de hoy (o el lunes de la semana actual si hoy es lunes). */
export function getNextMondayISO(from: Date = new Date()): string {
  const date = new Date(from);
  const day = date.getDay();
  const diff = day === 1 ? 0 : ((8 - day) % 7);
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

/** Día de la semana (lunes-domingo) que le corresponde a `dateISO` dentro de la semana que arranca en `weekStartISO`, o null si cae fuera de esa semana. */
export function getDayOfWeekInWeek(dateISO: string, weekStartISO: string): DayOfWeek | null {
  const date = new Date(`${dateISO}T00:00:00`);
  const weekStart = new Date(`${weekStartISO}T00:00:00`);
  const diffDays = Math.round((date.getTime() - weekStart.getTime()) / 86_400_000);
  if (diffDays < 0 || diffDays > 6) return null;
  return DAYS_OF_WEEK[diffDays];
}
