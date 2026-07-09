"use client";

import { useState } from "react";
import { ShieldCheck, Plus, Pencil, Trash2 } from "lucide-react";
import { PanelHeader } from "@/components/layout/PanelHeader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConstraintFormDialog } from "@/components/rules/ConstraintFormDialog";
import { useConstraintsStore } from "@/stores/useConstraintsStore";
import { useEmployeesStore } from "@/stores/useEmployeesStore";
import { useScheduleStore } from "@/stores/useScheduleStore";
import { getSiteName } from "@/stores/useSitesStore";
import { DAY_LABELS } from "@/types";
import type { HardConstraint, SoftConstraint } from "@/types";

const PRIORITY_ORDER = [
  "Cumplimiento de restricciones obligatorias",
  "Cobertura operativa",
  "Balance de horas (meta 44h/semana)",
  "Minimización de horas extra",
  "Preferencias individuales",
  "Combinaciones ideales",
];

type DialogState = { kind: "hard" | "soft"; editing: HardConstraint | SoftConstraint | null } | null;

export function RulesPanel() {
  const hardConstraints = useConstraintsStore((s) => s.hardConstraints);
  const softConstraints = useConstraintsStore((s) => s.softConstraints);
  const removeConstraint = useConstraintsStore((s) => s.removeConstraint);
  const employees = useEmployeesStore((s) => s.employees);
  const regenerate = useScheduleStore((s) => s.regenerate);
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const nameById = new Map(employees.map((e) => [e.id, e.name]));

  function scopeLabel(c: HardConstraint | SoftConstraint): string | null {
    const parts: string[] = [];
    if (c.employeeIds?.length) {
      parts.push(c.employeeIds.map((id) => nameById.get(id) ?? id).join(", "));
    }
    if (c.siteId) parts.push(getSiteName(c.siteId));
    if (c.day) parts.push(DAY_LABELS[c.day]);
    return parts.length ? parts.join(" · ") : null;
  }

  async function handleRemove(c: HardConstraint | SoftConstraint) {
    const confirmed = window.confirm(`¿Eliminar "${c.description}"? Se recalcularán los horarios.`);
    if (!confirmed) return;
    await removeConstraint(c.id);
    await regenerate();
  }

  return (
    <div className="flex h-full flex-col">
      <PanelHeader
        icon={ShieldCheck}
        title="Reglas"
        subtitle="Restricciones que sigue el motor de horarios"
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDialogState({ kind: "hard", editing: null })}
            >
              <Plus className="size-3.5" />
              Restricción
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDialogState({ kind: "soft", editing: null })}
            >
              <Plus className="size-3.5" />
              Preferencia
            </Button>
          </div>
        }
      />
      <ScrollArea className="h-full flex-1">
        <div className="space-y-6 p-4">
          <Card className="gap-2 p-4 ring-border">
            <p className="label-caps text-ink-faint">Orden de prioridad del motor</p>
            <ol className="list-inside list-decimal space-y-1 text-sm text-ink-soft">
              {PRIORITY_ORDER.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
          </Card>

          <section className="space-y-2">
            <p className="label-caps px-1 text-ink-faint">
              Restricciones duras ({hardConstraints.length})
            </p>
            {hardConstraints.length === 0 ? (
              <p className="px-1 text-sm text-ink-mute">Ninguna todavía.</p>
            ) : (
              <div className="space-y-2">
                {hardConstraints.map((c) => (
                  <Card key={c.id} className="gap-1 p-3 ring-border">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-ink">{c.description}</p>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Editar"
                          onClick={() => setDialogState({ kind: "hard", editing: c })}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Eliminar"
                          onClick={() => handleRemove(c)}
                          className="text-ink-mute hover:text-danger"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    {scopeLabel(c) && <p className="text-xs text-ink-mute">{scopeLabel(c)}</p>}
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-2">
            <p className="label-caps px-1 text-ink-faint">
              Preferencias / restricciones blandas ({softConstraints.length})
            </p>
            {softConstraints.length === 0 ? (
              <p className="px-1 text-sm text-ink-mute">Ninguna todavía.</p>
            ) : (
              <div className="space-y-2">
                {softConstraints.map((c) => (
                  <Card key={c.id} className="gap-1 p-3 ring-border">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-ink">{c.description}</p>
                      <div className="flex shrink-0 items-center gap-1">
                        <Badge
                          variant="outline"
                          className={
                            c.enabled
                              ? "border-olive/30 bg-olive-soft text-[#3f4a2e]"
                              : "border-border text-ink-mute"
                          }
                        >
                          {c.enabled ? `Peso ${c.weight}` : "Deshabilitada"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Editar"
                          onClick={() => setDialogState({ kind: "soft", editing: c })}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Eliminar"
                          onClick={() => handleRemove(c)}
                          className="text-ink-mute hover:text-danger"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    {scopeLabel(c) && <p className="text-xs text-ink-mute">{scopeLabel(c)}</p>}
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </ScrollArea>

      <ConstraintFormDialog
        open={dialogState !== null}
        onOpenChange={(open) => !open && setDialogState(null)}
        kind={dialogState?.kind ?? "hard"}
        editing={dialogState?.editing}
      />
    </div>
  );
}
