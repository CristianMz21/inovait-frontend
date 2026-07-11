# Tareas: Reportes municipales P1 (002)

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

Estimated: ~1.4k LOC en 4 PR stacked; split PR2→PR3→PR4→PR5; delivery on-risk con chain fijado en `proposal.md`.

### Suggested Work Units

| Unit | Goal | PR | Base |
| --- | --- | --- | --- |
| WU07-RPT | `age-distribution` DTO + mapper + slot + componente + a11y | PR2 | main |
| WU08-RPT | `sector-report` con dedupe delegada al backend | PR3 | main |
| WU09-RPT | `top-schools-report` con tabla a11y (`<caption>` + `<th scope>`) | PR4 | main |
| WU10-RPT | Shell `/reports`, flip ruta, footer, hardening, rerun gate | PR5 | main |

## Fase 1: WU07-RPT — age-report (PR2)

- [x] T047 Crear `src/app/core/api/dtos/age-distribution.dto.ts` + fixture happy/empty/422 en `src/testing/fixtures/age-distribution.fixture.ts`.
- [x] T048 Spec DTO + fixture: igualdad exacta contra `components/reports.yaml`.
- [x] T049 Crear `src/app/features/reports/report.api.service.ts` con `getAgeDistribution(academicYearId, asOfDate?)` + spec ST-RPT-AGE.
- [x] T050 Crear `report.mappers.ts` con `ageDistributionResponseToVm()` sin recálculo.
- [x] T051 Crear `report.facade.ts` con slot `ageState` + cancel-on-switch + descarte `stale` por `requestKey`; spec cubre success, stale y 422.
- [x] T052 Crear `age-distribution.component.{ts,html,scss,spec.ts}` con fieldset, `aria-required/busy`, `role="status"/"alert"`, 320 px OK.
- [x] T053 Evidencia WU07 + commit `feat(002): age distribution report with remote state (WU07)`.

## Fase 2: WU08-RPT — sector-report (PR3)

- [x] T054 Crear `sector-counts.dto.ts` + fixture happy/empty/422 + spec.
- [x] T055 Añadir `getDistinctTeacherCountsBySector(periodStart, periodEnd)` al servicio + spec ST-RPT-SECTOR.
- [x] T056 Mapper `teacherCountsBySectorToVm()` sin dedupe cliente + spec.
- [x] T057 Añadir slot `sectorState` al facade con `requestKey` independiente + spec.
- [x] T058 Crear `teacher-counts-by-sector.component.{ts,html,scss,spec.ts}` con fieldset y estados a11y.
- [x] T059 Evidencia WU08 + commit `feat(002): sector counts report preserving backend dedupe (WU08)`.

## Fase 3: WU09-RPT — top-schools-report (PR4)

- [x] T060 Crear `top-schools.dto.ts` + fixtures happy y `[]` + spec.
- [x] T061 Añadir `getTopSchoolsByEnrollment(academicYearId)` al servicio + spec ST-RPT-TOP.
- [x] T062 Mapper `topSchoolsResponseToVm()` preserva orden canónico y empates + spec con caso `count=12`.
- [x] T063 Añadir slot `topState` al facade + spec (loading/empty/error + stale).
- [x] T064 Crear `top-schools.component.{ts,html,scss,spec.ts}` con `<table>`, `<caption class="visually-hidden">`, `<th scope="col">`, botón Reintentar.
- [x] T065 Evidencia WU09 + commit `feat(002): top schools report with ties preserved (WU09)`.

## Fase 4: WU10-RPT — shell + consolidación + gate (PR5)

- [x] T066 Crear `reports-shell.component.{ts,html,scss,spec.ts}` con tres `<section>` (sin child routes), anclas internas, 320 px OK.
- [x] T067 Spec shell: una ruta, tres secciones, host cancela suscripciones al destruir.
- [x] T068 Crear `src/app/a11y/p0-a11y-reports.routes.spec.ts` con `CT-A11Y-RPT-AGE/SECTOR/TOP` (success, empty, 422, 404) espejo de `CT-A11Y-P0`.
- [x] T069 Modificar `src/app/app.routes.ts`: `/reports` → `ReportsShellComponent`; `/student-history` conserva `data.lockedFeature`.
- [x] T070 Modificar `src/app/app.component.html`: footer "Reportes operativos · Historia pendiente"; nav Reportes `aria-disabled="false"`.
- [x] T071 Actualizar `docs/evaluator-execution.md`: matriz P1 + walkthrough (T033-RPT + T034-RPT).
- [x] T072 Rerun gate: `npm test --no-watch`, `ng build --configuration=development`, `npm run contract:verify`; output verbatim en el doc.
- [x] T073 Evidencia WU10 + commit `feat(002): reports shell + a11y consolidation + gate rerun (WU10)` + push.

## Fuera de alcance (recordatorio)

- [ ] FE-US7 `student-history` permanece bloqueado; `getStudentHistory` no se invoca. Se ejecuta en `003-student-history`.
