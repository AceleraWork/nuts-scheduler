import type { SiteId } from "./site";
import type { Area } from "./employee";
import type { DayOfWeek } from "./index";

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
}
