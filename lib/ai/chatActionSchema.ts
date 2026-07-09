import { z } from "zod";

// Enums duplicados a mano (no importados de types/constraint.ts) para evitar un ciclo de
// imports con types/chat.ts. Si se agrega un tipo de restricción nuevo, actualizar ambos lados.
const dayOfWeekSchema = z.enum([
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
]);

const siteIdSchema = z.enum(["calle-93", "calle-81"]);

const hardConstraintTypeSchema = z.enum([
  "employee-never-at-site",
  "min-one-day-off",
  "cannot-open-alone",
  "cannot-close-alone",
  "onboarding-not-alone-critical",
  "skill-required-for-task",
  "employee-day-off",
  "employee-blocked-by-training",
]);

const softConstraintTypeSchema = z.enum([
  "early-leave-preference",
  "late-start-preference",
  "preferred-day-off-range",
  "pair-together-at-site",
  "target-weekly-hours",
  "site-reinforcement",
  "custom-chat-directive",
]);

const addHardConstraintPayloadSchema = z.object({
  type: hardConstraintTypeSchema,
  description: z.string(),
  employeeIds: z.array(z.string()).optional(),
  siteId: siteIdSchema.optional(),
  day: dayOfWeekSchema.optional(),
  params: z.record(z.string(), z.unknown()).optional(),
});

const addSoftConstraintPayloadSchema = z.object({
  type: softConstraintTypeSchema,
  description: z.string(),
  weight: z.number().min(1).max(10),
  enabled: z.boolean(),
  employeeIds: z.array(z.string()).optional(),
  siteId: siteIdSchema.optional(),
  day: dayOfWeekSchema.optional(),
  params: z.record(z.string(), z.unknown()).optional(),
});

export const chatActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("add_hard_constraint"), payload: addHardConstraintPayloadSchema }),
  z.object({ type: z.literal("add_soft_constraint"), payload: addSoftConstraintPayloadSchema }),
  z.object({ type: z.literal("remove_constraint"), payload: z.object({ id: z.string() }) }),
  z.object({
    type: z.literal("update_constraint_weight"),
    payload: z.object({ id: z.string(), weight: z.number().min(1).max(10) }),
  }),
  z.object({
    type: z.literal("regenerate_schedules"),
    payload: z.object({ reason: z.string().optional() }),
  }),
  z.object({
    type: z.literal("set_priority"),
    payload: z.object({ kind: z.literal("target-hours"), value: z.number() }),
  }),
  z.object({
    type: z.literal("move_shift"),
    payload: z.object({
      employeeId: z.string(),
      day: dayOfWeekSchema,
      siteId: siteIdSchema.optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      isDayOff: z.boolean().optional(),
    }),
  }),
  z.object({ type: z.literal("no_action"), payload: z.object({}).optional() }),
]);

export const chatResponseSchema = z.object({
  reply: z.string(),
  actions: z.array(chatActionSchema),
});

export type ChatAction = z.infer<typeof chatActionSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
