-- Migración: permite guardar horarios de varias semanas (antes solo existía una fila
-- 'A'/'B'/'C' por opción, sin importar la semana — no había navegación entre semanas).
-- Corre esto una sola vez en el SQL Editor de tu proyecto de Supabase ya existente —
-- instalaciones nuevas ya lo traen incluido en schema.sql. Es idempotente: puedes
-- correrlo varias veces sin duplicar datos.

alter table schedule_options add column if not exists option_id text;
update schedule_options set option_id = id where option_id is null;
alter table schedule_options alter column option_id set not null;

-- Reescribe el id de cada fila a '{week_start_date}_{option_id}' para que sea único por
-- semana, y actualiza los turnos que apuntan a ese id (en ese orden, porque shifts tiene
-- una FK hacia schedule_options.id).
alter table shifts drop constraint if exists shifts_schedule_option_id_fkey;

update shifts s
set schedule_option_id = so.week_start_date::text || '_' || so.option_id
from schedule_options so
where s.schedule_option_id = so.id
  and so.id !~ '_';

update schedule_options
set id = week_start_date::text || '_' || option_id
where id !~ '_';

alter table shifts
  add constraint shifts_schedule_option_id_fkey
  foreign key (schedule_option_id) references schedule_options(id) on delete cascade;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'schedule_options_option_id_check'
  ) then
    alter table schedule_options
      add constraint schedule_options_option_id_check check (option_id in ('A', 'B', 'C'));
  end if;
end $$;

create unique index if not exists schedule_options_week_option_idx
  on schedule_options (week_start_date, option_id);
