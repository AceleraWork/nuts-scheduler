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
import { parseHour12, shiftDurationHours } from "@/lib/time/formatTime";

const H = (hour: number) => hour * 60;
const EARLY_LEAVE_MAX_HOURS = 6;
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

// Turnos de 8 horas exactas (antes eran de 9h por error — ver bug reportado por la dueña).
const SERVICE_TEMPLATES = [
  { start: H(7), end: H(15) },
  { start: H(11), end: H(19) },
  { start: H(13), end: H(21) },
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
  const earlyLeaveByEmployeeDay = new Map<string, string>();
  const earlyLeaveByEmployeeAnyDay = new Map<string, string>();
  for (const c of softConstraints) {
    if (c.type === "early-leave-preference" && c.enabled && c.employeeIds?.[0]) {
      const leaveBy = (c.params?.leaveBy as string) ?? "1PM";
      if (c.day) {
        earlyLeaveByEmployeeDay.set(`${c.employeeIds[0]}:${c.day}`, leaveBy);
      } else {
        // Sin "day" significa "todos los días" (ej. "Javier sale máximo a las 7PM"
        // sin especificar un día puntual) — antes se ignoraba silenciosamente porque
        // este bloque exigía un day para registrar la preferencia.
        earlyLeaveByEmployeeAnyDay.set(c.employeeIds[0], leaveBy);
      }
    }
  }

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
        end = H(15);
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

      const leaveBy =
        earlyLeaveByEmployeeDay.get(`${employee.id}:${day}`) ??
        earlyLeaveByEmployeeAnyDay.get(employee.id) ??
        employee.earlyLeavePreferences?.find((p) => p.day === day)?.leaveBy;
      if (leaveBy) {
        const leaveByMinutes = parseHour12(leaveBy);
        // Solo recorta el turno si de verdad lo acorta (antes también aplicaba si
        // leaveBy caía después del fin de la plantilla, alargando el turno por error).
        if (leaveByMinutes > start && leaveByMinutes < end) {
          end = leaveByMinutes;
        }
      }
      // El aviso de "salida temprana" refleja horas reales trabajadas, no si se aplicó
      // una preferencia de leaveBy: cualquier turno de 6h o menos cuenta como temprano.
      const isEarlyLeave = shiftDurationHours(start, end) <= EARLY_LEAVE_MAX_HOURS;

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
  reinforceOnboardingCoverage(shifts, employees, sites);
  return shifts;
}

/**
 * Un empleado en onboarding nunca debe quedar como única persona trabajando en una sede
 * (necesita alguien más presente, no solo no-abrir/cerrar-sola/o). A diferencia de
 * `canOpenAlone`/`canCloseAlone`, esto se basa directo en `employee.status`, sin depender
 * de que exista una constraint manual registrada para dispararse.
 */
function reinforceOnboardingCoverage(shifts: Shift[], employees: Employee[], sites: Site[]): void {
  const employeeById = new Map(employees.map((e) => [e.id, e]));

  function isEligibleCandidate(
    shift: Shift,
    day: DayOfWeek,
    site: Site,
    excludeEmployeeId: string,
    requireNonOnboarding: boolean
  ): boolean {
    if (shift.day !== day || !shift.isDayOff || shift.employeeId === excludeEmployeeId) return false;
    const candidate = employeeById.get(shift.employeeId);
    if (!candidate || !candidate.active || !candidate.allowedSiteIds.includes(site.id)) return false;
    if (requireNonOnboarding && candidate.status === "onboarding") return false;
    return true;
  }

  for (const site of sites) {
    for (const day of DAYS_OF_WEEK) {
      const working = shifts.filter((s) => s.siteId === site.id && s.day === day && !s.isDayOff);
      if (working.length !== 1) continue;
      const sole = working[0];
      const soleEmployee = employeeById.get(sole.employeeId);
      if (!soleEmployee || soleEmployee.status !== "onboarding") continue;

      const candidateShift =
        shifts.find((s) => isEligibleCandidate(s, day, site, sole.employeeId, true)) ??
        shifts.find((s) => isEligibleCandidate(s, day, site, sole.employeeId, false));
      if (!candidateShift) continue;
      const candidateEmployee = employeeById.get(candidateShift.employeeId)!;

      // Buscar otro día donde el candidato ya trabaja y liberar su descanso ahí en vez de
      // agregarle un 7º día — preferimos el día de mayor headcount en esa sede, para que
      // retirarlo no vuelva a dejar a nadie solo.
      let bestSwapDay: Shift | null = null;
      let bestHeadcount = 1;
      for (const workShift of shifts) {
        if (workShift.employeeId !== candidateEmployee.id || workShift.isDayOff) continue;
        const headcountThatDay = shifts.filter(
          (s) => s.siteId === workShift.siteId && s.day === workShift.day && !s.isDayOff
        ).length;
        if (headcountThatDay > bestHeadcount) {
          bestHeadcount = headcountThatDay;
          bestSwapDay = workShift;
        }
      }
      if (!bestSwapDay) continue;

      const dayIndex = DAYS_OF_WEEK.indexOf(day);
      const employeeIndex = employees.indexOf(candidateEmployee);
      let start: number;
      let end: number;
      if (candidateEmployee.area === "cocina") {
        start = H(7);
        end = H(15);
      } else {
        const template = SERVICE_TEMPLATES[(dayIndex + employeeIndex) % SERVICE_TEMPLATES.length];
        start = template.start;
        end = template.end;
      }

      candidateShift.siteId = site.id;
      candidateShift.area = candidateEmployee.area;
      candidateShift.startMinutes = start;
      candidateShift.endMinutes = end;
      candidateShift.isDayOff = false;

      bestSwapDay.isDayOff = true;
      bestSwapDay.startMinutes = 0;
      bestSwapDay.endMinutes = 0;
      bestSwapDay.isEarlyLeave = false;
    }
  }
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
        // No se intercambia el turno de quien tiene salida temprana marcada (ni como quien
        // abre sola/o a reparar ni como candidato) para no sobrescribir su horario truncado
        // con el horario completo del otro — bug real ya corregido una vez.
        if (openerEmployee && !openerEmployee.canOpenAlone && !opener.isEarlyLeave) {
          const candidate = working
            .filter((s) => s.employeeId !== opener.employeeId && !s.isEarlyLeave)
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
        if (closerEmployee && !closerEmployee.canCloseAlone && !closer.isEarlyLeave) {
          const candidate = working
            .filter((s) => s.employeeId !== closer.employeeId && !s.isEarlyLeave)
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
