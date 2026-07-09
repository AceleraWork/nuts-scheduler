"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SKILL_LABELS } from "@/components/employees/SkillTag";
import { useEmployeesStore } from "@/stores/useEmployeesStore";
import { useSitesStore } from "@/stores/useSitesStore";
import { useScheduleStore } from "@/stores/useScheduleStore";
import type { Area, Employee, EmployeeStatus, Gender, SiteId, SkillName } from "@/types";

const KITCHEN_SKILLS: SkillName[] = ["salado", "dulce"];
const SERVICE_SKILLS: SkillName[] = ["apertura", "cafe", "rappi", "cierre"];

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function EmployeeCreateDialog() {
  const [open, setOpen] = useState(false);
  const addEmployee = useEmployeesStore((s) => s.addEmployee);
  const sites = useSitesStore((s) => s.sites);
  const regenerate = useScheduleStore((s) => s.regenerate);

  const [name, setName] = useState("");
  const [area, setArea] = useState<Area>("cocina");
  const [gender, setGender] = useState<Gender>("female");
  const [status, setStatus] = useState<EmployeeStatus>("activo");
  const [allowedSiteIds, setAllowedSiteIds] = useState<SiteId[]>([]);
  const [skills, setSkills] = useState<SkillName[]>([]);
  const [rotates, setRotates] = useState(false);
  const [canOpenAlone, setCanOpenAlone] = useState(true);
  const [canCloseAlone, setCanCloseAlone] = useState(true);

  const availableSkills = area === "cocina" ? KITCHEN_SKILLS : SERVICE_SKILLS;

  function toggleSite(siteId: SiteId) {
    setAllowedSiteIds((prev) =>
      prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]
    );
  }

  function toggleSkill(skill: SkillName) {
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  }

  function handleAreaChange(nextArea: Area) {
    setArea(nextArea);
    setSkills([]);
  }

  function resetForm() {
    setName("");
    setArea("cocina");
    setGender("female");
    setStatus("activo");
    setAllowedSiteIds([]);
    setSkills([]);
    setRotates(false);
    setCanOpenAlone(true);
    setCanCloseAlone(true);
  }

  async function handleSave() {
    if (!name.trim() || allowedSiteIds.length === 0 || skills.length === 0) return;
    const employee: Employee = {
      id: `emp-${slugify(name)}-${Date.now().toString(36)}`,
      name: name.trim(),
      area,
      status,
      gender,
      skills: skills.map((skill) => ({ skill, level: "competente" })),
      allowedSiteIds,
      rotates,
      canOpenAlone,
      canCloseAlone,
      active: true,
    };
    await addEmployee(employee);
    await regenerate();
    resetForm();
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <UserPlus className="size-3.5" />
        Nuevo empleado
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo empleado</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-1">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Camila" />
          </div>

          <div className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <Label>Área</Label>
              <Select value={area} onValueChange={(v) => handleAreaChange(v as Area)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cocina">Cocina</SelectItem>
                  <SelectItem value="servicio">Servicio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Género</Label>
              <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Femenino</SelectItem>
                  <SelectItem value="male">Masculino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
            <Label>Habilidades</Label>
            <div className="flex flex-col gap-2">
              {availableSkills.map((skill) => (
                <label key={skill} className="flex items-center justify-between gap-2 text-sm">
                  <span>{SKILL_LABELS[skill]}</span>
                  <Switch checked={skills.includes(skill)} onCheckedChange={() => toggleSkill(skill)} />
                </label>
              ))}
            </div>
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
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || allowedSiteIds.length === 0 || skills.length === 0}
          >
            Crear empleado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
