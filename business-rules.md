# Business Rules

## Objetivo del Sistema

Generar horarios semanales para Nuts About You respetando restricciones operativas, habilidades del personal, preferencias individuales y cobertura mínima requerida.

El sistema debe producir horarios válidos para las dos sedes y las dos áreas operativas principales:

* Cocina
* Servicio

---

# Objetivos del Solver

Los horarios deben optimizarse siguiendo el siguiente orden de prioridad:

## Prioridad 1 — Cumplimiento de restricciones obligatorias

Nunca generar una solución que viole una restricción dura.

Ejemplos:

* Juan David no puede trabajar en Calle 81.
* Leonela no puede abrir sola.
* Leonela no puede cerrar sola.
* Debe existir cobertura mínima requerida.
* Cada empleado debe tener un día off semanal.

## Prioridad 2 — Cobertura operativa

Garantizar que todas las sedes y áreas cuenten con personal suficiente para operar.

## Prioridad 3 — Balance de horas

Intentar acercar a cada persona a la meta semanal de 44 horas.

## Prioridad 4 — Minimización de horas extra

Reducir horas extra cuando sea posible.

## Prioridad 5 — Preferencias individuales

Intentar respetar preferencias personales sin afectar la operación.

## Prioridad 6 — Combinaciones ideales

Favorecer combinaciones operativas recomendadas cuando existan alternativas equivalentes.

---

# Entidades

## Site

Representa una sede física.

Valores actuales:

* Calle 93
* Calle 81

## Area

Representa una unidad operativa.

Valores actuales:

* Cocina
* Servicio

## Employee

Representa una persona del equipo.

Cada empleado puede tener:

* Skills
* Restricciones
* Preferencias
* Estado de onboarding
* Sedes permitidas
* Horas objetivo

## Skill

### Cocina

* Salado
* Dulce

### Servicio

* Apertura
* Café
* Rappi
* Cierre

## Shift

Representa una asignación de trabajo en un día determinado.

Debe contener:

* Empleado
* Fecha
* Sede
* Área
* Hora inicio
* Hora fin

---

# Sedes

## Calle 93

### Características

* Sede con mayor movimiento.
* Mayor carga operativa de jueves a domingo.

### Requisitos de cocina

De jueves a sábado:

* Deben existir 3 personas asignadas.

### Días críticos

* Jueves
* Viernes
* Sábado
* Domingo

### Stock

A las 9AM debe existir stock suficiente para la operación.

---

## Calle 81

### Características

* Menor carga operativa.
* Débora trabaja normalmente en esta sede.
* Juan David nunca trabaja en esta sede.
* Yeimi rota entre ambas sedes.

---

# Reglas Globales

## Horas semanales

Objetivo:

* 44 horas por semana por persona.

## Descansos

### Hard Constraint

* Cada persona debe tener exactamente 1 día off semanal.

### Soft Constraint

* Los días off deberían ubicarse entre lunes y jueves.

### Soft Constraint

* Idealmente solo una persona descansa por día.

### Soft Constraint

* Hay personas que pueden salir más temprano, pero esto solo se especifica en el chat del agente de IA.

### Día off fijo vs. variable

Por defecto, el día de descanso de cada persona es **variable**: el motor lo rota
semana a semana según cobertura, sin comprometerse a un día específico. Solo se debe
fijar un día off exacto (restricción dura `employee-day-off`) para alguien que
**de verdad no puede trabajar** ningún otro día que no sea ese, por un motivo externo
recurrente confirmado (ej. una cita médica fija, un compromiso religioso semanal).

Una preferencia de horario en un día puntual (ej. salir temprano) **no es lo mismo**
que un día off fijo — eso se modela como restricción de salida temprana, no como
día de descanso.

Actualmente nadie en el equipo tiene un día off fijo confirmado. El caso de
"salida temprana los miércoles por la iglesia" corresponde a la preferencia de
salida temprana de Luisa (ver sección Cocina), no a un día de descanso completo.

## Salidas tempranas

El sistema debe soportar:

* Salidas tempranas obligatorias.
* Salidas tempranas preferidas.

## Capacitaciones

El sistema debe permitir:

* Programar capacitaciones.
* Registrar asistencia.
* Permitir ausencias justificadas por necesidades operativas.

## Comunicación

Los horarios deben poder enviarse por correo electrónico.

---

# Horarios de Operación

## Horario de cierre

### Domingo

* Cierre al público: 5PM

### Lunes a sábado

* Cierre al público: 6PM

## Cierre operativo

Después del cierre al público existe una ventana adicional de:

* 1 hora y 30 minutos

Esta ventana debe considerarse parte del turno.

---

# Onboarding

Duración:

* 14 días desde la fecha de ingreso.

Durante onboarding:

### Hard Constraints

* No puede abrir sola.
* No puede cerrar sola.
* No puede quedar sola en tareas críticas.

### Soft Constraints

* Debe trabajar acompañada por personal experimentado cuando sea posible.

---

# Cocina

## Situación Operativa

* Existe escasez de personal.
* Puede ser necesario utilizar horas extra.
* Puede no ser posible alcanzar exactamente las 44 horas para todos.

## Skills

* Salado
* Dulce

---

## Rosa

### Skills

* Salado
* Dulce

### Fortalezas

* Muy fuerte en dulce.
* Puede apoyar ambas áreas.

### Preferencias operativas

* Favorecer combinación con Juan David.

### Turno de referencia

* 7AM–4PM

---

## Juan David

### Skills

* Salado

### Restricciones duras

* No puede trabajar en Calle 81.

### Restricciones blandas

* Evitar aperturas los viernes cuando sea posible.

### Preferencias operativas

* Favorecer combinación con Rosa.

### Turno de referencia

* 9AM–7PM

---

## Luisa

### Estado

* Onboarding

### Skills

* Dulce
* Salado (en aprendizaje)

### Restricciones duras

* Debe (intentar) salir temprano los miércoles por la iglesia.

### Restricciones blandas

* Intentar salida temprana los viernes.

### Observaciones

* Puede saturarse en periodos de alto boleo.

---

## Moni

### Skills

* Salado
* Dulce

### Preferencias

* Entrar tarde entre semana.

### Restricciones blandas

* Alternar salidas tempranas durante fines de semana.

---

## Débora

### Restricción operativa

* Trabaja normalmente en Calle 81.

### Pendiente

Confirmar área principal.

---

# Combinaciones Preferidas

## Soft Constraints

### Miércoles

* Moni + Rosa en Calle 93.

### Jueves a domingo

* Rosa + Juan David en Calle 93.

Estas combinaciones generan puntuación positiva pero nunca deben bloquear una solución válida.

---

# Servicio

## Subáreas

* Apertura
* Café
* Rappi

---

## Yeimi

### Sedes

* Calle 93
* Calle 81

### Pendiente

Confirmar si las dos salidas tempranas son permanentes.

---

## Javier

### Sedes

* Calle 93
* Calle 81

---

## Leonela

### Estado

* Onboarding

### Restricciones duras

* No puede abrir sola.
* No puede cerrar sola.

### Observaciones

* Requiere acompañamiento durante periodos de alta demanda.

---

# Operación Futura: Rappi Nocturno

Estado actual:

* No activo.

Requerimiento futuro:

* Soportar cobertura posterior al cierre.
* Configurar personal dedicado.
* Separar cierre operativo de operación nocturna.

---

# Formato de Hora

Usar:

* 7AM
* 6PM
* 6:30PM

No usar:

* 07:00AM
* 6:00PM

---

# TODOs de Negocio

## Pendientes

* Confirmar área principal de Débora.
* Confirmar continuidad de Juan David.
* Confirmar condición de las salidas tempranas de Yeimi.
* Definir reglas de Rappi nocturno.
* Definir frecuencia exacta de capacitaciones.
