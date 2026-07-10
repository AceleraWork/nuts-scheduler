import type { Shift, DayOfWeek } from "@/types";
import { DAYS_OF_WEEK } from "@/types";
import { getSiteName } from "@/stores/useSitesStore";
import { getDayOfWeekInWeek } from "@/lib/time/week";
import type { HardRule } from "@/lib/solver/types";
import { nextViolationId } from "@/lib/solver/types";

function workingShiftsAt(shifts: Shift[], siteId: string, day: DayOfWeek): Shift[] {
  return shifts.filter((s) => s.siteId === siteId && s.day === day && !s.isDayOff);
}

export const HARD_RULES: HardRule[] = [
  {
    type: "employee-never-at-site",
    evaluate: (shifts, _ctx, c) => {
      if (!c.employeeIds || !c.siteId) return [];
      return shifts
        .filter((s) => !s.isDayOff && c.employeeIds!.includes(s.employeeId) && s.siteId === c.siteId)
        .map((s) => ({
          id: nextViolationId(),
          ruleId: c.id,
          ruleType: c.type,
          severity: "hard" as const,
          message: `${s.employeeId} está asignado a ${getSiteName(s.siteId)} el ${s.day}, pero tiene prohibido trabajar ahí.`,
          employeeIds: [s.employeeId],
          siteId: s.siteId,
          day: s.day,
        }));
    },
  },
  {
    type: "min-one-day-off",
    evaluate: (shifts, ctx, c) => {
      const violations = [];
      for (const employee of ctx.employees) {
        const daysOffCount = shifts.filter(
          (s) => s.employeeId === employee.id && s.isDayOff
        ).length;
        if (daysOffCount === 0) {
          violations.push({
            id: nextViolationId(),
            ruleId: c.id,
            ruleType: c.type,
            severity: "hard" as const,
            message: `${employee.name} no tiene ningún día de descanso esta semana.`,
            employeeIds: [employee.id],
          });
        } else if (daysOffCount > 1) {
          violations.push({
            id: nextViolationId(),
            ruleId: c.id,
            ruleType: c.type,
            severity: "hard" as const,
            message: `${employee.name} tiene ${daysOffCount} días de descanso esta semana; debe tener exactamente 1.`,
            employeeIds: [employee.id],
          });
        }
      }
      return violations;
    },
  },
  {
    type: "cannot-open-alone",
    evaluate: (shifts, ctx, c) => {
      if (!c.employeeIds) return [];
      const violations = [];
      for (const site of ctx.sites) {
        for (const day of DAYS_OF_WEEK) {
          const working = workingShiftsAt(shifts, site.id, day);
          if (working.length === 0) continue;
          const openTime = Math.min(...working.map((s) => s.startMinutes));
          const openers = working.filter((s) => s.startMinutes === openTime);
          if (openers.length === 1 && c.employeeIds.includes(openers[0].employeeId)) {
            violations.push({
              id: nextViolationId(),
              ruleId: c.id,
              ruleType: c.type,
              severity: "hard" as const,
              message: `${openers[0].employeeId} abriría sola en ${site.name} el ${day}.`,
              employeeIds: [openers[0].employeeId],
              siteId: site.id,
              day,
            });
          }
        }
      }
      return violations;
    },
  },
  {
    type: "cannot-close-alone",
    evaluate: (shifts, ctx, c) => {
      if (!c.employeeIds) return [];
      const violations = [];
      for (const site of ctx.sites) {
        for (const day of DAYS_OF_WEEK) {
          const working = workingShiftsAt(shifts, site.id, day);
          if (working.length === 0) continue;
          const closeTime = Math.max(...working.map((s) => s.endMinutes));
          const closers = working.filter((s) => s.endMinutes === closeTime);
          if (closers.length === 1 && c.employeeIds.includes(closers[0].employeeId)) {
            violations.push({
              id: nextViolationId(),
              ruleId: c.id,
              ruleType: c.type,
              severity: "hard" as const,
              message: `${closers[0].employeeId} cerraría sola en ${site.name} el ${day}.`,
              employeeIds: [closers[0].employeeId],
              siteId: site.id,
              day,
            });
          }
        }
      }
      return violations;
    },
  },
  {
    type: "onboarding-not-alone-critical",
    evaluate: (shifts, ctx, c) => {
      const violations = [];
      const onboardingIds = new Set(
        ctx.employees.filter((e) => e.status === "onboarding").map((e) => e.id)
      );
      for (const site of ctx.sites) {
        for (const day of DAYS_OF_WEEK) {
          const working = workingShiftsAt(shifts, site.id, day);
          if (working.length === 1 && onboardingIds.has(working[0].employeeId)) {
            violations.push({
              id: nextViolationId(),
              ruleId: c.id,
              ruleType: c.type,
              severity: "hard" as const,
              message: `${working[0].employeeId} (en onboarding) queda sola en ${site.name} el ${day}.`,
              employeeIds: [working[0].employeeId],
              siteId: site.id,
              day,
            });
          }
        }
      }
      return violations;
    },
  },
  {
    type: "skill-required-for-task",
    evaluate: (shifts, ctx, c) => {
      const violations = [];
      for (const shift of shifts) {
        if (shift.isDayOff) continue;
        const employee = ctx.employees.find((e) => e.id === shift.employeeId);
        if (employee && employee.skills.length === 0) {
          violations.push({
            id: nextViolationId(),
            ruleId: c.id,
            ruleType: c.type,
            severity: "hard" as const,
            message: `${employee.name} no tiene habilidades registradas para la tarea asignada en ${shift.day}.`,
            employeeIds: [employee.id],
            siteId: shift.siteId,
            day: shift.day,
          });
        }
      }
      return violations;
    },
  },
  {
    type: "employee-day-off",
    evaluate: (shifts, ctx, c) => {
      if (!c.employeeIds || !c.day) return [];
      const violations = [];
      for (const employeeId of c.employeeIds) {
        const shift = shifts.find((s) => s.employeeId === employeeId && s.day === c.day);
        const employee = ctx.employees.find((e) => e.id === employeeId);
        if (shift && !shift.isDayOff) {
          violations.push({
            id: nextViolationId(),
            ruleId: c.id,
            ruleType: c.type,
            severity: "hard" as const,
            message: `${employee?.name ?? employeeId} está programado el ${c.day}, pero debía tener descanso ese día.`,
            employeeIds: [employeeId],
            day: c.day,
          });
        }
      }
      return violations;
    },
  },
  {
    type: "employee-blocked-by-training",
    evaluate: (shifts, ctx, c) => {
      const violations = [];
      for (const training of ctx.trainings) {
        const day = getDayOfWeekInWeek(training.date, ctx.weekStartDate);
        if (!day) continue;
        for (const employeeId of training.attendeeEmployeeIds) {
          const employee = ctx.employees.find((e) => e.id === employeeId);
          const shift = shifts.find(
            (s) =>
              s.employeeId === employeeId &&
              s.day === day &&
              !s.isDayOff &&
              s.startMinutes < training.endMinutes &&
              s.endMinutes > training.startMinutes
          );
          if (shift) {
            violations.push({
              id: nextViolationId(),
              ruleId: c.id,
              ruleType: c.type,
              severity: "hard" as const,
              message: `${employee?.name ?? employeeId} tiene un turno que se cruza con la capacitación "${training.title}" el ${day}.`,
              employeeIds: [employeeId],
              day: shift.day,
            });
          }
        }
      }
      return violations;
    },
  },
  {
    type: "custom-hard-directive",
    evaluate: () => [],
  },
];
