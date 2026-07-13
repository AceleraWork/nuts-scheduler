"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatWeekHeaderEs } from "@/lib/time/week";
import { useScheduleStore } from "@/stores/useScheduleStore";

interface WeekNavHeaderProps {
  leftSlot?: React.ReactNode;
}

export function WeekNavHeader({ leftSlot }: WeekNavHeaderProps) {
  const weekStartDate = useScheduleStore((s) => s.weekStartDate);
  const isLoadingWeek = useScheduleStore((s) => s.isLoadingWeek);
  const goToPreviousWeek = useScheduleStore((s) => s.goToPreviousWeek);
  const goToNextWeek = useScheduleStore((s) => s.goToNextWeek);

  return (
    <div className="grid grid-cols-3 items-center py-1">
      <div className="flex justify-start">{leftSlot}</div>
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Semana anterior"
          onClick={goToPreviousWeek}
          disabled={isLoadingWeek}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <p className="label-caps flex items-center gap-2 text-ink-mute">
          {isLoadingWeek && <Loader2 className="size-3 animate-spin" />}
          {formatWeekHeaderEs(weekStartDate)}
        </p>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Semana siguiente"
          onClick={goToNextWeek}
          disabled={isLoadingWeek}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <div />
    </div>
  );
}
