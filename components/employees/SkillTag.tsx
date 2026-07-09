import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EmployeeSkill } from "@/types";

export const SKILL_LABELS: Record<EmployeeSkill["skill"], string> = {
  salado: "Salado",
  dulce: "Dulce",
  apertura: "Apertura",
  cafe: "Café",
  rappi: "Rappi",
  cierre: "Cierre",
};

interface SkillTagProps {
  skill: EmployeeSkill;
  strong?: boolean;
}

export function SkillTag({ skill, strong }: SkillTagProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-border-strong bg-surface text-ink-soft",
        strong && "border-gold bg-gold-soft text-ink font-semibold"
      )}
    >
      {SKILL_LABELS[skill.skill]}
    </Badge>
  );
}
