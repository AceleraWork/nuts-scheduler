import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PanelHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PanelHeader({ icon: Icon, title, subtitle, action, className }: PanelHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-border px-4 py-3.5",
        className
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="gradient-icon flex size-7 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-4 text-white" strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-[0.9375rem] leading-tight text-ink truncate">{title}</h2>
          {subtitle && (
            <p className="label-caps text-ink-mute leading-tight truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
