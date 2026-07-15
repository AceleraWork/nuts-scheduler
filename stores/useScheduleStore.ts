import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { getScheduleOptionsForWeek, saveScheduleOption } from "@/lib/data/schedules";
import { loadScheduleDraft, saveScheduleDraft } from "@/lib/storage/scheduleDraft";
import { getNextMondayISO, shiftWeekISO } from "@/lib/time/week";
import { generateScheduleOptions } from "@/lib/solver/generateScheduleOptions";
import { validateSchedule } from "@/lib/solver/validateEdit";
import { useEmployeesStore } from "@/stores/useEmployeesStore";
import { useConstraintsStore } from "@/stores/useConstraintsStore";
import { useTrainingsStore } from "@/stores/useTrainingsStore";
import { useLeavesStore } from "@/stores/useLeavesStore";
import { useSitesStore } from "@/stores/useSitesStore";
import type { ScheduleOption, ScheduleOptionId, Shift } from "@/types";

interface ScheduleState {
  weekStartDate: string;
  options: ScheduleOption[];
  activeOptionId: ScheduleOptionId;
  isGenerating: boolean;
  isLoaded: boolean;
  isLoadingWeek: boolean;
  isSaving: boolean;
  initialize: () => Promise<void>;
  goToWeek: (weekStartDate: string) => Promise<void>;
  goToPreviousWeek: () => Promise<void>;
  goToNextWeek: () => Promise<void>;
  setActiveOptionId: (id: ScheduleOptionId) => void;
  updateShift: (optionId: ScheduleOptionId, shiftId: string, patch: Partial<Shift>) => Promise<void>;
  swapShifts: (optionId: ScheduleOptionId, shiftIdA: string, shiftIdB: string) => Promise<void>;
  revalidate: (optionId: ScheduleOptionId) => Promise<void>;
  regenerate: () => Promise<void>;
  saveActiveOption: () => Promise<void>;
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
  a.serviceTaskType = b.serviceTaskType;
  a.leaveId = b.leaveId;
  b.siteId = snapshotA.siteId;
  b.startMinutes = snapshotA.startMinutes;
  b.endMinutes = snapshotA.endMinutes;
  b.isDayOff = snapshotA.isDayOff;
  b.isEarlyLeave = snapshotA.isEarlyLeave;
  b.isTrainingBlock = snapshotA.isTrainingBlock;
  b.trainingEventId = snapshotA.trainingEventId;
  b.serviceTaskType = snapshotA.serviceTaskType;
  b.leaveId = snapshotA.leaveId;
}

/** Solo persiste el borrador de la semana "por defecto" (la próxima semana desde hoy,
 * que es la única que `initialize()` intenta restaurar) — si persistiéramos también al
 * navegar a otras semanas con las flechas, un vistazo a otra semana pisaría el borrador
 * real y se perdería al volver. */
function persistDraftIfDefaultWeek(state: Pick<ScheduleState, "weekStartDate" | "options" | "activeOptionId">): void {
  if (state.weekStartDate !== getNextMondayISO()) return;
  saveScheduleDraft({
    weekStartDate: state.weekStartDate,
    options: state.options,
    activeOptionId: state.activeOptionId,
  });
}

async function buildFreshOptions(weekStartDate: string): Promise<ScheduleOption[]> {
  const employees = useEmployeesStore.getState().employees.filter((e) => e.active);
  const { hardConstraints, softConstraints } = useConstraintsStore.getState();
  const { sites } = useSitesStore.getState();
  const { trainings } = useTrainingsStore.getState();
  const { leaves } = useLeavesStore.getState();
  return generateScheduleOptions({
    employees,
    sites,
    hardConstraints,
    softConstraints,
    trainings,
    leaves,
    weekStartDate,
    baseVariantOffset: Math.floor(Math.random() * 7),
  });
}

export const useScheduleStore = create<ScheduleState>()(
  immer((set, get) => ({
    weekStartDate: getNextMondayISO(),
    options: [],
    activeOptionId: "A",
    isGenerating: false,
    isLoaded: false,
    isLoadingWeek: false,
    isSaving: false,
    initialize: async () => {
      const weekStartDate = getNextMondayISO();
      const draft = loadScheduleDraft();
      if (draft && draft.weekStartDate === weekStartDate && draft.options.length > 0) {
        set((state) => {
          state.weekStartDate = draft.weekStartDate;
          state.options = draft.options;
          state.activeOptionId = draft.activeOptionId;
          state.isLoaded = true;
        });
        return;
      }
      const options = await getScheduleOptionsForWeek(weekStartDate);
      set((state) => {
        state.weekStartDate = weekStartDate;
        state.options = options;
        state.activeOptionId = options[0]?.id ?? "A";
        state.isLoaded = true;
      });
      persistDraftIfDefaultWeek(get());
    },
    goToWeek: async (weekStartDate) => {
      set((state) => {
        state.isLoadingWeek = true;
      });
      try {
        const options = await getScheduleOptionsForWeek(weekStartDate);
        set((state) => {
          state.weekStartDate = weekStartDate;
          state.options = options;
          state.activeOptionId = options[0]?.id ?? "A";
          state.isLoadingWeek = false;
        });
      } catch (err) {
        set((state) => {
          state.isLoadingWeek = false;
        });
        throw err;
      }
    },
    goToPreviousWeek: async () => {
      await get().goToWeek(shiftWeekISO(get().weekStartDate, -1));
    },
    goToNextWeek: async () => {
      await get().goToWeek(shiftWeekISO(get().weekStartDate, 1));
    },
    setActiveOptionId: (id) => {
      set((state) => {
        state.activeOptionId = id;
      });
      persistDraftIfDefaultWeek(get());
    },
    // Nota: las ediciones (updateShift/swapShifts) y regenerate() ya NO persisten a
    // Supabase automáticamente — solo mutan el estado local (y un borrador en
    // localStorage vía persistDraftIfDefaultWeek, para no perderlo con un refresh). El
    // único camino a Supabase es saveActiveOption() (botón "Guardar"), a propósito: la
    // dueña pidió que nada se guarde solo hasta que ella oprima Guardar/Enviar.
    updateShift: async (optionId, shiftId, patch) => {
      set((state) => {
        const option = state.options.find((o) => o.id === optionId);
        const shift = option?.shifts.find((s) => s.id === shiftId);
        if (shift) Object.assign(shift, patch);
      });
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
      await get().revalidate(optionId);
    },
    revalidate: async (optionId) => {
      const employees = useEmployeesStore.getState().employees.filter((e) => e.active);
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
      persistDraftIfDefaultWeek(get());
    },
    regenerate: async () => {
      set((state) => {
        state.isGenerating = true;
      });
      const weekStartDate = get().weekStartDate;
      const options = await buildFreshOptions(weekStartDate);
      set((state) => {
        state.options = options;
        state.activeOptionId = options[0]?.id ?? "A";
        state.isGenerating = false;
      });
      persistDraftIfDefaultWeek(get());
    },
    saveActiveOption: async () => {
      const option = selectActiveOption(get());
      if (!option) return;
      set((state) => {
        state.isSaving = true;
      });
      try {
        await saveScheduleOption(option);
      } finally {
        set((state) => {
          state.isSaving = false;
        });
      }
    },
  }))
);

export function selectActiveOption(state: ScheduleState): ScheduleOption | undefined {
  return state.options.find((o) => o.id === state.activeOptionId);
}
