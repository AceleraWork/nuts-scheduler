import { ChefHat, Coffee, Briefcase, Cookie, Clock3, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatShiftRange } from "@/lib/time/formatTime";
import { getSiteName } from "@/stores/useSitesStore";
import { getLeaveById } from "@/stores/useLeavesStore";
import { SERVICE_TASK_TYPE_LABELS } from "@/lib/constants";
import type { Shift } from "@/types";

interface ShiftBlockProps {
  shift: Shift;
}

export function ShiftBlock({ shift }: ShiftBlockProps) {
  if (shift.isDayOff && shift.leaveId) {
    const leave = getLeaveById(shift.leaveId);
    return (
      <div
        className="flex h-full min-h-16 flex-col items-center justify-center gap-0.5 rounded-lg border px-2 py-1.5 text-center"
        style={{ borderColor: leave?.color, backgroundColor: leave ? `${leave.color}22` : undefined }}
      >
        <span className="text-xs font-medium text-ink">{leave?.label ?? "Incapacidad"}</span>
      </div>
    );
  }

  if (shift.isDayOff) {
    return (
      <div className="flex h-full min-h-16 items-center justify-center rounded-lg border border-dashed border-border text-xs text-ink-faint">
        Descanso
      </div>
    );
  }

  const Icon =
    shift.area === "cocina"
      ? ChefHat
      : shift.area === "servicio"
        ? Coffee
        : shift.area === "planta"
          ? Cookie
          : Briefcase;

  return (
    <div
      className={cn(
        "flex h-full min-h-16 flex-col justify-center gap-0.5 rounded-lg border px-2 py-1.5",
        shift.area === "cocina"
          ? "border-gold/30 bg-gold-soft"
          : shift.area === "servicio"
            ? "border-olive/30 bg-olive-soft"
            : shift.area === "planta"
              ? "border-berry/30 bg-berry-soft"
              : "border-clay/30 bg-clay-soft"
      )}
    >
      <div className="flex items-center gap-1 text-[0.6875rem] text-ink-mute">
        <Icon className="size-3" />
        <span className="truncate">{getSiteName(shift.siteId)}</span>
      </div>
      <p className="font-mono-tabular text-xs font-semibold text-ink">
        {formatShiftRange(shift.startMinutes, shift.endMinutes)}
      </p>
      {shift.isEarlyLeave && (
        <div className="flex items-center gap-1 text-[0.625rem] text-ink-mute">
          <Clock3 className="size-2.5" />
          <span>Salida temprana</span>
        </div>
      )}
      {shift.serviceTaskType && (
        <div className="flex items-center gap-1 text-[0.625rem] text-ink-mute">
          <Tag className="size-2.5" />
          <span>{SERVICE_TASK_TYPE_LABELS[shift.serviceTaskType]}</span>
        </div>
      )}
    </div>
  );
}
