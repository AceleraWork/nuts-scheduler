import type { SiteId } from "./site";
import type { DayOfWeek } from "./index";

export type HardConstraintType =
  | "employee-never-at-site"
  | "min-one-day-off"
  | "cannot-open-alone"
  | "cannot-close-alone"
  | "onboarding-not-alone-critical"
  | "skill-required-for-task"
  | "employee-day-off"
  | "employee-blocked-by-training"
  | "custom-hard-directive";

export type SoftConstraintType =
  | "early-leave-preference"
  | "late-start-preference"
  | "preferred-day-off-range"
  | "pair-together-at-site"
  | "target-weekly-hours"
  | "site-reinforcement"
  | "custom-chat-directive";

export type ConstraintSource = "seed" | "chat" | "manual";

export interface HardConstraint {
  id: string;
  type: HardConstraintType;
  description: string;
  employeeIds?: string[];
  siteId?: SiteId;
  day?: DayOfWeek;
  params?: Record<string, unknown>;
  source: ConstraintSource;
  createdAt: string;
}

export interface SoftConstraint {
  id: string;
  type: SoftConstraintType;
  description: string;
  /** Peso relativo usado por el solver al ponderar violaciones (mayor = más importante). */
  weight: number;
  enabled: boolean;
  employeeIds?: string[];
  siteId?: SiteId;
  day?: DayOfWeek;
  params?: Record<string, unknown>;
  source: ConstraintSource;
  createdAt: string;
}
