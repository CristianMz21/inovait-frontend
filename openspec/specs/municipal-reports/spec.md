# Especificación de capacidad: `municipal-reports`

**Source changes**: 001-school-enrollment-management (P0), 002-municipal-reports (P1)

## Propósito

Definir los recorridos analíticos municipales (edad, docentes por sector, escuelas líderes e histórico académico-docente), con activación progresiva posterior a la aprobación de P0 y del bloqueo de puerta operacional. Tras el archivado de `002-municipal-reports`, los recorridos de distribución por edad, docentes por sector y escuelas líderes quedan operativos en `/reports`; el recorrido de histórico académico-docente permanece diferido a `003-student-history`.

## Requisitos

### Requisito: FR-RPT-001 — Bloqueo por fase y activación

La UI MUST mantener `/student-history` bloqueado hasta decisión explícita; MUST habilitar `/reports` para FR-RPT-002 y FR-RPT-003 al aplicar el cambio `002-municipal-reports`; MUST no invocar endpoints P1 bloqueados (excluye `getStudentHistory`).
(Estado anterior archivado 2026-07-11 con `001-school-enrollment-management`: bloqueaba `/reports` y `/student-history` tras `P1LockedComponent` y prohibía invocar cualquier endpoint P1.)

#### Scenario: Acceso en P0 bloqueado

- GIVEN la puerta P0 aún no aprobada,
- WHEN la operadora intenta navegar a reportes o historial,
- THEN la UI informa estado pendiente y no invoca endpoints P1.

#### Scenario: Desbloqueo controlado de P1

- GIVEN se habilita P1 por decisión explícita,
- WHEN se accede al mismo flujo,
- THEN la navegación procede y los datos se consumen con contratos canónicos.

#### Scenario: Acceso a `/reports` tras 002 (P1)

- GIVEN la puerta P0 aprobada y `002-municipal-reports` archivado,
- WHEN la operadora navega a `/reports/age-report`, `/reports/sector-report` o `/reports/top-schools-report`,
- THEN la navegación procede y los datos se consumen con `operationId` canónicos.

#### Scenario: `/student-history` sigue bloqueado tras 002 (P1)

- GIVEN el cambio `002-municipal-reports` archivado,
- WHEN la operadora navega a `/student-history`,
- THEN la UI sigue resolviendo a `P1LockedComponent` y no invoca `getStudentHistory`.

### Requisito: FR-RPT-002 — Distribución por edad (frontend)

La capacidad de distribución MUST mostrar conteo 3–7 y rangos `3–7`, `8–12` y `>12` usando `asOfDate` o fecha actual, y MUST reportar `0` cuando no hay inscripciones.

La UI MUST exponer `/reports/age-report` consumiendo `getAgeDistribution` con `academicYearId` obligatorio; MUST preservar `age3To7`, `age8To12`, `ageOver12` exactos (`minimumAge`, `maximumAge`, `count`) sin recalcular ni reagrupar; MUST reportar `0` cuando no hay inscripciones; MUST mantener `loading`/`error`/`empty`/`success` con cancelación y descarte `stale` por `requestKey`; MUST mapear sólo los códigos canónicos (`as_of_date_invalid`, `bad_request`, `not_found`).

#### Scenario: Distribución canónica de edades (P0)

- GIVEN estudiantes con edades 2, 3, 7, 8, 12 y 13 y un `asOfDate` válido,
- WHEN se consulta el reporte,
- THEN el tramo 3–7 y los tres rangos reflejan conteos exactos sin agregar o truncar.

#### Scenario: Sin inscripciones (P0)

- GIVEN un contexto existente sin inscripciones,
- WHEN se ejecuta el reporte,
- THEN todos los conteos mostrados son cero y sin errores.

#### Scenario: Distribución canónica — conteo exacto por banda (P1)

- GIVEN edades 2, 3, 7, 8, 12 y 13 con `asOfDate` válido,
- WHEN se consulta el reporte,
- THEN `age3To7.count=2`, `age8To12.count=2`, `ageOver12.count=1` y los rangos coinciden con el contrato.

#### Scenario: Contexto sin inscripciones (200 con ceros) (P1)

- GIVEN un año sin inscripciones,
- WHEN se ejecuta el reporte,
- THEN los tres tramos muestran `0` sin error.

#### Scenario: Loading con descarte de respuesta tardía (P1)

- GIVEN un GET en curso,
- WHEN la operadora cambia `academicYearId`,
- THEN `RemoteState` transita a `loading` con `requestKey` nuevo y la respuesta previa se descarta.

#### Scenario: Error 422 `as_of_date_invalid` (P1)

- GIVEN un `asOfDate` que precede un nacimiento incluido,
- WHEN el backend responde `422 ProblemDetails`,
- THEN la UI expone `role="alert"`, conserva filtros y no renderiza datos parciales.

#### Scenario: Accesibilidad (CT-A11Y-RPT-AGE) (P1)

- GIVEN la vista renderizada,
- WHEN se inspecciona el DOM,
- THEN hay un único `<h1 tabindex="-1">`, filtros con `<fieldset><legend>`, requeridos con `aria-required="true"`, `submit` con `aria-busy`, `loading`/`empty`/`success` con `role="status"` y `error` con `role="alert"`; layout usable a 320 px, contraste WCAG 2.2 AA (`--app-muted`/`--app-accent`) y `prefers-reduced-motion` honrado.

### Requisito: FR-RPT-003 — Docentes distintos por sector y escuelas líderes (frontend)

El reporte de sector y líderes MUST deduplicar por `teacherId` por sector, MUST contar empates completos y MUST conservar el orden estable recibido por backend.

La UI MUST exponer `/reports/sector-report` y `/reports/top-schools-report`. `sector-report` MUST consumir `getDistinctTeacherCountsBySector` con `periodStart`+`periodEnd` simultáneos y MUST mostrar `publicDistinctTeacherCount`/`privateDistinctTeacherCount` exactos (deduplicación por `teacherId` delegada al backend). `top-schools-report` MUST consumir `getTopSchoolsByEnrollment` con `academicYearId` obligatorio y MUST presentar todos los empates en `enrollmentCount` máximo en el orden estable del backend, sin reordenar ni podar. Ambas vistas MUST mantener `loading`/`error`/`empty`/`success` con cancelación y descarte `stale`.

#### Scenario: Docente con doble presencia (P0)

- GIVEN un docente con contratos en ambos sectores,
- WHEN se calcula `public/private` de período vigente,
- THEN debe contar una vez en cada sector.

#### Scenario: Empates de líderes (P0)

- GIVEN dos o más escuelas empatan en matrícula máxima,
- WHEN se consulta el ranking anual,
- THEN la UI presenta todas las líderes en orden estable.

#### Scenario: Docente con contratos en ambos sectores (P1)

- GIVEN un docente con un contrato `Public` y uno `Private` vigentes,
- WHEN se consulta `sector-report` con el período vigente,
- THEN el docente se cuenta una vez en cada sector.

#### Scenario: Empates de escuelas líderes — orden estable (P1)

- GIVEN dos escuelas con `enrollmentCount=12` en el mismo año,
- WHEN se consulta `top-schools-report`,
- THEN la UI las muestra a ambas en el orden `school.name` ascendente y luego `school.id`.

#### Scenario: Año sin inscripciones (200 `[]`) (P1)

- GIVEN un año sin `Enrollment`,
- WHEN se consulta el ranking,
- THEN la UI expone `role="status"` con mensaje vacío y un botón `Reintentar`.

#### Scenario: Loading con descarte de respuesta tardía (P1)

- GIVEN un GET en curso,
- WHEN la operadora cambia `academicYearId` o el período,
- THEN la fachada cancela la suscripción y descarta la respuesta tardía por `requestKey`.

#### Scenario: Error 422 `period_invalid` (P1)

- GIVEN `periodEnd < periodStart`,
- WHEN el backend responde `422 ProblemDetails` con `errors.periodEnd`,
- THEN la UI expone `role="alert"`, conserva filtros y no muestra conteos.

#### Scenario: Accesibilidad (CT-A11Y-RPT-SECTOR + CT-A11Y-RPT-TOP) (P1)

- GIVEN ambas vistas renderizadas,
- WHEN se inspecciona el DOM,
- THEN cada una expone un único `<h1 tabindex="-1">`, filtros con `<fieldset><legend>`, estados remotos con `role="status"`/`role="alert"`, `submit` con `aria-busy`; `top-schools-report` usa `<table>` con `<caption class="visually-hidden">` y `<th scope="col">`; usables a 320 px, contraste WCAG 2.2 AA y `prefers-reduced-motion` honrado.

### Requisito: FR-RPT-004 — Historial académico-docente (DEFERRED)

El historial MUST consultar por `documentType` + `documentNumber` y MUST mostrar inscripciones por año con asignaciones múltiples sin colapsar relaciones.

(Estado P1 archivado 2026-07-11 con `002-municipal-reports`): FR-RPT-004 queda fuera del alcance del cambio `002-municipal-reports`; se ejecuta en `003-student-history` con sus propios DTOs, fixtures, servicio, fachada, ruta, componente, tests y evidencia manual. La UI de `/student-history` permanece bloqueada por `P1LockedComponent` y `getStudentHistory` no se invoca en runtime.

#### Scenario: Identidad inexistente

- GIVEN un documento que no existe,
- WHEN se consulta historial,
- THEN el backend responde `404` y la UI informa sin romper la navegación.

#### Scenario: Estudiante con múltiples relaciones

- GIVEN un estudiante con asignaciones múltiples por año,
- WHEN se muestra el historial,
- THEN se preservan docentes, materias y días, incluyendo años sin asignaciones.

## Criterios de éxito

- SC-RPT-01: La apertura de P1 no avanza hasta aprobar `SC-001` de puerta P0 y completar evidencia P0 crítica.
- SC-RPT-02: Los recorridos P1 (`SCN-020` a `SCN-034`) cubren límites de edad, intersección de fechas/semanas, empates y multiplicidad sin recálculos cliente.
- SC-RPT-03: Se conservan límites del contrato en semántica de `422`, evitando estados de error inventados.
- SC-RPT-04 (P1): Los tres recorridos habilitados (`age-report`, `sector-report`, `top-schools-report`) exponen estados `loading`/`error`/`empty`/`success` con cancelación + descarte `stale` por `requestKey`, mapean sólo códigos canónicos (`as_of_date_invalid`, `period_invalid`, `bad_request`, `not_found`) y cumplen invariantes WCAG 2.2 AA (fieldset/legend, aria-required/aria-busy, role=status/alert, 320 px, contraste, prefers-reduced-motion).

## Riesgos abiertos y límites

- **Límite de alcance**: el recorrido de histórico académico-docente (`FR-RPT-004`) NO forma parte del cambio `002-municipal-reports` y se difiere a `003-student-history`; `/student-history` permanece bloqueada.
- **Riesgo**: depende de datos ficticios P1 adicionales (`TeacherCount`, `Age`, `History`) que no deben mezclarse con P0 y solo se habilitan tras P035.
- **Riesgo**: cambios de negocio de backend sobre agregados históricos invalidarían los escenarios de prueba y exigirían re-trazado.
- **Riesgo (P1)**: los `operationId` P1 sólo pueden ejercitarse end-to-end cuando el backend está en commit autorizado `1223630ab99bf1bfaa4f5919fccf5ff539379c8e` o sucesor aprobado en `APPROVED_SUCCESSORS`; el verificador de contrato aborta en commit-check antes de validar checksum y `operationId`.