# Delta: `municipal-reports` — activación P1 (003)

**Change**: `003-student-history` · **Tipo**: MODIFIED capability · **Frontend-only**
**Source changes**: 001-school-enrollment-management (P0), 002-municipal-reports (P1), 003-student-history (P1)

## Propósito

Activar `FR-RPT-004` reemplazando `P1LockedComponent` por el recorrido `student-history` en `/student-history`, consumiendo `getStudentHistory` desde el contrato canónico (`paths/enrollments.yaml` → `StudentHistoryResponse`). Reutiliza `CatalogFacade`, `RemoteState<T>`, `problemDetailsInterceptor` y los patrones WCAG 2.2 AA heredados. Frontend-only: sin cambios backend.

## ADDED Requirements

### Requisito: FR-RPT-004 — Historial académico-docente (frontend)

El recorrido MUST consumir `getStudentHistory` desde `/api/students/{documentType}/{documentNumber}/history`; MUST mostrar línea de tiempo con inscripciones (escuela, grado, grupo, año académico) y sus asignaciones docentes (docente, materia, días); MUST preservar el orden contractual (inscripciones descendente por `academicYear.startDate` y ascendente por `enrollmentId`; asignaciones ascendente por `subject.name`, `teacher.lastNames`, `teacher.firstNames`, `assignmentId`); MUST distinguir `loading`/`error`/`empty`/`success` con cancelación + descarte `stale` por `requestKey`; MUST mapear sólo códigos canónicos (`student_not_found`, `bad_request`); MUST bloquear el submit hasta que `documentType` y `documentNumber` cumplan las longitudes canónicas.

#### Scenario: Búsqueda con identidad válida → loading → success

- GIVEN `documentType` y `documentNumber` dentro de longitudes canónicas,
- WHEN la operadora confirma el formulario,
- THEN `RemoteState` transita a `loading` y al resolverse muestra la línea de tiempo completa en orden contractual.

#### Scenario: Identidad sin inscripciones → empty (200 `enrollments: []`)

- GIVEN identidad normalizada válida sin inscripciones,
- WHEN se consulta historial,
- THEN el backend responde `200` con `enrollments: []` y la UI expone `role="status"` con mensaje vacío y acción `Reintentar`.

#### Scenario: Identidad inválida → 404 `student_not_found`

- GIVEN una identidad que no corresponde a un estudiante,
- WHEN se consulta historial,
- THEN el backend responde `404 ProblemDetails` con `code: "student_not_found"` y la UI expone `role="alert"` preservando filtros.

#### Scenario: Cambio de filtros → cancel-on-switch + descarte stale

- GIVEN un GET en curso,
- WHEN la operadora cambia `documentType` o `documentNumber`,
- THEN la fachada cancela la suscripción previa y descarta la respuesta tardía por `requestKey`.

#### Scenario: Reintento desde error → reload remoto

- GIVEN estado `error` con filtros conservados,
- WHEN la operadora pulsa `Reintentar`,
- THEN se reinicia a `loading` y se vuelve a invocar `getStudentHistory`; al resolverse transita a `success` o `empty`.

#### Scenario: Asignaciones múltiples y años sin asignaciones preservados

- GIVEN inscripción con N asignaciones docentes y/o inscripciones sin asignaciones,
- WHEN se renderiza la línea de tiempo,
- THEN todas las asignaciones se listan por inscripción sin colapsar docentes, materias ni días; las inscripciones sin asignaciones muestran `teachingAssignments: []` explícito.

#### Scenario: Accesibilidad (CT-A11Y-RPT-HIST)

- GIVEN la vista renderizada,
- WHEN se inspecciona el DOM,
- THEN hay un único `<h1 tabindex="-1">`, filtros con `<fieldset><legend>`, requeridos con `aria-required="true"`, `submit` con `aria-busy`, `loading`/`empty`/`success` con `role="status"` y `error` con `role="alert"`; línea de tiempo `<ol>` semántica (o `<table>` con `<caption class="visually-hidden">` + `<th scope="col">`); usables a 320 px, contraste WCAG 2.2 AA (`--app-muted`/`--app-accent`) y `prefers-reduced-motion` honrado.

## MODIFIED Requirements

### Requisito: FR-RPT-001 — Bloqueo por fase y activación

La UI MUST mantener `/student-history` operativo tras activar `003-student-history`; MUST seguir habilitando `/reports` para FR-RPT-002 y FR-RPT-003; MUST restringir la invocación de `getStudentHistory` al recorrido `features/student-history/**`.
(Previously: bloqueaba `/student-history` tras `P1LockedComponent` y prohibía invocar `getStudentHistory`.)

#### Scenario: Acceso a `/reports` tras 003

- GIVEN `002-municipal-reports` y `003-student-history` archivados,
- WHEN la operadora navega a `/reports/age-report`, `/reports/sector-report` o `/reports/top-schools-report`,
- THEN la navegación procede con `operationId` canónicos.

#### Scenario: Acceso a `/student-history` tras 003

- GIVEN `003-student-history` archivado,
- WHEN la operadora navega a `/student-history`,
- THEN la UI muestra el componente `student-history` y se invoca `getStudentHistory` con la identidad provista.

#### Scenario: `getStudentHistory` confinado al recorrido propio

- GIVEN `003-student-history` archivado,
- WHEN se navega a `/reports/*` o `/enrollment-management`,
- THEN el verificador estático (`grep getStudentHistory src/`) registra consumo sólo dentro de `features/student-history/**`.

## REMOVED Requirements

Ninguna.

## RENAMED Requirements

Ninguna.

## Notas de contrato (read-only)

Forma: `StudentHistoryResponse` (`components/enrollments.yaml:131-145`); path `GET /api/students/{documentType}/{documentNumber}/history` (`paths/enrollments.yaml:111-165`, `operationId: getStudentHistory`). Parámetros: sólo path params (`documentType` 1–20, `documentNumber` 1–32). Sin `schoolId`/`gradeId`/`academicYearId`/`asOfDate` (esos viven en `listEnrollments`). Errores canónicos: `400`, `404 student_not_found`.