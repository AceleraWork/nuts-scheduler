import { supabase } from "@/lib/supabase/client";
import { leaveFromRow, leaveToRow } from "@/lib/supabase/mappers";
import type { EmployeeLeave } from "@/types";

export async function getLeaves(): Promise<EmployeeLeave[]> {
  const { data, error } = await supabase.from("employee_leaves").select("*").order("start_date");
  if (error) throw error;
  return (data ?? []).map(leaveFromRow);
}

export async function insertLeaveRow(leave: EmployeeLeave): Promise<void> {
  const { error } = await supabase.from("employee_leaves").insert(leaveToRow(leave));
  if (error) throw error;
}

export async function deleteLeaveRow(id: string): Promise<void> {
  const { error } = await supabase.from("employee_leaves").delete().eq("id", id);
  if (error) throw error;
}
