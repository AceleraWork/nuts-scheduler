"use client";

import { useState } from "react";
import { ArrowUp, RotateCcw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/stores/useChatStore";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const messageCount = useChatStore((s) => s.messages.length);
  const clearMessages = useChatStore((s) => s.clearMessages);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <div className="flex items-end gap-2 border-t border-border p-3">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="Genera el horario de la próxima semana…"
        className="min-h-10 flex-1 resize-none bg-surface-soft"
        rows={1}
      />
      <Button
        variant="outline"
        size="icon"
        aria-label="Reiniciar conversación"
        onClick={clearMessages}
        disabled={disabled || messageCount === 0}
      >
        <RotateCcw className="size-4" />
      </Button>
      <Button size="icon" onClick={handleSubmit} disabled={disabled || !value.trim()}>
        <ArrowUp className="size-4" />
      </Button>
    </div>
  );
}
