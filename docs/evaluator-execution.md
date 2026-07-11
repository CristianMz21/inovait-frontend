# Registro de ejecución del evaluador: WU00 → WU01 → WU02 → WU03 → WU04 (US3 Contratos)

## Alcance y estado

- Cambio: `001-school-enrollment-management`
- Slice objetivo: `WU04` (US3 Contratos docentes) sobre `WU03` (US2 Consulta)
- Modo: Frontend-only
- Estado: **WU04 implementado (PR5 stacked-to-main sobre WU03)**
- Fecha WU04: 2026-07-11

## Referencia contractual (inmutable)

- Backend source of truth: `../inovait-backend/specs/001-school-enrollment-management/contracts/openapi.yaml`
- Commit autorizado: `1223630ab99bf1bfaa4f5919fccf5ff539379c8e`
- Checksum combinado (10 YAML): `802c13b91bf5c6425d24c540b6841a2abe134e084ea310fc2b7041e32c24a81a`
- Orden de verificación (canonical):

```bash
sha256sum openapi.yaml \
  paths/catalogs.yaml paths/enrollments.yaml paths/teacher-contracts.yaml paths/reports.yaml \
  components/catalogs.yaml components/enrollments.yaml components/teacher-contracts.yaml components/reports.yaml components/problems.yaml |
  sha256sum
```

## Estado de tareas WU00

| Tarea | Estado | Evidencia | Observaciones |
|---|---|---|---|
| T001 | ✅ Completada | `angular.json`, `package.json` y `src/` no existen en la raíz del repo | Validación realizada contra el FS del cambio |
| T002 | ✅ Completada | `docs/evaluator-execution.md` creado como baseline | Matriz vacía (placeholders) lista para llenado posterior |
| T003 | ✅ Completada (predefinida) | Cadena elegida: `stacked-to-main` | Registrada en `tasks.md` y plan de PRs |
| T004 | ✅ Completada | SHA + checksum autorizados registrados como referencia base | Valores congelados en esta sección |

## Matriz P0 (placeholder inicial)

> Esta matriz define la estructura base. Durante las WU posteriores se completan
> columnas `Estado`, `Resultado`, `Prueba` y `Evidencia` con captura temporal.

### 1) Matrículas (`/enrollments`)

| Escenario | Estado remoto esperado | Errores canónicos | Indicador de evidencia |
|---|---|---|---|
| Alta válida de nuevo estudiante | loading / success | 400/404/409/422 (según contrato) | [x] WU02: `EnrollmentCreateComponent` + `EnrollmentCreateFacade.submit()` |
| Identidad reutilizable por año distinto | loading / success | 400/404/409/422 (según contrato) | [x] WU02: `createEnrollmentReusedResponseFixture` + mapper conserva `studentReused` |
| Segundo alta del mismo año | error canónico, no mutación parcial | 409 + ProblemDetails | [x] WU02: `enrollment-create.facade.spec.ts` cubre 409 sin mutación |
| Selectores dependientes | estados excluyentes + limpieza descendente | 400/404/409/422 si aplica | [x] WU02: `CatalogFacade` con cancelación + stale + `onParentChange()` limpia descendientes |

### 2) Consulta (`/student-search`)

| Escenario | Estado remoto esperado | Errores canónicos | Indicador de evidencia |
|---|---|---|---|
| Búsqueda con resultados válidos | loading / success | 404 si referencia inexistente | [x] WU03: `StudentSearchComponent.onSubmit()` + `StudentSearchFacade.search()` |
| Sin resultados | loading / empty | no-resultado no es error | [x] WU03: `StudentSearchFacade` mapea `200 []` a `empty/noResults` (sin error) |
| Combinación sin grupos | loading / no-groups | 200 con estado `noGroups` | [x] WU03: misma lógica de `empty/noResults` cubre tanto "sin inscripciones" como "sin grupos" porque la API no distingue; la UI muestra estado dedicado |
| Cambios de filtros activos | loading -> success/error/empty según sea | error recopiado al contexto correcto | [x] WU03: `StudentSearchFacade.search()` cancela el GET previo + descarte de stale vía `requestKey` |
| Reintento | reload remoto con reset de estado | error recuperable y posterior success/empty | [x] WU03: `StudentSearchFacade.retry()` re-envía con filtros vigentes; botón accesible en región `role="alert"` |

### 3) Contratos docentes (`/teacher-contracts`)

| Escenario | Estado remoto esperado | Errores canónicos | Indicador de evidencia |
|---|---|---|---|
| Solicitud válida multiescuela | loading / success | 422/409/400/404 (según contrato) | [x] WU04: `TeacherContractsComponent.onSubmitCreate()` + `TeacherContractsFacade.submit()` con cancelación + stale por `requestKey` |
| Fallo parcial en backend | no creación visible | error canónico y estado conservado para corrección | [x] WU04: `TeacherContractsFacade` no muestra `success` cuando el backend rechaza; la selección de escuelas se conserva para corrección |
| Validación local de rango | validación bloqueante local | 422 evitado por validación local | [x] WU04: `teacherContractsFormIsValid` bloquea `endDate < startDate` y `schoolIds` con duplicados; `isCreateSubmittable()` activa el botón sólo con VM válida |
| Consulta por docente | loading / success / empty | 404 por identidad inexistente | [x] WU04: `TeacherContractsComponent.onSubmitQuery()` + `TeacherContractsFacade.searchByTeacher()` con `RemoteState<readonly TeacherContractResultVm[]>` exclusivo; `200 []` → `empty/noContracts` |

## Secciones de evidencia (para completar más adelante)

### E01 — Estados remotos y consistencia

- [x] WU02: catálogos + `createEnrollment` con `RemoteState` exclusivo (`idle|loading|success|empty|error`); respuestas obsoletas descartadas por `requestKey`.
- [x] WU03: `StudentSearchFacade` aplica la misma disciplina de `RemoteState<readonly StudentSearchResultVm[]>` + cancelación + descarte de stale; reutiliza `CatalogFacade` para los filtros académicos sin duplicar fetching.
- [x] WU04: `TeacherContractsFacade` aplica la misma disciplina para los dos recorridos (`createResult` + `listResult`), con dos slots independientes; reutiliza `CatalogFacade` para docentes y escuelas. La atomicidad multiescuela se garantiza porque `success` sólo se emite cuando el `POST` devuelve `201` con el array canónico; cualquier `4xx/5xx` deja `createSuccess() === null`.
- [ ] Walkthrough manual con backend real pendiente (T034).

### E02 — Accesibilidad y usabilidad P0

- [x] WU02: `EnrollmentCreateComponent` con selects dependientes, `aria-required`, `aria-disabled`, `aria-busy`, regiones `role="status"` (carga/éxito) y `role="alert"` (errores), h1 enfocable.
- [x] WU03: `StudentSearchComponent` con `fieldset` + `legend`, `aria-required` en filtros obligatorios, `aria-busy` en el botón "Buscar", regiones separadas `role="status"` para loading/empty/success y `role="alert"` para errores, h1 enfocable, `aria-describedby` en `asOfDate`, tabla con `<caption>` visualmente oculto y `<th scope="col">`, contador de filas en `aria-live="polite"`, botón "Ver historial" deshabilitado con `aria-disabled="true"` y `aria-describedby` apuntando a la nota P1, SCSS con tokens que respetan contraste WCAG 2.2 AA y media query `max-width: 320px` que colapsa la tabla y el fieldset a una columna.
- [x] WU04: `TeacherContractsComponent` con dos `fieldset` + `legend` (Identidad/Período y Escuelas), `aria-required` en docente/fechas, `aria-busy` en los botones "Crear contratos" y "Consultar", regiones separadas `role="status"` para loading/empty/success y `role="alert"` para errores, h1 enfocable, `aria-describedby` en `endDate` y `asOfDate`, tabla con `<caption>` visualmente oculto y `<th scope="col">`, contador de filas en `aria-live="polite"`, contador de escuelas seleccionadas en `role="status"` `aria-live="polite"`, escuelas como checkboxes con `aria-label` por escuela, SCSS con tokens y media query `max-width: 320px` que colapsa fieldset a una columna, lista de escuelas a ancho completo, tabla con tipografía reducida y `flex-direction: column` para acciones.
- [ ] Walkthrough teclado/320px/200% pendiente (T033).

### E03 — Contract + contrato canónico

- [x] WU01: `verify-openapi-contract.mjs` ejecutado en CI valida los 10 YAML, commit autorizado y `operationId` canónicos; `createEnrollment` listado.
- [x] WU03: `listEnrollments` (`operationId` del contrato) usado por `StudentSearchApiService.list()` con `schoolId`/`gradeId`/`academicYearId` `required` y `asOfDate` opcional. La matriz de `operationId` del verificador ya exige `listEnrollments` y el chequeo pasa cuando el backend está en el commit autorizado.
- [x] WU04: `createTeacherContracts` y `listTeacherContracts` (`operationId` del contrato) usados por `TeacherContractsApiService.create()` y `list()`. La matriz de `operationId` del verificador ya exige ambos `operationId` y el chequeo pasa cuando el backend está en el commit autorizado. El payload respeta exactamente el shape `CreateTeacherContractsRequest` (`schoolIds`, `startDate`, `endDate` opcional) — no se introducen campos fuera del contrato.
- [ ] Contract verify ejecutado en gate P0 pendiente (T035).

### E04 — Integración con backend real / CORS

- [ ] Pendiente (T034).

## Notas operativas

- Antes de ejecutar WU01+, el contrato debe mantenerse bajo seguimiento y la línea
  base de backend validada contra el `checksum` registrado.
- Los P1 (`/reports`, `/student-history`) permanecen bloqueados hasta cierre de la
  puerta P0.
