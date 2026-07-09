"use client";

import { MessageCircle, AlertTriangle } from "lucide-react";
import { PanelHeader } from "@/components/layout/PanelHeader";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChatStore } from "@/stores/useChatStore";
import { useChatCompletion } from "@/hooks/useChatCompletion";

const EXAMPLE_PROMPTS = [
  "Genera el horario de la próxima semana",
  "Prioriza que todos tengan cerca de 44 horas",
  "Juan David no puede trabajar el viernes",
  "Necesito reforzar Calle 93 este fin de semana",
];

export function ChatPanel() {
  const messages = useChatStore((s) => s.messages);
  const isSending = useChatStore((s) => s.isSending);
  const error = useChatStore((s) => s.error);
  const { sendMessage } = useChatCompletion();

  return (
    <div className="flex h-full flex-col">
      <PanelHeader icon={MessageCircle} title="Chat IA" subtitle="Asistente de horarios" />

      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
          <div className="gradient-card flex size-11 items-center justify-center rounded-2xl">
            <MessageCircle className="size-5 text-ink-soft" strokeWidth={1.75} />
          </div>
          <div>
            <p className="font-display text-sm text-ink">Pídele horarios a la IA</p>
            <p className="text-sm text-ink-mute">Escribe en lenguaje natural, como estos ejemplos:</p>
          </div>
          <div className="flex flex-col gap-1.5 w-full">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="rounded-lg border border-border bg-surface-soft px-3 py-2 text-left text-sm text-ink-soft transition-colors hover:border-gold/40 hover:bg-gold-soft"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ChatMessageList messages={messages} isSending={isSending} />
      )}

      {error && (
        <div className="mx-3 mb-2 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}

      <ChatInput onSend={sendMessage} disabled={isSending} />
    </div>
  );
}
