# Trazabilidad frontend de requisitos

## Estado ejecutado

Al 2026-07-13, las seis superficies y los 13 consumidores runtime están
implementados. La verificación vigente es `629/629` pruebas Vitest, `32/32` E2E
mock, `10/10` E2E de build production y contrato `15/15` contra backend
`8ed5e6e57aa90758059ebb84ebd2ea55b8dd5854`. El análisis Sonar final mantiene
Quality Gate `OK`, 0 issues, cobertura 86.3 %, line coverage 84.9 %, branch
coverage 88.8 %, duplicación 0.6 % y ratings A.

Decisiones funcionales confirmadas:

- `listClassGroups` precede a `listEnrollments`; ausencia de grupos evita la
  segunda llamada y se distingue de grupos sin matrículas.
- `createTeacherContracts` siempre se reconcilia con un
  `listTeacherContracts` posterior; la vista nunca anexa el POST como estado
  canónico.
- Reportes presentan los conteos recibidos sin derivar totales, distinct ni
  orden cliente.
- La normalización de errores no expone strings, objetos parciales ni
  extensiones inesperadas del transporte.

## Fuentes de verdad

| Aspecto | Fuente canónica |
| --- | --- |
| consigna original | backend `docs/assessment-baseline.md` |
| comportamiento frontend | `specs/001-school-enrollment-management/spec.md` |
| reglas/REQ | backend `spec.md` |
| HTTP | backend `contracts/openapi.yaml` y sus nueve refs |
| arquitectura/modelos | `plan.md`, `data-model.md`, `docs/frontend-architecture.md` |
| interacción/accesibilidad | `docs/ux-design.md` |
| pruebas | `docs/testing-strategy.md` |
| secuencia | `specs/001-school-enrollment-management/tasks.md` |

La matriz enlaza sin duplicar reglas. Contiene 49 FR, 14 UX, 5 API, 2 GOV,
1 DATA, 52 REQ, 35 SCN backend, 8 SCN-FE, 5 BQ, 15 operationIds y 49 tareas.

El contrato frontend observado contiene **13 consumidores runtime** —nueve P0 y
cuatro P1— más dos operaciones contract-only. El baseline backend autorizado es
el commit `1223630ab99bf1bfaa4f5919fccf5ff539379c8e`, con checksum combinado
`802c13b91bf5c6425d24c540b6841a2abe134e084ea310fc2b7041e32c24a81a` y los diez
YAML versionados. La verificación exige ese commit exacto o un sucesor aprobado
explícitamente, archivos contractuales bajo seguimiento, directorio clean y
checksum coincidente.

## Superficies

| ID | Page | Prioridad | Tareas |
| --- | --- | --- | --- |
| `FE-S01` | EnrollmentCreatePage | P0 | T014–T019 |
| `FE-S02` | EnrollmentSearchPage | P0 | T020–T024 |
| `FE-S03` | TeacherContractsPage / form | P0 | T025–T030 |
| `FE-S04` | TeacherContractsPage / list | P0 | T025–T030 |
| `FE-S05` | ReportsPage | P1 | T036–T044,T047 |
| `FE-S06` | StudentHistoryPage | P1 | T036,T045–T047 |

## Operaciones: 15 contractuales, 13 runtime

| operationId | Consumidor runtime | Superficie | Tarea/prueba |
| --- | --- | --- | --- |
| `listSchools` | `CatalogApiService.listSchools` | FE-S01/02/03/05 | T011–T012; `ST-CATALOGS` |
| `listGrades` | `CatalogApiService.listGrades` | FE-S01/02/05 | T011–T012; `ST-CATALOGS` |
| `listAcademicYears` | `CatalogApiService.listAcademicYears` | FE-S01/02/05 | T011–T012; `ST-CATALOGS` |
| `listClassGroups` | `CatalogApiService.listClassGroups` | FE-S01/02 | T011–T012; `ST-CATALOGS` |
| `listTeachers` | `CatalogApiService.listTeachers` | FE-S03 | T011–T012; `ST-CATALOGS` |
| `listSubjects` | ninguno; contract-only | sin consumidor necesario | T008; `ST-CONTRACT-BUNDLE` |
| `listTeachersBySchool` | ninguno; contract-only | flujo UI es teacher-first | T008; `ST-CONTRACT-BUNDLE` |
| `createEnrollment` | `EnrollmentApiService.createEnrollment` | FE-S01 | T014–T018; `ST-ENR-CREATE` |
| `listEnrollments` | `StudentSearchApiService.list` | FE-S02 | T020–T023; `ST-SEARCH-QUERY` |
| `getStudentHistory` | `StudentHistoryApiService.getStudentHistory` | FE-S06 | T036,T045–T046; `ST-HISTORY`, `CT-HISTORY` |
| `createTeacherContracts` | `TeacherContractsApiService.create` | FE-S03 | T025–T028; `ST-CON-PAYLOAD` |
| `listTeacherContracts` | `TeacherContractsApiService.list` | FE-S04 | T025–T029; `ST-CON-LIST` |
| `getAgeDistribution` | `ReportApiService.getAgeDistribution` | FE-S05 | T036–T040; `ST-RPT-AGE`, `CT-RPT-AGE` |
| `getDistinctTeacherCountsBySector` | `ReportApiService.getDistinctTeacherCountsBySector` | FE-S05 | T036–T038,T041–T042; `ST-RPT-SECTOR`, `CT-RPT-SECTOR` |
| `getTopSchoolsByEnrollment` | `ReportApiService.getTopSchoolsByEnrollment` | FE-S05 | T036–T038,T043–T044; `ST-RPT-TOP`, `CT-RPT-TOP` |

## Matriz funcional

| Requisitos frontend ↔ backend | Aceptación | Operaciones | Tareas / pruebas |
| --- | --- | --- | --- |
| FR-001–011 ↔ REQ-001–011 | US1; SCN-001–007; SCN-FE-001–003,007 | catálogos, createEnrollment | T014–T019; `ST-ENR-CREATE`, `CT-ENR-FORM`, `CT-ENR-DEPENDENCIES`, `CT-ENR-STALE`, `CT-ENR-SUCCESS`, `CT-ENR-ATOMIC-ERROR`, `CT-CATALOG-STATES` |
| FR-012–017 ↔ REQ-012–017 | US2; SCN-008–012; SCN-FE-004,007; acceso P1 SCN-FE-005 | catálogos, listEnrollments | T020–T024; acción P1 T046; `ST-SEARCH-QUERY`, `CT-SEARCH-STATES`, `CT-SEARCH-RESULTS` |
| FR-018–026,047 ↔ REQ-018–026,047 | US3; SCN-013–019; SCN-FE-006–008 | catálogos, contract create/list | T025–T030; `ST-CON-PAYLOAD`, `ST-CON-LIST`, `CT-CON-FORM`, `CT-CON-STATES`, `CT-CON-ATOMIC-ERROR`, `CT-CON-STATUS` |
| FR-027–032 ↔ REQ-027–032 | US4; SCN-020–023; BQ-001/002 | getAgeDistribution | T036–T040,T047; `ST-RPT-AGE`, `CT-RPT-AGE` |
| FR-033–035 ↔ REQ-033–035 | US5; SCN-024–027; BQ-003 | getDistinctTeacherCountsBySector | T036–T038,T041–T042,T047; `ST-RPT-SECTOR`, `CT-RPT-SECTOR` |
| FR-036–037 ↔ REQ-036–037 | US6; SCN-028–030; BQ-004 | getTopSchoolsByEnrollment | T036–T038,T043–T044,T047; `ST-RPT-TOP`, `CT-RPT-TOP` |
| FR-038–041 ↔ REQ-038–041 | US7; lectura SCN-031–034; BQ-005; SCN-035 backend-only sin acción UI | getStudentHistory | T036,T045–T047; `ST-HISTORY`, `CT-HISTORY` |
| FR-042–043 ↔ REQ-042–043 | errores de todas las historias | todas según contrato | T010,T018,T023,T028,T032,T037; `ST-PROBLEM-400`, `ST-PROBLEM-404`, `ST-PROBLEM-409`, `ST-PROBLEM-422`, `ST-PROBLEM-TRANSPORT` |
| FR-044–049 ↔ REQ-044–049 | datos/orden/estado transversal | todas | T008–T013,T031–T036,T047–T048 |
| GOV-001 ↔ REQ-050 | contrato, ownership y documentación trazable | N/A | T002,T004,T008,T048 |
| GOV-002 ↔ REQ-051 | presupuesto y unidades revisables | N/A | T003,T019,T024,T030,T035,T049 |
| DATA-001 ↔ REQ-052 | cero persistencia/agregados frontend | lecturas | T009,T015,T026,T036,T038,T040,T042,T044,T046 |

`SCN-035` solo prueba en backend la escritura interna/seed de
`TeachingAssignment`. Frontend no tiene aceptación, acción, fixture conductual ni
tarea de creación. T045–T046 prueban y consumen únicamente historia read-side
válida para SCN-031–034.

## UX y accesibilidad

| Requisitos | Evidencia | Tareas / pruebas |
| --- | --- | --- |
| UX-001–005 | navegación, teclado, semántica, error y live regions | T013,T031–T035; `CT-SHELL-ROUTE`, `CT-A11Y-P0` |
| UX-006,010,014 | 320 px, 200 %, tabla/card única | T022,T029,T031,T033; `CT-SEARCH-RESULTS`, `CT-CON-STATUS` |
| UX-007–009,011 | estados exclusivos, submit y razones disabled | T012,T016–T018,T020–T030,T032; `CT-CATALOG-STATES`, `CT-ENR-DEPENDENCIES`, `CT-ENR-STALE`, `CT-ENR-SUCCESS`, `CT-ENR-ATOMIC-ERROR`, `CT-SEARCH-STATES`, `CT-CON-FORM`, `CT-CON-STATES`, `CT-CON-ATOMIC-ERROR` |
| UX-012 | reportes simples sin gráficos | T036–T047; `CT-RPT-AGE`, `CT-RPT-SECTOR`, `CT-RPT-TOP`, `CT-HISTORY` |
| UX-013 | title y política única route focus/announcement | T013,T031,T033; `CT-SHELL-ROUTE`, `CT-A11Y-P0` |

## Frontera API y DTO

| Requisito | Evidencia | Tareas |
| --- | --- | --- |
| API-001/002 | baseline autorizado `1223630ab99bf1bfaa4f5919fccf5ff539379c8e` + checksum `802c13b91bf5c6425d24c540b6841a2abe134e084ea310fc2b7041e32c24a81a`; archivos bajo seguimiento y directorio clean; 15 IDs, 13 runtime + 2 contract-only | T004,T008,T011,T014,T020,T025,T036–T046 |
| API-003 | validación local orienta; backend prevalece | T016–T018,T020–T030 |
| API-004 | ProblemDetails opcional/nullable y field map | T009–T010,T032 |
| API-005 | colecciones completas y orden recibido | T011–T012,T020–T029,T036–T046 |

Fixtures P0 T009 cubren create/list enrollment separados, endDate omitido/null y
`evaluatedAt`. Solo después de T035, T036 crea fixtures P1 con report
schoolId/gradeId omitido/null, propiedades fijas e historia completa.

## Preguntas de negocio P1

| BQ | Escenarios frontend | Operación | Tareas |
| --- | --- | --- | --- |
| BQ-001/002 | SCN-020–023 | getAgeDistribution | T036–T040,T047 |
| BQ-003 | SCN-024–027 | getDistinctTeacherCountsBySector | T036–T038,T041–T042,T047 |
| BQ-004 | SCN-028–030 | getTopSchoolsByEnrollment | T036–T038,T043–T044,T047 |
| BQ-005 | SCN-031–034; SCN-035 backend-only excluido | getStudentHistory | T036,T045–T047 |

## Estado y conteos

- Requisitos frontend: 49 FR + 14 UX + 5 API + 2 GOV + 1 DATA, todos trazados.
- Backend: REQ-001–052, 52/52 enlazados.
- Escenarios: SCN-001–035 presentes; SCN-035 marcado backend-only; SCN-FE-001–008 cubiertos.
- Negocio: BQ-001–005, 5/5 enlazadas.
- OpenAPI: 15/15; 13 consumidores runtime y 2 contract-only sin método cliente.
- Tareas: 49/49; P0 T001–T035, P1 condicional T036–T047, cierre T048–T049.
- P1: ninguna tarea, DTO ni fixture P1 comienza antes de la puerta T035; T036 prepara los contratos P1 antes de sus tests.
- Contexto académico: toda combinación School/Grade/AcademicYear existente es consultable; `200` vacío/ceros cubre ausencia de grupos o inscripciones y no se traza 422 por incompatibilidad en GET.
- Contrato backend: commit autorizado `1223630ab99bf1bfaa4f5919fccf5ff539379c8e`; checksum `802c13b91bf5c6425d24c540b6841a2abe134e084ea310fc2b7041e32c24a81a`; baseline contractual completado.
- Implementación: P0 y P1 operativos; 13 consumidores runtime, cinco rutas,
  workspace Angular, gates Vitest/Playwright/axe y despliegue local integrado.
