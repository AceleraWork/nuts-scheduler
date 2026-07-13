"use client";

import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSitesStore } from "@/stores/useSitesStore";
import { DAYS_OF_WEEK, DAY_LABELS } from "@/types";
import type { DayOfWeek, Site } from "@/types";

interface SiteCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function SiteCreateDialog({ open, onOpenChange }: SiteCreateDialogProps) {
  const addSite = useSitesStore((s) => s.addSite);
  const [name, setName] = useState("");
  const [volume, setVolume] = useState<Site["volume"]>("bajo");
  const [priorityDays, setPriorityDays] = useState<DayOfWeek[]>([]);

  function toggleDay(day: DayOfWeek) {
    setPriorityDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function resetForm() {
    setName("");
    setVolume("bajo");
    setPriorityDays([]);
  }

  async function handleSave() {
    if (!name.trim()) return;
    const site: Site = {
      id: slugify(name),
      name: name.trim(),
      volume,
      priorityDays,
    };
    await addSite(site);
    resetForm();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva sede</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-1">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Planta" />
          </div>

          <div className="space-y-1.5">
            <Label>Volumen</Label>
            <Select value={volume} onValueChange={(v) => setVolume(v as Site["volume"])}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alto">Alto</SelectItem>
                <SelectItem value="bajo">Bajo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Días prioritarios</Label>
            <div className="flex flex-col gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <label key={day} className="flex items-center justify-between gap-2 text-sm">
                  <span>{DAY_LABELS[day]}</span>
                  <Switch checked={priorityDays.includes(day)} onCheckedChange={() => toggleDay(day)} />
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Crear sede
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
