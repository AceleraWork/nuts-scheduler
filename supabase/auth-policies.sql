-- Nuts About You — Horarios: restringe el acceso a la base de datos a usuarios
-- autenticados (antes cualquiera con la anon key podía leer/escribir todo).
-- Corre esto en el SQL Editor DESPUÉS de crear el usuario Admin en
-- Authentication > Users.

drop policy if exists "allow all sites" on sites;
drop policy if exists "allow all employees" on employees;
drop policy if exists "allow all hard_constraints" on hard_constraints;
drop policy if exists "allow all soft_constraints" on soft_constraints;
drop policy if exists "allow all trainings" on trainings;
drop policy if exists "allow all schedule_options" on schedule_options;
drop policy if exists "allow all shifts" on shifts;

create policy "authenticated only sites" on sites for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated only employees" on employees for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated only hard_constraints" on hard_constraints for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated only soft_constraints" on soft_constraints for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated only trainings" on trainings for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated only schedule_options" on schedule_options for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated only shifts" on shifts for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
