# Propuesta: Historial académico-docente P1

**Change**: `003-student-history` | **Fecha**: 2026-07-11 | **Frontend-only**
**Predecesores**: `001-school-enrollment-management`, `002-municipal-reports` (archivados 2026-07-11)

## Intent

Entregar el último P1 diferido: vista `/student-history` para consultar `FR-RPT-004` por `documentType` + `documentNumber` y mostrar una línea de tiempo académica con inscripciones, escuela, grado, grupo y asignaciones docentes, consumiendo `getStudentHistory` sin cambios backend.

## Scope

### In Scope

- Ruta `/student-history` operativa, reemplazando `P1LockedComponent`.
- Endpoint `getStudentHistory` y DTOs/manual fixtures del contrato.
- Componente timeline con estados `loading`/`error`/`empty`/`success`.

### Out of Scope

- Auth/permisos, paginación, exportaciones, edición o nuevos filtros.
- Cambios backend o modificación del contrato OpenAPI.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `municipal-reports`: activar `FR-RPT-004` dentro de la capacidad existente.

## Proposal question round

La ejecución pidió crear el artefacto ahora; quedan como supuestos a validar: timeline read-only, búsqueda por documento normalizado, `404 student_not_found` como error recuperable, y sin paginación/exportación aunque haya múltiples años.

## Approach

Reusar `CatalogFacade`, `RemoteState<T>`, `ProblemDetails` y Reactive Forms para el input de búsqueda; mantener cancelación/stale de WU02/WU03. Crear `StudentHistoryApiService`, `StudentHistoryFacade`, mappers/VMs y componente bajo `src/app/features/student-history/`. Reemplazar `P1LockedComponent` en la ruta; el timeline preserva orden contractual y no colapsa asignaciones múltiples.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `src/app/features/student-history/*` | New | API service, facade, mappers, VM, component, specs. |
| `src/app/core/api/dtos/student-history-item.dto.ts` | New | DTOs alineados a `StudentHistoryResponse`. |
| `src/app/app.routes.ts` | Modified | `/student-history` deja de usar `P1LockedComponent`. |
| `src/app/app.component.html` | Modified | Footer/app shell refleja historia operativa. |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Drift de contrato | Med | Usar `paths/enrollments.yaml` como fuente y `contract:verify`. |
| T033-STU/T034-STU manuales abiertos | Med | Documentar evidencia manual separada. |
| Limitación env commit-check | Med | Mantener warning: full gate requiere backend `1223630ab` o sucesor. |
| Presión de cierre del día | High | Un solo slice enfocado; no agregar extras. |

## Rollback Plan

Revertir el slice frontend de `003-student-history`; mantener evidencia y reportes para auditoría. `/student-history` vuelve a `P1LockedComponent` sin tocar backend.

## Dependencies

- Backend autorizado `1223630ab99bf1bfaa4f5919fccf5ff539379c8e` para gate completo.
- OpenAPI `contracts/paths/enrollments.yaml` (`getStudentHistory`) como fuente de verdad.

## Success Criteria

- [ ] `/student-history` muestra timeline accesible con `loading`/`error`/`empty`/`success`.
- [ ] `getStudentHistory` consume shape canónico y preserva años/asignaciones.
- [ ] `contract:verify` pasa content checks; warning env documentado si aplica.
- [ ] Tests verdes como evidencia contractual.
