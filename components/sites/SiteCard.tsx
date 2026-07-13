"use client";

import { useMemo } from "react";
import { Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmployeeAvatar } from "@/components/employees/EmployeeAvatar";
import { useEmployeesStore } from "@/stores/useEmployeesStore";
import { useSitesStore } from "@/stores/useSitesStore";
import type { Site } from "@/types";

const NO_MANAGER = "__none__";

interface SiteCardProps {
  site: Site;
}

export function SiteCard({ site }: SiteCardProps) {
  const employees = useEmployeesStore((s) => s.employees);
  const updateSite = useSitesStore((s) => s.updateSite);
  const manager = useMemo(
    () => employees.find((e) => e.id === site.managerId),
    [employees, site.managerId]
  );

  async function handleManagerChange(value: string | null) {
    await updateSite({ ...site, managerId: !value || value === NO_MANAGER ? undefined : value });
  }

  return (
    <Card className="gap-3 py-4 ring-border">
      <div className="flex items-center gap-3 px-4">
        {manager ? (
          <EmployeeAvatar gender={manager.gender} className="size-11" />
        ) : (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-soft text-ink-faint">
            <Building2 className="size-5" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-display text-sm text-ink truncate">{site.name}</h3>
          <p className="label-caps text-ink-mute">{manager ? manager.name : "Sin encargado"}</p>
        </div>
      </div>

      <div className="space-y-1.5 px-4">
        <p className="label-caps text-ink-faint">Encargado</p>
        <Select value={site.managerId ?? NO_MANAGER} onValueChange={handleManagerChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_MANAGER}>Sin encargado</SelectItem>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {site.notes && site.notes.length > 0 && (
        <div className="space-y-1 px-4">
          <p className="label-caps text-ink-faint">Notas</p>
          <p className="text-sm text-ink-soft">{site.notes.join(" · ")}</p>
        </div>
      )}
    </Card>
  );
}
