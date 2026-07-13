import type { DayOfWeek } from "./index";

export type SiteId = string;

export interface Site {
  id: SiteId;
  name: string;
  volume: "alto" | "bajo";
  /** Mínimo de personas de cocina requeridas por día en esta sede. */
  kitchenMinStaffByDay?: Partial<Record<DayOfWeek, number>>;
  /** Días de mayor prioridad para asignar cobertura completa. */
  priorityDays: DayOfWeek[];
  /** Hora antes de la cual debe haber cobertura suficiente para recibir stock, ej. "9AM". */
  stockCoverageBy?: string;
  /** Hora de cierre para un día puntual en esta sede (ej. domingo cierra más temprano),
   * ej. { domingo: "5PM" }. Recorta el fin de cualquier turno de ese día en esta sede. */
  closingHourByDay?: Partial<Record<DayOfWeek, string>>;
  /** IDs de empleados cuya sede habitual/fija es esta. */
  homeEmployeeIds?: string[];
  /** Empleado encargado de esta sede. Sin valor → se muestra "Sin encargado". */
  managerId?: string;
  notes?: string[];
}
