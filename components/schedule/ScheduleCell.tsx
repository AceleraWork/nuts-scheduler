"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { ShiftBlock } from "@/components/schedule/ShiftBlock";
import { ShiftEditPopover } from "@/components/schedule/ShiftEditPopover";
import { TrainingIndicator } from "@/components/schedule/TrainingIndicator";
import { HolidayIndicator } from "@/components/schedule/HolidayIndicator";
import type { Shift, ScheduleOptionId, TrainingEvent, PublicHoliday } from "@/types";
import type { SiteFilter } from "@/components/schedule/SiteFilterTabs";

interface ScheduleCellProps {
  shift: Shift | undefined;
  siteFilter: SiteFilter;
  optionId: ScheduleOptionId;
  draggable: boolean;
  training?: TrainingEvent;
  holiday?: PublicHoliday;
}

export function ScheduleCell({ shift, siteFilter, optionId, draggable, training, holiday }: ScheduleCellProps) {
  const droppable = useDroppable({ id: shift?.id ?? "empty", disabled: !draggable || !shift });
  const draggableState = useDraggable({ id: shift?.id ?? "empty", disabled: !draggable || !shift });

  if (!shift) {
    return <div className="min-h-16 rounded-lg border border-dashed border-border/50" />;
  }

  const isHiddenByFilter =
    !shift.isDayOff && siteFilter !== "todas" && shift.siteId !== siteFilter;

  if (isHiddenByFilter) {
    return (
      <div className="flex min-h-16 items-center justify-center rounded-lg border border-border/40 text-[0.6875rem] text-ink-faint">
        Otra sede
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={droppable.setNodeRef}
        className={cn(
          "rounded-lg transition-shadow",
          droppable.isOver && "ring-2 ring-gold ring-offset-1 ring-offset-canvas"
        )}
      >
        <div
          ref={draggableState.setNodeRef}
          {...draggableState.listeners}
          {...draggableState.attributes}
          className={cn(draggable && "cursor-grab active:cursor-grabbing", draggableState.isDragging && "opacity-40")}
        >
          <ShiftEditPopover shift={shift} optionId={optionId}>
            <ShiftBlock shift={shift} />
          </ShiftEditPopover>
        </div>
      </div>
      {(holiday || training) && (
        <div className="absolute inset-x-1 top-0.5 flex flex-col gap-0.5">
          {holiday && <HolidayIndicator holiday={holiday} />}
          {training && <TrainingIndicator training={training} />}
        </div>
      )}
    </div>
  );
}
