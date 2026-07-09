/**
 * Formatea minutos desde medianoche a formato de hora corto: "6PM", "7AM", "6:30PM".
 * Nunca muestra ":00" en punto ni ceros a la izquierda.
 */
export function formatHour12(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const period = hours24 < 12 ? "AM" : "PM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return minutes === 0 ? `${hours12}${period}` : `${hours12}:${String(minutes).padStart(2, "0")}${period}`;
}

/** Formatea un rango de turno, ej. "7AM - 4PM". */
export function formatShiftRange(startMinutes: number, endMinutes: number): string {
  return `${formatHour12(startMinutes)} - ${formatHour12(endMinutes)}`;
}

/** Convierte una hora "7AM" / "6:30PM" a minutos desde medianoche. */
export function parseHour12(value: string): number {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) {
    throw new Error(`Formato de hora inválido: "${value}"`);
  }
  const [, hourStr, minuteStr, period] = match;
  let hours = parseInt(hourStr, 10) % 12;
  if (period.toUpperCase() === "PM") hours += 12;
  const minutes = minuteStr ? parseInt(minuteStr, 10) : 0;
  return hours * 60 + minutes;
}

/** Convierte minutos desde medianoche a "HH:MM" (24h) para inputs nativos type="time". */
export function minutesToHHMM(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Convierte "HH:MM" (24h) de un input nativo a minutos desde medianoche. */
export function hhmmToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Duración de un turno en horas decimales, considerando turnos que cruzan medianoche. */
export function shiftDurationHours(startMinutes: number, endMinutes: number): number {
  const diff = endMinutes >= startMinutes ? endMinutes - startMinutes : 1440 - startMinutes + endMinutes;
  return diff / 60;
}
