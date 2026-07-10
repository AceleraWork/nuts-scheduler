import ExcelJS from "exceljs";
import { DAYS_OF_WEEK, DAY_LABELS } from "@/types";
import type { Employee, ScheduleOption, HoursIndicator } from "@/types";
import { getEmployeeWeeklyHours, getHoursIndicator } from "@/lib/solver/hours";
import { shiftCellText } from "@/lib/export/scheduleRows";

const INDICATOR_FILL: Record<HoursIndicator, string> = {
  green: "FFE5F0DF",
  yellow: "FFFBF0D9",
  red: "FFFBE4E1",
};
const INDICATOR_FONT: Record<HoursIndicator, string> = {
  green: "FF3F6B2E",
  yellow: "FF8A6414",
  red: "FFB4302C",
};

export async function buildScheduleExcel(option: ScheduleOption, employees: Employee[]): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Nuts About You — Horarios";
  const sheet = workbook.addWorksheet(option.label.slice(0, 31));

  sheet.columns = [
    { header: "Empleado", key: "employee", width: 20 },
    ...DAYS_OF_WEEK.map((day) => ({ header: DAY_LABELS[day], key: day, width: 18 })),
    { header: "Horas", key: "hours", width: 12 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFCFA670" } };

  for (const employee of employees) {
    const hours = getEmployeeWeeklyHours(option.shifts, employee.id);
    const indicator = getHoursIndicator(hours);
    const rowValues: Record<string, string | number> = { employee: employee.name, hours };
    for (const day of DAYS_OF_WEEK) {
      rowValues[day] = shiftCellText(option, employee.id, day);
    }
    const row = sheet.addRow(rowValues);
    const hoursCell = row.getCell("hours");
    hoursCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: INDICATOR_FILL[indicator] } };
    hoursCell.font = { color: { argb: INDICATOR_FONT[indicator] }, bold: true };
  }

  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FFEAE0C8" } },
        bottom: { style: "thin", color: { argb: "FFEAE0C8" } },
        left: { style: "thin", color: { argb: "FFEAE0C8" } },
        right: { style: "thin", color: { argb: "FFEAE0C8" } },
      };
    });
  });

  return workbook.xlsx.writeBuffer();
}
