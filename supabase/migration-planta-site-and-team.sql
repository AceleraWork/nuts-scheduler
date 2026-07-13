-- Migración: agrega la sede "Planta" (producción de pastelería/donas) y el equipo que
-- trabaja ahí, más Camila/Karen/Kim que rotan entre Planta y los puntos en tareas
-- administrativas. Corre esto DESPUÉS de migration-employee-area-admin.sql (agrega el área
-- 'admin' que usan Camila/Karen/Kim). Corre esto una sola vez en el SQL Editor de tu
-- proyecto de Supabase ya existente — instalaciones nuevas ya lo traen incluido en
-- schema.sql. Es idempotente vía ON CONFLICT DO NOTHING.

alter table employees add column if not exists explicit_day_pattern jsonb;

insert into sites (id, name, volume, priority_days, home_employee_ids, notes) values
('planta', 'Planta', 'bajo', ARRAY[]::text[],
  ARRAY['emp-aura','emp-daniel','emp-deilis','emp-karo','emp-gabi','emp-vane'],
  ARRAY['Sede de producción (donas/pastelería). Contenido operativo completo pendiente de confirmar con la dueña.'])
on conflict (id) do nothing;

insert into employees (id, name, area, status, gender, skills, allowed_site_ids, rotates, can_open_alone, can_close_alone, explicit_day_pattern, notes, active) values
('emp-aura', 'Aura', 'cocina', 'activo', 'female',
  '[{"skill":"dulce","level":"competente"}]'::jsonb, ARRAY['planta'], false, true, true, null, null, true),
('emp-daniel', 'Daniel', 'cocina', 'activo', 'male',
  '[{"skill":"dulce","level":"competente"}]'::jsonb, ARRAY['planta'], false, true, true, null, null, true),
('emp-deilis', 'Deilis', 'cocina', 'activo', 'female',
  '[{"skill":"dulce","level":"competente"}]'::jsonb, ARRAY['planta'], false, true, true, null,
  ARRAY['Hace donas junto con Gabi — deben coincidir en Planta.'], true),
('emp-karo', 'Karo', 'cocina', 'activo', 'female',
  '[{"skill":"dulce","level":"competente"}]'::jsonb, ARRAY['planta'], false, true, true, null,
  ARRAY['Se queda más tarde que el resto del equipo de Planta.'], true),
('emp-gabi', 'Gabi', 'cocina', 'activo', 'female',
  '[{"skill":"dulce","level":"competente"}]'::jsonb, ARRAY['planta'], false, true, true, null,
  ARRAY['Hace donas junto con Deilis — deben coincidir en Planta.'], true),
('emp-vane', 'Vane', 'cocina', 'activo', 'female',
  '[{"skill":"dulce","level":"competente"}]'::jsonb, ARRAY['planta'], false, true, true, null,
  ARRAY['Actualmente en licencia de maternidad — usar "Nueva incapacidad" en su perfil cuando se tengan las fechas exactas.'], true),
('emp-camila', 'Camila', 'admin', 'activo', 'female',
  '[]'::jsonb, ARRAY['planta','calle-93','calle-81'], true, true, true,
  '{"martes":"calle-93","miercoles":"calle-81","jueves":"calle-93","viernes":"calle-81","sabado":"calle-93"}'::jsonb,
  ARRAY['Base en Planta; la mayoría de los días visita los puntos.'], true),
('emp-karen', 'Karen', 'admin', 'activo', 'female',
  '[]'::jsonb, ARRAY['planta','calle-93','calle-81'], true, true, true,
  '{"martes":"calle-93","jueves":"calle-81"}'::jsonb,
  ARRAY['Base en Planta; visita un punto 2 veces por semana.', 'Revisar temas de llegadas tarde.'], true),
('emp-kim', 'Kim', 'admin', 'activo', 'female',
  '[]'::jsonb, ARRAY['planta'], false, true, true, null, null, true)
on conflict (id) do nothing;

insert into soft_constraints (id, type, description, weight, enabled, employee_ids, site_id, day, params, source, created_at) values
('sc-pair-deilis-gabi-planta', 'pair-together-at-site', 'Deilis y Gabi juntas en Planta (hacen donas).', 8, true,
  ARRAY['emp-deilis','emp-gabi'], 'planta', null,
  '{"days":["lunes","martes","miercoles","jueves","viernes","sabado"]}'::jsonb, 'seed', now()),
('sc-karo-late-start', 'late-start-preference', 'Karo prefiere entrar/salir más tarde que el resto del equipo de Planta.', 5, true,
  ARRAY['emp-karo'], null, null, null, 'seed', now())
on conflict (id) do nothing;
