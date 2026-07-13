-- Migración: agrega sede opcional a las capacitaciones (Calle 81 / Calle 93 / Planta).
-- Corre esto una sola vez en el SQL Editor de tu proyecto de Supabase ya existente —
-- instalaciones nuevas ya lo traen incluido en schema.sql. Es idempotente.

alter table trainings add column if not exists site_id text references sites(id);
