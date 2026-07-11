# Delta: `municipal-reports` — habilitación P1 (002)

**Change**: `002-municipal-reports` · **Tipo**: MODIFIED capability · **Frontend-only**

## Propósito

Levantar el bloqueo P0 sobre `/reports` para los recorridos de **distribución por edad**, **docentes distintos por sector** y **escuelas líderes por matrícula**, consumiendo los `operationId` de `paths/reports.yaml` (commit backend `1223630ab`). Reutiliza `CatalogFacade`, `RemoteState<T>`, `problemDetailsInterceptor` y los patrones WCAG 2.2 AA del shell P0 (CT-A11Y-P0). FR-RPT-004 queda fuera de alcance y se difiere a `003-student-history`; `/student-history` permanece bloqueado.

## ADDED Requirements

### Requisito: FR-RPT-002 — Distribución por edad (frontend)

La UI MUST exponer `/reports/age-report` consumiendo `getAgeDistribution` con `academicYearId` obligatorio; MUST preservar `age3To7`, `age8To12`, `ageOver12` exactos (`minimumAge`, `maximumAge`, `count`) sin recalcular ni reagrupar; MUST reportar `0` cuando no hay inscripciones; MUST mantener `loading`/`error`/`empty`/`success` con cancelación y descarte `stale` por `requestKey`; MUST mapear sólo los códigos canónicos (`as_of_date_invalid`, `bad_request`, `not_found`).

#### Scenario: Distribución canónica
- GIVEN edades 2, 3, 7, 8, 12 y 13 con `asOfDate` válido,
- WHEN se consulta el reporte,
- THEN `age3To7.count=2`, `age8To12.count=2`, `ageOver12.count=1` y los rangos coinciden con el contrato.

#### Scenario: Contexto sin inscripciones (200 con ceros)
- GIVEN un año sin inscripciones,
- WHEN se ejecuta el reporte,
- THEN los tres tramos muestran `0` sin error.

#### Scenario: Loading con descarte de respuesta tardía
- GIVEN un GET en curso,
- WHEN la operadora cambia `academicYearId`,
- THEN `RemoteState` transita a `loading` con `requestKey` nuevo y la respuesta previa se descarta.

#### Scenario: Error 422 `as_of_date_invalid`
- GIVEN un `asOfDate` que precede un nacimiento incluido,
- WHEN el backend responde `422 ProblemDetails`,
- THEN la UI expone `role="alert"`, conserva filtros y no renderiza datos parciales.

#### Scenario: Accesibilidad (CT-A11Y-RPT-AGE)
- GIVEN la vista renderizada,
- WHEN se inspecciona el DOM,
- THEN hay un único `<h1 tabindex="-1">`, filtros con `<fieldset><legend>`, requeridos con `aria-required="true"`, `submit` con `aria-busy`, `loading`/`empty`/`success` con `role="status"` y `error` con `role="alert"`; layout usable a 320 px, contraste WCAG 2.2 AA (`--app-muted`/`--app-accent`) y `prefers-reduced-motion` honrado.

### Requisito: FR-RPT-003 — Sector y escuelas líderes (frontend)

La UI MUST exponer `/reports/sector-report` y `/reports/top-schools-report`. `sector-report` MUST consumir `getDistinctTeacherCountsBySector` con `periodStart`+`periodEnd` simultáneos y MUST mostrar `publicDistinctTeacherCount`/`privateDistinctTeacherCount` exactos (deduplicación por `teacherId` delegada al backend). `top-schools-report` MUST consumir `getTopSchoolsByEnrollment` con `academicYearId` obligatorio y MUST presentar todos los empates en `enrollmentCount` máximo en el orden estable del backend, sin reordenar ni podar. Ambas vistas MUST mantener `loading`/`error`/`empty`/`success` con cancelación y descarte `stale`.

#### Scenario: Docente con contratos en ambos sectores
- GIVEN un docente con un contrato `Public` y uno `Private` vigentes,
- WHEN se consulta `sector-report` con el período vigente,
- THEN el docente se cuenta una vez en cada sector.

#### Scenario: Empates de escuelas líderes (orden estable)
- GIVEN dos escuelas con `enrollmentCount=12` en el mismo año,
- WHEN se consulta `top-schools-report`,
- THEN la UI las muestra a ambas en el orden `school.name` ascendente y luego `school.id`.

#### Scenario: Año sin inscripciones (200 `[]`)
- GIVEN un año sin `Enrollment`,
- WHEN se consulta el ranking,
- THEN la UI expone `role="status"` con mensaje vacío y un botón `Reintentar`.

#### Scenario: Loading con descarte de respuesta tardía
- GIVEN un GET en curso,
- WHEN la operadora cambia `academicYearId` o el período,
- THEN la fachada cancela la suscripción y descarta la respuesta tardía por `requestKey`.

#### Scenario: Error 422 `period_invalid`
- GIVEN `periodEnd < periodStart`,
- WHEN el backend responde `422 ProblemDetails` con `errors.periodEnd`,
- THEN la UI expone `role="alert"`, conserva filtros y no muestra conteos.

#### Scenario: Accesibilidad (CT-A11Y-RPT-SECTOR + CT-A11Y-RPT-TOP)
- GIVEN ambas vistas renderizadas,
- WHEN se inspecciona el DOM,
- THEN cada una expone un único `<h1 tabindex="-1">`, filtros con `<fieldset><legend>`, estados remotos con `role="status"`/`role="alert"`, `submit` con `aria-busy`; `top-schools-report` usa `<table>` con `<caption class="visually-hidden">` y `<th scope="col">`; usables a 320 px, contraste WCAG 2.2 AA y `prefers-reduced-motion` honrado.

## MODIFIED Requirements

### Requisito: FR-RPT-001 — Bloqueo por fase y activación

La UI MUST mantener `/student-history` bloqueado hasta decisión explícita; MUST habilitar `/reports` para FR-RPT-002 y FR-RPT-003 al aplicar este cambio; MUST no invocar endpoints P1 bloqueados (excluye `getStudentHistory`).
(Previously: bloqueaba `/reports` y `/student-history` tras `P1LockedComponent` y prohibía invocar cualquier endpoint P1).

#### Scenario: Acceso a `/reports` tras 002
- GIVEN la puerta P0 aprobada y 002 archivado,
- WHEN la operadora navega a `/reports/age-report`, `/reports/sector-report` o `/reports/top-schools-report`,
- THEN la navegación procede y los datos se consumen con `operationId` canónicos.

#### Scenario: `/student-history` sigue bloqueado tras 002
- GIVEN el cambio 002 archivado,
- WHEN la operadora navega a `/student-history`,
- THEN la UI sigue resolviendo a `P1LockedComponent` y no invoca `getStudentHistory`.

## DEFERRED — fuera de alcance de este cambio

### Requisito: FR-RPT-004 — Historial académico-docente
- (Razón): se ejecuta en `003-student-history` con sus propios DTOs, fixtures, servicio, fachada, ruta, componente, tests y evidencia manual.
- (Migración): ninguna referencia UI en este slice; `getStudentHistory` permanece no consumido.
- (Estado canónico): sigue descrito en `openspec/specs/municipal-reports/spec.md`; se activará con su propia propuesta y delta.