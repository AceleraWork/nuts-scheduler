"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Sparkles } from "lucide-react";
import { PanelHeader } from "@/components/layout/PanelHeader";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScheduleOptionTabs } from "@/components/schedule/ScheduleOptionTabs";
import { SiteFilterTabs, type SiteFilter } from "@/components/schedule/SiteFilterTabs";
import { ScheduleGrid } from "@/components/schedule/ScheduleGrid";
import { ScheduleSummaryFooter } from "@/components/schedule/ScheduleSummaryFooter";
import { ScheduleWarningsBar } from "@/components/schedule/ScheduleWarningsBar";
import { ExportButton } from "@/components/export/ExportButton";
import { useScheduleStore, selectActiveOption } from "@/stores/useScheduleStore";
import { useEmployeesStore } from "@/stores/useEmployeesStore";

export function SchedulePanel() {
  const activeOption = useScheduleStore(selectActiveOption);
  const isGenerating = useScheduleStore((s) => s.isGenerating);
  const regenerate = useScheduleStore((s) => s.regenerate);
  const employees = useEmployeesStore((s) => s.employees);
  const [siteFilter, setSiteFilter] = useState<SiteFilter>("todas");

  const sortedEmployees = useMemo(
    () => [...employees].sort((a, b) => a.area.localeCompare(b.area) || a.name.localeCompare(b.name)),
    [employees]
  );

  return (
    <div className="flex h-full flex-col">
      <PanelHeader
        icon={CalendarDays}
        title="Horarios"
        subtitle="Opciones A · B · C"
        action={<ScheduleOptionTabs />}
      />
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <SiteFilterTabs value={siteFilter} onChange={setSiteFilter} />
        <div className="flex items-center gap-2">
          {activeOption && <ExportButton option={activeOption} employees={sortedEmployees} />}
          <Button size="sm" onClick={regenerate} disabled={isGenerating}>
            <Sparkles className="size-3.5" />
            {isGenerating ? "Generando…" : "Generar horarios"}
          </Button>
        </div>
      </div>
      <ScrollArea className="h-full flex-1">
        <div className="space-y-4 p-4">
          {activeOption && (
            <>
              <ScheduleSummaryFooter option={activeOption} />
              <ScheduleWarningsBar violations={activeOption.violations} />
              <ScheduleGrid employees={sortedEmployees} option={activeOption} siteFilter={siteFilter} />
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
