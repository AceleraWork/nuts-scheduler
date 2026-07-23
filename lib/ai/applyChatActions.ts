import type { ChatAction } from "@/lib/ai/chatActionSchema";
import { useConstraintsStore } from "@/stores/useConstraintsStore";
import { useScheduleStore, selectActiveOption } from "@/stores/useScheduleStore";
import { parseHour12 } from "@/lib/time/formatTime";
import { getSiteName } from "@/stores/useSitesStore";
import type { Shift } from "@/types";

let actionCounter = 0;
function nextId(prefix: string): string {
  actionCounter += 1;
  return `${prefix}-chat-${Date.now()}-${actionCounter}`;
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
        await useConstraintsStore.getState().addHardConstraint({
          ...action.payload,
          id: nextId("hc"),
          source: "chat",
          createdAt: new Date().toISOString(),
        });
        applied.push({ action, summary: `Restricción agregada: ${action.payload.description}` });
        break;
      }
      case "add_soft_constraint": {
        await useConstraintsStore.getState().addSoftConstraint({
          ...action.payload,
          id: nextId("sc"),
          source: "chat",
          createdAt: new Date().toISOString(),
        });
        applied.push({ action, summary: `Preferencia agregada: ${action.payload.description}` });
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
