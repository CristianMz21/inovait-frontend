# Capacidades de pruebas y calidad

**Modo TDD estricto**: deshabilitado
**Fecha de detección**: 2026-07-11

El repositorio todavía no contiene un proyecto Angular, dependencias instaladas
ni comandos ejecutables de pruebas o calidad. La planificación de la feature
selecciona Vitest/jsdom, TestBed, HttpTestingController y Material Harnesses;
siguen sin estar instalados. Playwright no forma parte del P0 comprometido.

## Ejecución de pruebas

- Comando: no disponible.
- Framework: no instalado ni configurado.

## Capas de prueba

| Capa | Disponible | Herramienta |
| --- | --- | --- |
| Unitarias | No | Vitest/jsdom planificado, no instalado |
| Integración frontend | No | TestBed/HttpTestingController planificados |
| E2E | No | Sin Playwright ni script E2E en P0 |

## Cobertura

- Disponible: No.
- Comando: no disponible.

## Herramientas de calidad

| Herramienta | Disponible | Comando |
| --- | --- | --- |
| Linter | No | No disponible |
| Type checker | No | No disponible |
| Formatter | No | No disponible |

El modo TDD estricto deberá revisarse cuando exista un test runner real. Su
deshabilitación actual describe una limitación del scaffold; se habilitará en un
futuro inmediato al definir un flujo de pruebas reproducible para la feature.
