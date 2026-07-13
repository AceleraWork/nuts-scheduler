@AGENTS.md

# Nuts About You — Sistema de Planeación de Horarios

App para que la dueña de la cafetería/pastelería "Nuts About You" genere y edite horarios
semanales del equipo (cocina + servicio, 2 sedes) conversando con un chatbot en lenguaje
natural, con un motor de reglas que respeta restricciones duras/blandas.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui (estilo `base-nova`,
  usa `@base-ui/react` en vez de Radix — revisar los componentes ya generados en
  `components/ui/*` antes de asumir APIs de Radix/shadcn "clásico").
- Zustand para estado global (sin `persist`/localStorage — la fuente de verdad es Supabase).
- Supabase (Postgres + Auth) como backend.
- OpenRouter (`openai/gpt-4.1`) para el chat IA, vía API route server-side.
- `@dnd-kit` para drag & drop, `jspdf`/`jspdf-autotable` y `exceljs` para exportar.

## Arquitectura de datos

```
Supabase (Postgres, RLS "solo autenticados")
  → lib/supabase/client.ts   (cliente browser)
  → lib/supabase/mappers.ts  (snake_case DB ↔ camelCase TS)
  → lib/data/*.ts            (funciones async: getX/insertX/updateX/deleteX)
  → stores/use*Store.ts      (Zustand: initialize() async + mutaciones async)
  → components/*             (leen los stores con hooks reactivos)
```

Los 4 stores con datos mutables (`useEmployeesStore`, `useConstraintsStore`,
`useTrainingsStore`, `useScheduleStore`) exponen `initialize()` y se hidratan en
`components/layout/AppShell.tsx` (`useEffect` que corre `Promise.all` de los 4 más
`useScheduleStore`, que depende de que los demás ya tengan datos). `useSitesStore` es
más simple (no se muta desde la UI) y expone además `getSiteName(id)` **síncrono** para
componentes/exportaciones que no pueden esperar una promesa (asume que el store ya cargó).

El motor de reglas (`lib/solver/*`) es puro y no toca Supabase directamente: recibe
`employees/sites/hardConstraints/softConstraints/trainings` ya cargados y devuelve
`ScheduleOption[]`.

**`useScheduleStore` es la única excepción al patrón "cada mutación persiste al toque"**:
`regenerate`/`updateShift`/`swapShifts`/`revalidate` solo mutan el estado local en memoria,
sin tocar Supabase — a propósito, porque la dueña no quiere que horarios a medio editar
(por chat o drag&drop) se guarden solos. El único camino a Supabase es `saveActiveOption()`
(botón "Guardar" en `SaveSendMenu.tsx`), que llama a `saveScheduleOption` en
`lib/data/schedules.ts` y guarda solo la opción activa (A/B/C), no las otras dos variantes.
Como excepción puntual a "sin persist/localStorage", `lib/storage/scheduleDraft.ts` guarda
un espejo de `{ weekStartDate, options, activeOptionId }` en `localStorage` cada vez que
cambia el estado **de la semana por defecto** (la próxima semana desde hoy, la única que
`initialize()` restaura) — así un refresh o cierre de pestaña no borra ediciones aún no
guardadas. `initialize()` lo usa como atajo (si el borrador coincide con la semana de hoy,
se salta el fetch a Supabase); `goToWeek()` (flechas de navegación) NO lo consulta ni lo
sobreescribe, para no pisar el borrador de la semana por defecto al solo pasar a ver otra
semana. Si se cambia de semana y se vuelve, o se guarda con "Guardar", el borrador se
resincroniza solo. Los otros 3 stores (`useEmployeesStore`, `useConstraintsStore`,
`useTrainingsStore`) sí persisten cada mutación de inmediato a Supabase, sin localStorage,
como antes.

## Autenticación

Un solo usuario admin en Supabase Auth (email real `kim@toroteam.com`, password
`AdminNuts123!`), pero el login de la app solo pide "Usuario: Admin" — `lib/supabase/auth.ts`
mapea el username fijo al email real internamente. RLS en las 7 tablas exige
`auth.role() = 'authenticated'` (ver `supabase/auth-policies.sql`); sin sesión, la API
REST de Supabase devuelve arrays vacíos, no error.

`components/layout/AppShell.tsx` es el gate: `checking-auth` → `unauthenticated` (muestra
`LoginForm`) → `loading-data` → `ready`/`error`. Escucha `supabase.auth.onAuthStateChange`
para reaccionar a login/logout sin recargar la página.

## Setup de Supabase (ya ejecutado en el proyecto real del usuario)

Correr en el SQL Editor de Supabase, en este orden:
1. `supabase/schema.sql` — crea las 7 tablas (sites, employees, hard_constraints,
   soft_constraints, trainings, schedule_options, shifts) con RLS "allow all" inicial.
2. `supabase/seed.sql` — carga los 8 empleados, 2 sedes y las restricciones semilla.
3. `supabase/auth-policies.sql` — reemplaza las políticas "allow all" por
   "solo autenticados".

Ya aplicadas al proyecto real (instalaciones nuevas las traen de una vez en `schema.sql`,
no hace falta correrlas ahí): `supabase/migration-service-task-type.sql` (agrega
`service_task_type` a `shifts`), `supabase/migration-schedule-options-per-week.sql`
(permite guardar horarios de varias semanas — antes `schedule_options.id` era solo
'A'/'B'/'C' sin distinguir semana), `supabase/migration-site-closing-hour.sql` (agrega
`closing_hour_by_day` a `sites`, ver "Reglas de negocio" abajo), `supabase/migration-employee-area-admin.sql`
(agrega `'admin'` como área válida — debe correr **antes** de `migration-planta-site-and-team.sql`,
que ya inserta empleados con esa área), `supabase/migration-planta-site-and-team.sql` (sede
`planta` + 9 empleados de Planta/admin + 2 soft constraints, agrega `employees.explicit_day_pattern`),
`supabase/migration-training-site.sql` (agrega `trainings.site_id`) y
`supabase/migration-employee-leaves.sql` (tabla `employee_leaves` + `shifts.leave_id`). Estas 4
últimas se aplicaron manualmente vía MCP de Supabase el 2026-07-13 después de que un crash
dejara el código escrito pero las migraciones sin correr contra el proyecto real — si
`AppShell` vuelve a mostrar "No se pudo conectar a Supabase", lo primero es comparar
`supabase/schema.sql` contra el estado real de la tabla antes de asumir un bug de código.
También aplicadas al proyecto real el mismo día vía MCP: `supabase/migration-site-manager.sql`
(agrega `sites.manager_id`, sin FK — mismo patrón que `home_employee_ids` — por el orden de
creación de tablas en `schema.sql`; setea `emp-kim` como encargada de `calle-93`) y
`supabase/migration-employee-area-planta.sql` (agrega `'planta'` como área válida en los
checks de `employees`/`shifts` y migra a Aura/Daniel/Deilis/Karo/Gabi/Vane de `area='cocina'`
a `area='planta'`, ver "Sede Planta" abajo).

Y crear el usuario en Authentication → Users (email `kim@toroteam.com`, password
`AdminNuts123!`, "Auto Confirm User" activado) — esto no se puede automatizar sin
acceso admin/API key de servicio, lo hace el usuario a mano desde el dashboard.

## Variables de entorno (`.env.local`, gitignored)

- `OPENROUTER_API_KEY` — chat IA.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — proyecto de Supabase del
  usuario (`https://dhdyjtmxnjtobmsxprdg.supabase.co`).
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`,
  `GOOGLE_DRIVE_ROOT_FOLDER_ID` — export de horarios a Google Drive/Sheets
  (`lib/google/*`, `app/api/export/drive/route.ts`). Fase inicial: crear una cuenta de
  servicio en Google Cloud Console (IAM & Admin → Cuentas de servicio), habilitar las APIs
  de Drive y Sheets, generar una llave JSON, compartir la carpeta del Drive de Acelera con
  el email `...@...iam.gserviceaccount.com` de esa cuenta (permiso Editor), y usar el ID de
  esa carpeta como `GOOGLE_DRIVE_ROOT_FOLDER_ID`. Sin estas 3 variables, el botón "Exportar
  a Drive" muestra un error claro en vez de fallar silenciosamente.

## Motor de reglas (`lib/solver/`)

- `assign.ts`: construcción greedy (día off, sede, horas por plantilla) + reparación de
  "no abrir/cerrar sola" (intercambia el turno **completo**, no solo el horario de inicio/fin,
  para no romper la duración — bug real que ya se corrigió una vez). Los turnos siempre son
  de 8h exactas: cocina fija 7AM–3PM, servicio rota entre 3 plantillas que nunca empiezan
  antes de las 8AM. `applySiteClosingCap()` recorta el fin del turno si `Site.closingHourByDay`
  tiene una hora para ese día (hoy solo calle-93/domingo → 5PM) — se aplica en los **dos**
  lugares donde se calculan start/end (el loop principal y `reinforceOnboardingCoverage`).
- `rules/hardRules.ts` / `rules/softRules.ts` / `rules/ruleRegistry.ts`: reglas
  registradas por `type`, evaluadas contra instancias de `HardConstraint`/`SoftConstraint`
  (datos editables, no hardcodeadas). `target-weekly-hours` usa `WEEKLY_TARGET_HOURS` (42)
  como default y, si el constraint tiene `allowOvertime: true`, tolera hasta
  `MAX_OVERTIME_HOURS` (4) de más — no horas extra ilimitadas.
- `diversity.ts`: 3 estrategias (balanced/pairing-focus/hours-focus) generan las opciones
  A/B/C variando pesos y el orden de días-off.
- `validateEdit.ts`: misma evaluación, usada tras cada edición manual (drag&drop, popover)
  para advertencias no bloqueantes.

## Reglas de negocio clave

- **Horarios**: cocina siempre entra a las 7AM; servicio nunca antes de las 8AM (3
  plantillas rotativas, todas de 8h). Calle 93 cierra a las 5PM los domingos
  (`Site.closingHourByDay`, `types/site.ts`) — **la app no tiene calendario de festivos**
  (solo un patrón recurrente por día de semana), así que un feriado puntual entre semana no
  se detecta solo; hay que ajustarlo a mano ese turno específico (popover o chat con
  `move_shift`) para esa semana.
- **Sede Planta**: única sede con plantillas de turno propias y hardcodeadas en
  `lib/solver/assign.ts` (`PLANTA_SITE_ID`/`PLANTA_TEMPLATES`) — entradas variables
  (5:30AM/6AM/7AM), duración 8-9h, en vez del 7AM-3PM fijo del resto de cocina. El chequeo
  de `siteId === PLANTA_SITE_ID` va **antes** que el de `employee.area === "cocina"`, así
  que aplica por sede sin importar el área del empleado. Equipo actual: Aura, Daniel,
  Deilis, Karo, Gabi, Vane (área `planta`, categoría propia desde 2026-07-13 — antes eran
  `cocina`; el cambio de área no afecta el horario porque `assign.ts` decide la plantilla
  por `siteId` antes de mirar `area`) + Camila/Karen/Kim (área `admin`, rotan entre Planta
  y los puntos vía `explicitDayPattern`).
- **Incapacidades/licencias** (`employee_leaves`, `useLeavesStore`): el solver no asigna
  turnos a un empleado en los días cubiertos por una licencia activa (`forcedLeaveDaysFor`
  en `assign.ts`) — el turno queda como día libre etiquetado con la licencia
  (`Shift.leaveId`), no como un simple descanso.
- **Horas objetivo**: `WEEKLY_TARGET_HOURS = 42`, `MAX_OVERTIME_HOURS = 4`
  (`lib/constants.ts`). El color del indicador de horas en `HoursBadge`
  (`components/employees/HoursBadge.tsx`, vía `getHoursIndicator` en `lib/solver/hours.ts`)
  se calcula sobre **horas extra** (`horas - objetivo`), no sobre horas totales absolutas:
  0h extra = verde, 1-2h = amarillo, 3h o más = rojo. Ver `OVERTIME_INDICATOR_THRESHOLDS`.

## Chat IA (`lib/ai/`, `app/api/chat/route.ts`)

- `chatActionSchema.ts` (zod v4, usa `z.discriminatedUnion` — **no** `zod-to-json-schema`,
  zod v4 trae `z.toJSONSchema()` nativo aunque terminamos sin usarlo: OpenRouter se llama
  con `response_format: json_object` + validación zod + un reintento, no structured outputs
  estricto, por fragilidad de ese modo con uniones discriminadas).
- `systemPrompt.ts`: **crítico que cada ejemplo de acción muestre el JSON anidado real**
  `{ type, payload: {...} }` — un bug real fue que los ejemplos en texto no mostraban el
  anidamiento y el modelo devolvía los campos sueltos, fallando la validación zod siempre.
- `openrouter.ts`: cualquier header HTTP (`X-Title`, etc.) debe ser ASCII/Latin1 puro —
  un guión largo "—" rompe `fetch()` con `ByteString` error (bug real ya corregido).

## Gotchas ya encontrados en este proyecto (no repetir)

- **Next.js 16 / shadcn `base-nova`**: usa `@base-ui/react`, no Radix. Revisar el archivo
  ya generado en `components/ui/` antes de asumir props (`open`/`onOpenChange` se
  mantienen, pero cosas como `render={<Componente />}` para triggers son de Base UI).
- **`react-resizable-panels` v4**: `defaultSize`/`minSize`/`maxSize` deben ir como
  string con unidad (`"26%"`), no número plano (un número plano colapsaba el panel).
- **Zustand + selectores que crean arrays/objetos nuevos** (`.filter()` dentro del
  selector) rompen `useSyncExternalStore` y crean loops infinitos de render. Filtrar
  siempre en `useMemo` en el componente, no dentro del selector.
- **Hydration mismatch**: los stores dependen de datos async (antes localStorage, ahora
  Supabase) — `AppShell` debe renderizar el mismo placeholder en servidor y en el primer
  render de cliente, y solo mostrar la app real después de un efecto client-only.
- **ESLint `react-hooks/refs` y `react-hooks/set-state-in-effect`** (reglas nuevas del
  preset de Next 16) flaguean patrones normales (dnd-kit, sync de estado de formulario
  en `useEffect`). Están deshabilitadas a nivel de proyecto en `eslint.config.mjs` con
  justificación — no reactivarlas sin revisar los falsos positivos primero.
- **Formato de hora obligatorio**: nunca `":00"` ni ceros a la izquierda (`"7AM"`, no
  `"7:00AM"`) — usar siempre `lib/time/formatTime.ts`, no formatear horas a mano.
- **Paleta de color por área**: `app/globals.css` solo traía 3 pares (gold=cocina,
  olive=servicio, clay=admin/otros). Al agregar `planta` como área real se sumó un 4º par
  (`--berry`/`--berry-soft`, light + dark) — si se agrega otra área/categoría a futuro, hace
  falta un 5º par, no reusar uno existente.

## Estado actual

MVP completo (paneles de chat/empleados/horarios, motor de reglas, chat con OpenRouter,
drag&drop con validación en vivo, exportación PDF/Excel, capacitaciones, apartado de Sedes)
+ backend real en Supabase + login de un solo admin. Pendiente para el usuario: seguir
usando/probando la app y decidir próximos pasos (roles adicionales, más sedes, ajustes al
motor, etc.).

## Apartado de Sedes (`app/sedes/page.tsx`, `components/sites/*`)

Separado de Personal, con su propio link en el nav (`components/layout/AppShell.tsx`).
`SitesPanel.tsx` muestra cada `Site` como una tarjeta tipo perfil (`SiteCard.tsx`): nombre +
encargado (`Site.managerId`, referencia a un `Employee`, **sin FK** en `sites` — mismo
patrón que `homeEmployeeIds`, porque en `schema.sql` la tabla `sites` se crea antes que
`employees`) o "Sin encargado" si no tiene, con un `Select` inline para asignar/quitar
encargado (`useSitesStore.updateSite`, ya persiste a Supabase). "Crear sede nueva" reusa
`SitesMenu`/`SiteCreateDialog` (antes vivían dentro de `EmployeesPanel`, ahora solo acá).
Personal (`EmployeesPanel.tsx`) tiene su propio filtro de categoría (mismo
`CategoryFilterSelect` que usa el horario, ahora con ítem "Planta") en vez de mostrar
siempre las 4 secciones completas.

