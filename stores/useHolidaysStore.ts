import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  getPublicHolidays,
  getPublicHolidaysForYear,
  insertPublicHolidays,
} from "@/lib/data/holidays";
import { fetchColombiaHolidays } from "@/lib/holidays/nagerDate";
import type { PublicHoliday } from "@/types";

interface HolidaysState {
  holidays: PublicHoliday[];
  loadedYears: number[];
  isLoaded: boolean;
  initialize: () => Promise<void>;
  ensureYearLoaded: (year: number) => Promise<void>;
}

export const useHolidaysStore = create<HolidaysState>()(
  immer((set, get) => ({
    holidays: [],
    loadedYears: [],
    isLoaded: false,
    initialize: async () => {
      const holidays = await getPublicHolidays();
      const loadedYears = [...new Set(holidays.map((h) => Number(h.date.slice(0, 4))))];
      set((state) => {
        state.holidays = holidays;
        state.loadedYears = loadedYears;
        state.isLoaded = true;
      });
      const currentYear = new Date().getFullYear();
      await Promise.all([
        get().ensureYearLoaded(currentYear),
        get().ensureYearLoaded(currentYear + 1),
      ]);
    },
    ensureYearLoaded: async (year) => {
      if (get().loadedYears.includes(year)) return;
      let holidaysForYear = await getPublicHolidaysForYear(year);
      if (holidaysForYear.length === 0) {
        try {
          holidaysForYear = await fetchColombiaHolidays(year);
          await insertPublicHolidays(holidaysForYear);
        } catch {
          // Festivos es informativo, no crítico: si la API externa falla no debe
          // bloquear el resto de la app. Se reintentará la próxima vez que se pida este año.
          return;
        }
      }
      set((state) => {
        const existingDates = new Set(state.holidays.map((h) => h.date));
        for (const h of holidaysForYear) {
          if (!existingDates.has(h.date)) state.holidays.push(h);
        }
        state.loadedYears.push(year);
      });
    },
  }))
);
