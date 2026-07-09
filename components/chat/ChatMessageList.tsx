"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import type { ChatMessage } from "@/types";

interface ChatMessageListProps {
  messages: ChatMessage[];
  isSending: boolean;
}

export function ChatMessageList({ messages, isSending }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isSending]);

  return (
    <ScrollArea className="h-full min-h-0 flex-1">
      <div className="flex flex-col gap-4 p-4">
        {messages.map((message) => (
          <ChatMessageBubble key={message.id} message={message} />
        ))}
        {isSending && (
          <div className="flex items-center gap-1.5 text-sm text-ink-mute">
            <span className="streaming-caret">Pensando</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
