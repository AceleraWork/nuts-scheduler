import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  getHardConstraints,
  getSoftConstraints,
  insertHardConstraint,
  insertSoftConstraint,
  deleteConstraintRow,
  updateSoftConstraintWeightRow,
  updateSoftConstraintParamsRow,
  updateHardConstraintRow,
  updateSoftConstraintRow,
} from "@/lib/data/constraints";
import type { HardConstraint, SoftConstraint } from "@/types";

interface ConstraintsState {
  hardConstraints: HardConstraint[];
  softConstraints: SoftConstraint[];
  isLoaded: boolean;
  initialize: () => Promise<void>;
  addHardConstraint: (constraint: HardConstraint) => Promise<void>;
  addSoftConstraint: (constraint: SoftConstraint) => Promise<void>;
  updateHardConstraint: (constraint: HardConstraint) => Promise<void>;
  updateSoftConstraint: (constraint: SoftConstraint) => Promise<void>;
  removeConstraint: (id: string) => Promise<void>;
  updateSoftConstraintWeight: (id: string, weight: number) => Promise<void>;
  setTargetHours: (value: number) => Promise<void>;
}

export const useConstraintsStore = create<ConstraintsState>()(
  immer((set, get) => ({
    hardConstraints: [],
    softConstraints: [],
    isLoaded: false,
    initialize: async () => {
      const [hardConstraints, softConstraints] = await Promise.all([
        getHardConstraints(),
        getSoftConstraints(),
      ]);
      set((state) => {
        state.hardConstraints = hardConstraints;
        state.softConstraints = softConstraints;
        state.isLoaded = true;
      });
    },
    addHardConstraint: async (constraint) => {
      await insertHardConstraint(constraint);
      set((state) => {
        state.hardConstraints.push(constraint);
      });
    },
    addSoftConstraint: async (constraint) => {
      await insertSoftConstraint(constraint);
      set((state) => {
        state.softConstraints.push(constraint);
      });
    },
    updateHardConstraint: async (constraint) => {
      await updateHardConstraintRow(constraint);
      set((state) => {
        const idx = state.hardConstraints.findIndex((c) => c.id === constraint.id);
        if (idx !== -1) state.hardConstraints[idx] = constraint;
      });
    },
    updateSoftConstraint: async (constraint) => {
      await updateSoftConstraintRow(constraint);
      set((state) => {
        const idx = state.softConstraints.findIndex((c) => c.id === constraint.id);
        if (idx !== -1) state.softConstraints[idx] = constraint;
      });
    },
    removeConstraint: async (id) => {
      await deleteConstraintRow(id);
      set((state) => {
        state.hardConstraints = state.hardConstraints.filter((c) => c.id !== id);
        state.softConstraints = state.softConstraints.filter((c) => c.id !== id);
      });
    },
    updateSoftConstraintWeight: async (id, weight) => {
      await updateSoftConstraintWeightRow(id, weight);
      set((state) => {
        const constraint = state.softConstraints.find((c) => c.id === id);
        if (constraint) constraint.weight = weight;
      });
    },
    setTargetHours: async (value) => {
      const targets = get().softConstraints.filter((c) => c.type === "target-weekly-hours");
      await Promise.all(
        targets.map((c) => updateSoftConstraintParamsRow(c.id, { ...c.params, targetHours: value }, 9))
      );
      set((state) => {
        for (const constraint of state.softConstraints) {
          if (constraint.type === "target-weekly-hours") {
            constraint.params = { ...constraint.params, targetHours: value };
            constraint.weight = 9;
          }
        }
      });
    },
  }))
);
