import { CheckCircle2 } from "lucide-react";
import type { AppliedAction } from "@/lib/ai/applyChatActions";

export function ChatActionCard({ action }: { action: AppliedAction }) {
  if (action.action.type === "no_action") return null;
  return (
    <div className="flex items-start gap-1.5 rounded-lg border border-olive/25 bg-olive-soft px-2.5 py-1.5 text-xs text-[#3f4a2e]">
      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
      <span>{action.summary}</span>
    </div>
  );
}
