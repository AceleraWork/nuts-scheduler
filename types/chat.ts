export type { ChatAction } from "@/lib/ai/chatActionSchema";
import type { AppliedAction } from "@/lib/ai/applyChatActions";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: AppliedAction[];
  createdAt: string;
}
