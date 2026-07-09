import { supabase } from "@/lib/supabase/client";
import { trainingFromRow, trainingToRow } from "@/lib/supabase/mappers";
import type { TrainingEvent } from "@/types";

export async function getTrainingEvents(): Promise<TrainingEvent[]> {
  const { data, error } = await supabase.from("trainings").select("*").order("date");
  if (error) throw error;
  return (data ?? []).map(trainingFromRow);
}

export async function insertTrainingEvent(training: TrainingEvent): Promise<void> {
  const { error } = await supabase.from("trainings").insert(trainingToRow(training));
  if (error) throw error;
}

export async function deleteTrainingEventRow(id: string): Promise<void> {
  const { error } = await supabase.from("trainings").delete().eq("id", id);
  if (error) throw error;
}
