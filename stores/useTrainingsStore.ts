import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { getTrainingEvents, insertTrainingEvent, deleteTrainingEventRow } from "@/lib/data/trainings";
import type { TrainingEvent } from "@/types";

interface TrainingsState {
  trainings: TrainingEvent[];
  isLoaded: boolean;
  initialize: () => Promise<void>;
  addTrainingEvent: (training: TrainingEvent) => Promise<void>;
  removeTrainingEvent: (id: string) => Promise<void>;
}

export const useTrainingsStore = create<TrainingsState>()(
  immer((set) => ({
    trainings: [],
    isLoaded: false,
    initialize: async () => {
      const trainings = await getTrainingEvents();
      set((state) => {
        state.trainings = trainings;
        state.isLoaded = true;
      });
    },
    addTrainingEvent: async (training) => {
      await insertTrainingEvent(training);
      set((state) => {
        state.trainings.push(training);
      });
    },
    removeTrainingEvent: async (id) => {
      await deleteTrainingEventRow(id);
      set((state) => {
        state.trainings = state.trainings.filter((t) => t.id !== id);
      });
    },
  }))
);
