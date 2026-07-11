# Estrategia de pruebas frontend

## Decisión

Angular CLI 21 con Vitest y `jsdom`, `TestBed`, `HttpTestingController` y
Material Component Harnesses. P0 no instala Playwright ni define E2E. El browser
real se valida mediante walkthrough contra backend después de las pruebas.

## Capas

| Capa | Herramienta futura | Riesgo cubierto |
| --- | --- | --- |
| mapper/fixture | Vitest | forma DTO, omitidos/null, enums y orden |
| service HTTP | HttpTestingController | operationId, método, path, query, body y error |
| component/page | TestBed + Harnesses | forms, estados, foco, semántica y render |
| walkthrough | navegador + backend real | CORS, integración, teclado, responsive y zoom |

Los fixtures se crean por fase antes de los tests que los consumen. T009 crea
solo P0; los DTO/fixtures de reportes e historia se crean en T036, después de la
puerta T035 y antes de cualquier test P1. Representan el OpenAPI congelado; no
implementan reglas backend.

## Catálogo estable de pruebas P0

### Base, contrato y catálogos

| ID | Comportamiento |
| --- | --- |
| `ST-CONTRACT-BUNDLE` | commit `1223630ab99bf1bfaa4f5919fccf5ff539379c8e` o sucesor aprobado explícitamente, checksum aprobado coincidente (`802c13b91bf5c6425d24c540b6841a2abe134e084ea310fc2b7041e32c24a81a` para el baseline actual), archivos bajo seguimiento, directorio clean, refs y 15 operationIds; 13 runtime + 2 contract-only |
| `CT-SHELL-ROUTE` | navegación, skip link, título por ruta, foco único en h1 y anuncio polite |
| `ST-CATALOGS` | cinco métodos runtime P0 con query/orden exactos; no existen métodos dead-client |
| `CT-CATALOG-STATES` | School/Grade/AcademicYear/Teacher loading/error/empty/success exclusivos, retry y stale invalidado |

### Matrículas

| ID | Comportamiento |
| --- | --- |
| `ST-ENR-CREATE` | request exacto; `CreateEnrollmentResponseDto` es independiente, incluye `studentReused` y no se usa como list item; 400/404/409/422 propagados |
| `CT-ENR-FORM` | requeridos, longitudes y birthDate futura; primer error enfocado |
| `CT-ENR-DEPENDENCIES` | selectores descendientes disabled y limpieza inmediata |
| `CT-ENR-STALE` | cancelación/requestKey impide revivir catálogo anterior |
| `CT-ENR-SUCCESS` | confirmación viva, reset total y foco predecible |
| `CT-ENR-ATOMIC-ERROR` | conserva corrección y nunca presenta Student/Enrollment parcial |

### Consulta

| ID | Comportamiento |
| --- | --- |
| `ST-SEARCH-QUERY` | schoolId/gradeId/academicYearId requeridos; asOfDate solo si existe; combinación existente no produce expectativa 422 |
| `CT-SEARCH-STATES` | catálogos y resultados loading/error/noGroups/empty/success exclusivos con retry; `200 []` cubre noGroups/empty |
| `CT-SEARCH-RESULTS` | columnas/orden/acción completos; solo tabla o tarjetas expuesta por breakpoint |

### Contratos

| ID | Comportamiento |
| --- | --- |
| `ST-CON-PAYLOAD` | POST multiescuela; endDate omitido y null; rechazo canónico |
| `ST-CON-LIST` | GET por teacher, asOfDate opcional, endDate nullable, evaluatedAt y orden intacto |
| `CT-CON-FORM` | Teacher/School, IDs únicos y rango; submit bloqueado |
| `CT-CON-STATES` | catálogos y lista loading/error/empty/success exclusivos, retry y stale |
| `CT-CON-ATOMIC-ERROR` | 404/409/422 conserva datos y no agrega filas |
| `CT-CON-STATUS` | sector, estado persistido y efectivo al evaluatedAt separados |

### ProblemDetails y accesibilidad

| ID | Comportamiento |
| --- | --- |
| `ST-PROBLEM-400` | request ausente/mal formado y mensaje seguro |
| `ST-PROBLEM-404` | referencia inexistente y corrección contextual |
| `ST-PROBLEM-409` | conflicto persistido sin éxito parcial |
| `ST-PROBLEM-422` | regla semántica declarada por la operación, nunca incompatibilidad de referencias existentes en GET |
| `ST-PROBLEM-TRANSPORT` | red/forma irreconocible sin detalles internos |
| `CT-A11Y-P0` | títulos, route focus, teclado, labels, describedby/invalid, live regions, headers y disabled reason |

## Fixtures mínimos

- catálogos P0 con colecciones pobladas y vacías;
- create enrollment y list item separados;
- teacher request con `endDate` omitido/null y response con `evaluatedAt`;
- ProblemDetails con opcionales omitidos, detail/instance null y errors presente/ausente;
- reportes P1, creados solo tras T035, con schoolId/gradeId omitidos/null y propiedades fijas;
- historia P1, creada solo tras T035, con arrays completos/vacíos sin conducta SCN-035;
- datos exclusivamente ficticios, sin secretos ni PII real.

## P1 condicional

| ID | Comportamiento |
| --- | --- |
| `ST-RPT-AGE`, `CT-RPT-AGE` | query opcional, age3To7/age8To12/ageOver12, límites y ceros |
| `ST-RPT-SECTOR`, `CT-RPT-SECTOR` | propiedades public/private fijas y período exacto |
| `ST-RPT-TOP`, `CT-RPT-TOP` | todos los empates, vacío y orden canónico |
| `ST-HISTORY` | operación read-side, path normalizado, forma completa y 404 |
| `CT-HISTORY` | SCN-031–034: años/asignaciones completos y 404; no crea ni prueba SCN-035 en UI |

Estas pruebas no se escriben ni ejecutan antes de la puerta P0.

## Matriz manual P0-only

`docs/evaluator-execution.md` registra por `/enrollments`, `/student-search` y
`/teacher-contracts`:

- loading/error/empty/success/retry y catálogo obsoleto;
- 400/404/409/422 según la respuesta declarada por cada operación; listas y
  búsquedas no esperan 422 por combinación académica existente y cada N/A se
  justifica contra OpenAPI y no se simula una variante inexistente;
- teclado completo, route focus, errores/éxito y live regions;
- 320 CSS px, 200 % zoom, alto contraste y una sola tabla/card semántica;
- backend real, CORS y recorridos de atomicidad.

## Puerta P0

1. `ST-CONTRACT-BUNDLE` pasa con el commit
   `1223630ab99bf1bfaa4f5919fccf5ff539379c8e` —o un sucesor aprobado
   explícitamente—, los archivos bajo seguimiento, el directorio contractual
   clean y el checksum aprobado coincidente
   (`802c13b91bf5c6425d24c540b6841a2abe134e084ea310fc2b7041e32c24a81a`
   para el baseline actual).
2. Todos los IDs P0 anteriores pasan con Vitest/build estricto.
3. La matriz manual P0-only está completa y fechada.
4. Los tres walkthroughs pasan contra backend real con CORS local.
5. Solo entonces puede comenzar cualquier prueba P1 o packaging extra.

No se fija porcentaje de cobertura. Los tiempos calentados se registran como
observación local no gating y no requieren tooling de rendimiento.
