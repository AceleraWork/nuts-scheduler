import type {
  DayOfWeek,
  Employee,
  HardConstraint,
  Shift,
  Site,
  SiteId,
  SoftConstraint,
} from "@/types";
import { DAYS_OF_WEEK } from "@/types";
import { parseHour12 } from "@/lib/time/formatTime";

const H = (hour: number) => hour * 60;
const WORKING_DAYS_OFF_COUNT = 1;
const DAY_OFF_PREFERENCE_ORDER: DayOfWeek[] = [
  "lunes",
  "martes",
  "miercoles",
  "domingo",
  "jueves",
  "viernes",
  "sabado",
];

const SERVICE_TEMPLATES = [
  { start: H(7), end: H(16) },
  { start: H(11), end: H(20) },
  { start: H(13), end: H(22) },
];

let shiftCounter = 0;
function nextShiftId(): string {
  shiftCounter += 1;
  return `shift-${shiftCounter}`;
}

function rotate<T>(arr: T[], offset: number): T[] {
  const n = arr.length;
  return arr.map((_, i) => arr[(i + offset) % n]);
}

function forcedDaysOffFor(employeeId: string, hardConstraints: HardConstraint[]): DayOfWeek[] {
  return hardConstraints
    .filter((c) => c.type === "employee-day-off" && c.employeeIds?.includes(employeeId) && c.day)
    .map((c) => c.day!);
}

function homeSiteFor(employee: Employee, sites: Site[]): SiteId {
  const home = sites.find((s) => s.homeEmployeeIds?.includes(employee.id));
  if (home && employee.allowedSiteIds.includes(home.id)) return home.id;
  return employee.allowedSiteIds[0];
}

function excludedSitesFor(employeeId: string, hardConstraints: HardConstraint[]): Set<SiteId> {
  const excluded = new Set<SiteId>();
  for (const c of hardConstraints) {
    if (c.type === "employee-never-at-site" && c.employeeIds?.includes(employeeId) && c.siteId) {
      excluded.add(c.siteId);
    }
  }
  return excluded;
}

interface AssignInput {
  employees: Employee[];
  sites: Site[];
  hardConstraints: HardConstraint[];
  softConstraints: SoftConstraint[];
  weekStartDate: string;
  variantOffset?: number;
}

export function buildShifts({
  employees,
  sites,
  hardConstraints,
  softConstraints,
  variantOffset = 0,
}: AssignInput): Shift[] {
  const preferredOffDays = new Set(
    (softConstraints.find((c) => c.type === "preferred-day-off-range" && c.enabled)?.params
      ?.days as DayOfWeek[] | undefined) ?? []
  );
  const lateStartEmployeeIds = new Set(
    softConstraints
      .filter((c) => c.type === "late-start-preference" && c.enabled)
      .flatMap((c) => c.employeeIds ?? [])
  );

  const shifts: Shift[] = [];

  employees.forEach((employee, employeeIndex) => {
    const excludedSites = excludedSitesFor(employee.id, hardConstraints);
    const allowedSites = employee.allowedSiteIds.filter((id) => !excludedSites.has(id));
    const forced = forcedDaysOffFor(employee.id, hardConstraints);

    const preferenceOrder = rotate(DAY_OFF_PREFERENCE_ORDER, (employeeIndex + variantOffset) % 7).filter(
      (d) => preferredOffDays.size === 0 || preferredOffDays.has(d) || DAY_OFF_PREFERENCE_ORDER.indexOf(d) < 4
    );

    const daysOff = new Set<DayOfWeek>(forced);
    for (const day of preferenceOrder) {
      if (daysOff.size >= WORKING_DAYS_OFF_COUNT) break;
      daysOff.add(day);
    }
    for (const day of DAYS_OF_WEEK) {
      if (daysOff.size >= WORKING_DAYS_OFF_COUNT) break;
      daysOff.add(day);
    }

    const home = homeSiteFor({ ...employee, allowedSiteIds: allowedSites }, sites);

    DAYS_OF_WEEK.forEach((day, dayIndex) => {
      if (daysOff.has(day)) {
        shifts.push({
          id: nextShiftId(),
          employeeId: employee.id,
          siteId: allowedSites[0] ?? employee.allowedSiteIds[0],
          day,
          area: employee.area,
          startMinutes: 0,
          endMinutes: 0,
          isDayOff: true,
        });
        return;
      }

      let siteId: SiteId;
      if (employee.rotates && allowedSites.length > 1) {
        const isPriorityDay = sites.some(
          (s) => s.priorityDays.includes(day) && allowedSites.includes(s.id)
        );
        const prioritySite = sites.find((s) => s.priorityDays.includes(day));
        siteId =
          isPriorityDay && prioritySite && allowedSites.includes(prioritySite.id)
            ? prioritySite.id
            : allowedSites[(dayIndex + employeeIndex) % allowedSites.length];
      } else {
        siteId = home;
      }

      let start: number;
      let end: number;
      if (employee.area === "cocina") {
        start = H(7);
        end = H(16);
      } else {
        const template = SERVICE_TEMPLATES[(dayIndex + employeeIndex) % SERVICE_TEMPLATES.length];
        start = template.start;
        end = template.end;
      }

      const isWeekday = !["sabado", "domingo"].includes(day);
      if (lateStartEmployeeIds.has(employee.id) && isWeekday) {
        start += H(2);
        end += H(2);
      }

      let isEarlyLeave = false;
      const earlyLeave = employee.earlyLeavePreferences?.find((p) => p.day === day);
      if (earlyLeave) {
        const leaveByMinutes = parseHour12(earlyLeave.leaveBy);
        if (leaveByMinutes > start) {
          end = leaveByMinutes;
          isEarlyLeave = true;
        }
      }

      shifts.push({
        id: nextShiftId(),
        employeeId: employee.id,
        siteId,
        day,
        area: employee.area,
        startMinutes: start,
        endMinutes: end,
        isEarlyLeave,
      });
    });
  });

  repairOpenCloseAlone(shifts, employees, sites);
  return shifts;
}

function repairOpenCloseAlone(shifts: Shift[], employees: Employee[], sites: Site[]): void {
  const employeeById = new Map(employees.map((e) => [e.id, e]));

  for (const site of sites) {
    for (const day of DAYS_OF_WEEK) {
      const working = shifts.filter((s) => s.siteId === site.id && s.day === day && !s.isDayOff);
      if (working.length < 2) continue;

      const openTime = Math.min(...working.map((s) => s.startMinutes));
      const openers = working.filter((s) => s.startMinutes === openTime);
      if (openers.length === 1) {
        const opener = openers[0];
        const openerEmployee = employeeById.get(opener.employeeId);
        if (openerEmployee && !openerEmployee.canOpenAlone) {
          const candidate = working
            .filter((s) => s.employeeId !== opener.employeeId)
            .sort((a, b) => a.startMinutes - b.startMinutes)[0];
          if (candidate) {
            const tmpStart = opener.startMinutes;
            const tmpEnd = opener.endMinutes;
            opener.startMinutes = candidate.startMinutes;
            opener.endMinutes = candidate.endMinutes;
            candidate.startMinutes = tmpStart;
            candidate.endMinutes = tmpEnd;
          }
        }
      }

      const closeTime = Math.max(...working.map((s) => s.endMinutes));
      const closers = working.filter((s) => s.endMinutes === closeTime);
      if (closers.length === 1) {
        const closer = closers[0];
        const closerEmployee = employeeById.get(closer.employeeId);
        if (closerEmployee && !closerEmployee.canCloseAlone) {
          const candidate = working
            .filter((s) => s.employeeId !== closer.employeeId)
            .sort((a, b) => b.endMinutes - a.endMinutes)[0];
          if (candidate) {
            const tmpStart = closer.startMinutes;
            const tmpEnd = closer.endMinutes;
            closer.startMinutes = candidate.startMinutes;
            closer.endMinutes = candidate.endMinutes;
            candidate.startMinutes = tmpStart;
            candidate.endMinutes = tmpEnd;
          }
        }
      }
    }
  }
}
