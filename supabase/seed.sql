-- Nuts About You — Horarios: datos semilla.
-- Corre esto DESPUÉS de schema.sql, en el mismo SQL Editor.

insert into sites (id, name, volume, kitchen_min_staff_by_day, priority_days, stock_coverage_by, home_employee_ids, notes) values
('calle-93', 'Calle 93', 'alto', '{"jueves":3,"viernes":3,"sabado":3}'::jsonb, ARRAY['viernes','sabado'], '9AM', null,
  ARRAY['Días fuertes: jueves, viernes, sábado y domingo.','A las 9AM debe existir cobertura suficiente para recibir stock.','Viernes y sábado son prioritarios para cobertura completa.']),
('calle-81', 'Calle 81', 'bajo', null, ARRAY[]::text[], null, ARRAY['emp-debora'],
  ARRAY['Débora normalmente trabaja aquí.','Juan David nunca trabaja aquí.','Yeimi rota entre sedes.']);

insert into employees (id, name, area, status, gender, skills, allowed_site_ids, rotates, can_open_alone, can_close_alone, early_leave_preferences, notes, active) values
('emp-rosa', 'Rosa', 'cocina', 'activo', 'female',
  '[{"skill":"salado","level":"competente"},{"skill":"dulce","level":"experto"}]'::jsonb,
  ARRAY['calle-93','calle-81'], false, true, true, null,
  ARRAY['Más fuerte en dulce.'], true),
('emp-juan-david', 'Juan David', 'cocina', 'activo', 'male',
  '[{"skill":"salado","level":"experto"},{"skill":"dulce","level":"aprendiz"}]'::jsonb,
  ARRAY['calle-93'], false, true, true, null,
  ARRAY['Fuerte en salado, débil en dulce.','Nunca trabaja en Calle 81.'], true),
('emp-luisa', 'Luisa', 'cocina', 'onboarding', 'female',
  '[{"skill":"salado","level":"aprendiz"},{"skill":"dulce","level":"aprendiz"}]'::jsonb,
  ARRAY['calle-93','calle-81'], false, false, false,
  '[{"day":"miercoles","leaveBy":"4PM","strict":true},{"day":"viernes","leaveBy":"4PM","strict":false}]'::jsonb,
  ARRAY['Nueva, en aprendizaje.','No dejar sola en situaciones críticas.'], true),
('emp-moni', 'Moni', 'cocina', 'activo', 'female',
  '[{"skill":"salado","level":"competente"},{"skill":"dulce","level":"competente"}]'::jsonb,
  ARRAY['calle-93','calle-81'], false, true, true, null,
  ARRAY['Muy rápida.','Prefiere entrar tarde entre semana.'], true),
('emp-debora', 'Débora', 'cocina', 'activo', 'female',
  '[{"skill":"salado","level":"competente"}]'::jsonb,
  ARRAY['calle-81','calle-93'], false, true, true, null,
  ARRAY['Pendiente clasificación definitiva de habilidades.','Normalmente trabaja en Calle 81.'], true),
('emp-yeimi', 'Yeimi', 'servicio', 'activo', 'female',
  '[{"skill":"apertura","level":"competente"},{"skill":"cafe","level":"competente"},{"skill":"rappi","level":"competente"},{"skill":"cierre","level":"competente"}]'::jsonb,
  ARRAY['calle-93','calle-81'], true, true, true, null,
  ARRAY['Rota entre sedes.'], true),
('emp-javier', 'Javier', 'servicio', 'activo', 'male',
  '[{"skill":"apertura","level":"competente"},{"skill":"cafe","level":"competente"},{"skill":"rappi","level":"competente"},{"skill":"cierre","level":"competente"}]'::jsonb,
  ARRAY['calle-93','calle-81'], true, true, true, null,
  ARRAY['Rota entre sedes.'], true),
('emp-leonela', 'Leonela', 'servicio', 'onboarding', 'female',
  '[{"skill":"apertura","level":"aprendiz"},{"skill":"cafe","level":"aprendiz"},{"skill":"cierre","level":"aprendiz"}]'::jsonb,
  ARRAY['calle-93','calle-81'], false, false, false, null,
  ARRAY['Nueva.','No puede abrir sola.','No puede cerrar sola.','Requiere acompañamiento.'], true);

insert into hard_constraints (id, type, description, employee_ids, site_id, day, params, source, created_at) values
('hc-juan-david-never-calle-81', 'employee-never-at-site', 'Juan David nunca trabaja en Calle 81.', ARRAY['emp-juan-david'], 'calle-81', null, null, 'seed', '2026-01-01T00:00:00Z'),
('hc-min-one-day-off', 'min-one-day-off', 'Toda persona debe tener exactamente 1 día off en la semana.', null, null, null, null, 'seed', '2026-01-01T00:00:00Z'),
('hc-leonela-cannot-open-alone', 'cannot-open-alone', 'Leonela no puede abrir sola.', ARRAY['emp-leonela'], null, null, null, 'seed', '2026-01-01T00:00:00Z'),
('hc-leonela-cannot-close-alone', 'cannot-close-alone', 'Leonela no puede cerrar sola.', ARRAY['emp-leonela'], null, null, null, 'seed', '2026-01-01T00:00:00Z'),
('hc-onboarding-not-alone-critical', 'onboarding-not-alone-critical', 'Las personas en onboarding no pueden quedar solas en tareas críticas.', null, null, null, null, 'seed', '2026-01-01T00:00:00Z'),
('hc-employee-blocked-by-training', 'employee-blocked-by-training', 'Nadie queda programado durante una capacitación a la que asiste.', null, null, null, null, 'seed', '2026-01-01T00:00:00Z'),
('hc-skill-required-for-task', 'skill-required-for-task', 'Solo se asignan tareas a personas con la habilidad compatible.', null, null, null, null, 'seed', '2026-01-01T00:00:00Z');

insert into soft_constraints (id, type, description, weight, enabled, employee_ids, site_id, day, params, source, created_at) values
('sc-luisa-early-miercoles', 'early-leave-preference', 'Luisa sale temprano el miércoles.', 8, true, ARRAY['emp-luisa'], null, 'miercoles', null, 'seed', '2026-01-01T00:00:00Z'),
('sc-luisa-early-viernes', 'early-leave-preference', 'Luisa sale temprano el viernes cuando sea posible.', 4, true, ARRAY['emp-luisa'], null, 'viernes', null, 'seed', '2026-01-01T00:00:00Z'),
('sc-moni-late-start', 'late-start-preference', 'Moni prefiere entrar tarde entre semana.', 5, true, ARRAY['emp-moni'], null, null, null, 'seed', '2026-01-01T00:00:00Z'),
('sc-days-off-lun-jue', 'preferred-day-off-range', 'Los descansos idealmente caen entre lunes y jueves.', 3, true, null, null, null, '{"days":["lunes","martes","miercoles","jueves"]}'::jsonb, 'seed', '2026-01-01T00:00:00Z'),
('sc-pair-rosa-juan-david', 'pair-together-at-site', 'Rosa y Juan David juntos en Calle 93 de jueves a domingo.', 6, true, ARRAY['emp-rosa','emp-juan-david'], 'calle-93', null, '{"days":["jueves","viernes","sabado","domingo"]}'::jsonb, 'seed', '2026-01-01T00:00:00Z'),
('sc-pair-moni-rosa-miercoles', 'pair-together-at-site', 'Moni y Rosa juntas en Calle 93 los miércoles.', 4, true, ARRAY['emp-moni','emp-rosa'], 'calle-93', 'miercoles', null, 'seed', '2026-01-01T00:00:00Z'),
('sc-target-hours-servicio', 'target-weekly-hours', 'Servicio debe acercarse a 44 horas semanales.', 7, true, null, null, null, '{"area":"servicio","targetHours":44,"allowOvertime":false}'::jsonb, 'seed', '2026-01-01T00:00:00Z'),
('sc-target-hours-cocina', 'target-weekly-hours', 'Cocina debe acercarse a 44 horas semanales, aunque se permiten horas extra.', 7, true, null, null, null, '{"area":"cocina","targetHours":44,"allowOvertime":true}'::jsonb, 'seed', '2026-01-01T00:00:00Z');
