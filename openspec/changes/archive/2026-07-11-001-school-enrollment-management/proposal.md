# Propuesta: Gestión frontend de inscripción escolar y contratación docente

## Intent

Entregar P0 de frontend para operatividad municipal (Matrículas, Consulta y Contratos), respetando el contrato canónico del backend y dejando Reportes/Historial para P1.

## Scope

### In Scope
- Implementar shell y rutas P0 (`/enrollments`, `/student-search`, `/teacher-contracts`).
- Implementar 9 operaciones runtime canónicas y sus vistas en `src/app/features/*`.
- Aplicar estados remotos exclusivos, envío atómico y error handling por `ProblemDetails`.
- Preparar evidencia para P0: accesibilidad y contrato.

### Out of Scope
- Auth/autorización, administración, paginación y reportes avanzados.
- Reportes e historial en P1; no se ejecutan antes de validar P0.
- Cambios de contrato o reglas canónicas del backend.

## Capabilities

### New Capabilities
- `enrollment-management`: matrícula con dependencias académicas.
- `student-search`: consulta conjunta con vacíos explícitos.
- `teacher-contracts`: creación multiescuela atómica + lista por docente.
- `municipal-reports`: P1 bloqueado hasta puerta P0.

### Modified Capabilities
- `None` (sin baseline funcional frontend en OpenSpec local).

## Approach

1. Mantener trazabilidad con `spec.md`, `plan.md`, `tasks.md`, y `docs/requirements-traceability.md`.
2. Montar Angular 21 base (shell, rutas, interceptor, core API/catálogos).
3. Implementar features P0 con DTO/mappers y estado local por Signals + RxJS para cancelación.
4. Validar WU02–WU04 por unidad y cerrar puerta P0 con `contract verify`.

## Affected Areas

| Area | Impact | Descripción |
|---|---|---|
| `src/app/layout/`, `src/app/app.routes.ts` | New | shell, navegación principal, documento y enfoque de ruta |
| `src/app/core/api/`, `src/app/core/catalogs/` | New | transportes tipados y catálogo académico/pre-cargado |
| `src/app/features/enrollments/` | New | matrícula + búsqueda con estados remotos |
| `src/app/features/teacher-contracts/` | New | creación/consulta atómica multiescuela |
| `docs/evaluator-execution.md` | New/Update | evidencia y decisiones de revisión/gate |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Cadena PR sin resolver | Alta | Detener implementación hasta `T003`.
| Contrato backend distinto | Media | Exigir verify de commit/checksum pre-gate.
| Falta de toolchain al iniciar | Alta | Ejecutar T005–T007 con gate de disponibilidad.

## Rollback Plan

Si una unidad falla, revertir solo ese slice (git checkout/revert), conservar evidencia en `docs/evaluator-execution.md` y no cambiar trazabilidad contractual hasta que el bloque se corrija.

## Dependencies

- Baseline backend: `1223630ab...81a` con checksum aprobado.
- Estrategia de revisión y cadena PR (T003) resuelta.
- Node 24.11.1 / npm 11.6.2.

## Success Criteria

- [ ] P0 en tres rutas con estados remotos consistentes y enfoque a11y.
- [ ] P0 cubre FR-001/049, UX-001/014 y SCN-001 a SCN-019.
- [ ] No mutación parcial en SCN-007, SCN-008, SCN-019 y SCN-FE-006.
- [ ] Puerta P0 superada antes de `reports/history` y antes de empaquetado.
- [ ] Decisión de estrategia de PR registrada antes de abrir cambios por slice.
