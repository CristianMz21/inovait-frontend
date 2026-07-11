# Archive Report — `002-municipal-reports` (P1)

## Summary

| Field | Value |
|---|---|
| Change | `002-municipal-reports` |
| Status | `ARCHIVED_WITH_WARNINGS` — P1 municipal-reports closed (`/reports` operativo); `FR-RPT-004` diferido a `003-student-history` |
| Date | 2026-07-11 |
| Scope | Frontend-only archive for P1 (`/reports/age-report`, `/reports/sector-report`, `/reports/top-schools-report`). Synced delta into canonical `openspec/specs/municipal-reports/spec.md`; preserved P0 baseline plus P1 implementations for FR-RPT-002 y FR-RPT-003. `/student-history` permanece bloqueada. |
| Artifact mode | OpenSpec filesystem + Engram archive report |
| Predecesor | `001-school-enrollment-management` (archivado `2026-07-11`) |
| Implementation commits | `7b16bb5` (WU07), `bf3ed79` (WU08), `a451ba6` (WU09), `3a44875` (WU10) |

This archive syncs the completed P1 delta specs into the canonical `openspec/specs/municipal-reports/spec.md` (preserving the P0 baseline) and records the remaining non-blocking evidence gaps. Tasks T047–T073 are complete for P1; the single `[ ]` checkbox for `student-history` is an intentional out-of-scope reminder for `003-student-history`, not an open implementation task.

## Synced specs

The following canonical spec was updated by merging the P1 delta into the existing P0 baseline and annotated with `**Source changes**: 001-school-enrollment-management (P0), 002-municipal-reports (P1)`:

- `openspec/specs/municipal-reports/spec.md` — merged from P0 baseline + P1 delta:
  - **FR-RPT-001** (MODIFIED): `/reports` habilitado para FR-RPT-002/003; `/student-history` permanece bloqueado.
  - **FR-RPT-002** (IMPLEMENTED): escenarios P0 conservados + 4 escenarios P1 (conteo por banda exacto, `200 []` con ceros como `success`, loading con descarte `stale`, 422 `as_of_date_invalid`, accesibilidad `CT-A11Y-RPT-AGE`).
  - **FR-RPT-003** (IMPLEMENTED): escenarios P0 conservados + 4 escenarios P1 (docente con doble sector, empates con orden estable, `200 []` con `Reintentar`, loading con descarte `stale`, 422 `period_invalid`, accesibilidad `CT-A11Y-RPT-SECTOR` + `CT-A11Y-RPT-TOP`).
  - **FR-RPT-004** (DEFERRED): estado P0 conservado + nota explícita de diferimiento a `003-student-history`; sin cambios en el requisito canónico.

The canonical specs for the other capabilities (`enrollment-management`, `student-search`, `teacher-contracts`) were not touched by this change — they remain owned by `001-school-enrollment-management` (P0 archived 2026-07-11).

## Verification reference

- Verification report: [`verify-report.md`](./verify-report.md)
- Verdict inherited from verification: `PASS_WITH_WARNINGS`, `READY TO ARCHIVE`
- Commit verificado: `3a44875 feat(002): reports shell + a11y consolidation + gate rerun (WU10)` (`main`)
- Build/tests evidence: 29 archivos, **358/358 tests** (135 P0 + 23 P0 a11y + 100 P1 en facade/mappers/components/P1 a11y); `npx ng build --configuration=development` OK.
- Contract evidence: `verify-openapi-contract.mjs` tracking + clean OK; commit-check con nota (limitación del entorno local, idéntica al P0).
- Design conformance: 100 % — `ReportsShellComponent` con tres `<section>` y anclas internas; `ReportsFacade` con tres `SlotBinding<VM>` independientes; cancel-on-switch + descarte `stale` por `requestKey`; mappers sin recálculo; `200 []` en `top-schools` mapea a `RemoteState.empty` con `retryTop()` desde `empty` o `error`; `problemDetailsInterceptor` cableado globalmente.

## Manual evidence gaps still open

| Task | Status | Reference | Archive decision |
|---|---|---|---|
| T033-RPT Walkthrough teclado/320px/200%/contraste | `manual evidence pending` | `docs/evaluator-execution.md` → `Walkthrough Script` (Bloques R-A a R-C + tabla de registro T033-RPT con 15 filas `☐`) | No oculto; carga explícita de validación manual post-archive con revisor humano antes del release. |
| T034-RPT Backend integration (backend real `localhost:5000`, CORS, end-to-end) | `manual integration pending` | `docs/evaluator-execution.md` → `Backend integration` (procedimiento manual + tabla con 5 verificaciones) | No oculto; carga explícita de integración backend real post-archive. |

Ambos gaps están reconocidos en el doc como "manual evidence pending" y deben ejecutarse en una release distinta; no bloquean el archivado del slice P1 cerrado.

## Known warnings inherited

| ID | Warning | Impact | Recommended timing |
|---|---|---|---|
| W-ENV-COMMIT-CHECK | `verify-openapi-contract.mjs` rechaza HEAD backend local `ea8335496…` (no autorizado; backend está 20 commits adelante del baseline congelado `1223630ab…`). Limitación del entorno local — el verificador es correcto y rechaza desviaciones; en CI con backend en `1223630ab` o sucesor aprobado en `APPROVED_SUCCESSORS`, esta comprobación pasa. | Bloquea checksum + operationIds check en entorno local; no bloquea archive porque el contrato de contenido **es verificable** en CI estándar. | Decidir `APPROVED_SUCCESSORS` cuando el backend esté estabilizado (mantenimiento, no del change 002). |
| W-TEST-WARNINGS-INHERITED | `npm test` emite warnings heredados de Angular sobre `disabled` con reactive forms en specs P0 (`enrollment-create.component.spec.ts`, `student-search.component.spec.ts`). No son fallos ni fueron suprimidos. | Cosmético; distrae al lector del output. | Documentar explícitamente en `evaluator-execution.md` (sugerencia S-1 de `verify-report.md`). |

Las advertencias son **idénticas en naturaleza** a las documentadas en el gate P0 (`openspec/changes/archive/2026-07-11-001-school-enrollment-management/archive-report.md` → "Known warnings inherited"); no introducen nuevos riesgos estructurales.

## Future work / next change candidates

- **`003-student-history`**: implementar el recorrido `FE-US7` para activar `FR-RPT-004` (historial académico-docente) usando `getStudentHistory`, con DTOs, fixtures, servicio, fachada, ruta, componente, tests y evidencia manual propios. La ruta `/student-history` sigue detrás de `P1LockedComponent` y `getStudentHistory` permanece sin invocarse en runtime (verificado estáticamente por `grep getStudentHistory src/` = 0 matches fuera de `verify-openapi-contract.mjs`).
- **E2E cross-slot hardening (sugerencia S-2 de `verify-report.md`)**: consolidar un test E2E del shell (`App` + `Router`) que ejercite el clic en "Reintentar" del top-schools dentro del shell montado para validar interacción real del DOM, no sólo el facade. Aplicable a 003 o un change futuro de hardening.
- **Decisión sobre `APPROVED_SUCCESSORS`**: cuando el backend se estabilice, decidir si el HEAD actual se aprueba como sucesor (`verify-openapi-contract.mjs:38-40`) o si `main` backend se retrotrae al commit `1223630ab` para esta feature. Trabajo de mantenimiento del repositorio backend, no del change 002.

## Archive contents

- `proposal.md` ✅
- `design.md` ✅
- `specs/municipal-reports/spec.md` ✅ (delta kept for history)
- `tasks.md` ✅ (27/27 P1 tasks complete; único `[ ]` = recordatorio "fuera de alcance" para `003-student-history`)
- `verify-report.md` ✅ (PASS_WITH_WARNINGS — READY TO ARCHIVE)
- `archive-report.md` ✅ (este archivo)

## Active changes directory

- `openspec/changes/002-municipal-reports/` ya **no existe** — el directorio completo fue movido al archive.

## Source of truth updated

- `openspec/specs/municipal-reports/spec.md` — header actualizado a `**Source changes**: 001-school-enrollment-management (P0), 002-municipal-reports (P1)`; FR-RPT-001 modificado; FR-RPT-002/003 ampliados con escenarios P1; FR-RPT-004 marcado como DEFERRED.

## SDD cycle complete

El cambio `002-municipal-reports` fue planificado, implementado, verificado y archivado. Listo para el siguiente change (`003-student-history`).