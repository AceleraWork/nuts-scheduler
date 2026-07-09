export interface TrainingEvent {
  id: string;
  title: string;
  /** Fecha ISO, ej. "2026-07-09". */
  date: string;
  startMinutes: number;
  endMinutes: number;
  attendeeEmployeeIds: string[];
  justifiedAbsenceEmployeeIds: string[];
}
