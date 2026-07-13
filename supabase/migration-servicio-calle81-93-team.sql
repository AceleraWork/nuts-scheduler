-- Migración: agrega al equipo de servicio de Calle 81 y Calle 93 que faltaba en el
-- sistema. Javier y Leonela ya existían (se ignoran). Sin datos operativos (habilidades,
-- apertura/cierre, género exacto) — se usan valores por defecto razonables, editables
-- luego desde el popover de edición o a mano en Supabase. Corre esto una sola vez en el
-- SQL Editor de tu proyecto de Supabase ya existente. Es idempotente vía ON CONFLICT DO
-- NOTHING.

insert into employees (id, name, area, status, gender, skills, allowed_site_ids, rotates, can_open_alone, can_close_alone, notes, active) values
('emp-david', 'David', 'servicio', 'activo', 'male',
  '[]'::jsonb, ARRAY['calle-81'], false, true, true,
  ARRAY['Agregado sin datos operativos completos (habilidades, apertura/cierre) — verificar con la dueña.'], true),
('emp-fabiana', 'Fabiana', 'servicio', 'activo', 'female',
  '[]'::jsonb, ARRAY['calle-81'], false, true, true,
  ARRAY['Agregada sin datos operativos completos (habilidades, apertura/cierre) — verificar con la dueña.'], true),
('emp-jeimy', 'Jeimy', 'servicio', 'activo', 'female',
  '[]'::jsonb, ARRAY['calle-81'], false, true, true,
  ARRAY['Agregada sin datos operativos completos (habilidades, apertura/cierre) — verificar con la dueña.'], true),
('emp-javi', 'Javi', 'servicio', 'activo', 'male',
  '[]'::jsonb, ARRAY['calle-81'], false, true, true,
  ARRAY['Agregado sin datos operativos completos (habilidades, apertura/cierre) — verificar con la dueña.'], true),
('emp-yei', 'Yei', 'servicio', 'activo', 'male',
  '[]'::jsonb, ARRAY['calle-81'], false, true, true,
  ARRAY['Agregado sin datos operativos completos (habilidades, apertura/cierre) — verificar con la dueña.'], true),
('emp-thays', 'Thays', 'servicio', 'activo', 'female',
  '[]'::jsonb, ARRAY['calle-93'], false, true, true,
  ARRAY['Agregada sin datos operativos completos (habilidades, apertura/cierre) — verificar con la dueña.'], true),
('emp-emanuel', 'Emanuel', 'servicio', 'activo', 'male',
  '[]'::jsonb, ARRAY['calle-93'], false, true, true,
  ARRAY['Agregado sin datos operativos completos (habilidades, apertura/cierre) — verificar con la dueña.'], true)
on conflict (id) do nothing;
