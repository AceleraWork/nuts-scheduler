import type { Employee, HardConstraint, ScheduleOption, Site, SoftConstraint, TrainingEvent } from "@/types";
import { buildShifts } from "@/lib/solver/assign";
import { evaluateAll } from "@/lib/solver/rules/ruleRegistry";
import { computeScore } from "@/lib/solver/scoring";
import { DIVERSITY_STRATEGIES, applyWeightMultipliers } from "@/lib/solver/diversity";
import type { RuleContext } from "@/lib/solver/types";

interface GenerateInput {
  employees: Employee[];
  sites: Site[];
  hardConstraints: HardConstraint[];
  softConstraints: SoftConstraint[];
  trainings: TrainingEvent[];
  weekStartDate: string;
}

function summarize(strategyLabel: string, violationCount: number, hardCount: number): string {
  if (hardCount > 0) {
    return `${strategyLabel}. Quedaron ${hardCount} restricción(es) dura(s) sin resolver por falta de personal disponible ese día — revísalas antes de publicar.`;
  }
  if (violationCount === 0) {
    return `${strategyLabel}. Todas las restricciones duras y blandas configuradas se cumplieron.`;
  }
  return `${strategyLabel}. Se cumplieron todas las restricciones duras; quedaron ${violationCount} preferencia(s) blanda(s) sin satisfacer del todo.`;
}

export function generateScheduleOptions({
  employees,
  sites,
  hardConstraints,
  softConstraints,
  trainings,
  weekStartDate,
}: GenerateInput): ScheduleOption[] {
  const ctx: RuleContext = { employees, sites, trainings, weekStartDate };
  const generatedAt = new Date().toISOString();

  return DIVERSITY_STRATEGIES.map((strategy) => {
    const weightedSoftConstraints = applyWeightMultipliers(softConstraints, strategy.weightMultipliers);
    const shifts = buildShifts({
      employees,
      sites,
      hardConstraints,
      softConstraints: weightedSoftConstraints,
      weekStartDate,
      variantOffset: strategy.variantOffset,
    });
    const violations = evaluateAll(shifts, ctx, hardConstraints, weightedSoftConstraints);
    const hardCount = violations.filter((v) => v.severity === "hard").length;

    return {
      id: strategy.id,
      label: strategy.label,
      weekStartDate,
      shifts,
      score: computeScore(violations),
      violations,
      reasoningSummary: summarize(strategy.label, violations.length, hardCount),
      generatedAt,
    };
  });
}
