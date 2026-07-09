import { useScheduleStore, selectActiveOption } from "@/stores/useScheduleStore";
import { getEmployeeWeeklyHours, getHoursIndicator } from "@/lib/solver/hours";
import { WEEKLY_TARGET_HOURS } from "@/lib/constants";

export function useEmployeeHours(employeeId: string) {
  const activeOption = useScheduleStore(selectActiveOption);
  const hours = activeOption ? getEmployeeWeeklyHours(activeOption.shifts, employeeId) : 0;
  return {
    hours,
    indicator: getHoursIndicator(hours),
    diffFromTarget: hours - WEEKLY_TARGET_HOURS,
  };
}
