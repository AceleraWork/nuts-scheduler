import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { getLeaves, insertLeaveRow, deleteLeaveRow } from "@/lib/data/leaves";
import type { EmployeeLeave } from "@/types";

interface LeavesState {
  leaves: EmployeeLeave[];
  isLoaded: boolean;
  initialize: () => Promise<void>;
  addLeave: (leave: EmployeeLeave) => Promise<void>;
  removeLeave: (id: string) => Promise<void>;
}

export const useLeavesStore = create<LeavesState>()(
  immer((set) => ({
    leaves: [],
    isLoaded: false,
    initialize: async () => {
      const leaves = await getLeaves();
      set((state) => {
        state.leaves = leaves;
        state.isLoaded = true;
      });
    },
    addLeave: async (leave) => {
      await insertLeaveRow(leave);
      set((state) => {
        state.leaves.push(leave);
      });
    },
    removeLeave: async (id) => {
      await deleteLeaveRow(id);
      set((state) => {
        state.leaves = state.leaves.filter((l) => l.id !== id);
      });
    },
  }))
);

/** Lookup síncrono para vistas que no pueden esperar una promesa (asume que el store ya se inicializó). */
export function getLeaveById(id: string): EmployeeLeave | undefined {
  return useLeavesStore.getState().leaves.find((l) => l.id === id);
}
