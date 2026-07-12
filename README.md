# Inovait Frontend

Angular 21 frontend for municipal school enrollment management. The application
contains five operative screens: enrollment creation, student search, teacher
contracts, municipal reports, and student history.

## Requirements

- Node.js `24.11.1`
- npm `11.6.2`

The repository tracks `package-lock.json`. Install dependencies reproducibly:

```bash
npm ci
```

## Local development

```bash
npm start
```

The development build uses the typed in-browser mock backend by default, so no
backend service is required. The production build defaults to real HTTP.

To run the full stack against the real backend instead of mocks, use
`../inovait-backend/scripts/deploy-local.sh` (or `deploy-local.ps1` on
Windows) from the backend repo. It brings up SQL Server, the API, and serves
this frontend with `ng serve --configuration production` at
`http://localhost:4200`. See that repo's README for details.

Set `window.__INOVAIT_USE_MOCKS__` before Angular bootstraps to override either
build default. Only boolean `true` and `false` are accepted; every other value
fails closed to the build default. This runtime flag has precedence over the build configuration.
The mock table contains the 15 API routes currently consumed by frontend API
services; it does not add or redefine backend contracts.

Student history keeps propagating its optional `asOfDate` end to end because it
is an existing frontend requirement, although the current backend OpenAPI path
does not list that query parameter. This frontend behavior does not modify the
backend contract.

## Quality gates

```bash
npm run typecheck
npm run lint:eslint
npm run lint:style
npm run lint
npm test
npm run test:coverage
npm run build:development
npm run build:production
npm run e2e
npm audit
```

`npm run e2e` runs both the development mock suite and a production-build smoke
suite on desktop and mobile Chromium, including axe accessibility checks. Each
Playwright web server owns its process exclusively. If port 4200 is occupied,
the run fails fast and never terminates the existing process. Production
no-mock requests are intercepted and blocked inside Playwright; tests never
contact a real backend.

`contract:verify` remains available for explicit contract work, but is not part
of the frontend-only CI workflow because it requires the separate backend
repository.

## Architecture

- Standalone Angular components and strict TypeScript
- Reactive Forms for input and cascade state
- Signals for local view state and RxJS for HTTP cancellation
- Functional HTTP interceptors with normalized ProblemDetails errors
- Vitest/TestBed unit and integration tests
- Playwright and axe for browser-level verification

See [`docs/frontend-architecture.md`](docs/frontend-architecture.md) and
[`docs/testing-strategy.md`](docs/testing-strategy.md) for additional context.
