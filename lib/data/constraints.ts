import { supabase } from "@/lib/supabase/client";
import {
  hardConstraintFromRow,
  hardConstraintToRow,
  softConstraintFromRow,
  softConstraintToRow,
} from "@/lib/supabase/mappers";
import type { HardConstraint, SoftConstraint } from "@/types";

export async function getHardConstraints(): Promise<HardConstraint[]> {
  const { data, error } = await supabase.from("hard_constraints").select("*");
  if (error) throw error;
  return (data ?? []).map(hardConstraintFromRow);
}

export async function getSoftConstraints(): Promise<SoftConstraint[]> {
  const { data, error } = await supabase.from("soft_constraints").select("*");
  if (error) throw error;
  return (data ?? []).map(softConstraintFromRow);
}

export async function insertHardConstraint(constraint: HardConstraint): Promise<void> {
  const { error } = await supabase.from("hard_constraints").insert(hardConstraintToRow(constraint));
  if (error) throw error;
}

export async function insertSoftConstraint(constraint: SoftConstraint): Promise<void> {
  const { error } = await supabase.from("soft_constraints").insert(softConstraintToRow(constraint));
  if (error) throw error;
}

export async function updateSoftConstraintWeightRow(id: string, weight: number): Promise<void> {
  const { error } = await supabase.from("soft_constraints").update({ weight }).eq("id", id);
  if (error) throw error;
}

export async function updateHardConstraintRow(constraint: HardConstraint): Promise<void> {
  const { id, ...rest } = hardConstraintToRow(constraint);
  const { error } = await supabase.from("hard_constraints").update(rest).eq("id", id as string);
  if (error) throw error;
}

export async function updateSoftConstraintRow(constraint: SoftConstraint): Promise<void> {
  const { id, ...rest } = softConstraintToRow(constraint);
  const { error } = await supabase.from("soft_constraints").update(rest).eq("id", id as string);
  if (error) throw error;
}

export async function updateSoftConstraintParamsRow(
  id: string,
  params: Record<string, unknown>,
  weight: number
): Promise<void> {
  const { error } = await supabase.from("soft_constraints").update({ params, weight }).eq("id", id);
  if (error) throw error;
}

export async function deleteConstraintRow(id: string): Promise<void> {
  const [hard, soft] = await Promise.all([
    supabase.from("hard_constraints").delete().eq("id", id),
    supabase.from("soft_constraints").delete().eq("id", id),
  ]);
  if (hard.error) throw hard.error;
  if (soft.error) throw soft.error;
}
