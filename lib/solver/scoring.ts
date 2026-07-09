import type { Violation } from "@/types";

const HARD_VIOLATION_PENALTY = 100;

/** Puntaje de costo total: menor es mejor. Las reglas duras violadas pesan mucho más que las blandas. */
export function computeScore(violations: Violation[]): number {
  return violations.reduce((total, v) => {
    if (v.severity === "hard") return total + HARD_VIOLATION_PENALTY;
    return total + (v.weight ?? 1);
  }, 0);
}
