-- Migración: agrega el encargado de cada sede (para el nuevo apartado "Sedes"). Corre esto
-- una sola vez en el SQL Editor de tu proyecto de Supabase ya existente — instalaciones
-- nuevas ya lo traen incluido en schema.sql. Es idempotente. Sin FK a employees (mismo
-- patrón que home_employee_ids) para no depender del orden de creación de tablas.

alter table sites add column if not exists manager_id text;

update sites set manager_id = 'emp-kim' where id = 'calle-93' and manager_id is null;
