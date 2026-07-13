import { X } from "lucide-react";
import { formatShiftRange } from "@/lib/time/formatTime";
import type { TrainingEvent } from "@/types";

interface TrainingBadgeProps {
  training: TrainingEvent;
  onRemove: (id: string) => void;
}

export function TrainingBadge({ training, onRemove }: TrainingBadgeProps) {
  // "T00:00:00" evita que el parseo de la fecha ISO se corra un día por zona horaria.
  const dayNumber = new Date(`${training.date}T00:00:00`).getDate();
  const fullDetail = `${training.title} · ${training.date} · ${formatShiftRange(training.startMinutes, training.endMinutes)}`;

  return (
    <div
      title={fullDetail}
      className="group relative flex w-20 flex-col items-center justify-center gap-0.5 rounded-2xl border border-olive/30 bg-olive-soft px-2 py-2.5 text-center"
    >
      <span className="font-mono-tabular text-lg font-semibold text-ink">{dayNumber}</span>
      <span className="w-full truncate text-xs text-ink-soft">{training.title}</span>
      <button
        onClick={() => onRemove(training.id)}
        aria-label={`Eliminar capacitación ${training.title}`}
        className="absolute -top-1.5 -right-1.5 hidden rounded-full border border-border bg-surface p-0.5 text-ink-mute hover:text-danger group-hover:block"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}
