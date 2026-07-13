import type {
  DayOfWeek,
  Employee,
  EmployeeLeave,
  HardConstraint,
  Shift,
  Site,
  SiteId,
  SoftConstraint,
} from "@/types";
import { DAYS_OF_WEEK } from "@/types";
import { parseHour12, shiftDurationHours } from "@/lib/time/formatTime";
import { dateForDayInWeek } from "@/lib/time/week";

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

// Turnos de 8 horas exactas. Solo cocina entra a las 7AM — servicio nunca antes de las 8AM.
// La 3ª plantilla era 1PM-9PM, pero en la práctica casi nadie entra tan tarde — se
// reemplazó por 10AM-6PM (patrón real observado en horarios pasados de la dueña).
const SERVICE_TEMPLATES = [
  { start: H(8), end: H(16) },
  { start: H(11), end: H(19) },
  { start: H(10), end: H(18) },
];

// Planta (producción) es la única sede con un patrón de turno estructuralmente distinto:
// entradas variables (5:30/6/7AM) y duración 8-9h, en vez del 7AM-3PM fijo del resto de
// cocina. Hardcoded a propósito — es una sola sede especial hoy, no una config genérica
// por sede (ver Site.closingHourByDay para el patrón "config por sede" cuando aplique).
const PLANTA_SITE_ID: SiteId = "planta";
const PLANTA_TEMPLATES = [
  { start: H(5) + 30, end: H(13) + 30 },
  { start: H(6), end: H(15) },
  { start: H(7), end: H(15) },
];
// Horario administrativo por defecto (Camila/Karen/Kim) — sin datos operativos provistos
// aún, editable por turno desde el popover de edición.
const ADMIN_DEFAULT_TEMPLATE = { start: H(8), end: H(16) };

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

/** Días de esta semana cubiertos por una incapacidad/licencia activa del empleado, mapeados
 * a la incapacidad correspondiente (para poder etiquetar el turno de descanso resultante). */
function forcedLeaveDaysFor(
  employeeId: string,
  leaves: EmployeeLeave[],
  weekStartDate: string
): Map<DayOfWeek, string> {
  const result = new Map<DayOfWeek, string>();
  for (const day of DAYS_OF_WEEK) {
    const dateISO = dateForDayInWeek(weekStartDate, day);
    const leave = leaves.find(
      (l) => l.employeeId === employeeId && dateISO >= l.startDate && dateISO <= l.endDate
    );
    if (leave) result.set(day, leave.id);
  }
  return result;
}

function homeSiteFor(employee: Employee, sites: Site[]): SiteId {
  const home = sites.find((s) => s.homeEmployeeIds?.includes(employee.id));
  if (home && employee.allowedSiteIds.includes(home.id)) return home.id;
  return employee.allowedSiteIds[0];
}

/** Recorta el fin de un turno si la sede tiene una hora de cierre para ese día (ej. calle-93
 * cierra a las 5PM los domingos). No aplica a "festivos" — la app no tiene un calendario de
 * fechas feriadas, solo un patrón recurrente por día de la semana. */
function applySiteClosingCap(siteId: SiteId, day: DayOfWeek, start: number, end: number, sites: Site[]): number {
  const closingHour = sites.find((s) => s.id === siteId)?.closingHourByDay?.[day];
  if (!closingHour) return end;
  const closingMinutes = parseHour12(closingHour);
  return closingMinutes > start && closingMinutes < end ? closingMinutes : end;
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
  leaves: EmployeeLeave[];
  weekStartDate: string;
  variantOffset?: number;
}

export function buildShifts({
  employees,
  sites,
  hardConstraints,
  softConstraints,
  leaves,
  weekStartDate,
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
    const leaveDays = forcedLeaveDaysFor(employee.id, leaves, weekStartDate);

    const preferenceOrder = rotate(DAY_OFF_PREFERENCE_ORDER, (employeeIndex + variantOffset) % 7).filter(
      (d) => preferredOffDays.size === 0 || preferredOffDays.has(d) || DAY_OFF_PREFERENCE_ORDER.indexOf(d) < 4
    );

    const daysOff = new Set<DayOfWeek>([...forced, ...leaveDays.keys()]);
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
          leaveId: leaveDays.get(day),
        });
        return;
      }

      let siteId: SiteId;
      const patternSite = employee.explicitDayPattern?.[day];
      if (patternSite && allowedSites.includes(patternSite)) {
        siteId = patternSite;
      } else if (employee.rotates && allowedSites.length > 1) {
        const isPriorityDay = sites.some(
          (s) => s.priorityDays.includes(day) && allowedSites.includes(s.id)
        );
        const prioritySite = sites.find((s) => s.priorityDays.includes(day));
        siteId =
          isPriorityDay && prioritySite && allowedSites.includes(prioritySite.id)
            ? prioritySite.id
            : allowedSites[(dayIndex + employeeIndex + variantOffset) % allowedSites.length];
      } else {
        siteId = home;
      }

      let start: number;
      let end: number;
      if (siteId === PLANTA_SITE_ID) {
        const template = PLANTA_TEMPLATES[(dayIndex + employeeIndex + variantOffset) % PLANTA_TEMPLATES.length];
        start = template.start;
        end = template.end;
      } else if (employee.area === "cocina") {
        start = H(7);
        end = H(15);
      } else if (employee.area === "admin") {
        start = ADMIN_DEFAULT_TEMPLATE.start;
        end = ADMIN_DEFAULT_TEMPLATE.end;
      } else {
        const template = SERVICE_TEMPLATES[(dayIndex + employeeIndex + variantOffset) % SERVICE_TEMPLATES.length];
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
      end = applySiteClosingCap(siteId, day, start, end, sites);
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
      if (site.id === PLANTA_SITE_ID) {
        const template = PLANTA_TEMPLATES[(dayIndex + employeeIndex) % PLANTA_TEMPLATES.length];
        start = template.start;
        end = template.end;
      } else if (candidateEmployee.area === "cocina") {
        start = H(7);
        end = H(15);
      } else if (candidateEmployee.area === "admin") {
        start = ADMIN_DEFAULT_TEMPLATE.start;
        end = ADMIN_DEFAULT_TEMPLATE.end;
      } else {
        const template = SERVICE_TEMPLATES[(dayIndex + employeeIndex) % SERVICE_TEMPLATES.length];
        start = template.start;
        end = template.end;
      }
      end = applySiteClosingCap(site.id, day, start, end, sites);

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
