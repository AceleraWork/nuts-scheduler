import { cn } from "@/lib/utils";
import type { HoursIndicator } from "@/types";

const INDICATOR_STYLES: Record<HoursIndicator, string> = {
  green: "bg-[#e5f0df] text-[#3f6b2e] border-[#c3dcb4]",
  yellow: "bg-[#fbf0d9] text-[#8a6414] border-[#eaceA0]",
  red: "bg-danger-soft text-danger border-danger/30",
};

interface HoursBadgeProps {
  hours: number;
  indicator: HoursIndicator;
  targetHours: number;
}

export function HoursBadge({ hours, indicator, targetHours }: HoursBadgeProps) {
  const diff = hours - targetHours;
  const diffLabel = diff === 0 ? "en objetivo" : diff > 0 ? `+${diff}h` : `${diff}h`;
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        INDICATOR_STYLES[indicator]
      )}
    >
      <span className="font-mono-tabular font-semibold">{hours}h</span>
      <span className="opacity-70">· {diffLabel}</span>
    </div>
  );
}
