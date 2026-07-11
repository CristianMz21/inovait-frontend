# Plan de implementación: Gestión frontend de inscripción escolar y contratación docente

**Rama**: `main` | **Fecha**: 2026-07-10 | **Especificación**: [spec.md](./spec.md)

**Estado**: planificación únicamente. Este plan no autoriza scaffold,
dependencias, código, pruebas, commits ni pushes.

## Resumen

Entregar en una jornada únicamente P0: base Angular mínima, Matrículas,
Consulta de estudiantes, Contratos docentes, pruebas críticas, accesibilidad
crítica y walkthrough del evaluador. Es un pronóstico asistido por IA de riesgo
alto sobre una ruta crítica de ocho horas, no una promesa. P1 queda completamente
planificado como extensión condicional posterior a evidencia P0. Las páginas pueden desarrollarse
con fixtures P0 congelados del OpenAPI fijado por el baseline autorizado;
la integración backend real y CORS son obligatorios en la puerta final P0.

La consigna original se preserva en el backend canónico
[`docs/assessment-baseline.md`](../../../inovait-backend/docs/assessment-baseline.md)
y no se duplica aquí.

## Contexto técnico

| Área | Decisión |
| --- | --- |
| Plataforma | Angular `21.2.18`, CLI `21.2.19`, TypeScript `5.9.3`, RxJS `7.8.2`, Node `24.11.1`, npm `11.6.2` |
| UI | Angular Material/CDK `21.2.14`; standalone, Reactive Forms y strict mode |
| Estado | Signals locales para vista; RxJS para HTTP y cancelación; sin store global |
| Pruebas | Vitest/jsdom, TestBed, HttpTestingController y Material Harnesses; sin Playwright en P0 |
| Persistencia | ninguna; backend canónico para reglas, historia y orden |
| Alcance | tres rutas P0; dos rutas P1; listas acotadas sin paginación |
| Rendimiento | observación local calentada, no gating y sin tooling pesado |

## Contrato canónico y reproducibilidad

Ruta: `../../../inovait-backend/specs/001-school-enrollment-management/contracts/openapi.yaml`.
El bundle OpenAPI `3.1.0`, API `1.0.0`, conserva 15 `operationId`.

El baseline contractual autorizado es el commit backend
`1223630ab99bf1bfaa4f5919fccf5ff539379c8e`. Contiene los diez YAML versionados y
su SHA-256 combinado es
`802c13b91bf5c6425d24c540b6841a2abe134e084ea310fc2b7041e32c24a81a`.

La verificación frontend fallará si el backend no está en ese commit o en un
sucesor aprobado explícitamente, si algún input contractual no está bajo
seguimiento, si el directorio contractual tiene cambios, si el commit no contiene
los diez YAML o si versión/checksum no coinciden. El bloqueador pre-apply restante
es exclusivamente la estrategia de revisión o la `size:exception` limitada a
archivos generados.

## Operaciones y DTO

- Las 15 operaciones se verifican contra OpenAPI.
- Existen 13 consumidores runtime: cinco catálogos P0, create/list enrollment,
  create/list teacher contracts y cuatro lecturas P1.
- `listSubjects` y `listTeachersBySchool` son contract-only: no se crean métodos
  frontend ni llamadas sin consumidor visual.
- Los DTO manuales mantienen camelCase y opcionalidad/nullability exactas.
  `CreateEnrollmentResponseDto` declara de forma independiente todos los campos
  del schema canónico y no extiende ni reutiliza `EnrollmentListItemDto`; contratos
  conservan `evaluatedAt`; reportes usan propiedades fijas.
- Antes de la puerta solo se crean DTO y fixtures P0. Los DTO/fixtures de reportes
  e historia se crean después de T035 y antes de sus pruebas P1. Cada fase prueba
  campos omitidos y `null`; ningún mapper reordena, deduplica o recalcula respuestas.

## Semántica del contexto de consulta

Cualquier combinación de referencias existentes `School` + `Grade` +
`AcademicYear` es consultable en listas, búsqueda y reportes. La ausencia de
`ClassGroup` o inscripciones devuelve `200` con `[]` o conteos cero y se presenta
como estado vacío/no-groups. `422` no representa una “combinación incompatible”
en esas consultas: queda limitado a reglas semánticas declaradas por el contrato,
como la relación de un `ClassGroup` en una escritura o fechas/períodos inválidos.

## Arquitectura y datos

```text
Route page → Reactive Form / local Signal → mapper → typed API service
                                                    ↓
                              problemDetailsInterceptor → HttpClient → backend
```

El código futuro se organiza en `core/api`, `core/catalogs`, `layout` y
`features/{enrollments,teacher-contracts,reports,student-history}`. No habrá
`SharedModule`, facade global, repository frontend ni capas vacías. Véanse
[frontend-architecture.md](../../docs/frontend-architecture.md) y
[data-model.md](./data-model.md).

## Estados y accesibilidad P0

- Cada page y cada catálogo necesario representa estados exclusivos
  loading/error/empty/success, con reintento; una selección obsoleta se invalida
  y el rechazo backend permite recargar opciones.
- Cada ruta establece un `document.title` significativo, enfoca su `h1` una vez
  al completar la navegación y lo anuncia mediante una única región polite.
- Errores de submit enfocan el primer campo o resumen aplicable; cambios remotos
  ordinarios se anuncian sin mover foco.
- En responsive, tabla y tarjetas comparten datos pero solo una representación
  semántica permanece expuesta y enfocable en cada breakpoint.
- Antes de la puerta se verifican teclado, labels, foco, live regions, contraste,
  320 CSS px, 200 % de zoom y ausencia de información solo por color.

## Hitos y puertas

| Hito | Evidencia de salida |
| --- | --- |
| Pre-apply | baseline backend autorizado/versionado en `1223630ab99bf1bfaa4f5919fccf5ff539379c8e` (completado) y estrategia de revisión decidida (pendiente) |
| Base P0 | scaffold seguro, contrato verificado, shell, errores, DTO y fixtures exclusivamente P0 |
| Matrículas | validación, dependencias, catálogos remotos, 201 y 400/404/409/422 |
| Consulta | query conjunta, no-groups, empty, error, success y tabla/card |
| Contratos | catálogos/lista remotos, create atómico, estados y `evaluatedAt` |
| Puerta P0 | matriz P0-only, suite crítica, teclado/responsive y backend real/CORS |
| P1 condicional | reportes e historia, solo después de aprobar la puerta |

La matriz P0-only cubre las tres rutas, estados loading/error/empty/success,
400/404/409/422 según aplicabilidad canónica, reintento, teclado, transiciones de
foco, viewport/zoom y backend real/CORS. Un estado no aplicable se registra como
tal; nunca se inventa una respuesta para completar la matriz.

## Ruta crítica P0 de ocho horas

Las 49 tareas son ítems finos de control de dependencia y evidencia, no 49 horas: P0 usa
T001–T035; P1 T036–T047 queda fuera del reloj y T048–T049 son cierre posterior.
Antes de iniciar debe conservarse válido el baseline contractual y resolverse la puerta de revisión,
Node/npm disponibles y el backend encaminado para estar listo en la última hora.
Los slices T014–T032 trabajan contra fixtures P0 congelados; T034–T035 realizan
la integración real y CORS.

Los timeboxes y cortes obligatorios se detallan en [quickstart.md](./quickstart.md).
Si a las 04:00 Matrículas y Consulta no están verdes con Contratos iniciado, o si
a las 07:00 no están verdes las tres rutas, pruebas críticas y evidencia manual
de accesibilidad, se detiene la promesa temporal y se registra el desvío. Solo se
retiran observación de latencia, refactor cosmético o casos redundantes sin riesgo
nuevo; nunca los tres recorridos, errores/accesibilidad crítica, integración real
o entregables requeridos.

## Presupuesto de revisión

| Categoría | P0 comprometido | P1 condicional |
| --- | ---: | ---: |
| Líneas humanas | 1.600–2.300 | +900–1.400 |
| Scaffold/lock/config generado | 650–1.050 | sin incremento relevante |
| Riesgo de 400 líneas | Alto | Alto |

La estrategia cacheada es `ask-on-risk`. Antes del scaffold debe elegirse una
cadena de PRs por unidad funcional o aprobar una `size:exception` limitada a
scaffold/lockfile generado. Las líneas generadas se revisan y reportan separadas
de las humanas. Mientras la decisión siga pendiente no se afirma cumplimiento.

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

## Control constitucional posterior

**Resultado**: PASS técnico condicionado por un bloqueador pre-apply: la
estrategia de revisión. El baseline contractual autorizado ya está versionado en
`1223630ab99bf1bfaa4f5919fccf5ff539379c8e`. P0 precede a P1,
backend conserva autoridad, la trazabilidad usa IDs estables y toda la
accesibilidad P0 requerida ocurre antes de la puerta.
