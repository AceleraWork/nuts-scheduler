"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, Loader2, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/auth/LoginForm";
import { NotificationsBell } from "@/components/layout/NotificationsBell";
import { supabase } from "@/lib/supabase/client";
import { signOut } from "@/lib/supabase/auth";
import { useEmployeesStore } from "@/stores/useEmployeesStore";
import { useConstraintsStore } from "@/stores/useConstraintsStore";
import { useSitesStore } from "@/stores/useSitesStore";
import { useTrainingsStore } from "@/stores/useTrainingsStore";
import { useLeavesStore } from "@/stores/useLeavesStore";
import { useHolidaysStore } from "@/stores/useHolidaysStore";
import { useScheduleStore } from "@/stores/useScheduleStore";
import { useUiStore } from "@/stores/useUiStore";

interface AppShellProps {
  children: React.ReactNode;
}

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/personal", label: "Personal" },
  { href: "/sedes", label: "Sedes" },
  { href: "/reglas", label: "Reglas" },
];

type LoadState = "checking-auth" | "unauthenticated" | "loading-data" | "ready" | "error";

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isChatVisible = useUiStore((s) => s.isChatVisible);
  const toggleChat = useUiStore((s) => s.toggleChat);
  const [loadState, setLoadState] = useState<LoadState>("checking-auth");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        await Promise.all([
          useEmployeesStore.getState().initialize(),
          useConstraintsStore.getState().initialize(),
          useSitesStore.getState().initialize(),
          useTrainingsStore.getState().initialize(),
          useLeavesStore.getState().initialize(),
          useHolidaysStore.getState().initialize(),
        ]);
        await useScheduleStore.getState().initialize();
        if (!cancelled) setLoadState("ready");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error desconocido conectando a Supabase.");
          setLoadState("error");
        }
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        setLoadState("loading-data");
        loadData();
      } else {
        setLoadState("unauthenticated");
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "SIGNED_IN" && session) {
        setLoadState("loading-data");
        loadData();
      } else if (event === "SIGNED_OUT") {
        setLoadState("unauthenticated");
      }
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  if (loadState === "checking-auth") {
    return <div className="h-dvh bg-canvas" />;
  }

  if (loadState === "unauthenticated") {
    return <LoginForm />;
  }

  if (loadState === "loading-data") {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-canvas">
        <Loader2 className="size-5 animate-spin text-ink-soft" />
        <p className="text-sm text-ink-mute">Cargando datos…</p>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-canvas px-6 text-center">
        <AlertTriangle className="size-6 text-danger" />
        <p className="font-display text-sm text-ink">No se pudo conectar a Supabase</p>
        <p className="max-w-md text-sm text-ink-mute">{error}</p>
        <p className="max-w-md text-xs text-ink-faint">
          Verifica que hayas corrido supabase/schema.sql, supabase/seed.sql y
          supabase/auth-policies.sql en el SQL Editor de tu proyecto.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-canvas">
      <header className="flex items-center gap-2.5 border-b border-border px-5 py-3">
        <Image src="/logo.png" alt="Nuts About You" width={24} height={24} className="rounded-full" />
        <span className="font-display text-base text-ink">Nuts About You</span>
        <nav className="ml-3 flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-surface-soft font-medium text-ink"
                    : "text-ink-mute hover:text-ink"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        {pathname === "/" && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={isChatVisible ? "Ocultar chat" : "Mostrar chat"}
            onClick={toggleChat}
            className="ml-1 text-ink-mute hover:text-ink"
          >
            {isChatVisible ? (
              <PanelLeftClose className="size-3.5" />
            ) : (
              <PanelLeftOpen className="size-3.5" />
            )}
          </Button>
        )}
        <div className="ml-auto flex items-center gap-1">
          <NotificationsBell />
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="size-3.5" />
            Cerrar sesión
          </Button>
        </div>
      </header>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
