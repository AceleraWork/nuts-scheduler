import type { Employee, Site, TrainingEvent, Shift, Violation, HardConstraint, SoftConstraint } from "@/types";

export interface RuleContext {
  employees: Employee[];
  sites: Site[];
  trainings: TrainingEvent[];
  weekStartDate: string;
}

export interface HardRule {
  type: HardConstraint["type"];
  evaluate: (shifts: Shift[], ctx: RuleContext, constraint: HardConstraint) => Violation[];
}

export interface SoftRule {
  type: SoftConstraint["type"];
  evaluate: (shifts: Shift[], ctx: RuleContext, constraint: SoftConstraint) => Violation[];
}

let violationCounter = 0;
export function nextViolationId(): string {
  violationCounter += 1;
  return `violation-${violationCounter}`;
}
