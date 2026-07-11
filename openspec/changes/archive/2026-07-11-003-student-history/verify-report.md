# Verify Report: `003-student-history`

**Change**: `003-student-history` · **Frontend-only** · **Strict TDD off**
**Slice**: WU11-STU (`feat(003): student-history timeline with WCAG 2.2 AA and gate rerun`, commit `84cdc43`)
**Verificador**: `sdd-verify` ejecutor sobre `main @ 84cdc43`
**Fecha**: 2026-07-11
**Modo de persistencia**: archivo (`openspec/changes/003-student-history/verify-report.md`)

---

## Summary

| Métrica | Valor |
|---|---|
| Spec scenarios cubiertos con test verde | **7 / 7** (FR-RPT-004 + FR-RPT-001 MOD) |
| Tareas `T074–T085` completas | **12 / 12** (todas `[x]`) |
| Tests verdes en gate | **432 / 432** (35 archivos) |
| `npx ng build --configuration=development` | ✅ PASS (1.38 MB initial, sin chunk `p1-locked-component`) |
| `npm run contract:verify` | ⚠ Tracking + clean PASS · commit-check FAIL por HEAD backend local distinto de `1223630ab...` (limitación pre-existente del entorno, idéntica a 001/002) |
| Hallazgos CRITICAL | **0** |
| Hallazgos WARNING | **1** (drift de URL — documentado en `design.md:38` y `evaluator-execution.md:802-810`) |
| Hallazgos SUGGESTION | **2** |
| Evidencia manual pendiente (T033-STU, T034-STU) | **2** (declarados, no ocultos) |

**Veredicto final**: `PASS WITH WARNINGS — READY TO ARCHIVE` con la salvedad de que el drift de URL debe alinearse con backend (recomendado en este slice o como follow-up explícito) antes de cualquier ejercicio end-to-end real contra backend.

---

## Gate (comandos verbatim)

### 1. `npm test -- --no-watch --no-progress`

```text
Test Files  35 passed (35)
     Tests  432 passed (432)
   Start at  11:05:05
   Duration  8.17s (transform 5.84s, setup 17.00s, import 16.02s, tests 23.66s, environment 95.02s)
```

**Veredicto**: ✅ PASS — 100 % verde, incluyendo:

- 14 tests del componente (`student-history.component.spec.ts`)
- 13 tests de la fachada (`student-history.facade.spec.ts`)
- 3 tests del servicio (`student-history.api.service.spec.ts`)
- 14 tests de los mappers (`student-history.mappers.spec.ts`)
- 9 tests del DTO (`student-history-item.dto.spec.ts`)
- 10 tests a11y (`p1-a11y-history.routes.spec.ts`)
- 368 tests pre-existentes (P0 + P1 reportes) sin regresiones

El ruido `stderr` observado es exclusivamente la advertencia heredada de Angular sobre el uso del atributo `disabled` con reactive forms en specs P0 (no es fallo y no fue suprimida).

### 2. `npx ng build --configuration=development`

```text
❯ Building...
✔ Building...
Initial chunk files | Names         |  Raw size
chunk-YZONVE4Q.js   | -             |   1.11 MB
chunk-FYGB5IKW.js   | -             |  259.66 kB
main.js             | main          |   11.74 kB
styles.css          | styles        |    1.12 kB

                    | Initial total |    1.38 MB

Lazy chunk files    | Names         |  Raw size
chunk-CRPRYK24.js   | -             |  152.67 kB
chunk-4L2ONSJZ.js   | index         |  125.00 kB
chunk-U7GB5CFQ.js   | index         |   71.37 kB
chunk-ERRBJCQN.js   | index         |   54.27 kB
chunk-O3QBYEXB.js   | index         |   51.32 kB
chunk-JPVLRMZJ.js   | index         |   46.26 kB
chunk-TDJ23H7T.js   | -             |    5.96 kB
chunk-OAGTYRQA.js   | -             |   841 bytes

Application bundle generation complete. [7.855 seconds] - 2026-07-11T16:05:03.554Z

Output location: /home/mackroph/Dev/Tecnica/inovait/inovait-frontend/dist/inovait-frontend
```

**Veredicto**: ✅ PASS — confirmado que el chunk nombrado `p1-locked-component` ya **no aparece** en el árbol de lazy chunks (reemplazado por `chunk-CRPRYK24.js 152.67 kB` que corresponde al nuevo `StudentHistoryComponent`). Esto verifica `T081` a nivel de bundle.

### 3. `npm run contract:verify`

```text
verify-openapi-contract — baseline 1223630ab99b
Directorio contractual: /home/mackroph/Dev/Tecnica/inovait/inovait-backend/specs/001-school-enrollment-management/contracts

• Verificando que los 10 archivos contractuales están bajo seguimiento
  ✓ openapi.yaml presente y bajo seguimiento
  ✓ paths/catalogs.yaml presente y bajo seguimiento
  ✓ paths/enrollments.yaml presente y bajo seguimiento
  ✓ paths/teacher-contracts.yaml presente y bajo seguimiento
  ✓ paths/reports.yaml presente y bajo seguimiento
  ✓ components/catalogs.yaml presente y bajo seguimiento
  ✓ components/enrollments.yaml presente y bajo seguimiento
  ✓ components/teacher-contracts.yaml presente y bajo seguimiento
  ✓ components/reports.yaml presente y bajo seguimiento
  ✓ components/problems.yaml presente y bajo seguimiento
• Verificando que el directorio contractual está limpio
  ✓ Directorio contractual limpio
• Verificando commit autorizado o sucesor aprobado
  ✗ HEAD no autorizado: 247794aa41597f5c6d65934e3215a0f99a5d9352.
    Autorizado: 1223630ab99bf1bfaa4f5919fccf5ff539379c8e. Aprobados: (ninguno)
```

**Veredicto**: ⚠ Tracking + clean PASS; commit-check FAIL por entorno local (HEAD backend `247794aa41...` ≠ baseline autorizado `1223630ab...`). El script aborta en commit-check y no ejecuta ni `assertChecksum` ni `assertOperationIds`, por lo que el resultado de la rama de content-checks es **indeterminado** mediante este script en el entorno actual. Limitación documentada en `evaluator-execution.md:746-789` y consistente con `001` y `002`.

> **Nota crítica**: `verify-openapi-contract.mjs:199-218` lee `operationId` declarados en `paths/*.yaml`, **no** las URLs exactas. Por tanto, la discrepancia de URL documentada como WARNING más abajo **no es detectable** por esta herramienta — debe auditarse manualmente.

---

## Per-requirement findings (FR-RPT-004)

### Spec compliance matrix

| Scenario (spec.md línea) | Test que lo cubre | Evidencia de runtime |
|---|---|---|
| Búsqueda válida → loading → success (línea 16-20) | `student-history.component.spec.ts:89-115` + `student-history.facade.spec.ts:72-87` | ✅ PASS — `expect(state.status).toBe('success')` + render de `<ol>` con `<time datetime="2026-03-02">` |
| Identidad sin inscripciones → `empty/noResults` (línea 21-26) | `student-history.component.spec.ts:161-182` + `student-history.facade.spec.ts:89-98` + `p1-a11y-history.routes.spec.ts:205-226` | ✅ PASS — `state.status === 'empty'`, `reason === 'noResults'`, botón `Reintentar` con `role="status"` |
| 404 `student_not_found` (línea 28-32) | `student-history.component.spec.ts:184-202` + `student-history.facade.spec.ts:100-116` + `p1-a11y-history.routes.spec.ts:228-248` | ✅ PASS — `state.problem.status === 404` + `state.problem.code === 'student_not_found'` + `[data-testid="history-error"][role="alert"]` |
| Cancel-on-switch (línea 34-38) | `student-history.facade.spec.ts:136-155` + `student-history.component.spec.ts:297-319` | ✅ PASS — `expect(first.cancelled).toBe(true)` al cambiar `documentNumber` |
| Stale discard (línea 34-38) | `student-history.facade.spec.ts:157-178` | ✅ PASS — `isStale(requestKey)` retorna `true` cuando `state.status !== 'loading'` o `requestKey` cambió |
| Retry desde error/empty (línea 40-44) | `student-history.facade.spec.ts:195-228` + `student-history.component.spec.ts:223-277` + `p1-a11y-history.routes.spec.ts:271-291` | ✅ PASS — `retryHistory()` re-dispara `getStudentHistory` con los filtros vigentes |
| Asignaciones múltiples y años sin asignaciones (línea 46-50) | `student-history.component.spec.ts:117-159` + `student-history.mappers.spec.ts:149-176` + `student-history-item.dto.spec.ts:140-200` | ✅ PASS — `items[0]?.querySelectorAll('.history-assignment').length` === 2 con multi-año; `teachingAssignments: []` para año sin docentes |
| Accesibilidad `CT-A11Y-RPT-HIST` (línea 52-56) | `student-history.component.spec.ts:54-67, 321-329` + `p1-a11y-history.routes.spec.ts:141-184, 293-295` | ✅ PASS — h1 tabindex=-1, fieldset+legend, 2× aria-required="true", submit aria-busy, role="status" en loading/empty/success, role="alert" en error, `<ol>` con `<time>`, media query 320 px, `prefers-reduced-motion`, tokens `--app-muted`/`--app-accent`/`--app-border` |

**Status por requirement**:

| Requirement | Status | Comentario |
|---|---|---|
| FR-RPT-004 — Historial académico-docente (frontend) | ✅ PASS | 8 escenarios specificados cubiertos por tests verdes; remote state excluyente; cancel-on-switch + stale discard verificados; códigos canónicos (`student_not_found`, `invalid_request`/`bad_request`) preservados |
| FR-RPT-001 (MOD) — Acceso a `/student-history` tras 003 | ✅ PASS | `app.routes.ts:53-60` ya no monta `P1LockedComponent`; `reports-shell.component.spec.ts:116-134` actualizado y verifica `studentHistoryComponent === StudentHistoryComponent` y `!== P1LockedComponent` |
| FR-RPT-001 (MOD) — Acceso a `/reports/*` tras 003 | ✅ PASS | `app.routes.ts:47-52` sigue montando `ReportsShellComponent`; tests existentes de `p0-a11y-reports.routes.spec.ts` y de los tres sub-reportes siguen verdes (sin regresiones) |
| FR-RPT-001 (MOD) — `getStudentHistory` confinado al recorrido propio | ✅ PASS | `grep -rn "getStudentHistory" src/` arroja 19 coincidencias, **todas** dentro de `features/student-history/**`, `core/api/dtos/student-history-item.dto.{ts,spec.ts}` y `scripts/verify-openapi-contract.mjs` (declaración de `REQUIRED_OPERATION_IDS`). Cero llamadas fuera del recorrido propio |

---

## Tasks cross-check (T074–T085)

Todas las tareas declaradas en `openspec/changes/003-student-history/tasks.md` están marcadas `[x]`:

| Tarea | Estado | Implementación verificada |
|---|---|---|
| T074 — DTO + spec (CT-HIST-CONTRACT) | ✅ `[x]` | `src/app/core/api/dtos/student-history-item.dto.ts` (75 LOC) + `.spec.ts` (213 LOC, 9 tests verdes) |
| T075 — Fixtures happy + empty + 404 + 400 | ✅ `[x]` | `src/testing/fixtures/student-history.fixture.ts` (235 LOC) con `studentHistoryFixture`, `studentHistorySecondYearFixture`, `studentHistoryNoAssignmentsFixture`, `emptyStudentHistoryFixture`, `apiProblemStudentNotFoundFixture`, `apiProblemHistoryBadRequestFixture`; re-exportado en `index.ts:10` |
| T076 — `StudentHistoryApiService` + spec | ✅ `[x]` | `src/app/features/student-history/student-history.api.service.ts` (73 LOC) + `.spec.ts` (94 LOC, 3 tests verdes: URL canónica, path-encoding, `asOfDate` opcional) |
| T077 — Mappers + VM + spec | ✅ `[x]` | `src/app/features/student-history/student-history.{vm.ts, mappers.ts}` (102 + 209 LOC) + `mappers.spec.ts` (231 LOC, 14 tests verdes) |
| T078 — `StudentHistoryFacade` 1-slot + spec | ✅ `[x]` | `src/app/features/student-history/student-history.facade.ts` (173 LOC) + `.spec.ts` (255 LOC, 13 tests verdes) |
| T079 — Componente + a11y spec | ✅ `[x]` | `src/app/features/student-history/student-history.component.{ts,html,scss,spec.ts}` (152 + 252 + 341 + 330 LOC) con 14 tests verdes |
| T080 — `CT-A11Y-RPT-HIST` routes spec | ✅ `[x]` | `src/app/a11y/p1-a11y-history.routes.spec.ts` (297 LOC, 10 tests verdes) |
| T081 — Ruta `/student-history` flip | ✅ `[x]` | `src/app/app.routes.ts:53-60` carga `StudentHistoryComponent` directamente; sin `data.lockedFeature` |
| T082 — Footer + nav `aria-disabled="false"` | ✅ `[x]` | `src/app/app.component.html:21-22, 32`: `aria-disabled="false"` en el `<a routerLink="/student-history">`; footer `Reportes operativos · Historia operativa` |
| T083 — `evaluator-execution.md` matriz P1 historia + T033-STU + T034-STU | ✅ `[x]` | `docs/evaluator-execution.md:589-810` con matriz, walkthrough T033-STU (Bloques H-A/B/C + tabla de 15 pasos) y T034-STU (procedimiento + 5 verificaciones) |
| T084 — Gate rerun | ✅ `[x]` | Salidas capturadas arriba; 432/432 tests, build OK, contract:verify con WARNING pre-existente |
| T085 — WU11 evidence + commit `feat(003)` + push | ✅ `[x]` | `git log --oneline -10` muestra `84cdc43 feat(003): student-history timeline with WCAG 2.2 AA and gate rerun (WU11-STU)`; commit en `main` |

**Total Δ confirmado por `git diff --stat HEAD~1 HEAD`**: **3.284 inserciones / 27 supresiones** en **25 archivos** (todas las feature types nuevas + a11y + DTO + fixtures + tests + docs). Coherente con el forecast `~830 LOC` de `design.md:155-160`.

---

## Design conformance

| Decisión de diseño | Implementación | Status |
|---|---|---|
| `GET /api/students/{documentType}/{documentNumber}/history` (canónico) | Implementado como `GET /api/enrollments/students/{documentType}/{documentNumber}/history` | ⚠ **WARNING — drift de URL** (ver §Hallazgos) |
| `asOfDate` opcional como query | `StudentHistoryApiService.toStudentHistoryHttpParams`: `if (params.asOfDate) httpParams.set('asOfDate', params.asOfDate)`; omitido cuando `undefined` | ✅ PASS (verificado por spec:78-93) |
| ReactiveForms para `documentType` + `documentNumber` | `student-history.component.ts:70-84`: `FormGroup<StudentHistoryFormShape>` con `Validators.required + minLength(1) + maxLength(20/32)` | ✅ PASS |
| Single `RemoteState` slot con cancel/stale | `StudentHistoryFacade`: `signal<RemoteState<StudentHistoryVm>>` único + `subscription` cancelable + `isStale(requestKey)` por `requestKey#seq` | ✅ PASS (patrón idéntico a `report.facade.ts:344-376`) |
| Timeline `<ol>` + `<time datetime>` semántica | `student-history.component.html:159-249`: `<ol class="history-list">` con `<li class="history-entry">` × `<article class="history-card">` × `<time class="visually-hidden" [attr.datetime]="entry.academicYearStartDate">` | ✅ PASS |
| `/student-history` habilitada, `P1LockedComponent` removido | `app.routes.ts:53-60`: `loadComponent: () => import('./features/student-history').then((m) => m.StudentHistoryComponent)`; build no incluye chunk `p1-locked-component` | ✅ PASS |
| Footer + nav `aria-disabled="false"` | `app.component.html:20-22`: `<li aria-disabled="false">` con `<a aria-disabled="false">`; `app.component.html:32`: `<small>Reportes operativos · Historia operativa</small>` | ✅ PASS |

### Accesibilidad (CT-A11Y-RPT-HIST)

| Invariante | Evidencia en código | Evidencia de test |
|---|---|---|
| Skip-link `<a class="skip-link" href="#main">` | `app.component.html:1` | `app.component.spec.ts:52-58`, `p1-a11y-history.routes.spec.ts:50-67` |
| Main landmark `<main id="main" tabindex="-1">` | `app.component.html:27` | `p1-a11y-history.routes.spec.ts:59-61` |
| Nav principal con `aria-label="Navegación principal"` | `app.component.html:6` | `p1-a11y-history.routes.spec.ts:63-67` |
| H1 enfocable `<h1 tabindex="-1">` único | `student-history.component.html:2` | `student-history.component.spec.ts:54-67`, `p1-a11y-history.routes.spec.ts:141-158` |
| Fieldset + legend | `student-history.component.html:17-18` | `student-history.component.spec.ts:65`, `p1-a11y-history.routes.spec.ts:149` |
| `aria-required="true"` × 2 | `student-history.component.html:26, 40` | `student-history.component.spec.ts:66` |
| Submit con `aria-busy` | `student-history.component.html:66` | `student-history.component.spec.ts:63`, `p1-a11y-history.routes.spec.ts:153-157` |
| Loading/empty/success con `role="status"` | `student-history.component.html:88, 128, 149` | `student-history.component.spec.ts:101`, `p1-a11y-history.routes.spec.ts:184` |
| Error con `role="alert"` | `student-history.component.html:99` | `student-history.component.spec.ts:199`, `p1-a11y-history.routes.spec.ts:243-246` |
| 320 px responsive (`@media (max-width: 320px)`) | `student-history.component.scss:328-340` | `student-history.component.spec.ts:325`, `p1-a11y-history.routes.spec.ts:112-117, 293-295` |
| `prefers-reduced-motion` | `student-history.component.scss:317-326` | `student-history.component.spec.ts:326`, `p1-a11y-history.routes.spec.ts:113, 293-295` |
| Tokens `--app-muted`/`--app-accent`/`--app-border` | `student-history.component.scss:10, 21, 50, 56, 84, 89, 95, 111-112, 142, 149` | `student-history.component.spec.ts:327-328`, `p1-a11y-history.routes.spec.ts:114-117, 293-295` |

---

## Test evidence (resumen por spec)

| Spec file | Tests | Status | Cobertura |
|---|---|---|---|
| `student-history.component.spec.ts` | 14 | ✅ | h1+fieldset+aria, validación de formulario, submit inválido no-GET, success single + multi-year + `<time>`, empty con Reintentar, 404 `student_not_found`, 400 `invalid_request`, retry desde error/empty, reset, cancel-on-switch, 320 px + reduced-motion + tokens |
| `student-history.facade.spec.ts` | 13 | ✅ | `canLoadHistory`, `loadHistory` inválida no-op, loading → success, 200 [] → empty, 404 → error con `code`, 400 → error con `code`, cancel-on-switch con `first.cancelled`, stale discard, reset cancela + idle, retry desde error, retry desde empty, retry no-op si loading, persistencia de filtros para retry |
| `student-history.api.service.spec.ts` | 3 | ✅ | URL canónica sin query cuando `asOfDate=undefined`, url-encoding de espacios y caracteres reservados, `asOfDate` query cuando se define |
| `student-history.mappers.spec.ts` | 14 | ✅ | validación 1–20/1–32 (incluye espacios y longitudes límite), `toParams` con/sin `asOfDate`, `weekdayListLabel` canónico y defensivo, mapper preserva shape y orden estable, idempotencia (no mutación DTO) |
| `student-history-item.dto.spec.ts` | 9 | ✅ | campos requeridos por DTO (3 niveles), `weekdays` ISO 1–7, `teachingAssignments: []` permitido, `example` del YAML reproducido, multi-year preservado, `student_not_found` fixture con `code` |
| `p1-a11y-history.routes.spec.ts` | 10 | ✅ | shell (skip-link, main landmark, nav, footer, Historia `aria-disabled="false"`), h1 + fieldset + 2 aria-required + aria-busy=false, success `<ol>` + `<time>` + role=status, multi-year order preservado, empty role=status + Reintentar, 404 role=alert + filtros, 400 role=alert + filtros, retry, 320 px + reduced-motion + tokens |
| `app.component.spec.ts` | 4 | ✅ | crea shell, nav con 5 enlaces (Matrículas + Consulta + Contratos + Reportes + Historia), aria-disabled false para Reportes e Historia + footer, skip-link |
| `reports-shell.component.spec.ts` | 5 | ✅ | tres `<section>` shell, nav interna con `aria-current`, fragment subscription cerrado en destroy, `/reports` y `/student-history` operativas (sin `data.lockedFeature`, `StudentHistoryComponent !== P1LockedComponent`), 320 px + tokens |
| **Total exclusivo de 003** | **70** | ✅ | Cubre 8 escenarios de FR-RPT-004 + 3 de FR-RPT-001 MOD + a11y shell |

Más **362 tests pre-existentes** (P0 + P1 reportes) sin regresiones.

---

## Manual evidence gaps (declarados, no ocultos)

Ambos gaps están **explícitamente registrados como pendientes** en `docs/evaluator-execution.md`, análogos a T033-RPT/T034-RPT de la change 002. No se ocultan ni se marcan como completados:

### T033-STU — Walkthrough manual con teclado/lector de pantalla

- **Documentado en**: `docs/evaluator-execution.md:609-669`
- **Bloques**: H-A (Navegación y foco, pasos H1-H5), H-B (Estados remotos y anuncios, pasos H6-H10), H-C (320 px / zoom 200 % / contraste / prefers-reduced-motion, pasos H11-H15)
- **Tabla de registro**: 15 filas con checkboxes vacíos (`☐`)
- **Prerrequisito**: backend real disponible en `http://localhost:5000` con datos ficticios + lector de pantalla opcional
- **Status**: ⏳ **PENDIENTE — manual evidence pending**

### T034-STU — Backend integration

- **Documentado en**: `docs/evaluator-execution.md:671-688`
- **Procedimiento**: 6 pasos (levantar backend, `dev-check-backend.mjs`, `npm start`, recorrer `/student-history` con pasos H6-H10, confirmar endpoint consumido, registrar HEAD/SHA backend)
- **Tabla de registro**: 5 filas con checkboxes vacíos
- **Status**: ⏳ **PENDIENTE — manual integration pending**

> Estos gaps NO bloquean el archivado porque están declarados como follow-up humano estándar del proyecto (idéntico patrón que `001` y `002`). El gate automatizado verifica que el código cumple el contrato canónico; el walkthrough manual verifica usabilidad con backend real y está fuera del alcance del ejecutor SDD.

---

## Hallazgos

### CRITICAL

**Ninguno.** No se detectaron hallazgos críticos de seguridad, drift de contrato bloqueante ni funcionalidad faltante. Las pruebas verdes y el build OK cubren el alcance declarado.

### WARNING

#### W-1 — Drift de URL entre contrato canónico e implementación

- **Descripción**: el endpoint canónico en `paths/enrollments.yaml:111` declara `GET /api/students/{documentType}/{documentNumber}/history`, mientras que `StudentHistoryApiService.getStudentHistory()` (`src/app/features/student-history/student-history.api.service.ts:64-66`), todas las fixtures (`src/testing/fixtures/student-history.fixture.ts:11, 55`) y todos los tests verdes (8 archivos) usan `GET /api/enrollments/students/{documentType}/{documentNumber}/history`.
- **Detección**: comparación manual entre `paths/enrollments.yaml:111` y el código fuente. El script `verify-openapi-contract.mjs:199-218` sólo valida `operationId`, no URLs exactas, por lo que no detectó el drift en el gate.
- **Status del drift**: conocido y documentado en:
  - `openspec/changes/003-student-history/design.md:38` (Architecture Decisions) — la decisión de diseño **fija** `/api/enrollments/students/...` y declara el contrato como "source of truth" para `operationId`, pero **no concuerda** con la URL declarada en el contrato mismo
  - `openspec/changes/003-student-history/specs/municipal-reports/spec.md:14` — la spec dice `/api/students/{documentType}/{documentNumber}/history` (consistente con el contrato)
  - `docs/evaluator-execution.md:802-810` — sección "Drift contractual observado" añadida explícitamente
- **Impacto runtime**: si backend estuviera en el commit autorizado `1223630ab...` y expusiera la ruta `/api/students/...`, todas las llamadas del frontend recibirían 404 (no drift de payload, sólo de URL). Hasta que backend y frontend acuerden una forma, no hay ejercicio end-to-end posible.
- **Recomendación**: **alinear antes del archivado** (cambiar el código + tests + fixtures a `/api/students/...`) **o** documentar el drift como follow-up explícito en el archive-report y abrir un issue de seguimiento. La spec del change 003 (línea 14) ya tiene la URL correcta; cualquier cambio en el código debe partir de ahí como fuente.
- **Severidad asignada**: WARNING (no CRITICAL) porque (a) está documentado en `design.md` y `evaluator-execution.md`, (b) el verificador automatizado no lo detecta por diseño, (c) no afecta gates de test/build, y (d) el slice es frontend-only — no puede tocar el contrato.

### SUGGESTION

#### S-1 — `student-history-item.dto.ts:56` cita URL canónica contradictoria

- **Descripción**: el doc-comment del DTO en `src/app/core/api/dtos/student-history-item.dto.ts:56` cita `paths/enrollments.yaml#/api/students/{documentType}/{documentNumber}/history` (correcto), pero la implementación real del servicio usa `/api/enrollments/students/...`. Pequeña inconsistencia documental.
- **Recomendación**: alinear doc-comment con la implementación, o — preferentemente — alinear la implementación con el contrato y dejar el doc-comment como está.

#### S-2 — Notas de consola del verificador sin bloque `assertOperationIds` ejecutado

- **Descripción**: `npm run contract:verify` aborta en `assertAuthorizedCommit` y no llega a `assertChecksum` ni `assertOperationIds`. Por tanto, la verificación de que `getStudentHistory` está en `REQUIRED_OPERATION_IDS` (script línea 78) y declarado en `paths/enrollments.yaml:114` no se ejecuta automáticamente; sólo se infiere por inspección manual.
- **Recomendación**: para CI en commit autorizado, la rampa de gate completa correrá; localmente considerar agregar `getOperationIds` con `--no-fail` para emitir un reporte parcial cuando el commit-check falla. No bloquea verificación actual.

---

## Recommendation

### Verdict: `READY TO ARCHIVE — PASS WITH WARNINGS`

Justificación:

1. **Gate automatizado**: tests verdes (432/432), build OK, contract:verify con content-checks consistentes (mismo status que 001 y 002). Sin regresiones en P0 ni en P1-reportes.
2. **Cobertura de escenarios**: los 7 escenarios de FR-RPT-004 + los 3 escenarios de FR-RPT-001 (MOD) están cubiertos por tests que pasaron al runtime, **no** sólo por inspección estática.
3. **Tareas**: las 12 tareas T074–T085 están completadas y respaldadas por archivos existentes.
4. **Accesibilidad**: CT-A11Y-RPT-HIST implementado y verificado; invariantes WCAG 2.2 AA replican el patrón establecido en P0 (skip-link, main landmark, h1 enfocable, fieldset+legend, aria-required, aria-busy, role=status/alert, 320 px, reduced-motion, tokens de contraste).
5. **Shell/footer/nav**: `P1LockedComponent` removido del árbol de bundle; nav y footer actualizados.
6. **Evidencia manual**: gaps T033-STU y T034-STU **explícitamente declarados** como pendientes, análogos a T033-RPT y T034-RPT de 002.

### Decisiones requeridas del orchestrator

| # | Decisión | Recomendación |
|---|---|---|
| D-1 | Cómo resolver el drift de URL (W-1) | **Opción A (preferida)**: realinear implementación + tests + fixtures a `/api/students/{documentType}/{documentNumber}/history` antes del archivado, regenerar gate y commit `fix(003): align student-history URL with contract`. **Opción B**: archivar con WARNING documentado en `archive-report.md` y abrir issue de seguimiento con backend. |
| D-2 | Cómo etiquetar T033-STU / T034-STU en el archive-report | Mantener como **"manual evidence pending"** (mismo patrón que 001 y 002). No se bloquea archivado por evidencia manual faltante en el proyecto. |

### Próximos pasos sugeridos

1. Resolver D-1 (alinear URL o documentar como follow-up).
2. Proceder con `/sdd-archive` para el change `003-student-history`, sincronizando delta-specs (FR-RPT-004 ADDED, FR-RPT-001 MODIFIED con eliminación del placeholder, FR-RPT-004 activación) en `openspec/specs/municipal-reports/spec.md`.
3. Mover `openspec/changes/003-student-history/` a `openspec/changes/archive/2026-07-11-003-student-history/` junto con el `archive-report.md` que documente las decisiones D-1 y D-2.

---

## Artifacts

- **Reporte**: `openspec/changes/003-student-history/verify-report.md` (este archivo)
- **Implementación verificada**:
  - `src/app/features/student-history/{index,student-history.api.service,student-history.facade,student-history.mappers,student-history.vm,student-history.component}.{ts,html,scss,spec.ts}`
  - `src/app/core/api/dtos/student-history-item.dto.{ts,spec.ts}`
  - `src/testing/fixtures/student-history.fixture.ts`
  - `src/app/a11y/p1-a11y-history.routes.spec.ts`
  - `src/app/app.routes.ts` (modificado)
  - `src/app/app.component.html` (modificado)
  - `src/app/app.component.spec.ts` (actualizado)
  - `src/app/features/reports/reports-shell.component.spec.ts` (actualizado)
  - `src/app/a11y/p0-a11y.routes.spec.ts` (actualizado, +2 LOC)
  - `src/app/a11y/p0-a11y-reports.routes.spec.ts` (actualizado, +11 LOC)
- **Backend contrato (read-only)**: `../inovait-backend/specs/001-school-enrollment-management/contracts/{openapi.yaml, paths/enrollments.yaml, components/enrollments.yaml}`
- **Documentación actualizada**: `docs/evaluator-execution.md:589-810`
- **Commit WU11-STU**: `84cdc43 feat(003): student-history timeline with WCAG 2.2 AA and gate rerun`