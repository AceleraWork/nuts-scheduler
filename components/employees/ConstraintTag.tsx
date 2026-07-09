import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ConstraintTagProps {
  label: string;
  severity: "hard" | "soft";
}

export function ConstraintTag({ label, severity }: ConstraintTagProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        severity === "hard"
          ? "border-danger/30 bg-danger-soft text-danger"
          : "border-olive/30 bg-olive-soft text-[#3f4a2e]"
      )}
    >
      {label}
    </Badge>
  );
}
