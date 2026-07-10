import { TriangleAlert, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Violation } from "@/types";

interface ViolationsListProps {
  violations: Violation[];
}

export function ViolationsList({ violations }: ViolationsListProps) {
  if (violations.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {violations.map((violation) => {
        const isHard = violation.severity === "hard";
        const Icon = isHard ? OctagonAlert : TriangleAlert;
        return (
          <div
            key={violation.id}
            className={cn(
              "flex items-start gap-2 rounded-lg border px-3 py-2 text-xs",
              isHard
                ? "border-danger/30 bg-danger-soft text-danger"
                : "border-amber/30 bg-[#fff4de] text-[#8a6400]"
            )}
          >
            <Icon className="mt-0.5 size-3.5 shrink-0" />
            <span>{violation.message}</span>
          </div>
        );
      })}
    </div>
  );
}
