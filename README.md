# Inovait — Frontend

Frontend Angular 21 para la gestión municipal de matrículas escolares (prueba
técnica full stack INOVAIT). Cinco pantallas operativas: alta de matrícula
(`/enrollments`), consulta de estudiantes (`/student-search`), contratos
docentes (`/teacher-contracts`), reportes municipales (`/reports`) e historial
del estudiante (`/student-history`). El backend hermano es
[`inovait-backend`](../inovait-backend) (.NET 10 + SQL Server).

## Requisitos

| Herramienta | Versión   | Descarga                                   |
| ----------- | --------- | ------------------------------------------ |
| Node.js     | `24.11.1` | <https://nodejs.org/> (o `nvm install 24`) |
| npm         | `11.6.2`  | incluido con Node.js                       |

El repositorio versiona `package-lock.json`; la instalación reproducible es
siempre con `npm ci` (no `npm install`).

## Instalación y ejecución

### Opción A — Stack completo con backend real (recomendada para evaluar)

Clonar ambos repos como hermanos y usar el script del backend, que levanta SQL
Server, la API y este frontend (build de producción, HTTP real) con un solo
comando:

```bash
git clone git@github.com:CristianMz21/inovait-backend.git
git clone git@github.com:CristianMz21/inovait-frontend.git
cd inovait-backend
./scripts/deploy-local.sh            # Windows: powershell -ExecutionPolicy Bypass -File scripts\deploy-local.ps1
```

Al terminar, el frontend queda en <http://localhost:4200> (abrir por
`localhost`, no `127.0.0.1`: el allowlist de CORS del backend solo incluye ese
origen) y la API en <http://localhost:5000>. Baja completa con
`./scripts/deploy-local.sh --down`. Prerrequisitos, parámetros y el paso a paso
manual están en el [README del backend](../inovait-backend/README.md).

### Opción B — Solo frontend con mocks (sin backend)

```bash
npm ci
npm start
```

El build de desarrollo usa un backend simulado tipado dentro del navegador (las
15 rutas del contrato con fixtures), así que no requiere ningún servicio. Queda
en <http://localhost:4200>.

Para verificar la alcanzabilidad del backend real antes de un walkthrough:

```bash
node scripts/dev-check-backend.mjs   # health + preflight CORS contra http://localhost:5000
```

## Pruebas y quality gates

```bash
npm run lint        # typecheck (app/spec/e2e) + eslint --max-warnings=0 + prettier
npm test            # Vitest con thresholds de cobertura (gate)
npm run e2e         # Playwright: suite mock + smoke de build de producción
```

Comandos individuales: `npm run typecheck`, `npm run lint:eslint`,
`npm run lint:style`, `npm run test:coverage`, `npm run build:development`,
`npm run build:production`, `npm run e2e:mock`, `npm run e2e:production`,
`npm audit`.

`npm run e2e` corre ambas suites en Chromium desktop y mobile, con chequeos de
accesibilidad axe. Cada web server de Playwright es dueño exclusivo de su
proceso: si el puerto 4200 está ocupado, el run falla rápido y nunca mata el
proceso existente. Los requests sin mock del build de producción se interceptan
y bloquean dentro de Playwright; las pruebas jamás contactan un backend real.

`npm run contract:verify` valida el contrato OpenAPI contra el repo hermano del
backend (árbol contractual, commit autorizado, checksum canónico y los 15
`operationId`); no forma parte del CI frontend-only porque requiere ese repo
presente.

## Detalles de comportamiento

- **Mocks en runtime**: `window.__INOVAIT_USE_MOCKS__` (solo booleanos `true`/
  `false`; cualquier otro valor cae al default del build) tiene precedencia
  sobre la configuración de build. La tabla de mocks contiene exactamente las
  15 rutas del contrato; no agrega ni redefine contratos del backend.
- **Historial del estudiante**: sigue el contrato al pie de la letra — el
  request solo lleva los segmentos de identidad documental en el path. El
  filtro `asOfDate` sigue disponible en consulta de estudiantes, contratos y
  reportes, donde el contrato sí lo define.
- **Privacidad en la navegación**: la consulta de estudiantes persiste en la
  URL solo sus filtros académicos no sensibles. Abrir el historial de un
  resultado registra la identidad en un handoff volátil en memoria y navega con
  un token `selection` opaco y aleatorio: la identidad documental nunca se
  escribe en la URL, el history state ni el web storage. El token no es una
  frontera de autorización y no puede resolverse si se pierde la memoria de la
  aplicación.

## Arquitectura

- Componentes standalone de Angular y TypeScript estricto.
- Reactive Forms para entrada y estado en cascada.
- Signals para estado local de vista y RxJS para cancelación HTTP.
- Interceptores HTTP funcionales con errores ProblemDetails normalizados.
- Tests unitarios y de integración con Vitest/TestBed.
- Verificación a nivel navegador con Playwright y axe.

Más contexto en [`docs/frontend-architecture.md`](docs/frontend-architecture.md)
y [`docs/testing-strategy.md`](docs/testing-strategy.md).
