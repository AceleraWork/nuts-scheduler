import type { HardConstraintType, SoftConstraintType } from "@/types";

export const HARD_CONSTRAINT_TYPES: HardConstraintType[] = [
  "employee-never-at-site",
  "min-one-day-off",
  "cannot-open-alone",
  "cannot-close-alone",
  "onboarding-not-alone-critical",
  "skill-required-for-task",
  "employee-day-off",
  "employee-blocked-by-training",
];

export const HARD_CONSTRAINT_LABELS: Record<HardConstraintType, string> = {
  "employee-never-at-site": "Nunca trabaja en una sede",
  "min-one-day-off": "Debe tener exactamente 1 día off",
  "cannot-open-alone": "No puede abrir sola/o",
  "cannot-close-alone": "No puede cerrar sola/o",
  "onboarding-not-alone-critical": "Onboarding: no puede quedar sola/o en tareas críticas",
  "skill-required-for-task": "Requiere habilidad específica para la tarea",
  "employee-day-off": "Día de descanso fijo",
  "employee-blocked-by-training": "Bloqueado por una capacitación",
};

export const SOFT_CONSTRAINT_TYPES: SoftConstraintType[] = [
  "early-leave-preference",
  "late-start-preference",
  "preferred-day-off-range",
  "pair-together-at-site",
  "target-weekly-hours",
  "site-reinforcement",
  "custom-chat-directive",
];

export const SOFT_CONSTRAINT_LABELS: Record<SoftConstraintType, string> = {
  "early-leave-preference": "Salida temprana",
  "late-start-preference": "Prefiere entrar tarde",
  "preferred-day-off-range": "Descansos preferidos lunes-jueves",
  "pair-together-at-site": "Pareja preferida en una sede",
  "target-weekly-hours": "Meta de horas semanales",
  "site-reinforcement": "Reforzar sede en días específicos",
  "custom-chat-directive": "Directiva personalizada (chat)",
};

export const TYPES_WITH_DAYS_PARAM: (HardConstraintType | SoftConstraintType)[] = [
  "preferred-day-off-range",
  "pair-together-at-site",
  "site-reinforcement",
];
