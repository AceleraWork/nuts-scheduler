import type { SiteId } from "./site";
import type { Area } from "./employee";
import type { DayOfWeek } from "./index";

export type ServiceTaskType = "caja" | "servicio" | "rappi-vitrina" | "bebidas";

export interface Shift {
  id: string;
  employeeId: string;
  siteId: SiteId;
  day: DayOfWeek;
  area: Area;
  /** Minutos desde medianoche, ej. 7AM = 420. */
  startMinutes: number;
  /** Minutos desde medianoche, ej. 4PM = 960. */
  endMinutes: number;
  isDayOff?: boolean;
  isEarlyLeave?: boolean;
  isTrainingBlock?: boolean;
  trainingEventId?: string;
  /** Etiqueta manual/chat de tarea de servicio (caja, rappi, etc.), solo informativa. */
  serviceTaskType?: ServiceTaskType;
}
