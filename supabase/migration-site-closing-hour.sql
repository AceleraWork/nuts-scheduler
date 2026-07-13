-- Migración: agrega hora de cierre por día a las sedes (ej. Calle 93 cierra a las 5PM
-- los domingos). Corre esto una sola vez en el SQL Editor de tu proyecto de Supabase ya
-- existente — instalaciones nuevas ya lo traen incluido en schema.sql. Es idempotente.

alter table sites add column if not exists closing_hour_by_day jsonb;

update sites
set closing_hour_by_day = '{"domingo":"5PM"}'::jsonb
where id = 'calle-93' and closing_hour_by_day is null;
