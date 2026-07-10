"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileText, FileSpreadsheet, Mail } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { buildSchedulePdf } from "@/lib/export/buildPdf";
import { buildScheduleExcel } from "@/lib/export/buildExcel";
import type { Employee, ScheduleOption } from "@/types";

interface DownloadMenuProps {
  option: ScheduleOption;
  employees: Employee[];
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function DownloadMenu({ option, employees }: DownloadMenuProps) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExportPdf() {
    setIsExporting(true);
    try {
      const doc = buildSchedulePdf(option, employees);
      downloadBlob(doc.output("blob"), `horario-${option.id}-${option.weekStartDate}.pdf`);
      toast.success("PDF descargado.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleExportExcel() {
    setIsExporting(true);
    try {
      const buffer = await buildScheduleExcel(option, employees);
      downloadBlob(
        new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        `horario-${option.id}-${option.weekStartDate}.xlsx`
      );
      toast.success("Excel descargado.");
    } finally {
      setIsExporting(false);
    }
  }

  function handleSendEmail() {
    toast.info("Enviar por correo estará disponible próximamente.");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="sm" variant="outline" disabled={isExporting} />}>
        <Download className="size-3.5" />
        Descargar
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPdf}>
          <FileText className="size-4" />
          Descargar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportExcel}>
          <FileSpreadsheet className="size-4" />
          Descargar Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSendEmail}>
          <Mail className="size-4" />
          Enviar por correo (próximamente)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
