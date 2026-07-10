import { DAYS_OF_WEEK, DAY_LABELS } from "@/types";
import type { Employee, ScheduleOption, SiteId } from "@/types";
import { formatShiftRange } from "@/lib/time/formatTime";
import { getSiteName } from "@/stores/useSitesStore";
import { SERVICE_TASK_TYPE_LABELS } from "@/lib/constants";
import { getEmployeeWeeklyHours } from "@/lib/solver/hours";

export function shiftCellText(
  option: ScheduleOption,
  employeeId: string,
  day: (typeof DAYS_OF_WEEK)[number]
): string {
  const shift = option.shifts.find((s) => s.employeeId === employeeId && s.day === day);
  if (!shift || shift.isDayOff) return "Descanso";
  const tag = shift.serviceTaskType ? ` (${SERVICE_TASK_TYPE_LABELS[shift.serviceTaskType]})` : "";
  return `${getSiteName(shift.siteId)} ${formatShiftRange(shift.startMinutes, shift.endMinutes)}${tag}`;
}

/**
 * Filas "Empleado | Lunes..Domingo | Horas" para un horario, opcionalmente filtradas a una
 * sede. Compartido entre el export a Excel local y el export a Google Sheets.
 */
export function buildScheduleRows(
  option: ScheduleOption,
  employees: Employee[],
  siteFilter?: SiteId
): string[][] {
  const header = ["Empleado", ...DAYS_OF_WEEK.map((d) => DAY_LABELS[d]), "Horas"];
  const rows = employees
    .filter((employee) => {
      if (!siteFilter) return true;
      return option.shifts.some(
        (s) => s.employeeId === employee.id && !s.isDayOff && s.siteId === siteFilter
      );
    })
    .map((employee) => [
      employee.name,
      ...DAYS_OF_WEEK.map((day) => shiftCellText(option, employee.id, day)),
      String(getEmployeeWeeklyHours(option.shifts, employee.id)),
    ]);
  return [header, ...rows];
}
