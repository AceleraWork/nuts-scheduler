"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSitesStore } from "@/stores/useSitesStore";
import { minutesToHHMM, hhmmToMinutes } from "@/lib/time/formatTime";
import { useScheduleStore } from "@/stores/useScheduleStore";
import type { Shift, ScheduleOptionId, SiteId } from "@/types";

interface ShiftEditPopoverProps {
  shift: Shift;
  optionId: ScheduleOptionId;
  children: React.ReactNode;
}

export function ShiftEditPopover({ shift, optionId, children }: ShiftEditPopoverProps) {
  const [open, setOpen] = useState(false);
  const updateShift = useScheduleStore((s) => s.updateShift);
  const sites = useSitesStore((s) => s.sites);

  const [isDayOff, setIsDayOff] = useState(shift.isDayOff ?? false);
  const [siteId, setSiteId] = useState<SiteId>(shift.siteId);
  const [start, setStart] = useState(minutesToHHMM(shift.startMinutes || 7 * 60));
  const [end, setEnd] = useState(minutesToHHMM(shift.endMinutes || 16 * 60));
  const [isEarlyLeave, setIsEarlyLeave] = useState(shift.isEarlyLeave ?? false);

  function handleOpenChange(next: boolean) {
    if (next) {
      setIsDayOff(shift.isDayOff ?? false);
      setSiteId(shift.siteId);
      setStart(minutesToHHMM(shift.startMinutes || 7 * 60));
      setEnd(minutesToHHMM(shift.endMinutes || 16 * 60));
      setIsEarlyLeave(shift.isEarlyLeave ?? false);
    }
    setOpen(next);
  }

  function handleSave() {
    updateShift(optionId, shift.id, {
      isDayOff,
      siteId,
      startMinutes: isDayOff ? 0 : hhmmToMinutes(start),
      endMinutes: isDayOff ? 0 : hhmmToMinutes(end),
      isEarlyLeave: isDayOff ? false : isEarlyLeave,
    });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger render={<button type="button" className="block w-full text-left" />}>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <PopoverHeader>
          <PopoverTitle>Editar turno</PopoverTitle>
        </PopoverHeader>

        <div className="flex items-center justify-between gap-2">
          <Label>Descanso</Label>
          <Switch checked={isDayOff} onCheckedChange={setIsDayOff} />
        </div>

        {!isDayOff && (
          <>
            <div className="space-y-1.5">
              <Label>Sede</Label>
              <Select value={siteId} onValueChange={(v) => setSiteId(v as SiteId)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
                <Label>Entrada</Label>
                <input
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full rounded-lg border border-input bg-transparent px-2 py-1.5 text-sm"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label>Salida</Label>
                <input
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full rounded-lg border border-input bg-transparent px-2 py-1.5 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Label>Salida temprana</Label>
              <Switch checked={isEarlyLeave} onCheckedChange={setIsEarlyLeave} />
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave}>
            Guardar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
