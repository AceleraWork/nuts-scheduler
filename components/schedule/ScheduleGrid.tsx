"use client";

import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { DAYS_OF_WEEK, DAY_LABELS } from "@/types";
import type { Employee, ScheduleOption } from "@/types";
import { ScheduleCell } from "@/components/schedule/ScheduleCell";
import { EmployeeAvatar } from "@/components/employees/EmployeeAvatar";
import { useScheduleStore } from "@/stores/useScheduleStore";
import { useTrainingsStore } from "@/stores/useTrainingsStore";
import { getDayOfWeekInWeek } from "@/lib/time/week";
import type { SiteFilter } from "@/components/schedule/SiteFilterTabs";

interface ScheduleGridProps {
  employees: Employee[];
  option: ScheduleOption;
  siteFilter: SiteFilter;
}

export function ScheduleGrid({ employees, option, siteFilter }: ScheduleGridProps) {
  const swapShifts = useScheduleStore((s) => s.swapShifts);
  const trainings = useTrainingsStore((s) => s.trainings);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const draggable = siteFilter === "todas";

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    swapShifts(option.id, String(active.id), String(over.id));
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-separate border-spacing-1.5">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-40 bg-surface text-left">
                <span className="label-caps text-ink-mute">Empleado</span>
              </th>
              {DAYS_OF_WEEK.map((day) => (
                <th key={day} className="min-w-28 text-left">
                  <span className="label-caps text-ink-mute">{DAY_LABELS[day]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td className="sticky left-0 z-10 bg-surface align-top">
                  <div className="flex items-center gap-2 py-1.5 pr-2">
                    <EmployeeAvatar gender={employee.gender} className="size-7" />
                    <span className="truncate text-sm font-medium text-ink">{employee.name}</span>
                  </div>
                </td>
                {DAYS_OF_WEEK.map((day) => {
                  const shift = option.shifts.find(
                    (s) => s.employeeId === employee.id && s.day === day
                  );
                  const training = trainings.find(
                    (t) =>
                      t.attendeeEmployeeIds.includes(employee.id) &&
                      getDayOfWeekInWeek(t.date, option.weekStartDate) === day
                  );
                  return (
                    <td key={day} className="align-top">
                      <ScheduleCell
                        shift={shift}
                        siteFilter={siteFilter}
                        optionId={option.id}
                        draggable={draggable}
                        training={training}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!draggable && (
        <p className="px-1 pt-2 text-xs text-ink-faint">
          Cambia a &quot;Todas&quot; para arrastrar y soltar turnos.
        </p>
      )}
    </DndContext>
  );
}
