import type { SiteId } from "./site";
import type { DayOfWeek } from "./index";

export type Area = "cocina" | "servicio";
export type EmployeeStatus = "activo" | "onboarding";
export type Gender = "male" | "female";

export type KitchenSkill = "salado" | "dulce";
export type ServiceSkill = "apertura" | "cafe" | "rappi" | "cierre";
export type SkillName = KitchenSkill | ServiceSkill;
export type SkillLevel = "aprendiz" | "competente" | "experto";

export interface EmployeeSkill {
  skill: SkillName;
  level: SkillLevel;
}

export interface EarlyLeavePreference {
  day: DayOfWeek;
  /** Hora límite de salida, formato "6PM" / "6:30PM". */
  leaveBy: string;
  /** Si es una preferencia blanda ("cuando sea posible") o fija. */
  strict?: boolean;
}

export interface Employee {
  id: string;
  name: string;
  area: Area;
  status: EmployeeStatus;
  gender: Gender;
  skills: EmployeeSkill[];
  allowedSiteIds: SiteId[];
  /** Rota entre sedes en vez de tener una sede fija. */
  rotates: boolean;
  canOpenAlone: boolean;
  canCloseAlone: boolean;
  earlyLeavePreferences?: EarlyLeavePreference[];
  weeklyTargetOverrideHours?: number;
  notes?: string[];
  active: boolean;
}
