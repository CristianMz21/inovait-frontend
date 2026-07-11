# Inovait — Frontend

Aplicación frontend planificada para la evaluación técnica de gestión de
matrículas escolares y contratos docentes.

> **Estado actual**: planificación únicamente. Todavía no existen scaffold
> Angular, `package.json`, lockfile, código fuente ni pruebas ejecutables.

## Compromiso de una jornada

P0 es el único MVP comprometido:

1. crear o reutilizar `Student` y crear `Enrollment` atómicamente;
2. consultar matrículas por `School`, `Grade` y `AcademicYear`;
3. crear contratos de un `Teacher` para varias escuelas y consultarlos;
4. validar errores, accesibilidad crítica y los tres walkthroughs con backend real.

Los reportes e historia P1 permanecen planificados como extensión condicional.
No se inician hasta aprobar la puerta P0.

El pronóstico P0 es de **riesgo alto** y usa una ruta crítica asistida por IA de
ocho horas, no una promesa incondicional. Sus 49 tareas totales son ítems finos de control:
35 pertenecen a P0, 12 a P1 condicional y 2 al cierre. P1 queda fuera del reloj.
Los prerrequisitos deben estar resueltos antes de iniciarlo; durante los slices
funcionales se usan fixtures P0 congelados y la última hora se reserva para
integración real y puerta. Solo puede recortarse hardening no esencial, nunca
los tres recorridos P0, evidencia crítica de errores/accesibilidad, integración
real ni entregables requeridos. La secuencia y los cortes están en
[`quickstart.md`](specs/001-school-enrollment-management/quickstart.md).

## Stack aprobado para implementación futura

- Angular framework `21.2.18` y Angular CLI `21.2.19`.
- TypeScript `5.9.3`, RxJS `7.8.2` y Angular Material/CDK `21.2.14`.
- Componentes standalone, TypeScript estricto, Reactive Forms y `HttpClient`.
- Vitest con `jsdom`, `TestBed`, `HttpTestingController` y Material Harnesses.

Playwright no forma parte del P0 comprometido ni existe un script E2E. Solo
podrá añadirse en un cambio posterior aprobado después de la puerta P0.

Estas son decisiones de planificación; no hay dependencias instaladas.

## Contrato backend

El OpenAPI canónico vive en el repositorio independiente
`../inovait-backend/specs/001-school-enrollment-management/contracts/openapi.yaml`.
Contiene 15 `operationId`: la UI planifica 13 consumidores runtime y verifica
`listSubjects` y `listTeachersBySchool` solo como contrato porque no tienen un
consumidor visual necesario.

El baseline contractual autorizado es el commit backend
`1223630ab99bf1bfaa4f5919fccf5ff539379c8e`, con checksum combinado
`802c13b91bf5c6425d24c540b6841a2abe134e084ea310fc2b7041e32c24a81a`.
Ese commit contiene los diez YAML bajo seguimiento. La verificación futura DEBE
exigir ese commit exacto o un sucesor aprobado explícitamente, los diez archivos
bajo seguimiento, el directorio contractual clean y el checksum coincidente.
El baseline ya no bloquea apply; permanece pendiente únicamente la estrategia
de revisión o la `size:exception` limitada a archivos generados.

La consigna original preservada se referencia, sin duplicarla, en
[`../inovait-backend/docs/assessment-baseline.md`](../inovait-backend/docs/assessment-baseline.md).

## Ejecución futura

El procedimiento seguro de scaffold para este repositorio no vacío está en
[`quickstart.md`](specs/001-school-enrollment-management/quickstart.md). Después
de que exista código, se documentarán y validarán `npm ci`, `npm start`,
`npm test`, `npm run build` y `npm run contract:verify`.

La URL local prevista es `http://localhost:4200`; el backend se configura en
`http://localhost:5000` con CORS explícito para el origen frontend. No se
requieren autenticación, secretos ni datos personales reales.

## Convenciones

- Ramas cortas y commits Conventional Commits, sin atribución de IA.
- TypeScript estricto, sin `any`, supresiones ni pruebas omitidas.
- Estado local; sin NgRx, CRUD de catálogos, paginación ni OpenAPI duplicado.
- Artefactos técnicos y copy visible en español profesional neutro;
  identificadores técnicos en inglés.

## Documentación

- [Plan](specs/001-school-enrollment-management/plan.md)
- [Tareas](specs/001-school-enrollment-management/tasks.md)
- [Trazabilidad](docs/requirements-traceability.md)
- [Arquitectura](docs/frontend-architecture.md)
- [UX y accesibilidad](docs/ux-design.md)
- [Pruebas](docs/testing-strategy.md)
