import { GraduationCap, X } from "lucide-react";
import { formatShiftRange } from "@/lib/time/formatTime";
import type { TrainingEvent } from "@/types";

interface TrainingBadgeProps {
  training: TrainingEvent;
  onRemove: (id: string) => void;
}

export function TrainingBadge({ training, onRemove }: TrainingBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold-soft px-2.5 py-1 text-xs text-ink-soft">
      <GraduationCap className="size-3.5 shrink-0" />
      <span className="font-medium text-ink">{training.title}</span>
      <span className="text-ink-mute">
        {training.date} · {formatShiftRange(training.startMinutes, training.endMinutes)}
      </span>
      <button
        onClick={() => onRemove(training.id)}
        aria-label={`Eliminar capacitación ${training.title}`}
        className="text-ink-mute hover:text-danger"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}
