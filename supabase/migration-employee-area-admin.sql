-- Migración: agrega 'admin' como área válida (Camila, Karen y Kim rotan entre Planta y
-- los puntos en tareas administrativas, no son cocina ni servicio). Corre esto ANTES de
-- migration-planta-site-and-team.sql. Corre esto una sola vez en el SQL Editor de tu
-- proyecto de Supabase ya existente — instalaciones nuevas ya lo traen incluido en
-- schema.sql. Es idempotente.

alter table employees drop constraint if exists employees_area_check;
alter table employees add constraint employees_area_check check (area in ('cocina', 'servicio', 'admin'));

alter table shifts drop constraint if exists shifts_area_check;
alter table shifts add constraint shifts_area_check check (area in ('cocina', 'servicio', 'admin'));
