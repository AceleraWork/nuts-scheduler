import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  getScheduleOptions,
  saveScheduleOptions,
  updateShiftRow,
  updateScheduleOptionMetaRow,
} from "@/lib/data/schedules";
import { getNextMondayISO } from "@/lib/time/week";
import { generateScheduleOptions } from "@/lib/solver/generateScheduleOptions";
import { validateSchedule } from "@/lib/solver/validateEdit";
import { useEmployeesStore } from "@/stores/useEmployeesStore";
import { useConstraintsStore } from "@/stores/useConstraintsStore";
import { useTrainingsStore } from "@/stores/useTrainingsStore";
import { useSitesStore } from "@/stores/useSitesStore";
import type { ScheduleOption, ScheduleOptionId, Shift } from "@/types";

interface ScheduleState {
  options: ScheduleOption[];
  activeOptionId: ScheduleOptionId;
  isGenerating: boolean;
  isLoaded: boolean;
  initialize: () => Promise<void>;
  setActiveOptionId: (id: ScheduleOptionId) => void;
  updateShift: (optionId: ScheduleOptionId, shiftId: string, patch: Partial<Shift>) => Promise<void>;
  swapShifts: (optionId: ScheduleOptionId, shiftIdA: string, shiftIdB: string) => Promise<void>;
  revalidate: (optionId: ScheduleOptionId) => Promise<void>;
  regenerate: () => Promise<void>;
}

function swapShiftContent(a: Shift, b: Shift): void {
  const snapshotA = { ...a };
  a.siteId = b.siteId;
  a.startMinutes = b.startMinutes;
  a.endMinutes = b.endMinutes;
  a.isDayOff = b.isDayOff;
  a.isEarlyLeave = b.isEarlyLeave;
  a.isTrainingBlock = b.isTrainingBlock;
  a.trainingEventId = b.trainingEventId;
  b.siteId = snapshotA.siteId;
  b.startMinutes = snapshotA.startMinutes;
  b.endMinutes = snapshotA.endMinutes;
  b.isDayOff = snapshotA.isDayOff;
  b.isEarlyLeave = snapshotA.isEarlyLeave;
  b.isTrainingBlock = snapshotA.isTrainingBlock;
  b.trainingEventId = snapshotA.trainingEventId;
}

async function buildFreshOptions(): Promise<ScheduleOption[]> {
  const { employees } = useEmployeesStore.getState();
  const { hardConstraints, softConstraints } = useConstraintsStore.getState();
  const { sites } = useSitesStore.getState();
  const { trainings } = useTrainingsStore.getState();
  return generateScheduleOptions({
    employees,
    sites,
    hardConstraints,
    softConstraints,
    trainings,
    weekStartDate: getNextMondayISO(),
  });
}

export const useScheduleStore = create<ScheduleState>()(
  immer((set, get) => ({
    options: [],
    activeOptionId: "A",
    isGenerating: false,
    isLoaded: false,
    initialize: async () => {
      let options = await getScheduleOptions();
      if (options.length === 0) {
        options = await buildFreshOptions();
        await saveScheduleOptions(options);
      }
      set((state) => {
        state.options = options;
        state.activeOptionId = options[0]?.id ?? "A";
        state.isLoaded = true;
      });
    },
    setActiveOptionId: (id) =>
      set((state) => {
        state.activeOptionId = id;
      }),
    updateShift: async (optionId, shiftId, patch) => {
      set((state) => {
        const option = state.options.find((o) => o.id === optionId);
        const shift = option?.shifts.find((s) => s.id === shiftId);
        if (shift) Object.assign(shift, patch);
      });
      const shift = get().options.find((o) => o.id === optionId)?.shifts.find((s) => s.id === shiftId);
      if (shift) await updateShiftRow(shift, optionId);
      await get().revalidate(optionId);
    },
    swapShifts: async (optionId, shiftIdA, shiftIdB) => {
      if (shiftIdA === shiftIdB) return;
      set((state) => {
        const option = state.options.find((o) => o.id === optionId);
        const shiftA = option?.shifts.find((s) => s.id === shiftIdA);
        const shiftB = option?.shifts.find((s) => s.id === shiftIdB);
        if (!shiftA || !shiftB) return;
        swapShiftContent(shiftA, shiftB);
      });
      const option = get().options.find((o) => o.id === optionId);
      const shiftA = option?.shifts.find((s) => s.id === shiftIdA);
      const shiftB = option?.shifts.find((s) => s.id === shiftIdB);
      await Promise.all([
        shiftA ? updateShiftRow(shiftA, optionId) : Promise.resolve(),
        shiftB ? updateShiftRow(shiftB, optionId) : Promise.resolve(),
      ]);
      await get().revalidate(optionId);
    },
    revalidate: async (optionId) => {
      const { employees } = useEmployeesStore.getState();
      const { hardConstraints, softConstraints } = useConstraintsStore.getState();
      const { sites } = useSitesStore.getState();
      const { trainings } = useTrainingsStore.getState();
      const option = get().options.find((o) => o.id === optionId);
      if (!option) return;
      const { violations, score } = validateSchedule(
        option.shifts,
        { employees, sites, trainings, weekStartDate: option.weekStartDate },
        hardConstraints,
        softConstraints
      );
      set((state) => {
        const target = state.options.find((o) => o.id === optionId);
        if (target) {
          target.violations = violations;
          target.score = score;
        }
      });
      const updated = get().options.find((o) => o.id === optionId);
      if (updated) await updateScheduleOptionMetaRow(updated);
    },
    regenerate: async () => {
      set((state) => {
        state.isGenerating = true;
      });
      const options = await buildFreshOptions();
      await saveScheduleOptions(options);
      set((state) => {
        state.options = options;
        state.activeOptionId = options[0]?.id ?? "A";
        state.isGenerating = false;
      });
    },
  }))
);

export function selectActiveOption(state: ScheduleState): ScheduleOption | undefined {
  return state.options.find((o) => o.id === state.activeOptionId);
}
