# Propuesta: Reportes municipales P1 — edad, sector y escuelas líderes

**Change**: `002-municipal-reports` | **Fecha**: 2026-07-11 | **Frontend-only**
**Predecesor**: `001-school-enrollment-management` (archivado `2026-07-11`)

## Intent

Entregar la mitad read-only de `municipal-reports` desde
[`openspec/specs/municipal-reports/spec.md`](../../specs/municipal-reports/spec.md):
tres vistas en `/reports` que consumen `getAgeDistribution`,
`getDistinctTeacherCountsBySector` y `getTopSchoolsByEnrollment` del contrato en
commit backend `1223630ab99bf1bfaa4f5919fccf5ff539379c8e`. Sustituye el
`P1LockedComponent` por vistas accesibles. FE-US7 (historia académico-docente)
queda en `003-student-history`.

## Scope

### In Scope

- Ruta `/reports` con `age-report`, `sector-report`, `top-schools-report`.
- `ReportApiService` + `ReportFacade` + mappers en `src/app/features/reports/`.
- 3 DTO manuales + 1 fixture P1.
- Habilitar `/reports` en `app.routes.ts`; quitar `data.lockedFeature`.
- Footer shell: "Reportes operativos · Historia pendiente".
- Endurecer `verify-openapi-contract.mjs` (W-1 + W-2).

### Out of Scope

- Auth, paginación, gráficos, exportación CSV/PDF, filtros no declarados.
- FE-US7. `/student-history` sigue bloqueada.
- Cambios al backend o al contrato OpenAPI.

## Capabilities

### Modified Capabilities

- `municipal-reports`: se levanta el bloqueo P0 para FR-RPT-002/003. FR-RPT-004 (historia) continúa diferido. FR-RPT-001 sigue cumplido.

## Approach

1. Reusar `CatalogFacade` + `RemoteState<T>` + `problemDetailsInterceptor` de WU01–WU05.
2. `ReportApiService` con tres métodos y mappers que preservan shape canónico sin recálculo, orden ni deduplicación cliente. `ReportFacade` por reporte con slots `RemoteState` independientes, cancelación y descarte de stale vía `requestKey`.
3. Componentes WCAG 2.2 AA: `fieldset`+`legend`, `aria-required`/`busy`, `role="status"`/`role="alert"`, tabla con `<caption>` y `<th scope="col">` en `top-schools`.
4. Endurecer `verify-openapi-contract.mjs`: alinear `REQUIRED_OPERATION_IDS` y recorrer `paths/*.yaml` en `extractOperationIds`.

## Affected Areas

| Area | Impact |
|---|---|
| `src/app/features/reports/` (data-access + 3 componentes + facade + index) | New |
| `src/app/core/api/dtos/{age-distribution,teacher-counts-by-sector,top-school}.dto.ts` | New |
| `src/testing/fixtures/report.fixtures.ts` | New |
| `src/app/app.routes.ts` (`/reports` ya no usa `P1LockedComponent`) | Modified |
| `src/app/app.component.html` (footer) | Modified |
| `src/app/scripts/verify-openapi-contract.mjs` (W-1 + W-2) | Modified |
| `docs/evaluator-execution.md` (sección P1 Gate Reportes + T033-RPT/T034-RPT) | Update |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Drift de contrato | Baja | `verify-openapi-contract.mjs` exige commit `1223630ab` o sucesor; DTO reflejan `components/reports.yaml`. |
| W-1/W-2 latentes heredados | Alta | Endurecer verificador en el primer slice antes de tocar reportes. |
| T033/T034 manuales sin cerrar | Media | 002 documenta T033-RPT/T034-RPT como pendientes. |
| 400-line budget High | Alta | Cadena `stacked-to-main` (P0); cada reporte es una unidad revisable. |

## Rollback Plan

Revertir el slice correspondiente (cada reporte tiene commit independiente). Si el endurecimiento del verificador rompe CI, revertir ese commit aislado. Evidencia en `docs/evaluator-execution.md`.

## Dependencies

- Backend autorizado en commit `1223630ab99bf1bfaa4f5919fccf5ff539379c8e` (sin backend activo, pruebas contra fixtures).
- OpenAPI `3.1.0` y checksum `802c13b91bf5c6425d24c540b6841a2abe134e084ea310fc2b7041e32c24a81a` válidos.
- Cadena PR `stacked-to-main` (P0). Angular 21 / Vitest / `RemoteState` + `CatalogFacade` disponibles en `main`.

## Success Criteria

- [ ] Las tres vistas exponen estados loading/error/empty/success con `role="status"`/`role="alert"`.
- [ ] `ReportApiService` enlazado a operationIds canónicos; mappers sin recálculo ni reorden.
- [ ] `contract:verify` pasa tracking + clean + commit + 18 operationIds (15 P0 + 3 P1).
- [ ] `npm test` ≥ 100 % verde; tests cubren método/query/response exactos y 422 sólo canónicos.
- [ ] WCAG 2.2 AA: teclado, foco, `fieldset`/`legend`, `aria-required`/`busy`/`describedby`, contraste.
- [ ] `/student-history` sigue bloqueada.
- [ ] T033-RPT/T034-RPT documentados como pendientes.
- [ ] Footer shell: "Reportes operativos · Historia pendiente".
