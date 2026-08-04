import { CUSTOM_TYPES } from "@/lib/constraints/labels";
import type { ChatResponse } from "@/lib/ai/chatActionSchema";

/** "custom-hard-directive"/"custom-chat-directive": tipos informativos del panel de reglas,
 * nunca evaluados por el motor de horarios (evaluate: () => [] en hardRules.ts/softRules.ts). */
export function isCustomDirectiveType(type: string): boolean {
  return (CUSTOM_TYPES as string[]).includes(type);
}

/** "employee-day-off" sin "day" es un no-op: hardRules.ts y assign.ts (forcedDaysOffFor)
 * ambos requieren un "day" concreto para que la restricción tenga cualquier efecto. */
export function isDaylessEmployeeDayOff(payload: { type: string; day?: string }): boolean {
  return payload.type === "employee-day-off" && !payload.day;
}

function normalizeIds(ids?: string[]): string {
  return ids && ids.length > 0 ? [...ids].sort().join(",") : "";
}

function extraIdentityKey(type: string, params?: Record<string, unknown>): string {
  if (type === "target-weekly-hours") return `area:${(params?.area as string) ?? ""}`;
  if (type === "preferred-day-off-range") {
    const days = (params?.days as string[] | undefined) ?? [];
    return `days:${[...days].sort().join(",")}`;
  }
  return "";
}

/** Firma que identifica "la misma regla" para poder actualizarla en vez de duplicarla cuando
 * el chat la vuelve a mencionar (ej. la dueña reformula o corrige una restricción ya creada
 * en un mensaje anterior de la misma conversación). Deliberadamente NO incluye "description"
 * (texto libre que puede cambiar de redacción sin que la regla sea distinta), ni pesos/flags
 * (esos sí deben poder actualizarse). Los tipos "custom-*-directive" quedan fuera de este
 * cálculo (ver isCustomDirectiveType en el llamador): son notas libres sin más identidad que
 * su texto — agruparlas por "type" a secas colapsaría todas las notas en una sola. */
export function constraintIdentityKey(payload: {
  type: string;
  employeeIds?: string[];
  siteId?: string;
  day?: string;
  params?: Record<string, unknown>;
}): string {
  return [
    payload.type,
    normalizeIds(payload.employeeIds),
    payload.siteId ?? "",
    payload.day ?? "",
    extraIdentityKey(payload.type, payload.params),
  ].join("|");
}

/** Valida las acciones ANTES de aplicarlas (llamado desde app/api/chat/route.ts, sobre la
 * respuesta cruda del modelo) para poder pedirle un reintento con el problema concreto en
 * vez de solo mostrar una advertencia después de guardar. No reemplaza el aviso de
 * applyChatActions.ts (ese sigue siendo la red de seguridad si el reintento también falla),
 * es la primera línea de defensa. */
export function findSemanticIssues(response: ChatResponse): string[] {
  const issues: string[] = [];
  for (const action of response.actions) {
    if (action.type === "add_hard_constraint") {
      if (isCustomDirectiveType(action.payload.type)) {
        issues.push(
          `- add_hard_constraint con type "${action.payload.type}" para "${action.payload.description}": este tipo es solo informativo, el motor de horarios NUNCA lo aplica. Si algún otro tipo de la lista encaja de verdad úsalo; si no, usa "no_action" y explica en "reply" por qué no se puede representar todavía.`
        );
      } else if (isDaylessEmployeeDayOff(action.payload)) {
        issues.push(
          `- add_hard_constraint "employee-day-off" para "${action.payload.description}" sin "day": sin un día concreto no tiene ningún efecto en el horario. Si es para varios días o toda la semana (ej. una licencia/incapacidad), usa "add_leave" en vez de "employee-day-off".`
        );
      }
    } else if (action.type === "add_soft_constraint" && isCustomDirectiveType(action.payload.type)) {
      issues.push(
        `- add_soft_constraint con type "${action.payload.type}" para "${action.payload.description}": este tipo es solo informativo, el motor de horarios NUNCA lo aplica. Usa "no_action" si ningún otro tipo encaja.`
      );
    }
  }
  return issues;
}
