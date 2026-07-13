import { EmployeeCard } from "@/components/employees/EmployeeCard";
import type { Employee } from "@/types";

interface EmployeeSectionProps {
  title: string;
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onNewLeave: (employee: Employee) => void;
}

export function EmployeeSection({ title, employees, onEdit, onNewLeave }: EmployeeSectionProps) {
  if (employees.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="label-caps text-ink-mute">{title}</h3>
        <span className="label-caps text-ink-faint">{employees.length}</span>
      </div>
      <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2">
        {employees.map((employee) => (
          <EmployeeCard key={employee.id} employee={employee} onEdit={onEdit} onNewLeave={onNewLeave} />
        ))}
      </div>
    </section>
  );
}
