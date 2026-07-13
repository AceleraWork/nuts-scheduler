"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Area } from "@/types";

export type CategoryFilter = Area | "todas";

interface CategoryFilterSelectProps {
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
}

const LABELS: Record<CategoryFilter, string> = {
  todas: "Categoría Empleado: Todas",
  cocina: "Categoría Empleado: Cocina",
  servicio: "Categoría Empleado: Servicio",
  admin: "Categoría Empleado: Admin",
  planta: "Categoría Empleado: Planta",
};

export function CategoryFilterSelect({ value, onChange }: CategoryFilterSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as CategoryFilter)}>
      <SelectTrigger size="sm" className="w-56">
        <SelectValue>{LABELS[value]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todas">Todas</SelectItem>
        <SelectItem value="cocina">Cocina</SelectItem>
        <SelectItem value="servicio">Servicio</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="planta">Planta</SelectItem>
      </SelectContent>
    </Select>
  );
}
