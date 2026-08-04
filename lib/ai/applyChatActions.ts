import type { ChatAction } from "@/lib/ai/chatActionSchema";
import { useConstraintsStore } from "@/stores/useConstraintsStore";
import { useScheduleStore, selectActiveOption } from "@/stores/useScheduleStore";
import { useLeavesStore } from "@/stores/useLeavesStore";
import { parseHour12 } from "@/lib/time/formatTime";
import { getSiteName } from "@/stores/useSitesStore";
import {
  isCustomDirectiveType,
  isDaylessEmployeeDayOff,
  constraintIdentityKey,
} from "@/lib/ai/constraintValidation";
import type { Shift } from "@/types";

// Mismo color por defecto que EmployeeLeaveDialog.tsx (creación manual de incapacidades),
// para que una licencia creada por chat se vea igual que una creada a mano.
const DEFAULT_LEAVE_COLOR = "#c0788a";

let actionCounter = 0;
function nextId(prefix: string): string {
  actionCounter += 1;
  return `${prefix}-chat-${Date.now()}-${actionCounter}`;
}

/** "custom-hard-directive"/"custom-chat-directive" son campos informativos del panel de
 * reglas — el motor de horarios nunca los evalúa (ver lib/solver/rules/hardRules.ts y
 * softRules.ts, ambos con evaluate: () => []). El system prompt ya le dice al modelo que no
 * los use desde el chat, y route.ts los rechaza y pide un reintento antes de llegar aquí,
 * pero si de todos modos llegan (reintento agotado), la confirmación no debe sonar como si
 * el horario fuera a cambiar por esto. Lo mismo para "employee-day-off" sin "day": sin día,
 * forcedDaysOffFor/hardRules la ignoran por completo (ver assign.ts).
 */
function hardConstraintNoOpWarning(payload: { type: string; day?: string }): string | null {
  if (isCustomDirectiveType(payload.type)) {
    return " (nota: este tipo es solo informativo, no lo aplica el motor de horarios automáticamente)";
  }
  if (isDaylessEmployeeDayOff(payload)) {
    return " (⚠ sin un día específico esta restricción no tiene ningún efecto en el horario)";
  }
  return null;
}

function softConstraintNoOpWarning(payload: { type: string }): string | null {
  if (isCustomDirectiveType(payload.type)) {
    return " (nota: este tipo es solo informativo, no lo aplica el motor de horarios automáticamente)";
  }
  return null;
}

export interface AppliedAction {
  action: ChatAction;
  summary: string;
}

/** Aplica las acciones en orden y espera cada una antes de la siguiente: regenerate_schedules
 * necesita leer el estado ya persistido de las restricciones agregadas justo antes. */
export async function applyChatActions(actions: ChatAction[]): Promise<AppliedAction[]> {
  const applied: AppliedAction[] = [];

  for (const action of actions) {
    switch (action.type) {
      case "add_hard_constraint": {
        const { hardConstraints, addHardConstraint, updateHardConstraint } = useConstraintsStore.getState();
        // Evita apilar duplicados cuando el mismo empleado/día/sede se vuelve a mencionar en
        // la conversación (reformulación, corrección) — actualiza la regla existente en vez
        // de crear otra. Los tipos "custom-*-directive" quedan fuera: son notas libres sin
        // más identidad que su texto (ver constraintValidation.ts).
        const existing = isCustomDirectiveType(action.payload.type)
          ? undefined
          : hardConstraints.find((c) => constraintIdentityKey(c) === constraintIdentityKey(action.payload));
        if (existing) {
          await updateHardConstraint({ ...existing, ...action.payload });
        } else {
          await addHardConstraint({
            ...action.payload,
            id: nextId("hc"),
            source: "chat",
            createdAt: new Date().toISOString(),
          });
        }
        applied.push({
          action,
          summary: `${existing ? "Restricción actualizada (ya existía una igual)" : "Restricción agregada"}: ${action.payload.description}${hardConstraintNoOpWarning(action.payload) ?? ""}`,
        });
        break;
      }
      case "add_soft_constraint": {
        const { softConstraints, addSoftConstraint, updateSoftConstraint } = useConstraintsStore.getState();
        const existing = isCustomDirectiveType(action.payload.type)
          ? undefined
          : softConstraints.find((c) => constraintIdentityKey(c) === constraintIdentityKey(action.payload));
        if (existing) {
          await updateSoftConstraint({ ...existing, ...action.payload });
        } else {
          await addSoftConstraint({
            ...action.payload,
            id: nextId("sc"),
            source: "chat",
            createdAt: new Date().toISOString(),
          });
        }
        applied.push({
          action,
          summary: `${existing ? "Preferencia actualizada (ya existía una igual)" : "Preferencia agregada"}: ${action.payload.description}${softConstraintNoOpWarning(action.payload) ?? ""}`,
        });
        break;
      }
      case "remove_constraint": {
        await useConstraintsStore.getState().removeConstraint(action.payload.id);
        applied.push({ action, summary: "Restricción eliminada." });
        break;
      }
      case "update_constraint_weight": {
        await useConstraintsStore
          .getState()
          .updateSoftConstraintWeight(action.payload.id, action.payload.weight);
        applied.push({ action, summary: `Peso actualizado a ${action.payload.weight}.` });
        break;
      }
      case "set_priority": {
        await useConstraintsStore.getState().setTargetHours(action.payload.value);
        applied.push({
          action,
          summary: `Prioridad de horas objetivo ajustada a ${action.payload.value}h.`,
        });
        break;
      }
      case "add_leave": {
        await useLeavesStore.getState().addLeave({
          ...action.payload,
          id: nextId("leave"),
          color: DEFAULT_LEAVE_COLOR,
          createdAt: new Date().toISOString(),
        });
        applied.push({
          action,
          summary: `Incapacidad agregada: ${action.payload.label} (${action.payload.startDate} a ${action.payload.endDate}).`,
        });
        break;
      }
      case "regenerate_schedules": {
        await useScheduleStore.getState().regenerate();
        applied.push({ action, summary: "Horarios regenerados." });
        break;
      }
      case "move_shift": {
        const { employeeId, day, siteId, startTime, endTime, isDayOff, serviceTaskType } = action.payload;
        const option = selectActiveOption(useScheduleStore.getState());
        const shift = option?.shifts.find((s) => s.employeeId === employeeId && s.day === day);
        if (!option || !shift) {
          applied.push({
            action,
            summary: `No encontré el turno de ese día para aplicar el cambio.`,
          });
          break;
        }
        const patch: Partial<Shift> = {};
        if (isDayOff !== undefined) {
          patch.isDayOff = isDayOff;
        } else if (startTime || endTime || siteId || serviceTaskType) {
          // Si la IA pide un horario/sede/tarea concretos sin decir isDayOff, es porque
          // ese turno debe quedar trabajado — si el turno origen estaba en descanso, hay
          // que sacarlo de descanso explícitamente o Object.assign en updateShift deja el
          // horario nuevo pero isDayOff:true, y la grilla lo sigue mostrando como "Descanso".
          patch.isDayOff = false;
        }
        if (siteId) patch.siteId = siteId;
        if (startTime) patch.startMinutes = parseHour12(startTime);
        if (endTime) patch.endMinutes = parseHour12(endTime);
        if (serviceTaskType) patch.serviceTaskType = serviceTaskType;
        await useScheduleStore.getState().updateShift(option.id, shift.id, patch);
        applied.push({
          action,
          summary: serviceTaskType
            ? `Turno del ${day} asignado a ${serviceTaskType}.`
            : siteId
              ? `Turno movido a ${getSiteName(siteId)} el ${day}.`
              : `Turno del ${day} actualizado.`,
        });
        break;
      }
      case "no_action":
        break;
    }
  }

  return applied;
}
