import type { ServiceTaskType } from "@/types";

export const WEEKLY_TARGET_HOURS = 44;

export const SERVICE_TASK_TYPES: ServiceTaskType[] = ["caja", "servicio", "rappi-vitrina", "bebidas"];

export const SERVICE_TASK_TYPE_LABELS: Record<ServiceTaskType, string> = {
  caja: "Caja",
  servicio: "Servicio",
  "rappi-vitrina": "Rappi/Vitrina",
  bebidas: "Bebidas",
};

export const HOURS_INDICATOR_THRESHOLDS = {
  green: { min: 40, max: 46 },
  yellow: [
    { min: 36, max: 39 },
    { min: 47, max: 50 },
  ],
} as const;
