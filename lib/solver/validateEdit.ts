import type { HardConstraint, Shift, SoftConstraint, Violation } from "@/types";
import { evaluateAll } from "@/lib/solver/rules/ruleRegistry";
import { computeScore } from "@/lib/solver/scoring";
import type { RuleContext } from "@/lib/solver/types";

/**
 * Revalida el horario completo tras una edición manual (drag & drop, cambio de sede, etc.).
 * Nunca bloquea: solo reporta violaciones para mostrarlas como advertencias.
 */
export function validateSchedule(
  shifts: Shift[],
  ctx: RuleContext,
  hardConstraints: HardConstraint[],
  softConstraints: SoftConstraint[]
): { violations: Violation[]; score: number } {
  const violations = evaluateAll(shifts, ctx, hardConstraints, softConstraints);
  return { violations, score: computeScore(violations) };
}
