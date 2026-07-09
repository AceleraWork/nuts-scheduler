import { useCallback } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useEmployeesStore } from "@/stores/useEmployeesStore";
import { useConstraintsStore } from "@/stores/useConstraintsStore";
import { useSitesStore } from "@/stores/useSitesStore";
import { applyChatActions } from "@/lib/ai/applyChatActions";
import type { ChatStateSnapshot } from "@/lib/ai/systemPrompt";
import type { ChatMessage } from "@/types";

function buildSnapshot(): ChatStateSnapshot {
  const { employees } = useEmployeesStore.getState();
  const { hardConstraints, softConstraints } = useConstraintsStore.getState();
  const { sites } = useSitesStore.getState();
  return {
    employees: employees.map((e) => ({ id: e.id, name: e.name, area: e.area, status: e.status })),
    sites: sites.map((s) => ({ id: s.id, name: s.name })),
    hardConstraints: hardConstraints.map((c) => ({ id: c.id, description: c.description })),
    softConstraints: softConstraints.map((c) => ({
      id: c.id,
      description: c.description,
      weight: c.weight,
      enabled: c.enabled,
    })),
  };
}

export function useChatCompletion() {
  const sendMessage = useCallback(async (content: string) => {
    const chat = useChatStore.getState();
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    chat.addMessage(userMessage);
    chat.setError(null);
    chat.setSending(true);

    try {
      const history = [...chat.messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, stateSnapshot: buildSnapshot() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "Error llamando al asistente.");
      }
      const appliedActions = await applyChatActions(data.actions ?? []);
      useChatStore.getState().addMessage({
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: data.reply,
        actions: appliedActions,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      useChatStore.getState().setError(error instanceof Error ? error.message : "Error desconocido.");
    } finally {
      useChatStore.getState().setSending(false);
    }
  }, []);

  return { sendMessage };
}
