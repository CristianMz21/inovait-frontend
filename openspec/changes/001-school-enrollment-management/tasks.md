# Tareas: Gestión frontend de matrícula y contratación docente

## Review Workload Forecast

- 1.6k–2.3k P0 + scaffold + 900–1.4k P1
- 400-line budget risk: High
- Split: PR1→PR2→PR3→PR4→PR5, WU-P1 tras T035
- Delivery: on-risk
- Decision needed before apply: Yes
- Chained PRs recommended: Yes
- Chain strategy: stacked-to-main

### Suggested Work Units

- WU00 Gov (PR1, main)
- WU01 Base (PR2, WU00)
- WU02 US1 (PR3, WU01)
- WU03 US2 (PR4, WU02)
- WU04 US3 (PR5, WU03)
- WU05 Gate P0 (PR6, WU04)
- WU06 P1 opcional (PR7, T035)

## Fase 0

- [x] 1.1 T001 Validar ausencia de `angular.json`, `package.json`, `src/`.
- [x] 1.2 T002 Crear `docs/evaluator-execution.md` baseline P0.
- [x] 1.3 T003 Elegir estrategia (`stacked-to-main`).
- [x] 1.4 T004 Registrar SHA y checksum autorizados.

## Fase 1: Fundación

- [x] 2.1 T005 Ejecutar preflight `.angular-scaffold`.
- [x] 2.2 T006 Copiar scaffold a raíz.
- [x] 2.3 T007 Ajustar deps y scripts base.
- [x] 2.4 T008 Añadir `verify-openapi-contract.mjs` + `contract:verify`.
- [x] 2.5 T009 Crear DTOs y fixtures P0.
- [x] 2.6 T010 Añadir interceptor `ProblemDetails`.
- [x] 2.7 T011 Tests de catálogo remoto.
- [x] 2.8 T012 Implementar catálogo con cancelación y stale.
- [x] 2.9 T013 Configurar app config, routes y estilos.

## Fase 2: US1 matrícula

- [x] 3.1 T014 ST-ENR-CREATE para `createEnrollment`.
- [x] 3.2 T015 Implementar `CreateEnrollment` y mappers.
- [x] 3.3 T016 CT dependencias/stale/rollback.
- [x] 3.4 T017 Formulario con selects dependientes.
- [x] 3.5 T018 Integrar submit, retry y reset.
- [x] 3.6 T019 WU02 + evidencia P0.

## Fase 3: US2 consulta

- [x] 4.1 T020 ST-SEARCH-QUERY + CTs `SEARCH`.
- [x] 4.2 T021 Implementar filtros y `listEnrollments`.
- [x] 4.3 T022 Renderizar resultados.
- [x] 4.4 T023 Estados loading/error/empty/retry.
- [x] 4.5 T024 WU03 + evidencia.

## Fase 4: US3 contratos

- [x] 5.1 T025 ST-CON-PAYLOAD/LIST.
- [x] 5.2 T026 Implementar create/list contracts.
- [x] 5.3 T027 CT form/list remoto.
- [x] 5.4 T028 Form multi-escuela y consulta docente.
- [x] 5.5 T029 Responsive + estados.
- [x] 5.6 T030 WU04 + evidencia.

## Fase 5: Hardening P0

- [x] 6.1 T031 CT-A11Y-P0 rutas/shell.
- [x] 6.2 T032 Consolidar matriz P0 en doc.
- [x] 6.3 T033 Walkthrough teclado/320px/200%/contraste.
- [x] 6.4 T034 Validar backend real.
- [x] 6.5 T035 Puerta P0 (`contract:verify`, suite, build).

## Fase 6: P1 tras T035

- [ ] 7.1 T036 DTO/fixtures P1 reportes/historial.
- [ ] 7.2 T037 ST-RPT-AGE + ST-RPT-SECTOR.
- [ ] 7.3 T038 Implementar `ReportApiService`.
- [ ] 7.4 T039 CT-RPT-AGE.
- [ ] 7.5 T040 Implementar `age-report`.
- [ ] 7.6 T041 CT-RPT-SECTOR + CT-RPT-TOP.
- [ ] 7.7 T042 `sector-report`.
- [ ] 7.8 T043 `top-schools-report`.
- [ ] 7.9 T044 ST-HISTORY + CT-HISTORY.
- [ ] 7.10 T045 Integrar vista/historial.
- [ ] 7.11 T046 Rutas P1 + suite.

## Fase 7: Cierre

- [ ] 8.1 T047 Actualizar README/quickstart/docs.
- [ ] 8.2 T048 Cerrar PRs y empaque.
