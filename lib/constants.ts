import type { ServiceTaskType } from "@/types";

export const WEEKLY_TARGET_HOURS = 42;

/** Tope de horas extra por encima de WEEKLY_TARGET_HOURS, incluso cuando una regla de
 * horas objetivo tiene "permitir horas extra" activado. */
export const MAX_OVERTIME_HOURS = 4;

export const SERVICE_TASK_TYPES: ServiceTaskType[] = ["caja", "servicio", "rappi-vitrina", "bebidas"];

export const SERVICE_TASK_TYPE_LABELS: Record<ServiceTaskType, string> = {
  caja: "Caja",
  servicio: "Servicio",
  "rappi-vitrina": "Rappi/Vitrina",
  bebidas: "Bebidas",
};

/** Bandas de color según horas EXTRA (horas totales - WEEKLY_TARGET_HOURS), no horas
 * totales absolutas: 0h o menos = verde, 1-2h = amarillo, 3h o más = rojo (incluye
 * cualquier valor por encima de MAX_OVERTIME_HOURS). */
export const OVERTIME_INDICATOR_THRESHOLDS = {
  green: { max: 0 },
  yellow: { min: 1, max: 2 },
  red: { min: 3 },
} as const;
