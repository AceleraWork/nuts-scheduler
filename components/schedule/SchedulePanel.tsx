"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Sparkles } from "lucide-react";
import { PanelHeader } from "@/components/layout/PanelHeader";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScheduleOptionTabs } from "@/components/schedule/ScheduleOptionTabs";
import { SiteFilterTabs, type SiteFilter } from "@/components/schedule/SiteFilterTabs";
import { CategoryFilterSelect, type CategoryFilter } from "@/components/schedule/CategoryFilterSelect";
import { ScheduleGrid } from "@/components/schedule/ScheduleGrid";
import { ScheduleSummaryFooter } from "@/components/schedule/ScheduleSummaryFooter";
import { WeekNavHeader } from "@/components/schedule/WeekNavHeader";
import { EmptyWeekState } from "@/components/schedule/EmptyWeekState";
import { SaveSendMenu } from "@/components/export/SaveSendMenu";
import { DownloadMenu } from "@/components/export/DownloadMenu";
import { useScheduleStore, selectActiveOption } from "@/stores/useScheduleStore";
import { useEmployeesStore } from "@/stores/useEmployeesStore";

export function SchedulePanel() {
  const activeOption = useScheduleStore(selectActiveOption);
  const isGenerating = useScheduleStore((s) => s.isGenerating);
  const isLoadingWeek = useScheduleStore((s) => s.isLoadingWeek);
  const regenerate = useScheduleStore((s) => s.regenerate);
  const employees = useEmployeesStore((s) => s.employees);
  const [siteFilter, setSiteFilter] = useState<SiteFilter>("todas");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("todas");

  const sortedEmployees = useMemo(
    () =>
      employees
        .filter((e) => e.active)
        .filter((e) => categoryFilter === "todas" || e.area === categoryFilter)
        .sort((a, b) => a.area.localeCompare(b.area) || a.name.localeCompare(b.name)),
    [employees, categoryFilter]
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
        <div className="flex items-center gap-2">
          <span className="label-caps text-ink-mute">Sede:</span>
          <SiteFilterTabs value={siteFilter} onChange={setSiteFilter} />
        </div>
        <div className="flex items-center gap-2">
          {activeOption && (
            <>
              <DownloadMenu option={activeOption} employees={sortedEmployees} />
              <SaveSendMenu option={activeOption} employees={sortedEmployees} />
            </>
          )}
          <Button size="sm" onClick={regenerate} disabled={isGenerating || isLoadingWeek}>
            <Sparkles className="size-3.5" />
            {isGenerating ? "Generando…" : "Generar horarios"}
          </Button>
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-4">
          {activeOption && <ScheduleSummaryFooter option={activeOption} />}
          <WeekNavHeader
            leftSlot={<CategoryFilterSelect value={categoryFilter} onChange={setCategoryFilter} />}
          />
          {activeOption ? (
            <ScheduleGrid employees={sortedEmployees} option={activeOption} siteFilter={siteFilter} />
          ) : (
            <EmptyWeekState />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
