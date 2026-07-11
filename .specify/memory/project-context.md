# Contexto de planificación del proyecto

**Proyecto**: `inovait-frontend`
**Fecha de detección**: 2026-07-10
**Persistencia SDD**: GitHub Spec Kit (`.specify/`) con integración Codex

## Estado del repositorio

- Repositorio Git independiente del repositorio de backend.
- Rama actual: `main`, con seguimiento de `origin/main`.
- Remoto: `git@github.com:CristianMz21/inovait-frontend.git`.
- El repositorio contiene únicamente documentación inicial y configuración de
  ignorados; todavía no existe un proyecto Angular ni código de aplicación.

## Stack planificado y entorno detectado

| Elemento | Estado |
| --- | --- |
| Angular | Planificado: framework 21.2.18, CLI 21.2.19 |
| TypeScript | Planificado con modo estricto |
| Node.js | Detectado: `24.11.1` |
| npm | Detectado: `11.6.2` |
| Angular Material | Planificado: Material/CDK 21.2.14 |
| Angular Signals / RxJS | Signals locales y RxJS 7.8.2 para HTTP/cancelación |
| Backend REST API | Repositorio y ciclo de vida independientes |

Las versiones de Node.js y npm son contexto del entorno actual. La feature
`001-school-enrollment-management` seleccionó Angular 21 por compatibilidad
documentada, pero todavía no instaló ni generó ningún paquete.

## Convenciones para la planificación

- Redactar especificaciones, planes, tareas y demás artefactos técnicos en
  español neutro y profesional.
- Mantener en inglés los identificadores técnicos, nombres de archivos,
  comandos, API y símbolos de código.
- Mantener separadas las decisiones, ramas, historial y entregas del frontend y
  del backend.
- No inferir herramientas como instaladas a partir de elementos indicados como
  planificados en `README.md`.
- Resolver las versiones y herramientas del stack dentro del plan de cada
  funcionalidad, con evidencia vigente, antes de generar código.

## Fuentes inspeccionadas

- `README.md`
- `.gitignore`
- Estado, historial y remoto de Git
- Versiones locales de `specify`, `node` y `npm`
- Ausencia de `package.json`, `angular.json` y configuraciones de calidad o
  pruebas
