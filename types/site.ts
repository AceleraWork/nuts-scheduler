import type { DayOfWeek } from "./index";

export type SiteId = "calle-93" | "calle-81";

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
  /** IDs de empleados cuya sede habitual/fija es esta. */
  homeEmployeeIds?: string[];
  notes?: string[];
}
