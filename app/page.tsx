"use client";

import { useEffect, useRef, useState } from "react";
import { usePanelRef } from "react-resizable-panels";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { SchedulePanel } from "@/components/schedule/SchedulePanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useUiStore } from "@/stores/useUiStore";
import { cn } from "@/lib/utils";

const COLLAPSE_ANIMATION_MS = 220;

export default function Home() {
  const isChatVisible = useUiStore((s) => s.isChatVisible);
  const chatPanelRef = usePanelRef();
  const [isAnimating, setIsAnimating] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setIsAnimating(true);
    if (isChatVisible) chatPanelRef.current?.expand();
    else chatPanelRef.current?.collapse();
    const timeout = setTimeout(() => setIsAnimating(false), COLLAPSE_ANIMATION_MS);
    return () => clearTimeout(timeout);
  }, [isChatVisible, chatPanelRef]);

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full">
      <ResizablePanel
        panelRef={chatPanelRef}
        collapsible
        collapsedSize="0%"
        defaultSize="32%"
        minSize="22%"
        maxSize="45%"
        className={cn("min-w-0", isAnimating && "transition-[flex-grow] duration-200 ease-out")}
      >
        <div className="h-full overflow-hidden border-r border-border bg-surface">
          <ChatPanel />
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize="68%" minSize="40%" className="min-w-0">
        <div className="h-full bg-surface">
          <SchedulePanel />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
