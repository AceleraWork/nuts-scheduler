"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEmployeesStore } from "@/stores/useEmployeesStore";
import { useSitesStore } from "@/stores/useSitesStore";
import type { Employee, EmployeeStatus, SiteId } from "@/types";

interface EmployeeEditDialogProps {
  employee: Employee | null;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeEditDialog({ employee, onOpenChange }: EmployeeEditDialogProps) {
  const updateEmployee = useEmployeesStore((s) => s.updateEmployee);
  const sites = useSitesStore((s) => s.sites);
  const [status, setStatus] = useState<EmployeeStatus>("activo");
  const [allowedSiteIds, setAllowedSiteIds] = useState<SiteId[]>([]);
  const [rotates, setRotates] = useState(false);
  const [canOpenAlone, setCanOpenAlone] = useState(false);
  const [canCloseAlone, setCanCloseAlone] = useState(false);

  useEffect(() => {
    if (employee) {
      setStatus(employee.status);
      setAllowedSiteIds(employee.allowedSiteIds);
      setRotates(employee.rotates);
      setCanOpenAlone(employee.canOpenAlone);
      setCanCloseAlone(employee.canCloseAlone);
    }
  }, [employee]);

  function toggleSite(siteId: SiteId) {
    setAllowedSiteIds((prev) =>
      prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]
    );
  }

  async function handleSave() {
    if (!employee) return;
    await updateEmployee(employee.id, { status, allowedSiteIds, rotates, canOpenAlone, canCloseAlone });
    onOpenChange(false);
  }

  return (
    <Dialog open={employee !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar a {employee?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-1">
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as EmployeeStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="onboarding">Nuevo (onboarding)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Sedes permitidas</Label>
            <div className="flex flex-col gap-2">
              {sites.map((site) => (
                <label key={site.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>{site.name}</span>
                  <Switch
                    checked={allowedSiteIds.includes(site.id)}
                    onCheckedChange={() => toggleSite(site.id)}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Label>Rota entre sedes</Label>
            <Switch checked={rotates} onCheckedChange={setRotates} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label>Puede abrir sola</Label>
            <Switch checked={canOpenAlone} onCheckedChange={setCanOpenAlone} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label>Puede cerrar sola</Label>
            <Switch checked={canCloseAlone} onCheckedChange={setCanCloseAlone} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
