import type { Shift } from "./shift";
import type { HardConstraintType, SoftConstraintType } from "./constraint";
import type { SiteId } from "./site";
import type { DayOfWeek } from "./index";

export interface Violation {
  id: string;
  ruleId: string;
  ruleType: HardConstraintType | SoftConstraintType;
  severity: "hard" | "soft";
  message: string;
  employeeIds?: string[];
  siteId?: SiteId;
  day?: DayOfWeek;
  weight?: number;
}

export type ScheduleOptionId = "A" | "B" | "C";

export interface ScheduleOption {
  id: ScheduleOptionId;
  label: string;
  weekStartDate: string;
  shifts: Shift[];
  score: number;
  violations: Violation[];
  reasoningSummary: string;
  generatedAt: string;
}

export type HoursIndicator = "green" | "yellow" | "red";
