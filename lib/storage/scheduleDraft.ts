import type { ScheduleOption, ScheduleOptionId } from "@/types";

const STORAGE_KEY = "nuts-schedule-draft";

export interface ScheduleDraft {
  weekStartDate: string;
  options: ScheduleOption[];
  activeOptionId: ScheduleOptionId;
}

/** Borrador del horario en edición (no guardado en Supabase) para que sobreviva un
 * refresh o cierre de pestaña. Solo cubre la semana visible al momento de guardar el
 * borrador — no reemplaza a Supabase como fuente de verdad, solo evita perder ediciones
 * que la dueña aún no ha confirmado con el botón "Guardar". */
export function loadScheduleDraft(): ScheduleDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ScheduleDraft;
  } catch {
    return null;
  }
}

export function saveScheduleDraft(draft: ScheduleDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // localStorage lleno o bloqueado (ej. modo incógnito estricto) — el horario sigue
    // funcionando en memoria, solo no sobrevive un refresh en ese caso.
  }
}
