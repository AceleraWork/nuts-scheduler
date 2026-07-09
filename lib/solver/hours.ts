import type { HoursIndicator, Shift } from "@/types";
import { shiftDurationHours } from "@/lib/time/formatTime";
import { HOURS_INDICATOR_THRESHOLDS } from "@/lib/constants";

export function getHoursIndicator(hours: number): HoursIndicator {
  const { green, yellow } = HOURS_INDICATOR_THRESHOLDS;
  if (hours >= green.min && hours <= green.max) return "green";
  if (yellow.some((range) => hours >= range.min && hours <= range.max)) return "yellow";
  return "red";
}

export function getEmployeeWeeklyHours(shifts: Shift[], employeeId: string): number {
  return shifts
    .filter((shift) => shift.employeeId === employeeId && !shift.isDayOff)
    .reduce((total, shift) => total + shiftDurationHours(shift.startMinutes, shift.endMinutes), 0);
}
