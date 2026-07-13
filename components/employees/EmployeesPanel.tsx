"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { PanelHeader } from "@/components/layout/PanelHeader";
import { EmployeeSection } from "@/components/employees/EmployeeSection";
import { EmployeeEditDialog } from "@/components/employees/EmployeeEditDialog";
import { EmployeeCreateDialog } from "@/components/employees/EmployeeCreateDialog";
import { EmployeeLeaveDialog } from "@/components/employees/EmployeeLeaveDialog";
import { TrainingEventDialog } from "@/components/training/TrainingEventDialog";
import { TrainingBadge } from "@/components/training/TrainingBadge";
import { CategoryFilterSelect, type CategoryFilter } from "@/components/schedule/CategoryFilterSelect";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEmployeesStore } from "@/stores/useEmployeesStore";
import { useTrainingsStore } from "@/stores/useTrainingsStore";
import { useScheduleStore } from "@/stores/useScheduleStore";
import type { Employee } from "@/types";

export function EmployeesPanel() {
  const employees = useEmployeesStore((s) => s.employees);
  const trainings = useTrainingsStore((s) => s.trainings);
  const removeTrainingEvent = useTrainingsStore((s) => s.removeTrainingEvent);
  const options = useScheduleStore((s) => s.options);
  const revalidate = useScheduleStore((s) => s.revalidate);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [leaveEmployee, setLeaveEmployee] = useState<Employee | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("todas");

  const visibleEmployees = useMemo(
    () => (categoryFilter === "todas" ? employees : employees.filter((e) => e.area === categoryFilter)),
    [employees, categoryFilter]
  );
  const cocina = visibleEmployees.filter((e) => e.area === "cocina");
  const servicio = visibleEmployees.filter((e) => e.area === "servicio");
  const admin = visibleEmployees.filter((e) => e.area === "admin");
  const planta = visibleEmployees.filter((e) => e.area === "planta");

  async function handleRemoveTraining(id: string) {
    await removeTrainingEvent(id);
    await Promise.all(options.map((option) => revalidate(option.id)));
  }

  return (
    <div className="flex h-full flex-col">
      <PanelHeader
        icon={Users}
        title="Empleados"
        subtitle="Cocina, servicio, admin y planta"
        action={
          <div className="flex items-center gap-2">
            <CategoryFilterSelect value={categoryFilter} onChange={setCategoryFilter} />
            <EmployeeCreateDialog />
            <TrainingEventDialog />
          </div>
        }
      />
      {trainings.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-border px-4 py-2.5">
          {trainings.map((training) => (
            <TrainingBadge key={training.id} training={training} onRemove={handleRemoveTraining} />
          ))}
        </div>
      )}
      <ScrollArea className="min-h-0 flex-1 @container">
        <div className="space-y-6 p-4">
          <EmployeeSection
            title="Cocina"
            employees={cocina}
            onEdit={setEditingEmployee}
            onNewLeave={setLeaveEmployee}
          />
          <EmployeeSection
            title="Servicio"
            employees={servicio}
            onEdit={setEditingEmployee}
            onNewLeave={setLeaveEmployee}
          />
          <EmployeeSection
            title="Admin"
            employees={admin}
            onEdit={setEditingEmployee}
            onNewLeave={setLeaveEmployee}
          />
          <EmployeeSection
            title="Planta"
            employees={planta}
            onEdit={setEditingEmployee}
            onNewLeave={setLeaveEmployee}
          />
        </div>
      </ScrollArea>
      <EmployeeEditDialog
        employee={editingEmployee}
        onOpenChange={(open) => !open && setEditingEmployee(null)}
      />
      <EmployeeLeaveDialog
        employee={leaveEmployee}
        onOpenChange={(open) => !open && setLeaveEmployee(null)}
      />
    </div>
  );
}
