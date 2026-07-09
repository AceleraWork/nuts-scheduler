import { Sparkles } from "lucide-react";
import type { ScheduleOption } from "@/types";

interface ScheduleSummaryFooterProps {
  option: ScheduleOption;
}

export function ScheduleSummaryFooter({ option }: ScheduleSummaryFooterProps) {
  return (
    <div className="gradient-card flex items-start gap-2.5 rounded-xl px-3.5 py-3">
      <Sparkles className="mt-0.5 size-4 shrink-0 text-ink-soft" strokeWidth={1.75} />
      <p className="text-sm text-ink-soft leading-relaxed">{option.reasoningSummary}</p>
    </div>
  );
}
