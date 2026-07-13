"use client";

import { useMemo } from "react";
import { Pencil, Trash2, CalendarOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmployeeAvatar } from "@/components/employees/EmployeeAvatar";
import { SkillTag } from "@/components/employees/SkillTag";
import { ConstraintTag } from "@/components/employees/ConstraintTag";
import { HoursBadge } from "@/components/employees/HoursBadge";
import { useEmployeesStore } from "@/stores/useEmployeesStore";
import { useConstraintsStore } from "@/stores/useConstraintsStore";
import { useScheduleStore, selectActiveOption } from "@/stores/useScheduleStore";
import { useEmployeeHours } from "@/hooks/useHoursIndicator";
import { getSiteName } from "@/stores/useSitesStore";
import { WEEKLY_TARGET_HOURS } from "@/lib/constants";
import { DAY_LABELS } from "@/types";
import type { Employee } from "@/types";

interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onNewLeave: (employee: Employee) => void;
}

export function EmployeeCard({ employee, onEdit, onNewLeave }: EmployeeCardProps) {
  const { hours, indicator } = useEmployeeHours(employee.id);
  const activeOption = useScheduleStore(selectActiveOption);
  const regenerate = useScheduleStore((s) => s.regenerate);
  const removeEmployee = useEmployeesStore((s) => s.removeEmployee);
  const allHardConstraints = useConstraintsStore((s) => s.hardConstraints);
  const allSoftConstraints = useConstraintsStore((s) => s.softConstraints);
  const hardConstraints = useMemo(
    () => allHardConstraints.filter((c) => c.employeeIds?.includes(employee.id)),
    [allHardConstraints, employee.id]
  );
  const softConstraints = useMemo(
    () => allSoftConstraints.filter((c) => c.enabled && c.employeeIds?.includes(employee.id)),
    [allSoftConstraints, employee.id]
  );

  async function handleRemove() {
    const confirmed = window.confirm(
      `¿Eliminar a ${employee.name}? Esta acción no se puede deshacer y se recalcularán los horarios.`
    );
    if (!confirmed) return;
    await removeEmployee(employee.id);
    await regenerate();
  }

  const strongestSkill = employee.skills.find((s) => s.level === "experto");
  const daysOff = activeOption
    ? activeOption.shifts
        .filter((s) => s.employeeId === employee.id && s.isDayOff)
        .map((s) => DAY_LABELS[s.day])
    : [];

  return (
    <Card className="gap-3 py-4 ring-border">
      <div className="flex items-start justify-between gap-2 px-4">
        <div className="flex items-center gap-3 min-w-0">
          <EmployeeAvatar gender={employee.gender} className="size-11" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm text-ink truncate">{employee.name}</h3>
              <Badge
                variant="outline"
                className={
                  employee.status === "onboarding"
                    ? "border-amber/40 bg-[#fff4de] text-[#9a6400]"
                    : "border-olive/30 bg-olive-soft text-[#3f4a2e]"
                }
              >
                {employee.status === "onboarding" ? "Nuevo" : "Activo"}
              </Badge>
            </div>
            <p className="label-caps text-ink-mute">{employee.area}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Nueva incapacidad para ${employee.name}`}
            onClick={() => onNewLeave(employee)}
          >
            <CalendarOff className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Editar ${employee.name}`}
            onClick={() => onEdit(employee)}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Eliminar ${employee.name}`}
            onClick={handleRemove}
            className="text-ink-mute hover:text-danger"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="px-4">
        <HoursBadge hours={hours} indicator={indicator} targetHours={WEEKLY_TARGET_HOURS} />
      </div>

      <CardField label="Habilidades">
        <div className="flex flex-wrap gap-1.5">
          {employee.skills.map((skill) => (
            <SkillTag key={skill.skill} skill={skill} strong={skill.level === "experto"} />
          ))}
        </div>
      </CardField>

      {strongestSkill && (
        <CardField label="Fortalezas">
          <SkillTag skill={strongestSkill} strong />
        </CardField>
      )}

      <CardField label="Sedes">
        <p className="text-sm text-ink-soft">
          {employee.allowedSiteIds.map(getSiteName).join(", ")}
          {employee.rotates && <span className="text-ink-mute"> · rota entre sedes</span>}
        </p>
      </CardField>

      <CardField label="Preferencias">
        {softConstraints.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {softConstraints.map((c) => (
              <ConstraintTag key={c.id} label={c.description} severity="soft" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-mute">Ninguna</p>
        )}
      </CardField>

      <CardField label="Restricciones">
        {hardConstraints.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {hardConstraints.map((c) => (
              <ConstraintTag key={c.id} label={c.description} severity="hard" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-mute">Ninguna</p>
        )}
      </CardField>

      {daysOff.length > 0 && (
        <CardField label="Días off">
          <p className="text-sm text-ink-soft">{daysOff.join(", ")}</p>
        </CardField>
      )}

      {employee.earlyLeavePreferences && employee.earlyLeavePreferences.length > 0 && (
        <CardField label="Salidas tempranas">
          <p className="text-sm text-ink-soft">
            {employee.earlyLeavePreferences
              .map((p) => `${DAY_LABELS[p.day]} ${p.leaveBy}${p.strict ? "" : " (si es posible)"}`)
              .join(" · ")}
          </p>
        </CardField>
      )}
    </Card>
  );
}

function CardField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 px-4">
      <p className="label-caps text-ink-faint">{label}</p>
      {children}
    </div>
  );
}
