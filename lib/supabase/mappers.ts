import type {
  Employee,
  Site,
  HardConstraint,
  SoftConstraint,
  TrainingEvent,
  ScheduleOption,
  Shift,
} from "@/types";

export function employeeFromRow(row: Record<string, unknown>): Employee {
  return {
    id: row.id as string,
    name: row.name as string,
    area: row.area as Employee["area"],
    status: row.status as Employee["status"],
    gender: row.gender as Employee["gender"],
    skills: (row.skills as Employee["skills"]) ?? [],
    allowedSiteIds: (row.allowed_site_ids as Employee["allowedSiteIds"]) ?? [],
    rotates: Boolean(row.rotates),
    canOpenAlone: Boolean(row.can_open_alone),
    canCloseAlone: Boolean(row.can_close_alone),
    earlyLeavePreferences: (row.early_leave_preferences as Employee["earlyLeavePreferences"]) ?? undefined,
    weeklyTargetOverrideHours: (row.weekly_target_override_hours as number | null) ?? undefined,
    notes: (row.notes as string[] | null) ?? undefined,
    active: Boolean(row.active),
  };
}

export function employeeToRow(employee: Employee): Record<string, unknown> {
  return {
    id: employee.id,
    name: employee.name,
    area: employee.area,
    status: employee.status,
    gender: employee.gender,
    skills: employee.skills,
    allowed_site_ids: employee.allowedSiteIds,
    rotates: employee.rotates,
    can_open_alone: employee.canOpenAlone,
    can_close_alone: employee.canCloseAlone,
    early_leave_preferences: employee.earlyLeavePreferences ?? null,
    weekly_target_override_hours: employee.weeklyTargetOverrideHours ?? null,
    notes: employee.notes ?? null,
    active: employee.active,
  };
}

export function siteFromRow(row: Record<string, unknown>): Site {
  return {
    id: row.id as Site["id"],
    name: row.name as string,
    volume: row.volume as Site["volume"],
    kitchenMinStaffByDay: (row.kitchen_min_staff_by_day as Site["kitchenMinStaffByDay"]) ?? undefined,
    priorityDays: (row.priority_days as Site["priorityDays"]) ?? [],
    stockCoverageBy: (row.stock_coverage_by as string | null) ?? undefined,
    homeEmployeeIds: (row.home_employee_ids as string[] | null) ?? undefined,
    notes: (row.notes as string[] | null) ?? undefined,
  };
}

export function hardConstraintFromRow(row: Record<string, unknown>): HardConstraint {
  return {
    id: row.id as string,
    type: row.type as HardConstraint["type"],
    description: row.description as string,
    employeeIds: (row.employee_ids as string[] | null) ?? undefined,
    siteId: (row.site_id as HardConstraint["siteId"]) ?? undefined,
    day: (row.day as HardConstraint["day"]) ?? undefined,
    params: (row.params as Record<string, unknown> | null) ?? undefined,
    source: row.source as HardConstraint["source"],
    createdAt: row.created_at as string,
  };
}

export function hardConstraintToRow(c: HardConstraint): Record<string, unknown> {
  return {
    id: c.id,
    type: c.type,
    description: c.description,
    employee_ids: c.employeeIds ?? null,
    site_id: c.siteId ?? null,
    day: c.day ?? null,
    params: c.params ?? null,
    source: c.source,
    created_at: c.createdAt,
  };
}

export function softConstraintFromRow(row: Record<string, unknown>): SoftConstraint {
  return {
    id: row.id as string,
    type: row.type as SoftConstraint["type"],
    description: row.description as string,
    weight: Number(row.weight),
    enabled: Boolean(row.enabled),
    employeeIds: (row.employee_ids as string[] | null) ?? undefined,
    siteId: (row.site_id as SoftConstraint["siteId"]) ?? undefined,
    day: (row.day as SoftConstraint["day"]) ?? undefined,
    params: (row.params as Record<string, unknown> | null) ?? undefined,
    source: row.source as SoftConstraint["source"],
    createdAt: row.created_at as string,
  };
}

export function softConstraintToRow(c: SoftConstraint): Record<string, unknown> {
  return {
    id: c.id,
    type: c.type,
    description: c.description,
    weight: c.weight,
    enabled: c.enabled,
    employee_ids: c.employeeIds ?? null,
    site_id: c.siteId ?? null,
    day: c.day ?? null,
    params: c.params ?? null,
    source: c.source,
    created_at: c.createdAt,
  };
}

export function trainingFromRow(row: Record<string, unknown>): TrainingEvent {
  return {
    id: row.id as string,
    title: row.title as string,
    date: row.date as string,
    startMinutes: Number(row.start_minutes),
    endMinutes: Number(row.end_minutes),
    attendeeEmployeeIds: (row.attendee_employee_ids as string[]) ?? [],
    justifiedAbsenceEmployeeIds: (row.justified_absence_employee_ids as string[]) ?? [],
  };
}

export function trainingToRow(t: TrainingEvent): Record<string, unknown> {
  return {
    id: t.id,
    title: t.title,
    date: t.date,
    start_minutes: t.startMinutes,
    end_minutes: t.endMinutes,
    attendee_employee_ids: t.attendeeEmployeeIds,
    justified_absence_employee_ids: t.justifiedAbsenceEmployeeIds,
  };
}

export function shiftFromRow(row: Record<string, unknown>): Shift {
  return {
    id: row.id as string,
    employeeId: row.employee_id as string,
    siteId: row.site_id as Shift["siteId"],
    day: row.day as Shift["day"],
    area: row.area as Shift["area"],
    startMinutes: Number(row.start_minutes),
    endMinutes: Number(row.end_minutes),
    isDayOff: Boolean(row.is_day_off),
    isEarlyLeave: Boolean(row.is_early_leave),
    isTrainingBlock: Boolean(row.is_training_block),
    trainingEventId: (row.training_event_id as string | null) ?? undefined,
    serviceTaskType: (row.service_task_type as Shift["serviceTaskType"]) ?? undefined,
  };
}

export function shiftToRow(shift: Shift, scheduleOptionId: string): Record<string, unknown> {
  return {
    id: shift.id,
    schedule_option_id: scheduleOptionId,
    employee_id: shift.employeeId,
    site_id: shift.siteId,
    day: shift.day,
    area: shift.area,
    start_minutes: shift.startMinutes,
    end_minutes: shift.endMinutes,
    is_day_off: shift.isDayOff ?? false,
    is_early_leave: shift.isEarlyLeave ?? false,
    is_training_block: shift.isTrainingBlock ?? false,
    training_event_id: shift.trainingEventId ?? null,
    service_task_type: shift.serviceTaskType ?? null,
  };
}

/** PK real en Supabase: schedule_options.id ya no es solo 'A'/'B'/'C' (eso ahora vive en
 * `option_id`) sino ese valor prefijado por semana, para poder guardar varias semanas. */
export function scheduleOptionRowId(weekStartDate: string, optionId: ScheduleOption["id"]): string {
  return `${weekStartDate}_${optionId}`;
}

export function scheduleOptionFromRow(row: Record<string, unknown>, shifts: Shift[]): ScheduleOption {
  return {
    id: row.option_id as ScheduleOption["id"],
    label: row.label as string,
    weekStartDate: row.week_start_date as string,
    shifts,
    score: Number(row.score),
    violations: (row.violations as ScheduleOption["violations"]) ?? [],
    reasoningSummary: row.reasoning_summary as string,
    generatedAt: row.generated_at as string,
  };
}

export function scheduleOptionToRow(option: ScheduleOption): Record<string, unknown> {
  return {
    id: scheduleOptionRowId(option.weekStartDate, option.id),
    option_id: option.id,
    label: option.label,
    week_start_date: option.weekStartDate,
    score: option.score,
    violations: option.violations,
    reasoning_summary: option.reasoningSummary,
    generated_at: option.generatedAt,
  };
}
