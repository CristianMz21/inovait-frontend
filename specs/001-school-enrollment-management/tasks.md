---
description: "Tareas frontend P0-first para matrícula y contratación docente"
---

# Tareas: Gestión frontend de inscripción escolar y contratación docente

**Estado ejecutado (2026-07-13)**: P0 y P1 implementados. T001–T032 y
T034–T048 cuentan con evidencia en código, suites y
`docs/evaluator-execution.md`. T033 conserva pendiente únicamente la
confirmación humana del popup nativo de fecha y del zoom manual al 200 %; la
matriz automatizada responsive/teclado/axe está verde. SonarQube final está en
Quality Gate `OK` con 0 issues. T049 se completa mediante tres commits locales
por unidad de trabajo en `main`, sin push.

La lista detallada inferior se conserva como baseline histórico de
planificación; cuando su checkbox contradiga este resumen, prevalece el estado
ejecutado de este bloque y la evidencia fechada del evaluador.

Las 49 tareas son ítems finos de control de dependencia, revisión y evidencia; no
representan 49 horas secuenciales. P0 agrupa T001–T035 en los timeboxes de
[quickstart.md](./quickstart.md). T036–T047 son P1 y T048–T049 cierre posterior.

## Review Workload Forecast

| Categoría | P0 comprometido | P1 condicional / total |
| --- | ---: | ---: |
| Líneas humanas | 1.600–2.300 | +900–1.400; total 2.500–3.700 |
| Scaffold/lock/config generado | 650–1.050 | sin incremento relevante |
| Riesgo de 400 líneas | Alto | Alto |

La estrategia cacheada es `ask-on-risk`. Apply queda bloqueado hasta elegir una
cadena o aprobar `size:exception` solo para scaffold/lockfile generado. El diff
generado se reporta separado del humano; no existe excepción aprobada.

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Unidades revisables

| Unidad | Resultado | Líneas humanas | Generado separado |
| --- | --- | ---: | ---: |
| WU00 | baseline contractual registrado; estrategia de revisión pendiente | 0 | 0 |
| WU01 | scaffold/base/contrato | 260–380 | 650–1.050 |
| WU02 | Matrículas y pruebas | 340–400 | 0 |
| WU03 | Consulta y pruebas | 280–380 | 0 |
| WU04 | Contratos y pruebas | 340–400 | 0 |
| WU05 | accesibilidad/integración/puerta P0 | 280–380 | 0 |
| WU06–WU09 | una capacidad P1 por unidad | 220–360 cada una | 0 |

### Ruta crítica diaria y cortes

La puerta T004 ya está resuelta; T003, Node/npm y disponibilidad del backend P0
para integración deben estar resueltos antes del reloj. T014–T032 desarrollan las tres rutas
contra fixtures P0 congelados; T034–T035 usan backend real y CORS. A las 04:00,
Matrículas y Consulta deben estar verdes y Contratos iniciado. A las 07:00, las
tres rutas, la suite crítica y la evidencia manual de accesibilidad deben estar
listas para reservar la última hora a integración y gate. Si falla un corte se
registra el desvío: solo se corta hardening no esencial, nunca los tres recorridos
P0, errores/accesibilidad crítica, integración real ni entregables requeridos.

## Fase 0: decisiones bloqueantes y guía temprana

- [ ] T001 Verificar en solo lectura que no existen `angular.json`, `package.json`, `src/` ni lockfile y conservar la salida para T005; **Dep.** ninguna; **Criterio** no ejecuta npm/ng/build/test ni modifica implementación.
- [ ] T002 Crear temprano `docs/evaluator-execution.md` con prerrequisitos, baseline, matriz P0-only, walkthroughs y secciones de evidencia etiquetadas “No ejecutado”; **Dep.** T001; **Criterio** existe antes de registrar cualquier resultado y no contiene placeholders ambiguos.
- [ ] T003 [GOV-002] Elegir cadena de PRs o aprobar `size:exception` limitada a scaffold/lockfile generado, con ramas objetivo, líneas humanas/generadas y rollback en `docs/evaluator-execution.md`; **Dep.** T002; **Criterio** no se afirma cumplimiento mientras siga pendiente. **Bloquea T005.**
- [x] T004 [API-001,API-002; GOV-001] Registrar la autorización del baseline backend; **Evidencia** commit `1223630ab99bf1bfaa4f5919fccf5ff539379c8e`, con los diez YAML versionados y checksum aprobado `802c13b91bf5c6425d24c540b6841a2abe134e084ea310fc2b7041e32c24a81a`; **Criterio verificado** el commit contiene el bundle contractual. La verificación futura exige ese commit o un sucesor aprobado explícitamente, archivos bajo seguimiento, directorio contractual clean y checksum coincidente.

## Fase 1: base mínima P0

- [ ] T005 Ejecutar preflight y `ng new` dry-run exactamente como [quickstart.md](./quickstart.md), usando `.angular-scaffold`, `--skip-install` y sin `--force`; **Dep.** T002–T004; **Criterio** la simulación solo propone archivos dentro de staging y preserva Git/Spec Kit/docs.
- [ ] T006 Generar en `.angular-scaffold`, transferir únicamente `angular.json`, `package.json`, `tsconfig*.json`, `src/` y `public/`, y eliminar staging según quickstart; **Dep.** T005; **Criterio** workspace en raíz sin Git anidado, README reemplazado ni directorio `inovait-frontend/inovait-frontend`.
- [ ] T007 Fijar Angular/CLI `21.2.18/21.2.19`, TypeScript `5.9.3`, RxJS `7.8.2` y Material/CDK `21.2.14`, conservando Vitest; **Archivos** `package.json`, `package-lock.json`, `angular.json`, `src/styles.scss`; **Dep.** T006; **Criterio** no instala Playwright, NgRx ni tooling no planificado.
- [ ] T008 [API-001,API-002] Implementar `contract:verify` y su check estable `ST-CONTRACT-BUNDLE` sin dependencias para exigir el commit backend `1223630ab99bf1bfaa4f5919fccf5ff539379c8e` o un sucesor aprobado explícitamente, los diez archivos bajo seguimiento, el directorio contractual clean, checksum aprobado coincidente (`802c13b91bf5c6425d24c540b6841a2abe134e084ea310fc2b7041e32c24a81a` para el baseline actual), refs válidos, OpenAPI `3.1.0`, API `1.0.0` y exactamente 15 `operationId`; **Archivos** `scripts/verify-openapi-contract.mjs`, `package.json`; **Dep.** T007; **Criterio** falla ante archivo fuera del índice, cambios, commit/checksum no aprobados o mismatch y marca `listSubjects`/`listTeachersBySchool` como contract-only.
- [ ] T009 [P] [API-001–API-004] Crear únicamente DTO manuales y fixtures P0 antes de sus tests; **Archivos** `src/app/core/api/*.ts`, `src/app/core/catalogs/catalog.dto.ts`, `src/testing/fixtures/{catalog,enrollment,teacher-contract,problem-details}.fixtures.ts`; **Dep.** T008; **Criterio** nueve consumidores runtime P0, `CreateEnrollmentResponseDto` independiente de `EnrollmentListItemDto`, `endDate` omitido/null y `evaluatedAt`; no crea DTO ni fixtures de reportes/historia.
- [ ] T010 [P] [FR-042,FR-043] Escribir y completar `ST-PROBLEM-400`, `ST-PROBLEM-404`, `ST-PROBLEM-409`, `ST-PROBLEM-422` y `ST-PROBLEM-TRANSPORT` para el interceptor y field map; **Archivos** `src/app/core/api/problem-details.interceptor.spec.ts`, `problem-details.interceptor.ts`, `field-error-map.ts`; **Dep.** T009; **Criterio** conserva opcionales/fields seguros y no expone `instance`, trazas o extensiones internas.
- [ ] T011 [P] [FR-007,FR-008,FR-018,FR-046,FR-048] Escribir `ST-CATALOGS` y `CT-CATALOG-STATES` para los cinco catálogos P0; **Archivo** `src/app/core/catalogs/catalog-api.service.spec.ts`; **Dep.** T009; **Criterio** HttpTestingController prueba método/query/order exactos, estados loading/error/empty/success/retry/stale y ausencia de métodos runtime para los dos operationIds contract-only.
- [ ] T012 Implementar `CatalogApiService` y estado de catálogo loading/error/empty/success con retry e invalidación obsoleta; **Archivo** `src/app/core/catalogs/catalog-api.service.ts`; **Dep.** T011; **Criterio** cinco métodos runtime, cancelación de grupos y cero orden/deduplicación cliente.
- [ ] T013 [UX-001–UX-006] Escribir/completar `CT-SHELL-ROUTE` e implementar shell/rutas/config/tema; **Archivos** `src/app/app.config.ts`, `app.routes.ts`, `layout/`, `src/styles.scss`; **Dep.** T010,T012; **Criterio** navegación P0, skip link, título significativo por ruta, `h1` enfocado y anunciado una vez, foco visible y sin ruta P1 habilitada.

## Fase 2: Matrículas — FE-US1 P0

- [ ] T014 [P] [FE-US1] [FR-001–FR-011; `createEnrollment`] Escribir `ST-ENR-CREATE` para request, schema independiente `CreateEnrollmentResponseDto`, 201 nuevo/reutilizado y ProblemDetails; **Archivo** `src/app/features/enrollments/data-access/enrollment-api.service.spec.ts`; **Dep.** T009,T010; **Criterio** create declara todos sus campos canónicos, incluye `studentReused` y no extiende, intersecta ni reutiliza `EnrollmentListItemDto`.
- [ ] T015 [FE-US1] Implementar `createEnrollment` y mapeo mínimo sin `Location`, reordenamiento ni reglas duplicadas; **Archivos** `src/app/features/enrollments/data-access/enrollment-api.service.ts`, `models/enrollment.dto.ts`, `models/enrollment.mapper.ts`; **Dep.** T014; **Criterio** método vinculado al operationId y forma incompatible produce `invalidResponse`.
- [ ] T016 [FE-US1] [SCN-001–007,SCN-FE-001–003,SCN-FE-007] Escribir `CT-ENR-FORM`, `CT-ENR-DEPENDENCIES`, `CT-ENR-STALE`, `CT-ENR-SUCCESS` y `CT-ENR-ATOMIC-ERROR`; **Archivo** `src/app/features/enrollments/enrollment-create/enrollment-create-page.component.spec.ts`; **Dep.** T012,T015; **Criterio** requeridos, fecha futura, catálogos remotos/retry, limpieza/cancelación, 409/422 de escritura, reset y foco.
- [ ] T017 [FE-US1] Implementar Reactive Form y cadena School→AcademicYear→Grade→ClassGroup con estados exclusivos y stale protection; **Archivos** `src/app/features/enrollments/enrollment-create/*.{ts,html,scss}`; **Dep.** T016; **Criterio** controles/labels/razones disabled y respuesta tardía nunca revive opciones.
- [ ] T018 [FE-US1] Integrar submit, errores 400/404/409/422, recarga de catálogo obsoleto, confirmación, reset y foco; **Archivos** de T017; **Dep.** T010,T017; **Criterio** no muestra persistencia parcial, conserva datos corregibles y cumple live regions.
- [ ] T019 [FE-US1] Ejecutar verificación enfocada de WU02 con fixtures congelados y registrar resultados/diff; **Dep.** T018; **Criterio** `ST-ENR-CREATE`, `CT-ENR-FORM`, `CT-ENR-DEPENDENCIES`, `CT-ENR-STALE`, `CT-ENR-SUCCESS` y `CT-ENR-ATOMIC-ERROR` verdes, build estricto y líneas humanas ≤400 por slice decidido.

## Fase 3: Consulta de estudiantes — FE-US2 P0

- [ ] T020 [FE-US2] [SCN-008–012,SCN-FE-004,SCN-FE-007; `listEnrollments`] Escribir `ST-SEARCH-QUERY`, `CT-SEARCH-STATES` y `CT-SEARCH-RESULTS`; **Archivos** `src/app/features/enrollments/enrollment-search/*.spec.ts`; **Dep.** T012,T015,T019; **Criterio** toda combinación de referencias existentes es válida, `200 []` cubre noGroups/empty, referencias inexistentes producen 404 y no se espera 422 por combinación.
- [ ] T021 [FE-US2] Implementar coordinación de filtros, catálogos y `listEnrollments`; **Archivos** `src/app/features/enrollments/enrollment-search/enrollment-search-page.component.{ts,html,scss}`; **Dep.** T020; **Criterio** resultados previos se invalidan, noGroups evita llamada inútil y stale catalog ofrece recarga.
- [ ] T022 [FE-US2] Implementar resultados semánticos tabla/tarjetas; **Archivos** `src/app/features/enrollments/enrollment-search/enrollment-results.component.{ts,html,scss}`; **Dep.** T020,T021; **Criterio** conserva columnas/orden/acción y solo una representación queda expuesta/enfocable por breakpoint.
- [ ] T023 [FE-US2] Integrar error/retry, heading de resultados y anuncios; **Archivos** de T021–T022; **Dep.** T022; **Criterio** 400/404 corregibles, `200` empty/noGroups no es error, ninguna combinación existente se etiqueta incompatible, foco no salta y no se habilita historia P1.
- [ ] T024 [FE-US2] Ejecutar verificación enfocada de WU03 con fixtures y registrar resultados/diff; **Dep.** T023; **Criterio** `ST-SEARCH-QUERY`, `CT-SEARCH-STATES` y `CT-SEARCH-RESULTS` verdes, responsive público probado y build estricto.

## Fase 4: Contratos docentes — FE-US3 P0

- [ ] T025 [P] [FE-US3] [SCN-013–019; `createTeacherContracts`,`listTeacherContracts`] Escribir `ST-CON-PAYLOAD` y `ST-CON-LIST`; **Archivo** `src/app/features/teacher-contracts/data-access/teacher-contract-api.service.spec.ts`; **Dep.** T009,T010,T024; **Criterio** endDate omitido/null, `evaluatedAt`, query opcional y orden intacto; no prueba método `listTeachersBySchool`.
- [ ] T026 [FE-US3] Implementar DTO/mapper y solo los dos métodos runtime contractuales consumidos; **Archivos** `src/app/features/teacher-contracts/{models,data-access}/`; **Dep.** T025; **Criterio** estados persistido/efectivo separados, endDate requerido-nullable en response y cero método dead-client.
- [ ] T027 [FE-US3] [SCN-FE-006–008] Escribir `CT-CON-FORM`, `CT-CON-STATES`, `CT-CON-ATOMIC-ERROR` y `CT-CON-STATUS`; **Archivo** `src/app/features/teacher-contracts/teacher-contracts-page.component.spec.ts`; **Dep.** T012,T026; **Criterio** catálogos Teacher/School y lista loading/error/empty/success/retry, stale, rango, submit y rechazo total.
- [ ] T028 [FE-US3] Implementar form, creación atómica, refresh y lista por docente; **Archivos** `src/app/features/teacher-contracts/teacher-contracts-page.component.{ts,html}`; **Dep.** T027; **Criterio** 201 recarga, 400/404/409/422 conservan corrección y ninguna fila optimista parcial.
- [ ] T029 [FE-US3] Completar responsive/accesibilidad de contratos; **Archivo** `src/app/features/teacher-contracts/teacher-contracts-page.component.scss`; **Dep.** T028; **Criterio** sector, fin, estado y vigencia al `evaluatedAt` permanecen; una sola tabla/card semántica está expuesta.
- [ ] T030 [FE-US3] Ejecutar verificación enfocada de WU04 con fixtures y registrar resultados/diff; **Dep.** T029; **Criterio** `ST-CON-PAYLOAD`, `ST-CON-LIST`, `CT-CON-FORM`, `CT-CON-STATES`, `CT-CON-ATOMIC-ERROR` y `CT-CON-STATUS` verdes y build estricto.

## Fase 5: hardening y puerta P0

- [ ] T031 [P] [FE-US1–FE-US3] [UX-001–UX-011,UX-013,UX-014] Completar `CT-A11Y-P0` en specs existentes; **Dep.** T019,T024,T030; **Criterio** títulos de ruta, foco/anuncio único de `h1`, teclado, labels, describedby/invalid, live regions, headers, disabled reason y una representación responsive.
- [ ] T032 [FE-US1–FE-US3] Completar matriz automatizada P0-only con fixtures P0 para las tres rutas, estados loading/error/empty/success/retry y 400/404/409/422 según OpenAPI; **Archivos** specs P0 y `docs/evaluator-execution.md`; **Dep.** T031; **Criterio** GET de búsqueda usa `200` empty/noGroups y nunca 422 por combinación existente; cada 422/N/A restante está justificado sin inventar respuestas.
- [ ] T033 [FE-US1–FE-US3] Recorrer teclado/foco/labels/live regions, 320 CSS px, 200 % zoom, alto contraste y responsive; **Archivo** `docs/evaluator-execution.md`; **Dep.** T032; **Criterio** cero traps, foco oculto, pérdida de acción, duplicación semántica o información solo por color.
- [ ] T034 [FE-US1–FE-US3] Validar contra backend real con readiness nombrado: commit baseline `1223630ab99bf1bfaa4f5919fccf5ff539379c8e` o sucesor aprobado, archivos contractuales bajo seguimiento, directorio clean, nueve consumidores P0 implementados, seeds ficticios, errores canónicos y CORS local; **Archivo** `docs/evaluator-execution.md`; **Dep.** T033; **Criterio** tres walkthroughs, atomicidad, retry y listas reales pasan; no depende de IDs de tareas backend.
- [ ] T035 [FE-US1–FE-US3] Ejecutar puerta P0: contract verify, suite Vitest, build y consumir la matriz T032–T034; **Dep.** T034; **Criterio** 100 % P0 aprobado y evidencia fechada. **Bloquea todo trabajo P1 T036–T047 y el packaging T049 si falla.**

## Fase 6: P1 condicional — solo después de T035

- [ ] T036 [FE-US4–FE-US7] Crear DTO y fixtures exclusivamente P1 para reportes e historia antes de sus pruebas; **Archivos** `src/app/features/reports/models/`, `src/app/features/student-history/models/`, `src/testing/fixtures/{report,student-history}.fixtures.ts`; **Dep.** T035; **Criterio** cuatro consumidores runtime P1, schoolId/gradeId omitidos o null, propiedades fijas, `maximumAge: null`, arrays completos de historia y ninguna conducta de escritura SCN-035.
- [ ] T037 [FE-US4–FE-US6] Escribir `ST-RPT-AGE`, `ST-RPT-SECTOR` y `ST-RPT-TOP` usando los DTO/fixtures de T036; **Archivos** `src/app/features/reports/data-access/report-api.service.spec.ts`; **Dep.** T036; **Criterio** método/query/response exactos, referencias existentes sin grupos producen ceros/vacío y 422 solo cubre fecha/período canónico inválido.
- [ ] T038 [FE-US4–FE-US6] Implementar `ReportApiService` y mappers compartidos; **Archivos** `src/app/features/reports/{models,data-access}/`; **Dep.** T037; **Criterio** tres métodos runtime, cero buckets dinámicos, cálculo, orden o deduplicación cliente.
- [ ] T039 [P] [FE-US4] [SCN-020–023; BQ-001,BQ-002] Escribir `CT-RPT-AGE`; **Archivo** `src/app/features/reports/age-report/age-report.component.spec.ts`; **Dep.** T038; **Criterio** límites 2/3/7/8/12/13, fecha, ceros para contexto existente sin datos y estados exclusivos.
- [ ] T040 [FE-US4] Implementar distribución por edad accesible; **Archivos** `src/app/features/reports/age-report/`; **Dep.** T039; **Criterio** presenta `age3To7/age8To12/ageOver12` sin gráficos ni recálculo.
- [ ] T041 [P] [FE-US5] [SCN-024–027; BQ-003] Escribir `CT-RPT-SECTOR`; **Archivo** `src/app/features/reports/sector-report/sector-report.component.spec.ts`; **Dep.** T038; **Criterio** período completo, public/private fijos, ceros y estados exclusivos.
- [ ] T042 [FE-US5] Implementar docentes distintos por sector; **Archivos** `src/app/features/reports/sector-report/`; **Dep.** T041; **Criterio** muestra período devuelto y no recalcula distinct ni vigencia.
- [ ] T043 [P] [FE-US6] [SCN-028–030; BQ-004] Escribir `CT-RPT-TOP`; **Archivo** `src/app/features/reports/top-schools-report/top-schools-report.component.spec.ts`; **Dep.** T038; **Criterio** todos los empates, `200 []` para año existente sin inscripciones, orden y representación responsive única.
- [ ] T044 [FE-US6] Implementar escuelas líderes; **Archivos** `src/app/features/reports/top-schools-report/`; **Dep.** T043; **Criterio** no elige líder ni reordena la respuesta.
- [ ] T045 [P] [FE-US7] [SCN-031–034; BQ-005; `getStudentHistory`] Escribir `ST-HISTORY` y `CT-HISTORY`; **Archivos** `src/app/features/student-history/*.spec.ts`, enrollment API spec; **Dep.** T036,T023; **Criterio** 404, años/asignaciones completos y cero expectativa, fixture o test frontend para SCN-035 backend-only.
- [ ] T046 [FE-US7] [SCN-FE-005] Implementar historia, ruta y acción “Ver historial” en búsqueda; **Archivos** `src/app/features/student-history/`, resultados de búsqueda y `src/app/app.routes.ts`; **Dep.** T045; **Criterio** consume read-side válido, preserva multiplicidad y aplica política global de route focus.
- [ ] T047 [FE-US4–FE-US7] Habilitar Reportes, ejecutar suite P1 y walkthrough contra backend P1 listo con cálculo manual; **Archivos** `src/app/features/reports/`, `src/app/app.routes.ts`, `docs/evaluator-execution.md`; **Dep.** T040,T042,T044,T046 y readiness backend P1; **Criterio** BQ-001–005 evidenciadas sin alterar P0.

## Fase 7: cierre posterior a la puerta

- [ ] T048 Sincronizar README, quickstart, trazabilidad y evaluator execution con el estado realmente ejecutado, incluido un fallo de puerta si ocurre; **Dep.** ejecución de T035 y, si se autorizó P1, T047; **Criterio** Angular 21/Vitest, 15 contractuales/13 runtime, conteos y comandos reales sin prometer Playwright.
- [ ] T049 Preparar paquete o PRs solo tras una puerta T035 aprobada y con estrategia T003 aplicada, separando archivos generados de líneas humanas; **Dep.** T048 y T035 aprobada; **Criterio** cada slice tiene resultado, verificación y rollback; ningún packaging precedió T035.

## Dependencias y cobertura

`T001–T003 + T004 completada → T005–T013 → T014–T019 → T020–T024 → T025–T030 → T031–T035 → P1 T036–T047 → T048–T049`.

- **P0 comprometido**: T001–T035; tres rutas y nueve consumidores runtime.
- **P1 condicional**: T036–T047; agrega cuatro consumidores runtime hasta 13; DTO/fixtures P1 nacen en T036, nunca antes de la puerta.
- **Cierre**: T048–T049, siempre posterior al intento de puerta P0; packaging exige aprobación.
- **Tareas totales**: 49; P0 35, P1 12 y cierre 2.
- **Contrato**: 15/15 operationIds; `listSubjects` y `listTeachersBySchool` contract-only.
- **Paralelismo seguro**: solo tareas `[P]` con archivos distintos y prerequisitos completos.
- **Fuera de alcance**: auth, NgRx, CRUD, paginación, SQL, copia OpenAPI local y métodos cliente sin consumidor. Playwright se incorporó posteriormente como gate transversal de navegador.
