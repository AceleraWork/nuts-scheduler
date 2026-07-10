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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useConstraintsStore } from "@/stores/useConstraintsStore";
import { useScheduleStore } from "@/stores/useScheduleStore";
import { formatHour12, hhmmToMinutes, minutesToHHMM, parseHour12 } from "@/lib/time/formatTime";
import {
  HARD_CONSTRAINT_TYPES,
  HARD_CONSTRAINT_LABELS,
  SOFT_CONSTRAINT_TYPES,
  SOFT_CONSTRAINT_LABELS,
  TYPES_WITH_DAYS_PARAM,
  TYPES_WITH_SINGLE_DAY_FIELD,
  TYPES_WITH_SITE_FIELD,
  CUSTOM_TYPES,
} from "@/lib/constraints/labels";
import { DAYS_OF_WEEK, DAY_LABELS } from "@/types";
import type {
  HardConstraint,
  SoftConstraint,
  HardConstraintType,
  SoftConstraintType,
  DayOfWeek,
  SiteId,
} from "@/types";

const DEFAULT_LEAVE_BY = "1PM";

interface ConstraintFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: "hard" | "soft";
  editing?: HardConstraint | SoftConstraint | null;
}

let constraintIdCounter = 0;
function nextConstraintId(kind: "hard" | "soft"): string {
  constraintIdCounter += 1;
  return `${kind === "hard" ? "hc" : "sc"}-manual-${Date.now().toString(36)}-${constraintIdCounter}`;
}

export function ConstraintFormDialog({
  open,
  onOpenChange,
  kind,
  editing,
}: ConstraintFormDialogProps) {
  const employees = useEmployeesStore((s) => s.employees);
  const sites = useSitesStore((s) => s.sites);
  const addHardConstraint = useConstraintsStore((s) => s.addHardConstraint);
  const addSoftConstraint = useConstraintsStore((s) => s.addSoftConstraint);
  const updateHardConstraint = useConstraintsStore((s) => s.updateHardConstraint);
  const updateSoftConstraint = useConstraintsStore((s) => s.updateSoftConstraint);
  const regenerate = useScheduleStore((s) => s.regenerate);

  const [type, setType] = useState<HardConstraintType | SoftConstraintType>(
    kind === "hard" ? HARD_CONSTRAINT_TYPES[0] : SOFT_CONSTRAINT_TYPES[0]
  );
  const [description, setDescription] = useState("");
  const [employeeIds, setEmployeeIds] = useState<string[]>([]);
  const [siteIds, setSiteIds] = useState<SiteId[]>([]);
  const [days, setDays] = useState<DayOfWeek[]>([]);
  const [minHeadcount, setMinHeadcount] = useState(2);
  const [area, setArea] = useState<"cocina" | "servicio">("servicio");
  const [targetHours, setTargetHours] = useState(44);
  const [allowOvertime, setAllowOvertime] = useState(false);
  const [leaveByHHMM, setLeaveByHHMM] = useState(minutesToHHMM(parseHour12(DEFAULT_LEAVE_BY)));
  const [customLabel, setCustomLabel] = useState("");
  const [weight, setWeight] = useState(5);
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setDescription(editing.description);
      setEmployeeIds(editing.employeeIds ?? []);
      setSiteIds(editing.siteId ? [editing.siteId] : []);
      setDays(editing.day ? [editing.day] : ((editing.params?.days as DayOfWeek[]) ?? []));
      setMinHeadcount((editing.params?.minHeadcount as number) ?? 2);
      setArea((editing.params?.area as "cocina" | "servicio") ?? "servicio");
      setTargetHours((editing.params?.targetHours as number) ?? 44);
      setAllowOvertime(Boolean(editing.params?.allowOvertime));
      setLeaveByHHMM(minutesToHHMM(parseHour12((editing.params?.leaveBy as string) ?? DEFAULT_LEAVE_BY)));
      setCustomLabel((editing.params?.customLabel as string) ?? "");
      if ("weight" in editing) {
        setWeight(editing.weight);
        setEnabled(editing.enabled);
      }
    } else {
      setType(kind === "hard" ? HARD_CONSTRAINT_TYPES[0] : SOFT_CONSTRAINT_TYPES[0]);
      setDescription("");
      setEmployeeIds([]);
      setSiteIds([]);
      setDays([]);
      setMinHeadcount(2);
      setArea("servicio");
      setTargetHours(44);
      setAllowOvertime(false);
      setLeaveByHHMM(minutesToHHMM(parseHour12(DEFAULT_LEAVE_BY)));
      setCustomLabel("");
      setWeight(5);
      setEnabled(true);
    }
  }, [open, editing, kind]);

  function toggleEmployee(id: string) {
    setEmployeeIds((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));
  }

  function toggleDay(d: DayOfWeek) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  function toggleSite(id: SiteId) {
    setSiteIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAllSites() {
    setSiteIds((prev) => (prev.length === sites.length ? [] : sites.map((s) => s.id)));
  }

  const usesSiteField = TYPES_WITH_SITE_FIELD.includes(type);
  const usesSingleDayField = TYPES_WITH_SINGLE_DAY_FIELD.includes(type);
  const usesDaysParam = TYPES_WITH_DAYS_PARAM.includes(type);
  const isCustom = CUSTOM_TYPES.includes(type);
  const needsHeadcount = type === "site-reinforcement";
  const needsTargetHours = type === "target-weekly-hours";
  const needsLeaveBy = type === "early-leave-preference";

  function buildParams(): Record<string, unknown> | undefined {
    const params: Record<string, unknown> = {};
    if (usesDaysParam && days.length > 0) params.days = days;
    if (needsHeadcount) params.minHeadcount = minHeadcount;
    if (needsTargetHours) {
      params.area = area;
      params.targetHours = targetHours;
      params.allowOvertime = allowOvertime;
    }
    if (needsLeaveBy) params.leaveBy = formatHour12(hhmmToMinutes(leaveByHHMM));
    if (isCustom && customLabel.trim()) params.customLabel = customLabel.trim();
    return Object.keys(params).length > 0 ? params : undefined;
  }

  async function handleSave() {
    if (!description.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const base = {
          description: description.trim(),
          employeeIds: employeeIds.length > 0 ? employeeIds : undefined,
          siteId: siteIds[0] ?? undefined,
          day: usesSingleDayField ? (days[0] ?? undefined) : undefined,
          params: buildParams(),
        };
        if (kind === "hard") {
          await updateHardConstraint({
            ...(editing as HardConstraint),
            type: type as HardConstraintType,
            ...base,
          });
        } else {
          await updateSoftConstraint({
            ...(editing as SoftConstraint),
            type: type as SoftConstraintType,
            weight,
            enabled,
            ...base,
          });
        }
      } else {
        // Sede/día pueden generar varias constraints (una por sede y/o por día) cuando el
        // tipo los usa como campo singular — evita tener que migrar el modelo de datos a
        // arreglos para soportar "aplicar en ambas sedes" / "varios días" desde la UI.
        const siteCombos: (SiteId | undefined)[] =
          usesSiteField && siteIds.length > 0 ? siteIds : [siteIds[0] ?? undefined];
        const dayCombos: (DayOfWeek | undefined)[] =
          usesSingleDayField && days.length > 0 ? days : [days[0] ?? undefined];

        for (const site of siteCombos) {
          for (const day of dayCombos) {
            const base = {
              description: description.trim(),
              employeeIds: employeeIds.length > 0 ? employeeIds : undefined,
              siteId: site,
              day: usesSingleDayField ? day : undefined,
              params: buildParams(),
            };
            if (kind === "hard") {
              await addHardConstraint({
                id: nextConstraintId("hard"),
                type: type as HardConstraintType,
                source: "manual",
                createdAt: new Date().toISOString(),
                ...base,
              });
            } else {
              await addSoftConstraint({
                id: nextConstraintId("soft"),
                type: type as SoftConstraintType,
                source: "manual",
                createdAt: new Date().toISOString(),
                weight,
                enabled,
                ...base,
              });
            }
          }
        }
      }
      await regenerate();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  const typeOptions = kind === "hard" ? HARD_CONSTRAINT_TYPES : SOFT_CONSTRAINT_TYPES;
  const typeLabels = kind === "hard" ? HARD_CONSTRAINT_LABELS : SOFT_CONSTRAINT_LABELS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing
              ? `Editar ${kind === "hard" ? "restricción" : "preferencia"}`
              : `Nueva ${kind === "hard" ? "restricción dura" : "preferencia"}`}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto px-1">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as HardConstraintType | SoftConstraintType)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: HardConstraintType | SoftConstraintType) => typeLabels[v as keyof typeof typeLabels]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {typeLabels[t as keyof typeof typeLabels]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Moni no puede abrir sola los domingos."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Empleados</Label>
            <div className="flex flex-wrap gap-1.5">
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => toggleEmployee(emp.id)}
                  className={
                    "rounded-full border px-2.5 py-1 text-xs transition-colors " +
                    (employeeIds.includes(emp.id)
                      ? "border-gold/40 bg-gold-soft text-ink"
                      : "border-border text-ink-mute hover:text-ink")
                  }
                >
                  {emp.name}
                </button>
              ))}
            </div>
          </div>

          {isCustom && (
            <div className="space-y-1.5">
              <Label>Nombre de la regla</Label>
              <Input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Ej. No mezclar turnos con capacitación de proveedor"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Sedes (opcional)</Label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={toggleAllSites}
                className={
                  "rounded-full border px-2.5 py-1 text-xs transition-colors " +
                  (siteIds.length === sites.length && sites.length > 0
                    ? "border-gold/40 bg-gold-soft text-ink"
                    : "border-border text-ink-mute hover:text-ink")
                }
              >
                Ambas sedes
              </button>
              {sites.map((site) => (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => toggleSite(site.id)}
                  className={
                    "rounded-full border px-2.5 py-1 text-xs transition-colors " +
                    (siteIds.includes(site.id)
                      ? "border-gold/40 bg-gold-soft text-ink"
                      : "border-border text-ink-mute hover:text-ink")
                  }
                >
                  {site.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Días aplicables (opcional)</Label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS_OF_WEEK.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={
                    "rounded-full border px-2.5 py-1 text-xs transition-colors " +
                    (days.includes(d)
                      ? "border-gold/40 bg-gold-soft text-ink"
                      : "border-border text-ink-mute hover:text-ink")
                  }
                >
                  {DAY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          {needsLeaveBy && (
            <div className="space-y-1.5">
              <Label>Hora de salida</Label>
              <input
                type="time"
                value={leaveByHHMM}
                onChange={(e) => setLeaveByHHMM(e.target.value)}
                className="w-full rounded-lg border border-input bg-transparent px-2 py-1.5 text-sm"
              />
            </div>
          )}

          {needsHeadcount && (
            <div className="space-y-1.5">
              <Label>Personal mínimo requerido</Label>
              <Input
                type="number"
                min={1}
                value={minHeadcount}
                onChange={(e) => setMinHeadcount(Number(e.target.value))}
              />
            </div>
          )}

          {needsTargetHours && (
            <>
              <div className="flex gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label>Área</Label>
                  <Select value={area} onValueChange={(v) => setArea(v as "cocina" | "servicio")}>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v: "cocina" | "servicio") => (v === "cocina" ? "Cocina" : "Servicio")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cocina">Cocina</SelectItem>
                      <SelectItem value="servicio">Servicio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label>Horas objetivo</Label>
                  <Input
                    type="number"
                    min={1}
                    value={targetHours}
                    onChange={(e) => setTargetHours(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label>Permitir horas extra</Label>
                <Switch checked={allowOvertime} onCheckedChange={setAllowOvertime} />
              </div>
            </>
          )}

          {kind === "soft" && (
            <>
              <div className="space-y-1.5">
                <Label>Peso ({weight})</Label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label>Habilitada</Label>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!description.trim() || saving}>
            {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
