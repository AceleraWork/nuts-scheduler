import type { HardConstraint, Shift, SoftConstraint, Violation } from "@/types";
import { HARD_RULES } from "@/lib/solver/rules/hardRules";
import { SOFT_RULES } from "@/lib/solver/rules/softRules";
import type { RuleContext } from "@/lib/solver/types";

const hardRuleByType = new Map(HARD_RULES.map((rule) => [rule.type, rule]));
const softRuleByType = new Map(SOFT_RULES.map((rule) => [rule.type, rule]));

export function evaluateHardConstraints(
  shifts: Shift[],
  ctx: RuleContext,
  constraints: HardConstraint[]
): Violation[] {
  return constraints.flatMap((c) => hardRuleByType.get(c.type)?.evaluate(shifts, ctx, c) ?? []);
}

export function evaluateSoftConstraints(
  shifts: Shift[],
  ctx: RuleContext,
  constraints: SoftConstraint[]
): Violation[] {
  return constraints
    .filter((c) => c.enabled)
    .flatMap((c) => softRuleByType.get(c.type)?.evaluate(shifts, ctx, c) ?? []);
}

export function evaluateAll(
  shifts: Shift[],
  ctx: RuleContext,
  hardConstraints: HardConstraint[],
  softConstraints: SoftConstraint[]
): Violation[] {
  return [
    ...evaluateHardConstraints(shifts, ctx, hardConstraints),
    ...evaluateSoftConstraints(shifts, ctx, softConstraints),
  ];
}
