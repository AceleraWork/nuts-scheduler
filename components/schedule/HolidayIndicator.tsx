"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger, PopoverHeader, PopoverTitle } from "@/components/ui/popover";
import type { PublicHoliday } from "@/types";

interface HolidayIndicatorProps {
  holiday: PublicHoliday;
}

export function HolidayIndicator({ holiday }: HolidayIndicatorProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={`Festivo: ${holiday.name}`}
            className="h-1.5 w-full rounded-full bg-amber"
          />
        }
      />
      <PopoverContent className="w-56">
        <PopoverHeader>
          <PopoverTitle>Día festivo</PopoverTitle>
        </PopoverHeader>
        <p className="text-sm text-ink-mute">{holiday.name}</p>
      </PopoverContent>
    </Popover>
  );
}
