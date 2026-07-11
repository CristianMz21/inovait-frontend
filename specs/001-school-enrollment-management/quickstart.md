# Quickstart futuro de validación

## Estado

Guía para la implementación futura. Ningún comando de esta página fue
ejecutado durante planificación; no existen scaffold, `package.json`, lockfile,
fuente ni pruebas.

## Bloqueadores pre-apply

1. Elegir una estrategia de PRs encadenadas o aprobar `size:exception` limitada
   a scaffold/lockfile generado, separando líneas generadas de líneas humanas.

El baseline contractual ya fue autorizado y registrado en el commit backend
`1223630ab99bf1bfaa4f5919fccf5ff539379c8e`, con checksum
`802c13b91bf5c6425d24c540b6841a2abe134e084ea310fc2b7041e32c24a81a`.
Mientras falte la decisión de revisión, no se ejecuta el scaffold.

## Prerrequisitos futuros

- Node.js `24.11.1` y npm `11.6.2`, o versiones compatibles con Angular 21.
- Backend en `http://localhost:5000`, con datos ficticios y CORS para
  `http://localhost:4200` en la puerta P0.
- Baseline backend en el commit `1223630ab99bf1bfaa4f5919fccf5ff539379c8e`
  —o un sucesor aprobado explícitamente—, con archivos bajo seguimiento,
  directorio contractual clean y checksum coincidente.

No se requieren autenticación, secretos ni credenciales.

## Scaffold seguro en repositorio no vacío

Ejecutar desde la raíz de `inovait-frontend`. Angular CLI documenta `--directory`
como el destino del workspace y `--dry-run` como simulación sin escrituras. Se
genera primero en staging y se transfieren únicamente archivos conocidos; no se
usa `--force`, no se apunta `ng new` a `.` y no se crea un workspace anidado.

### 1. Preflight y simulación

```bash
test -d .git && test -d .specify && test -d .agents && \
test -d docs && test -d specs && test -f README.md && \
test ! -e angular.json && test ! -e package.json && \
test ! -e src && test ! -e .angular-scaffold

npx --yes @angular/cli@21.2.19 new inovait-frontend \
  --directory .angular-scaffold \
  --standalone --strict --routing --style=scss \
  --skip-git --skip-install --package-manager=npm \
  --test-runner=vitest --file-name-style-guide=2016 \
  --defaults --dry-run
```

Revisar que la salida solo proponga archivos dentro de `.angular-scaffold/`.

### 2. Generación en staging y transferencia controlada

```bash
npx --yes @angular/cli@21.2.19 new inovait-frontend \
  --directory .angular-scaffold \
  --standalone --strict --routing --style=scss \
  --skip-git --skip-install --package-manager=npm \
  --test-runner=vitest --file-name-style-guide=2016 \
  --defaults

test -f .angular-scaffold/angular.json && \
test -f .angular-scaffold/package.json && \
test -d .angular-scaffold/src && test -d .angular-scaffold/public

cp .angular-scaffold/angular.json \
   .angular-scaffold/package.json \
   .angular-scaffold/tsconfig.json \
   .angular-scaffold/tsconfig.app.json \
   .angular-scaffold/tsconfig.spec.json ./
cp -a .angular-scaffold/src .angular-scaffold/public ./
rm -rf .angular-scaffold

test -d .git && test -d .specify && test -d .agents && \
test -d docs && test -d specs && test -f README.md
git status --short
```

El README y los archivos Git/Spec Kit existentes no se reemplazan. La
instalación fijada y Material ocurren en tareas posteriores, una vez revisado el
diff generado.

## Dependencia contractual

Fuente única:

```text
../../../inovait-backend/specs/001-school-enrollment-management/contracts/openapi.yaml
```

El commit backend autorizado es:

```text
1223630ab99bf1bfaa4f5919fccf5ff539379c8e
```

Su checksum combinado es:

```text
802c13b91bf5c6425d24c540b6841a2abe134e084ea310fc2b7041e32c24a81a
```

Los diez YAML están versionados en ese commit. Desde el directorio backend
`contracts/`, el orden de cálculo es:

```bash
sha256sum openapi.yaml \
  paths/catalogs.yaml paths/enrollments.yaml \
  paths/teacher-contracts.yaml paths/reports.yaml \
  components/catalogs.yaml components/enrollments.yaml \
  components/teacher-contracts.yaml components/reports.yaml \
  components/problems.yaml | sha256sum
```

El futuro `contract:verify` debe comprobar antes del hash que cada archivo esté
bajo seguimiento, que el directorio contractual esté clean, que el commit sea
`1223630ab99bf1bfaa4f5919fccf5ff539379c8e` o un sucesor aprobado
explícitamente, que ese commit contenga los diez archivos y que
OpenAPI/API/operationIds coincidan. Debe fallar ante archivos fuera del índice,
cambios contractuales, commit no aprobado o checksum distinto. No se mantiene
una copia local del OpenAPI.

## Desarrollo con fixtures y backend real

Con el baseline versionado, los slices P0 pueden avanzar con fixtures P0
congelados que representen exactamente los DTO OpenAPI, incluidos omitidos y
`null`. No deben esperar todas las fases de implementación backend. Los fixtures
no sustituyen reglas, errores ni atomicidad del servidor. Ningún DTO o fixture de
reportes/historia P1 se crea antes de aprobar T035; T036 los prepara antes de las
pruebas P1.

La puerta P0 exige backend real. Configuración pública prevista:

```typescript
export const environment = { apiBaseUrl: 'http://localhost:5000' };
```

## Comandos futuros después del scaffold

```bash
npm ci
npm start
npm test -- --no-watch --no-progress
npm run build
npm run contract:verify -- \
  ../inovait-backend/specs/001-school-enrollment-management/contracts
```

Angular 21 usa Vitest. No existe `npm run e2e` ni Playwright en P0.

## Ruta crítica P0 asistida por IA — ocho horas

**Pronóstico**: riesgo alto. Las 49 tareas son ítems finos de control, no horas: solo
T001–T035 pertenecen al P0 diario; T036–T047 P1 y T048–T049 cierre quedan fuera
del reloj. Antes de iniciarlo deben estar confirmados el baseline autorizado y
la estrategia de revisión, Node/npm disponibles y el backend encaminado para
llegar listo a la integración final.

| Reloj | Timebox | Checklist agrupado | Fuente de datos / salida obligatoria |
| --- | ---: | --- | --- |
| 00:00–01:15 | 75 min | T005–T013 — base | contrato versionado; DTO/fixtures solo P0; shell y errores |
| 01:15–02:45 | 90 min | T014–T019 — Matrículas | fixtures P0 congelados; alta/reuse/conflicto/atomicidad verdes |
| 02:45–03:45 | 60 min | T020–T024 — Consulta | fixtures P0; filtros, `200` vacío/no-groups, edad y orden verdes |
| 03:45–05:15 | 90 min | T025–T030 — Contratos | fixtures P0; creación/lista/atomicidad/estados verdes |
| 05:15–06:15 | 60 min | T031–T032 — matriz crítica | errores y a11y automatizada de las tres rutas |
| 06:15–07:00 | 45 min | T033 — evidencia manual | teclado, foco, títulos, live regions, 320 px y 200 % |
| 07:00–08:00 | 60 min | T034–T035 — integración y puerta | backend real, CORS, tres walkthroughs y gate fechado |

### Cortes obligatorios

- **04:00**: Matrículas y Consulta deben estar verdes y Contratos iniciado. Si
  no, se registra el desvío y se deja de prometer una entrega de una jornada.
- **07:00**: las tres rutas, pruebas críticas y evidencia manual de accesibilidad
  deben estar listas. La última hora no se consume en features ni P1: se reserva
  a backend real, CORS, corrección de integración y puerta.

Ante desvíos solo se retiran observación de latencia, refactor cosmético o casos
redundantes que no cubran un riesgo nuevo. Nunca se cortan los tres recorridos
P0, evidencia crítica de errores/accesibilidad, integración real, walkthroughs ni
entregables requeridos. Si aun así no cabe, el objetivo diario se declara
incumplido.

## Walkthrough y puerta P0

Crear `docs/evaluator-execution.md` antes de registrar evidencia. Su matriz
P0-only debe incluir:

- `/enrollments`, `/student-search` y `/teacher-contracts`;
- loading/error/empty/success, reintento y catálogos obsoletos;
- 400/404/409/422 según aplicabilidad canónica, sin inventar respuestas;
- flujo completo por teclado, labels, foco y anuncios de ruta/estado;
- 320 CSS px, 200 % de zoom, contraste alto y cambio tabla/tarjetas con una sola
  representación semántica expuesta;
- backend real, origen `http://localhost:4200` y CORS;
- alta/reutilización/conflicto/atomicidad, búsqueda/no-groups y contratos
  multiescuela/lista.

Para listas, búsqueda y reportes, cualquier combinación de referencias
School/Grade/AcademicYear existentes es consultable. Ausencia de grupos o
inscripciones se evidencia como `200 []` o conteos cero; no se espera `422` por
“combinación incompatible”.

La puerta consume suite crítica, build futuro y esa matriz fechada. Si falla,
ninguna tarea P1 ni extra de empaquetado puede comenzar. La observación de tiempo
local es informativa, sin umbral de release.
