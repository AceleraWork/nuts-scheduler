-- Migración: incapacidades/licencias por empleado (rango de fechas + nombre + color).
-- El solver no asigna turnos a un empleado en los días cubiertos por una incapacidad
-- activa. Corre esto una sola vez en el SQL Editor de tu proyecto de Supabase ya existente
-- — instalaciones nuevas ya lo traen incluido en schema.sql. Es idempotente.

create table if not exists employee_leaves (
  id text primary key,
  employee_id text not null references employees(id) on delete cascade,
  label text not null,
  start_date date not null,
  end_date date not null,
  color text not null default '#c0788a',
  created_at timestamptz not null default now()
);

-- El proyecto real ya corrió auth-policies.sql (acceso solo autenticado) en las demás
-- tablas, así que esta tabla nueva se crea directo con esa misma política, sin pasar por
-- un estado intermedio de "allow all" público.
alter table employee_leaves enable row level security;
create policy "authenticated only employee_leaves" on employee_leaves for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table shifts add column if not exists leave_id text references employee_leaves(id);
