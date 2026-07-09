import { create } from "zustand";

interface UiState {
  isChatVisible: boolean;
  toggleChat: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isChatVisible: true,
  toggleChat: () => set((s) => ({ isChatVisible: !s.isChatVisible })),
}));
