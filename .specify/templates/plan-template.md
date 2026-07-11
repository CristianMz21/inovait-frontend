# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]

**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]

**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]

**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]

**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]

**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]

**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]

**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]

**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

**Canonical API Contract**: [backend OpenAPI location/version and compatibility decision]

**API Error Model**: [ProblemDetails mapping for field and general errors]

**Accessibility**: [WCAG 2.2 AA strategy, keyboard path, focus and announcements]

**Traceability**: [mapping approach from requirement IDs to UI, API, tasks and tests]

**Reproducible Setup**: [supported versions, clean-install and evaluator run path]

## Constitution Check

*GATE: Debe aprobarse antes de la investigación de Phase 0 y repetirse después
del diseño de Phase 1.*

Registrar `PASS` o `FAIL` con evidencia para cada puerta:

- Alcance de un día limitado a P0; P1 bloqueado hasta validar todos los P0.
- Selecciones dependientes `school`/`year`/`grade`/`group` e integridad definida.
- Validación cliente/servidor separada, con autoridad final del backend.
- OpenAPI backend canónico confirmado; no existen contratos frontend divergentes.
- Errores `ProblemDetails` y estados loading/error/success/empty definidos.
- Trazabilidad de requisitos a UI, API, tareas y pruebas documentada.
- Angular standalone, TypeScript estricto, `Reactive Forms`, HTTP tipado, rutas
  por feature y Angular Material respetados o excepción bloqueante justificada.
- Accesibilidad WCAG 2.2 AA, teclado, foco, labels y tablas responsive cubiertos.
- Pruebas centradas en comportamiento crítico, sin objetivos artificiales de
  cobertura.
- Setup reproducible, datos ficticios y ausencia de secretos confirmados.
- Sin estado global, bibliotecas UI, administración o abstracciones innecesarias.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── app/
│   ├── core/              # Cross-cutting configuration only
│   ├── shared/            # Reusable presentational elements only
│   └── features/          # Standalone components, routes and local services
├── environments/
└── styles/

tests/
└── e2e/                   # Critical evaluator journeys
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
