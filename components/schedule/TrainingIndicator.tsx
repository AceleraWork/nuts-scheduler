"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger, PopoverHeader, PopoverTitle } from "@/components/ui/popover";
import { formatShiftRange } from "@/lib/time/formatTime";
import { getSiteName } from "@/stores/useSitesStore";
import type { TrainingEvent } from "@/types";

interface TrainingIndicatorProps {
  training: TrainingEvent;
}

export function TrainingIndicator({ training }: TrainingIndicatorProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={`Capacitación: ${training.title}`}
            className="absolute inset-x-1 top-0.5 h-1.5 rounded-full bg-danger"
          />
        }
      />
      <PopoverContent className="w-56">
        <PopoverHeader>
          <PopoverTitle>{training.title}</PopoverTitle>
        </PopoverHeader>
        <p className="text-sm text-ink-mute">
          {formatShiftRange(training.startMinutes, training.endMinutes)}
        </p>
        {training.siteId && <p className="text-xs text-ink-faint">{getSiteName(training.siteId)}</p>}
      </PopoverContent>
    </Popover>
  );
}
