import { CalendarPlus } from "lucide-react";

export function EmptyWeekState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-16 text-center">
      <CalendarPlus className="size-6 text-ink-faint" strokeWidth={1.5} />
      <p className="text-sm text-ink-mute">Todavía no hay un horario guardado para esta semana.</p>
      <p className="text-xs text-ink-faint">Usa &quot;Generar horarios&quot; para crear uno nuevo.</p>
    </div>
  );
}
