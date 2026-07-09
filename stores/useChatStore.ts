import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ChatMessage } from "@/types";

interface ChatState {
  messages: ChatMessage[];
  isSending: boolean;
  error: string | null;
  addMessage: (message: ChatMessage) => void;
  setSending: (isSending: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  immer((set) => ({
    messages: [],
    isSending: false,
    error: null,
    addMessage: (message) =>
      set((state) => {
        state.messages.push(message);
      }),
    setSending: (isSending) =>
      set((state) => {
        state.isSending = isSending;
      }),
    setError: (error) =>
      set((state) => {
        state.error = error;
      }),
    clearMessages: () =>
      set((state) => {
        state.messages = [];
        state.error = null;
      }),
  }))
);
