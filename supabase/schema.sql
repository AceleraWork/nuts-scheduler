-- Nuts About You — Horarios: schema inicial de Supabase.
-- Corre este archivo completo en el SQL Editor de tu proyecto de Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).

create table if not exists sites (
  id text primary key,
  name text not null,
  volume text not null check (volume in ('alto', 'bajo')),
  kitchen_min_staff_by_day jsonb,
  priority_days text[] not null default '{}',
  stock_coverage_by text,
  closing_hour_by_day jsonb,
  home_employee_ids text[],
  manager_id text,
  notes text[]
);

create table if not exists employees (
  id text primary key,
  name text not null,
  area text not null check (area in ('cocina', 'servicio', 'admin', 'planta')),
  status text not null check (status in ('activo', 'onboarding')),
  gender text not null check (gender in ('male', 'female')),
  skills jsonb not null default '[]',
  allowed_site_ids text[] not null default '{}',
  rotates boolean not null default false,
  can_open_alone boolean not null default true,
  can_close_alone boolean not null default true,
  early_leave_preferences jsonb,
  weekly_target_override_hours numeric,
  explicit_day_pattern jsonb,
  notes text[],
  active boolean not null default true
);

create table if not exists hard_constraints (
  id text primary key,
  type text not null,
  description text not null,
  employee_ids text[],
  site_id text references sites(id),
  day text,
  params jsonb,
  source text not null check (source in ('seed', 'chat', 'manual')),
  created_at timestamptz not null default now()
);

create table if not exists soft_constraints (
  id text primary key,
  type text not null,
  description text not null,
  weight numeric not null default 5,
  enabled boolean not null default true,
  employee_ids text[],
  site_id text references sites(id),
  day text,
  params jsonb,
  source text not null check (source in ('seed', 'chat', 'manual')),
  created_at timestamptz not null default now()
);

create table if not exists trainings (
  id text primary key,
  title text not null,
  date date not null,
  start_minutes int not null,
  end_minutes int not null,
  attendee_employee_ids text[] not null default '{}',
  justified_absence_employee_ids text[] not null default '{}',
  site_id text references sites(id)
);

create table if not exists schedule_options (
  id text primary key, -- '{week_start_date}_{option_id}', ej. '2026-07-13_A'
  option_id text not null check (option_id in ('A', 'B', 'C')),
  label text not null,
  week_start_date date not null,
  score numeric not null default 0,
  violations jsonb not null default '[]',
  reasoning_summary text not null default '',
  generated_at timestamptz not null default now(),
  unique (week_start_date, option_id)
);

create table if not exists shifts (
  id text primary key,
  schedule_option_id text not null references schedule_options(id) on delete cascade,
  employee_id text not null references employees(id) on delete cascade,
  site_id text not null references sites(id),
  day text not null,
  area text not null check (area in ('cocina', 'servicio', 'admin', 'planta')),
  start_minutes int not null default 0,
  end_minutes int not null default 0,
  is_day_off boolean not null default false,
  is_early_leave boolean not null default false,
  is_training_block boolean not null default false,
  training_event_id text references trainings(id),
  service_task_type text
);

create index if not exists shifts_option_idx on shifts (schedule_option_id);
create index if not exists shifts_employee_idx on shifts (employee_id);

create table if not exists employee_leaves (
  id text primary key,
  employee_id text not null references employees(id) on delete cascade,
  label text not null,
  start_date date not null,
  end_date date not null,
  color text not null default '#c0788a',
  created_at timestamptz not null default now()
);

alter table shifts add column if not exists leave_id text references employee_leaves(id);

-- RLS: la app todavía no tiene login, así que se habilita acceso abierto de lectura/escritura
-- para la key pública (anon/publishable). Cuando agregues autenticación, reemplaza estas
-- políticas "allow all" por reglas basadas en el usuario autenticado.
alter table sites enable row level security;
alter table employees enable row level security;
alter table hard_constraints enable row level security;
alter table soft_constraints enable row level security;
alter table trainings enable row level security;
alter table schedule_options enable row level security;
alter table shifts enable row level security;
alter table employee_leaves enable row level security;

create policy "allow all sites" on sites for all using (true) with check (true);
create policy "allow all employees" on employees for all using (true) with check (true);
create policy "allow all hard_constraints" on hard_constraints for all using (true) with check (true);
create policy "allow all soft_constraints" on soft_constraints for all using (true) with check (true);
create policy "allow all trainings" on trainings for all using (true) with check (true);
create policy "allow all schedule_options" on schedule_options for all using (true) with check (true);
create policy "allow all shifts" on shifts for all using (true) with check (true);
create policy "allow all employee_leaves" on employee_leaves for all using (true) with check (true);
