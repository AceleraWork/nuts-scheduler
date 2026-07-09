"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useScheduleStore } from "@/stores/useScheduleStore";
import type { ScheduleOptionId } from "@/types";

export function ScheduleOptionTabs() {
  const options = useScheduleStore((s) => s.options);
  const activeOptionId = useScheduleStore((s) => s.activeOptionId);
  const setActiveOptionId = useScheduleStore((s) => s.setActiveOptionId);

  return (
    <Tabs
      value={activeOptionId}
      onValueChange={(v) => setActiveOptionId(v as ScheduleOptionId)}
    >
      <TabsList>
        {options.map((option) => (
          <TabsTrigger key={option.id} value={option.id}>
            Opción {option.id}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
