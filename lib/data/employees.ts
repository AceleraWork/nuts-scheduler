import { supabase } from "@/lib/supabase/client";
import { employeeFromRow, employeeToRow } from "@/lib/supabase/mappers";
import type { Employee } from "@/types";

export async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase.from("employees").select("*").order("name");
  if (error) throw error;
  return (data ?? []).map(employeeFromRow);
}

export async function updateEmployeeRow(employee: Employee): Promise<void> {
  const { error } = await supabase.from("employees").update(employeeToRow(employee)).eq("id", employee.id);
  if (error) throw error;
}

export async function insertEmployeeRow(employee: Employee): Promise<void> {
  const { error } = await supabase.from("employees").insert(employeeToRow(employee));
  if (error) throw error;
}

export async function deleteEmployeeRow(id: string): Promise<void> {
  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) throw error;
}
