"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save, SendHorizonal, CheckCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useSitesStore } from "@/stores/useSitesStore";
import { useScheduleStore } from "@/stores/useScheduleStore";
import type { Employee, ScheduleOption } from "@/types";

interface SaveSendMenuProps {
  option: ScheduleOption;
  employees: Employee[];
}

export function SaveSendMenu({ option, employees }: SaveSendMenuProps) {
  const [isSending, setIsSending] = useState(false);
  const sites = useSitesStore((s) => s.sites);
  const isSaving = useScheduleStore((s) => s.isSaving);
  const saveActiveOption = useScheduleStore((s) => s.saveActiveOption);

  async function sendToDrive() {
    const toastId = toast.loading("Enviando horario a Google Drive…");
    try {
      const response = await fetch("/api/export/drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option, employees, sites }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo enviar el horario.");
      toast.success("Horario enviado a Drive.", {
        id: toastId,
        action: { label: "Abrir carpeta", onClick: () => window.open(data.folderUrl, "_blank") },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo enviar el horario.", { id: toastId });
    }
  }

  async function handleSave() {
    try {
      await saveActiveOption();
      toast.success("Horario guardado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el horario.");
    }
  }

  async function handleSend() {
    setIsSending(true);
    try {
      await sendToDrive();
    } finally {
      setIsSending(false);
    }
  }

  async function handleSaveAndSend() {
    setIsSending(true);
    try {
      await saveActiveOption();
      await sendToDrive();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el horario.");
    } finally {
      setIsSending(false);
    }
  }

  const isBusy = isSaving || isSending;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="sm" disabled={isBusy} />}>
        <Save className="size-3.5" />
        {isBusy ? "Procesando…" : "Guardar"}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleSave}>
          <Save className="size-4" />
          Guardar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSend}>
          <SendHorizonal className="size-4" />
          Enviar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSaveAndSend}>
          <CheckCheck className="size-4" />
          Guardar y enviar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
