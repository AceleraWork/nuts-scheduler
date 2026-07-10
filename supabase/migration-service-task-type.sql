-- Migración: agrega el tipo de servicio (Caja/Servicio/Rappi-Vitrina/Bebidas) a los turnos.
-- Corre esto una sola vez en el SQL Editor de tu proyecto de Supabase ya existente —
-- las instalaciones nuevas ya lo traen incluido en schema.sql.

alter table shifts add column if not exists service_task_type text;
