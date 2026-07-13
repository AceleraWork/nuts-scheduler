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
import { useLeavesStore } from "@/stores/useLeavesStore";
import { useScheduleStore } from "@/stores/useScheduleStore";
import type { Employee } from "@/types";

interface EmployeeLeaveDialogProps {
  employee: Employee | null;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_COLOR = "#c0788a";

export function EmployeeLeaveDialog({ employee, onOpenChange }: EmployeeLeaveDialogProps) {
  const addLeave = useLeavesStore((s) => s.addLeave);
  const regenerate = useScheduleStore((s) => s.regenerate);

  const [label, setLabel] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);

  function resetForm() {
    setLabel("");
    setStartDate("");
    setEndDate("");
    setColor(DEFAULT_COLOR);
  }

  async function handleSave() {
    if (!employee || !label.trim() || !startDate || !endDate) return;
    await addLeave({
      id: `leave-${Date.now()}`,
      employeeId: employee.id,
      label: label.trim(),
      startDate,
      endDate,
      color,
      createdAt: new Date().toISOString(),
    });
    await regenerate();
    resetForm();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={employee !== null}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva incapacidad — {employee?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-1">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej. Licencia de maternidad"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <Label>Fecha inicio</Label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-input bg-transparent px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Fecha fin</Label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-input bg-transparent px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-16 rounded-lg border border-input bg-transparent p-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!label.trim() || !startDate || !endDate}>
            Crear incapacidad
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
