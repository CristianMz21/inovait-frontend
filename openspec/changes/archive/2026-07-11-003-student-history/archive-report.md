# Archive Report — `003-student-history` (P1)

## Summary

| Field | Value |
|---|---|
| Change | `003-student-history` |
| Status | `ARCHIVED_WITH_WARNINGS` — P1 student-history closed; `/student-history` operativo; `FR-RPT-004` activado |
| Date | 2026-07-11 |
| Scope | Frontend-only archive for P1 (`/student-history`). Synced delta into canonical `openspec/specs/municipal-reports/spec.md`; preserved P0 baseline + P1 reports (002) + activated P1 history (003). Los cuatro recorridos municipales quedan operativos: distribución por edad, docentes por sector y escuelas líderes en `/reports`; histórico académico-docente en `/student-history`. |
| Artifact mode | OpenSpec filesystem + Engram archive report |
| Predecesores | `001-school-enrollment-management` (archivado `2026-07-11`), `002-municipal-reports` (archivado `2026-07-11`) |
| Implementation commits | `84cdc43` (WU11-STU) · `6ad896e` (WU11-FIX-URL) |
| Archive commit | `chore(003): archive P1 student-history change and sync delta-specs` (pending; resolved at archive time) |

This archive syncs the completed P1 delta specs into the canonical `openspec/specs/municipal-reports/spec.md` (preserving the P0 baseline + P1 reports content), activates `FR-RPT-004` y registra los gaps manuales pendientes. Las 12 tareas T074–T085 están completas; el gate `npm test` (432/432), `npx ng build` (1.38 MB initial) y `contract:verify` (con la limitación pre-existente del entorno) están documentados en `verify-report.md`.

## Synced specs

The following canonical spec was updated by merging the P1 history delta into the existing P0+P1 baseline and annotated with `**Source changes**: 001-school-enrollment-management (P0), 002-municipal-reports (P1), 003-student-history (P1)`:

- `openspec/specs/municipal-reports/spec.md` — merged from P0 baseline + P1 reports (002) + P1 history (003):
  - **FR-RPT-001** (MODIFIED): `/student-history` ahora operativo; `/reports` sigue habilitado para FR-RPT-002/FR-RPT-003; `getStudentHistory` confinado a `features/student-history/**`.
  - **FR-RPT-002** (IMPLEMENTED): escenarios P0 + 4 escenarios P1 (conteo por banda exacto, `200 []` con ceros como `success`, loading con descarte `stale`, 422 `as_of_date_invalid`, accesibilidad `CT-A11Y-RPT-AGE`). Sin cambios en este archivado.
  - **FR-RPT-003** (IMPLEMENTED): escenarios P0 + 4 escenarios P1 (docente con doble sector, empates con orden estable, `200 []` con `Reintentar`, loading con descarte `stale`, 422 `period_invalid`, accesibilidad `CT-A11Y-RPT-SECTOR` + `CT-A11Y-RPT-TOP`). Sin cambios en este archivado.
  - **FR-RPT-004** (DEFERRED → ACTIVE): estado P0 conservado + estado `002` documentado + nota de activación `003`; los 2 escenarios P0 baseline (Identidad inexistente, Estudiante con múltiples relaciones) se preservan y se añaden 7 escenarios P1 (búsqueda válida → loading → success, identidad sin inscripciones → empty, identidad inválida → 404 `student_not_found`, cancel-on-switch + stale, retry desde error, asignaciones múltiples + años sin asignaciones preservados, accesibilidad `CT-A11Y-RPT-HIST`).

The canonical specs for the other capabilities (`enrollment-management`, `student-search`, `teacher-contracts`) were not touched by this change — they remain owned by `001-school-enrollment-management` (P0 archived 2026-07-11).

## Verification reference

- Verification report: [`verify-report.md`](./verify-report.md)
- Verdict inherited from verification: `PASS_WITH_WARNINGS`, `READY TO ARCHIVE`
- Commits verificados:
  - `84cdc43 feat(003): student-history timeline with WCAG 2.2 AA and gate rerun (WU11-STU)` (`main`)
  - `6ad896e fix(003): align student-history URL with canonical contract (WU11-FIX-URL)` (`main`)
- Build/tests evidence: 35 archivos, **432/432 tests** verdes (368 pre-existentes + 64 exclusivos de 003: 14 componente + 13 fachada + 3 servicio + 14 mappers + 9 DTO + 10 a11y + 1 app shell); `npx ng build --configuration=development` OK (1.38 MB initial, sin chunk `p1-locked-component`).
- Contract evidence: `verify-openapi-contract.mjs` tracking + clean OK; commit-check FAIL por entorno local (HEAD backend `247794aa41...` ≠ baseline autorizado `1223630ab...`), limitación pre-existente del entorno idéntica a 001 y 002. URL drift detectado manualmente y resuelto por WU11-FIX-URL (`6ad896e`).
- Design conformance: 100 % — `StudentHistoryComponent` con timeline `<ol>` + `<time datetime>` + `.visually-hidden`; `StudentHistoryFacade` con 1 `SlotBinding<StudentHistoryVm>` + cancel-on-switch + descarte `stale` por `requestKey#seq`; mappers 1:1 sin reordenar; `200 enrollments: []` mapea a `RemoteState.empty('noResults')` con `retryHistory()` desde `empty` o `error`; `404 student_not_found` / `400 invalid_request` mapeados vía `ApiProblem`; `problemDetailsInterceptor` cableado globalmente; URL canónica `/api/students/{documentType}/{documentNumber}/history` alineada.

## Manual evidence gaps still open

| Task | Status | Reference | Archive decision |
|---|---|---|---|
| T033-STU Walkthrough teclado/320px/200%/contraste | `manual evidence pending` | `docs/evaluator-execution.md:609-669` → Bloques H-A a H-C + tabla de registro T033-STU con 15 filas `☐` | No oculto; carga explícita de validación manual post-archive con revisor humano antes del release. |
| T034-STU Backend integration (backend real `localhost:5000`, CORS, end-to-end) | `manual integration pending` | `docs/evaluator-execution.md:671-688` → procedimiento manual + tabla con 5 verificaciones | No oculto; carga explícita de integración backend real post-archive. |

Ambos gaps están reconocidos en el doc como "manual evidence pending" y deben ejecutarse en una release distinta; no bloquean el archivado del slice P1 cerrado. Patrón idéntico a T033-RPT/T034-RPT de 002 y T033/T034 de 001.

## Known warnings inherited

| ID | Warning | Impact | Status / Recommended timing |
|---|---|---|---|
| W-ENV-COMMIT-CHECK | `verify-openapi-contract.mjs` rechaza HEAD backend local `247794aa41…` (no autorizado; backend está adelante del baseline congelado `1223630ab…`). Limitación del entorno local — el verificador es correcto y rechaza desviaciones; en CI con backend en `1223630ab` o sucesor aprobado en `APPROVED_SUCCESSORS`, esta comprobación pasa. | Bloquea checksum + operationIds check en entorno local; no bloquea archive porque el contrato de contenido **es verificable** en CI estándar. | Heredado; idéntico en 001 y 002. Decidir `APPROVED_SUCCESSORS` cuando el backend esté estabilizado (mantenimiento, no del change 003). |
| W-URL-DRIFT-RESOLVED | Drift de URL entre contrato canónico (`/api/students/...` en `paths/enrollments.yaml:111`) y la implementación original de WU11-STU (`/api/enrollments/students/...`). El verificador automatizado `verify-openapi-contract.mjs:199-218` sólo valida `operationId`, no URLs exactas, por lo que no detectó el drift en el gate. | **RESUELTO** por el fix `fix(003): align student-history URL with canonical contract (WU11-FIX-URL)` (`6ad896e`) que alineó `StudentHistoryApiService`, fixtures y tests al URL canónico. Verificado manualmente que la spec canónica y la implementación ahora coinciden exactamente. | Cerrado en `main` antes del archivado de 003. |
| W-TEST-WARNINGS-INHERITED | `npm test` emite warnings heredados de Angular sobre `disabled` con reactive forms en specs P0 (`enrollment-create.component.spec.ts`, `student-search.component.spec.ts`). No son fallos ni fueron suprimidos. | Cosmético; distrae al lector del output. | Heredado; idéntico en 001 y 002. Documentar explícitamente en `evaluator-execution.md`. |

Las advertencias son **idénticas en naturaleza** a las documentadas en los archives P0 y P1 reports; no introducen nuevos riesgos estructurales. El drift de URL estaba documentado como WARNING en el `verify-report.md` de WU11-STU (W-1) y se cerró antes del archivado.

## Future work / next change candidates

- **`003-student-history` está cerrado**. Los cuatro recorridos de `municipal-reports` quedan operativos. No hay work candidates obligatorios para esta capability.
- **Cierre de gaps manuales T033-STU / T034-STU**: ejecutar el walkthrough de teclado/lector de pantalla y la integración con backend real como actividad de validación humana previa al release. No son del change 003 (post-archive, pre-release).
- **Decisión sobre `APPROVED_SUCCESSORS`**: cuando el backend se estabilice, decidir si el HEAD actual se aprueba como sucesor (`verify-openapi-contract.mjs:38-40`) o si `main` backend se retrotrae al commit `1223630ab` para esta feature. Trabajo de mantenimiento del repositorio backend, no del change 003.
- **S-1 — `student-history-item.dto.ts:56` cita URL canónica contradictoria**: alinear doc-comment del DTO con la implementación (ahora ambas consistentes tras WU11-FIX-URL) o simplemente verificar que ya no aplica. Sugerencia cosmética; no bloquea archivado.
- **S-2 — `contract:verify` sin bloque `assertOperationIds` ejecutado**: para CI en commit autorizado, la rampa de gate completa correrá; localmente considerar agregar `getOperationIds` con `--no-fail` para emitir un reporte parcial cuando el commit-check falla. No bloquea verificación actual.

## Archive contents

- `proposal.md` ✅
- `design.md` ✅
- `specs/municipal-reports/spec.md` ✅ (delta kept for history)
- `tasks.md` ✅ (12/12 tareas P1 completas)
- `verify-report.md` ✅ (`PASS_WITH_WARNINGS — READY TO ARCHIVE`)
- `archive-report.md` ✅ (este archivo)

## Active changes directory

- `openspec/changes/003-student-history/` ya **no existe** — el directorio completo fue movido al archive.
- `openspec/changes/` ahora contiene únicamente `archive/` con los tres changes cerrados:
  - `2026-07-11-001-school-enrollment-management/`
  - `2026-07-11-002-municipal-reports/`
  - `2026-07-11-003-student-history/`

## Source of truth updated

- `openspec/specs/municipal-reports/spec.md` — header actualizado a `**Source changes**: 001-school-enrollment-management (P0), 002-municipal-reports (P1), 003-student-history (P1)`; FR-RPT-001 modificado con `/student-history` operativo y `getStudentHistory` confinado; FR-RPT-004 transicionado de DEFERRED a ACTIVE con los 2 escenarios P0 baseline preservados + 7 escenarios P1; SC-RPT-05 (P1, archivado con `003-student-history`) añadido a Criterios de éxito; Riesgos abiertos ampliados con la nota de URL drift RESUELTO por WU11-FIX-URL (`6ad896e`).

## SDD cycle complete

El cambio `003-student-history` fue planificado, implementado, verificado y archivado. Los cuatro recorridos de `municipal-reports` (FR-RPT-001/002/003/004) están operativos y consolidados en la spec canónica. El ciclo SDD frontend P0+P1 está cerrado. Listo para el siguiente change (no obligatorio; el alcance P1 comprometido está agotado).