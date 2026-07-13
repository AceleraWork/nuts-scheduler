import type { HoursIndicator, Shift } from "@/types";
import { shiftDurationHours } from "@/lib/time/formatTime";
import { OVERTIME_INDICATOR_THRESHOLDS, WEEKLY_TARGET_HOURS } from "@/lib/constants";

/** Color según horas EXTRA (hours - targetHours), no horas totales absolutas. */
export function getHoursIndicator(hours: number, targetHours: number = WEEKLY_TARGET_HOURS): HoursIndicator {
  const overtime = hours - targetHours;
  const { green, yellow } = OVERTIME_INDICATOR_THRESHOLDS;
  if (overtime <= green.max) return "green";
  if (overtime >= yellow.min && overtime <= yellow.max) return "yellow";
  return "red";
}

export function getEmployeeWeeklyHours(shifts: Shift[], employeeId: string): number {
  return shifts
    .filter((shift) => shift.employeeId === employeeId && !shift.isDayOff)
    .reduce((total, shift) => total + shiftDurationHours(shift.startMinutes, shift.endMinutes), 0);
}
