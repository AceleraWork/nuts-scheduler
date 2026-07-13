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

/** Inverso de getDayOfWeekInWeek: fecha ISO de `day` dentro de la semana que arranca en `weekStartISO`. */
export function dateForDayInWeek(weekStartISO: string, day: DayOfWeek): string {
  const date = new Date(`${weekStartISO}T00:00:00`);
  date.setDate(date.getDate() + DAYS_OF_WEEK.indexOf(day));
  return date.toISOString().slice(0, 10);
}

const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** Fecha ISO del lunes `deltaWeeks` semanas antes/después de `weekStartISO` (negativo = hacia atrás). */
export function shiftWeekISO(weekStartISO: string, deltaWeeks: number): string {
  const date = new Date(`${weekStartISO}T00:00:00`);
  date.setDate(date.getDate() + deltaWeeks * 7);
  return date.toISOString().slice(0, 10);
}

/** Rango legible en español de la semana que arranca en `weekStartISO`, ej. "06 al 12 de julio". */
export function formatWeekRangeEs(weekStartISO: string): string {
  const start = new Date(`${weekStartISO}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const startDay = String(start.getDate()).padStart(2, "0");
  const endDay = String(end.getDate()).padStart(2, "0");
  if (start.getMonth() === end.getMonth()) {
    return `${startDay} al ${endDay} de ${MONTHS_ES[start.getMonth()]}`;
  }
  return `${startDay} de ${MONTHS_ES[start.getMonth()]} al ${endDay} de ${MONTHS_ES[end.getMonth()]}`;
}

/** Mes + año en español de la semana que arranca en `weekStartISO`, ej. "Julio 2026". */
export function formatMonthEs(weekStartISO: string): string {
  const start = new Date(`${weekStartISO}T00:00:00`);
  const month = MONTHS_ES[start.getMonth()];
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${start.getFullYear()}`;
}

/** Encabezado en mayúsculas para el panel de horarios, ej. "SEMANA DEL 22 AL 28 DE JUNIO". */
export function formatWeekHeaderEs(weekStartISO: string): string {
  return `SEMANA DEL ${formatWeekRangeEs(weekStartISO).toUpperCase()}`;
}
