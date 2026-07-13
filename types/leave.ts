export interface EmployeeLeave {
  id: string;
  employeeId: string;
  /** Nombre libre, ej. "Licencia de maternidad", "Incapacidad médica", "Permiso de viaje". */
  label: string;
  /** Fecha ISO, inclusiva. */
  startDate: string;
  /** Fecha ISO, inclusiva. */
  endDate: string;
  /** Color hex elegido para mostrar esta incapacidad en el horario. */
  color: string;
  createdAt: string;
}
