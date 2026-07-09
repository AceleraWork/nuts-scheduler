import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-1 flex-col items-center justify-center gap-2 px-8 py-12 text-center", className)}>
      <div className="gradient-card flex size-11 items-center justify-center rounded-2xl">
        <Icon className="size-5 text-ink-soft" strokeWidth={1.75} />
      </div>
      <p className="font-display text-sm text-ink">{title}</p>
      {description && <p className="text-sm text-ink-mute max-w-xs">{description}</p>}
    </div>
  );
}
