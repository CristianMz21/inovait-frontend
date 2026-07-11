# Design: School Enrollment Management Frontend

## Technical Approach

Implementación **P0-first** con Angular standalone: montar primero shell base + cliente HTTP + interceptor de errores, luego completar en orden `enrollments`, `student-search`, `teacher-contracts` y, solo con evidencia de calidad, desbloquear P1 (`reports`, `student-history`).

El frontend opera como lector del contrato canónico; no redefine reglas transaccionales del backend. Se priorizan estados remotos predecibles, formularios accesibles y mapeos explícitos entre DTOs/VM.

## Architecture Decisions

### Decision: Feature-scoped structure and local state by Signals

**Choice**: `src/app/core` + `src/app/features/{enrollments,student-search,teacher-contracts,reports,student-history}`; estado local con Signals por vista.

**Alternatives considered**: store global (NgRx), facade extensa o repository layer pesado.

**Rationale**: El alcance P0 no requiere coordinación global; Signals permite estados pequeños y auditables sin aumentar complejidad.

### Decision: Contract-driven services and typed mappers

**Choice**: Servicios por dominio con DTOs y mappers explícitos para contratos usados en runtime (`listSchools`, `listGrades`, `createEnrollment`, `listEnrollments`, `createTeacherContracts`, `listTeacherContracts`, etc.).

**Alternatives considered**: cliente HTTP auto-generado desde OpenAPI o entidades compartidas para request/response.

**Rationale**: Se conserva trazabilidad exacta con `operationId` y se evita que diferencias canónicas entre payloads se oculten.

### Decision: P1 locked behind P0 evidence

**Choice**: Mantener rutas P1 disponibles en código pero no navegables hasta completar validación de P0 y checkpoint de tareas.

**Alternatives considered**: liberar todo desde el scaffold inicial o dividir por ramas parciales.

**Rationale**: Mantiene alcance controlado y reduce riesgo de deuda de UI sin contrato demostrado.

### Decision: Uniform ProblemDetails handling

**Choice**: `problemDetailsInterceptor` + tipo `ApiProblem` + `RemoteState` (`idle|loading|success|empty|error`) + `requestKey` de request.

**Alternatives considered**: manejo ad-hoc por componente o mensajes hardcodeados.

**Rationale**: Homogeneiza errores, permite accesibilidad consistente y evita estados obsoletos visibles.

## Data Flow

```text
View(Form + Signals)
  -> mapper (VM <-> DTO)
  -> service (HTTP typed)
  -> interceptor ProblemDetails
  -> HttpClient -> API

API response
  -> interceptor
  -> mapper (DTO -> VM)
  -> RemoteState + UI feedback
```

En selects dependientes, al cambiar un criterio padre se reinician hijos y se descartan respuestas atrasadas.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/app/app.config.ts` | Create | Providers, interceptores y configuración base API. |
| `src/app/app.routes.ts` | Create | Rutas P0 y P1 (P1 bloqueadas). |
| `src/app/layout/app-shell.component.ts` | Create | Shell + navegación + accesibilidad básica. |
| `src/app/core/api/*` | Create | API base token, `ProblemDetails` interceptor y tipos de error. |
| `src/app/core/catalogs/*` | Create | Catálogos canónicos con estado remoto. |
| `src/app/features/enrollments/*` | Create | Pantallas create/search y servicios de inscripción. |
| `src/app/features/teacher-contracts/*` | Create | Pantallas y servicios de contratos docentes. |
| `src/testing/fixtures/*` | Create | Datos mock y escenarios de error contractuales. |
| `src/app/scripts/verify-openapi-contract.mjs` | Create | Verificación de operación y checksums de contrato. |
| `docs/evaluator-execution.md` | Update | Evidencia y checklist de aprobación P0. |
| `package.json` | Update | Scripts (`test`, `build`, `contract:verify`) y dependencias base. |

## Interfaces / Contracts

```ts
export type RemoteState<T> =
  | { status: 'idle' }
  | { status: 'loading'; requestKey: string }
  | { status: 'success'; data: T }
  | { status: 'empty'; reason: 'noResults' | 'noGroups' | 'noContracts' }
  | { status: 'error'; problem: ApiProblem };

export interface CreateEnrollmentResponseDto {
  enrollmentId: number;
  studentId: number;
  studentReused: boolean;
}

export interface TeacherContractRequestDto {
  schoolIds: number[];
  startDate: string; // YYYY-MM-DD
  endDate?: string | null;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Mappers, validaciones y fixtures | Tests de transformación, campos opcionales y reglas de estado. |
| Integration | HTTP services | `operationId`, method, path, query y `ProblemDetails` por status. |
| Component | Pages y formularios P0 | Estados remotos, accesibilidad, validación dependiente. |

## Migration / Rollout

No migration required.

## Open Questions

- None.
