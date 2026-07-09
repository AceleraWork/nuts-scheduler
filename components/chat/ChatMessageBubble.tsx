import { cn } from "@/lib/utils";
import { ChatActionCard } from "@/components/chat/ChatActionCard";
import type { ChatMessage } from "@/types";

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex flex-col gap-1.5", isUser && "items-end")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
          isUser ? "bg-gold text-[#2a1706]" : "bg-surface-soft text-ink ring-1 ring-border"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose-msg whitespace-pre-wrap">{message.content}</div>
        )}
      </div>
      {message.actions && message.actions.length > 0 && (
        <div className="flex max-w-[85%] flex-col gap-1">
          {message.actions.map((action, i) => (
            <ChatActionCard key={i} action={action} />
          ))}
        </div>
      )}
    </div>
  );
}
