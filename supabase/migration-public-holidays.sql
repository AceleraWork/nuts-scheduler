-- Migración: festivos de Colombia, usados para mostrar una barra informativa en el
-- horario (no bloquea turnos, solo avisa a quien arma el horario). Se llenan desde la
-- API gratuita Nager.Date (date.nager.at) la primera vez que se necesita un año, y desde
-- ahí quedan cacheados acá. Corre esto una sola vez en el SQL Editor de tu proyecto de
-- Supabase ya existente — instalaciones nuevas ya lo traen incluido en schema.sql. Es
-- idempotente.

create table if not exists public_holidays (
  date date primary key,
  name text not null
);

-- El proyecto real ya corrió auth-policies.sql (acceso solo autenticado) en las demás
-- tablas, así que esta tabla nueva se crea directo con esa misma política, sin pasar por
-- un estado intermedio de "allow all" público.
alter table public_holidays enable row level security;
create policy "authenticated only public_holidays" on public_holidays for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
