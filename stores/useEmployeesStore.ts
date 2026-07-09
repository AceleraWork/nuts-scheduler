import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  getEmployees,
  updateEmployeeRow,
  insertEmployeeRow,
  deleteEmployeeRow,
} from "@/lib/data/employees";
import type { Employee } from "@/types";

interface EmployeesState {
  employees: Employee[];
  isLoaded: boolean;
  initialize: () => Promise<void>;
  updateEmployee: (id: string, patch: Partial<Employee>) => Promise<void>;
  addEmployee: (employee: Employee) => Promise<void>;
  removeEmployee: (id: string) => Promise<void>;
}

export const useEmployeesStore = create<EmployeesState>()(
  immer((set, get) => ({
    employees: [],
    isLoaded: false,
    initialize: async () => {
      const employees = await getEmployees();
      set((state) => {
        state.employees = employees;
        state.isLoaded = true;
      });
    },
    updateEmployee: async (id, patch) => {
      const current = get().employees.find((e) => e.id === id);
      if (!current) return;
      const updated = { ...current, ...patch };
      await updateEmployeeRow(updated);
      set((state) => {
        const employee = state.employees.find((e) => e.id === id);
        if (employee) Object.assign(employee, patch);
      });
    },
    addEmployee: async (employee) => {
      await insertEmployeeRow(employee);
      set((state) => {
        state.employees.push(employee);
      });
    },
    removeEmployee: async (id) => {
      await deleteEmployeeRow(id);
      set((state) => {
        state.employees = state.employees.filter((e) => e.id !== id);
      });
    },
  }))
);
