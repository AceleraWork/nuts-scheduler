"use client";

import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ViolationsList } from "@/components/schedule/ViolationsList";
import { useScheduleStore, selectActiveOption } from "@/stores/useScheduleStore";

export function NotificationsBell() {
  const activeOption = useScheduleStore(selectActiveOption);
  const violations = activeOption?.violations ?? [];
  const hasHard = violations.some((v) => v.severity === "hard");

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Notificaciones"
            className="relative text-ink-mute hover:text-ink"
          />
        }
      >
        <Bell className="size-3.5" />
        {violations.length > 0 && (
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full text-[0.6rem] font-medium text-white",
              hasHard ? "bg-danger" : "bg-amber"
            )}
          >
            {violations.length > 9 ? "9+" : violations.length}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[70vh] w-96 overflow-y-auto">
        <PopoverHeader>
          <PopoverTitle>Notificaciones</PopoverTitle>
        </PopoverHeader>
        {violations.length === 0 ? (
          <p className="px-1 py-2 text-xs text-ink-faint">Sin alertas por ahora.</p>
        ) : (
          <ViolationsList violations={violations} />
        )}
      </PopoverContent>
    </Popover>
  );
}
