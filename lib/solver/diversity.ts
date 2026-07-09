import type { SoftConstraint, SoftConstraintType } from "@/types";

export interface DiversityStrategy {
  id: "A" | "B" | "C";
  label: string;
  variantOffset: number;
  weightMultipliers: Partial<Record<SoftConstraintType, number>>;
}

export const DIVERSITY_STRATEGIES: DiversityStrategy[] = [
  {
    id: "A",
    label: "Opción A · Balanceada",
    variantOffset: 0,
    weightMultipliers: {},
  },
  {
    id: "B",
    label: "Opción B · Refuerzo de parejas",
    variantOffset: 3,
    weightMultipliers: { "pair-together-at-site": 2, "site-reinforcement": 1.5 },
  },
  {
    id: "C",
    label: "Opción C · Enfoque en horas",
    variantOffset: 5,
    weightMultipliers: { "target-weekly-hours": 2 },
  },
];

export function applyWeightMultipliers(
  softConstraints: SoftConstraint[],
  multipliers: Partial<Record<SoftConstraintType, number>>
): SoftConstraint[] {
  return softConstraints.map((c) => {
    const multiplier = multipliers[c.type];
    return multiplier ? { ...c, weight: c.weight * multiplier } : c;
  });
}
