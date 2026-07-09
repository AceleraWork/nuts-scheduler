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
- OpenRouter (`openai/gpt-4o-mini`) para el chat IA, vía API route server-side.
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
`ScheduleOption[]`. Quien sí persiste es `useScheduleStore` (regenerate/updateShift/swapShifts
llaman a `lib/data/schedules.ts` después de mutar el estado local).

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

Y crear el usuario en Authentication → Users (email `kim@toroteam.com`, password
`AdminNuts123!`, "Auto Confirm User" activado) — esto no se puede automatizar sin
acceso admin/API key de servicio, lo hace el usuario a mano desde el dashboard.

## Variables de entorno (`.env.local`, gitignored)

- `OPENROUTER_API_KEY` — chat IA.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — proyecto de Supabase del
  usuario (`https://dhdyjtmxnjtobmsxprdg.supabase.co`).

## Motor de reglas (`lib/solver/`)

- `assign.ts`: construcción greedy (día off, sede, horas por plantilla) + reparación de
  "no abrir/cerrar sola" (intercambia el turno **completo**, no solo el horario de inicio/fin,
  para no romper la duración — bug real que ya se corrigió una vez).
- `rules/hardRules.ts` / `rules/softRules.ts` / `rules/ruleRegistry.ts`: reglas
  registradas por `type`, evaluadas contra instancias de `HardConstraint`/`SoftConstraint`
  (datos editables, no hardcodeadas).
- `diversity.ts`: 3 estrategias (balanced/pairing-focus/hours-focus) generan las opciones
  A/B/C variando pesos y el orden de días-off.
- `validateEdit.ts`: misma evaluación, usada tras cada edición manual (drag&drop, popover)
  para advertencias no bloqueantes.

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

## Estado actual

MVP completo (paneles de chat/empleados/horarios, motor de reglas, chat con OpenRouter,
drag&drop con validación en vivo, exportación PDF/Excel, capacitaciones) + backend real en
Supabase + login de un solo admin. Pendiente para el usuario: seguir usando/probando la app
y decidir próximos pasos (roles adicionales, más sedes, ajustes al motor, etc.).

