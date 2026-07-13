"use client";

import { useState } from "react";
import { GraduationCap } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTrainingsStore } from "@/stores/useTrainingsStore";
import { useEmployeesStore } from "@/stores/useEmployeesStore";
import { useSitesStore } from "@/stores/useSitesStore";
import { useScheduleStore } from "@/stores/useScheduleStore";
import { hhmmToMinutes } from "@/lib/time/formatTime";
import type { SiteId } from "@/types";

const NONE = "__none__";

export function TrainingEventDialog() {
  const [open, setOpen] = useState(false);
  const employees = useEmployeesStore((s) => s.employees);
  const sites = useSitesStore((s) => s.sites);
  const addTrainingEvent = useTrainingsStore((s) => s.addTrainingEvent);
  const options = useScheduleStore((s) => s.options);
  const revalidate = useScheduleStore((s) => s.revalidate);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("11:00");
  const [siteId, setSiteId] = useState<SiteId | typeof NONE>(NONE);
  const [attendees, setAttendees] = useState<string[]>([]);
  const [justifiedAbsences, setJustifiedAbsences] = useState<string[]>([]);

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  function toggleAll(list: string[], setList: (v: string[]) => void) {
    setList(list.length === employees.length ? [] : employees.map((e) => e.id));
  }

  function resetForm() {
    setTitle("");
    setDate("");
    setStart("09:00");
    setEnd("11:00");
    setSiteId(NONE);
    setAttendees([]);
    setJustifiedAbsences([]);
  }

  async function handleSave() {
    if (!title.trim() || !date) return;
    await addTrainingEvent({
      id: `training-${Date.now()}`,
      title: title.trim(),
      date,
      startMinutes: hhmmToMinutes(start),
      endMinutes: hhmmToMinutes(end),
      attendeeEmployeeIds: attendees,
      justifiedAbsenceEmployeeIds: justifiedAbsences,
      siteId: siteId === NONE ? undefined : siteId,
    });
    await Promise.all(options.map((option) => revalidate(option.id)));
    resetForm();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <GraduationCap className="size-3.5" />
        Nueva capacitación
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva capacitación</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-1">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Manejo de caja" />
          </div>

          <div className="space-y-1.5">
            <Label>Sede</Label>
            <Select value={siteId} onValueChange={(v) => setSiteId(v as SiteId | typeof NONE)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: SiteId | typeof NONE) =>
                    v === NONE ? "Sin sede" : (sites.find((s) => s.id === v)?.name ?? v)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin sede</SelectItem>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <Label>Fecha</Label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-input bg-transparent px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Inicio</Label>
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-lg border border-input bg-transparent px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Fin</Label>
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded-lg border border-input bg-transparent px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label>Asistentes</Label>
              <label className="flex items-center gap-1.5 text-xs text-ink-mute">
                <span>Seleccionar todos</span>
                <Switch
                  checked={employees.length > 0 && attendees.length === employees.length}
                  onCheckedChange={() => toggleAll(attendees, setAttendees)}
                />
              </label>
            </div>
            <ScrollArea className="h-32 rounded-lg border border-border">
              <div className="flex flex-col gap-1.5 p-2">
                {employees.map((employee) => (
                  <label key={employee.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>{employee.name}</span>
                    <Switch
                      checked={attendees.includes(employee.id)}
                      onCheckedChange={() => toggle(attendees, setAttendees, employee.id)}
                    />
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label>Ausentes justificados</Label>
              <label className="flex items-center gap-1.5 text-xs text-ink-mute">
                <span>Seleccionar todos</span>
                <Switch
                  checked={employees.length > 0 && justifiedAbsences.length === employees.length}
                  onCheckedChange={() => toggleAll(justifiedAbsences, setJustifiedAbsences)}
                />
              </label>
            </div>
            <ScrollArea className="h-32 rounded-lg border border-border">
              <div className="flex flex-col gap-1.5 p-2">
                {employees.map((employee) => (
                  <label key={employee.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>{employee.name}</span>
                    <Switch
                      checked={justifiedAbsences.includes(employee.id)}
                      onCheckedChange={() => toggle(justifiedAbsences, setJustifiedAbsences, employee.id)}
                    />
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || !date}>
            Crear capacitación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
