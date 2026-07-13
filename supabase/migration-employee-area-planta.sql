-- Migración: agrega 'planta' como área válida y separa al equipo de Planta (que hoy vive
-- como área 'cocina') en su propia categoría. Corre esto DESPUÉS de
-- migration-planta-site-and-team.sql (crea la sede planta y ese equipo). Corre esto una
-- sola vez en el SQL Editor de tu proyecto de Supabase ya existente — instalaciones nuevas
-- ya lo traen incluido en schema.sql. Es idempotente.

alter table employees drop constraint if exists employees_area_check;
alter table employees add constraint employees_area_check check (area in ('cocina', 'servicio', 'admin', 'planta'));

alter table shifts drop constraint if exists shifts_area_check;
alter table shifts add constraint shifts_area_check check (area in ('cocina', 'servicio', 'admin', 'planta'));

update employees set area = 'planta'
where id in ('emp-aura', 'emp-daniel', 'emp-deilis', 'emp-karo', 'emp-gabi', 'emp-vane')
  and area = 'cocina';

update shifts set area = 'planta'
where employee_id in ('emp-aura', 'emp-daniel', 'emp-deilis', 'emp-karo', 'emp-gabi', 'emp-vane')
  and area = 'cocina';
