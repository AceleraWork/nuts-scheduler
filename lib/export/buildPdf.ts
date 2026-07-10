import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DAYS_OF_WEEK, DAY_LABELS } from "@/types";
import type { Employee, ScheduleOption } from "@/types";
import { formatShiftRange } from "@/lib/time/formatTime";
import { getSiteName } from "@/stores/useSitesStore";
import { SERVICE_TASK_TYPE_LABELS } from "@/lib/constants";

function shiftCellText(option: ScheduleOption, employeeId: string, day: (typeof DAYS_OF_WEEK)[number]): string {
  const shift = option.shifts.find((s) => s.employeeId === employeeId && s.day === day);
  if (!shift || shift.isDayOff) return "Descanso";
  const range = formatShiftRange(shift.startMinutes, shift.endMinutes);
  const tag = shift.serviceTaskType ? ` (${SERVICE_TASK_TYPE_LABELS[shift.serviceTaskType]})` : "";
  return `${getSiteName(shift.siteId)}\n${range}${shift.isEarlyLeave ? " (sale temprano)" : ""}${tag}`;
}

export function buildSchedulePdf(option: ScheduleOption, employees: Employee[]): jsPDF {
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(14);
  doc.text(`Nuts About You — ${option.label}`, 14, 16);
  doc.setFontSize(10);
  doc.text(`Semana del ${option.weekStartDate}`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [["Empleado", ...DAYS_OF_WEEK.map((d) => DAY_LABELS[d])]],
    body: employees.map((employee) => [
      employee.name,
      ...DAYS_OF_WEEK.map((day) => shiftCellText(option, employee.id, day)),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [207, 166, 112] },
    theme: "grid",
  });

  for (const employee of employees) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text(employee.name, 14, 18);
    doc.setFontSize(10);
    doc.text(`${option.label} — semana del ${option.weekStartDate}`, 14, 25);

    autoTable(doc, {
      startY: 32,
      head: [["Día", "Sede", "Horario"]],
      body: DAYS_OF_WEEK.map((day) => {
        const shift = option.shifts.find((s) => s.employeeId === employee.id && s.day === day);
        if (!shift || shift.isDayOff) return [DAY_LABELS[day], "—", "Descanso"];
        const tag = shift.serviceTaskType ? ` (${SERVICE_TASK_TYPE_LABELS[shift.serviceTaskType]})` : "";
        return [
          DAY_LABELS[day],
          getSiteName(shift.siteId),
          formatShiftRange(shift.startMinutes, shift.endMinutes) +
            (shift.isEarlyLeave ? " (sale temprano)" : "") +
            tag,
        ];
      }),
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [207, 166, 112] },
      theme: "grid",
    });
  }

  return doc;
}
