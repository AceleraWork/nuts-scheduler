import type { DayOfWeek } from "@/types";
import { getSiteName } from "@/stores/useSitesStore";
import { parseHour12, shiftDurationHours } from "@/lib/time/formatTime";
import type { SoftRule } from "@/lib/solver/types";
import { nextViolationId } from "@/lib/solver/types";

const LATE_START_THRESHOLD_MINUTES = 10 * 60; // 10AM
const WEEKDAYS: DayOfWeek[] = ["lunes", "martes", "miercoles", "jueves", "viernes"];

export const SOFT_RULES: SoftRule[] = [
  {
    type: "early-leave-preference",
    evaluate: (shifts, ctx, c) => {
      if (!c.employeeIds?.[0] || !c.day) return [];
      const employee = ctx.employees.find((e) => e.id === c.employeeIds![0]);
      const preference = employee?.earlyLeavePreferences?.find((p) => p.day === c.day);
      if (!preference) return [];
      const shift = shifts.find((s) => s.employeeId === employee!.id && s.day === c.day);
      if (!shift || shift.isDayOff) return [];
      const leaveByMinutes = parseHour12(preference.leaveBy);
      if (shift.endMinutes > leaveByMinutes) {
        return [
          {
            id: nextViolationId(),
            ruleId: c.id,
            ruleType: c.type,
            severity: "soft" as const,
            message: `${employee!.name} no salió temprano el ${c.day} como se prefería.`,
            employeeIds: [employee!.id],
            day: c.day,
            weight: c.weight,
          },
        ];
      }
      return [];
    },
  },
  {
    type: "late-start-preference",
    evaluate: (shifts, ctx, c) => {
      if (!c.employeeIds) return [];
      const violations = [];
      for (const employeeId of c.employeeIds) {
        const employee = ctx.employees.find((e) => e.id === employeeId);
        for (const day of WEEKDAYS) {
          const shift = shifts.find((s) => s.employeeId === employeeId && s.day === day);
          if (shift && !shift.isDayOff && shift.startMinutes < LATE_START_THRESHOLD_MINUTES) {
            violations.push({
              id: nextViolationId(),
              ruleId: c.id,
              ruleType: c.type,
              severity: "soft" as const,
              message: `${employee?.name ?? employeeId} entró temprano el ${day}; prefiere entrar tarde entre semana.`,
              employeeIds: [employeeId],
              day,
              weight: c.weight,
            });
          }
        }
      }
      return violations;
    },
  },
  {
    type: "preferred-day-off-range",
    evaluate: (shifts, ctx, c) => {
      const preferredDays = (c.params?.days as DayOfWeek[]) ?? [];
      if (preferredDays.length === 0) return [];
      const violations = [];
      for (const employee of ctx.employees) {
        const daysOff = shifts
          .filter((s) => s.employeeId === employee.id && s.isDayOff)
          .map((s) => s.day);
        const hasPreferredOff = daysOff.some((d) => preferredDays.includes(d));
        if (daysOff.length > 0 && !hasPreferredOff) {
          violations.push({
            id: nextViolationId(),
            ruleId: c.id,
            ruleType: c.type,
            severity: "soft" as const,
            message: `Los descansos de ${employee.name} no caen entre lunes y jueves.`,
            employeeIds: [employee.id],
            weight: c.weight,
          });
        }
      }
      return violations;
    },
  },
  {
    type: "pair-together-at-site",
    evaluate: (shifts, ctx, c) => {
      if (!c.employeeIds || c.employeeIds.length < 2 || !c.siteId) return [];
      const [a, b] = c.employeeIds;
      const days = (c.params?.days as DayOfWeek[]) ?? [];
      const violations = [];
      for (const day of days) {
        const shiftA = shifts.find((s) => s.employeeId === a && s.day === day);
        const shiftB = shifts.find((s) => s.employeeId === b && s.day === day);
        const bothPresent =
          shiftA && !shiftA.isDayOff && shiftA.siteId === c.siteId &&
          shiftB && !shiftB.isDayOff && shiftB.siteId === c.siteId;
        if (!bothPresent) {
          const empA = ctx.employees.find((e) => e.id === a)?.name ?? a;
          const empB = ctx.employees.find((e) => e.id === b)?.name ?? b;
          violations.push({
            id: nextViolationId(),
            ruleId: c.id,
            ruleType: c.type,
            severity: "soft" as const,
            message: `${empA} y ${empB} no coincidieron en ${getSiteName(c.siteId)} el ${day}.`,
            employeeIds: [a, b],
            siteId: c.siteId,
            day,
            weight: c.weight,
          });
        }
      }
      return violations;
    },
  },
  {
    type: "target-weekly-hours",
    evaluate: (shifts, ctx, c) => {
      const area = c.params?.area as string | undefined;
      const targetHours = (c.params?.targetHours as number) ?? 44;
      const allowOvertime = Boolean(c.params?.allowOvertime);
      if (!area) return [];
      const violations = [];
      for (const employee of ctx.employees.filter((e) => e.area === area)) {
        const hours = shifts
          .filter((s) => s.employeeId === employee.id && !s.isDayOff)
          .reduce((total, s) => total + shiftDurationHours(s.startMinutes, s.endMinutes), 0);
        const diff = hours - targetHours;
        const tolerance = 2;
        if (diff < -tolerance || (!allowOvertime && diff > tolerance)) {
          violations.push({
            id: nextViolationId(),
            ruleId: c.id,
            ruleType: c.type,
            severity: "soft" as const,
            message: `${employee.name} tiene ${hours}h, lejos del objetivo de ${targetHours}h semanales.`,
            employeeIds: [employee.id],
            weight: c.weight,
          });
        }
      }
      return violations;
    },
  },
  {
    type: "site-reinforcement",
    evaluate: (shifts, ctx, c) => {
      if (!c.siteId) return [];
      const days = (c.params?.days as DayOfWeek[]) ?? [];
      const minHeadcount = (c.params?.minHeadcount as number) ?? 2;
      const violations = [];
      for (const day of days) {
        const headcount = shifts.filter(
          (s) => s.siteId === c.siteId && s.day === day && !s.isDayOff
        ).length;
        if (headcount < minHeadcount) {
          violations.push({
            id: nextViolationId(),
            ruleId: c.id,
            ruleType: c.type,
            severity: "soft" as const,
            message: `${getSiteName(c.siteId)} solo tiene ${headcount} personas el ${day}; se pidió reforzar.`,
            siteId: c.siteId,
            day,
            weight: c.weight,
          });
        }
      }
      return violations;
    },
  },
  {
    type: "custom-chat-directive",
    evaluate: () => [],
  },
];
