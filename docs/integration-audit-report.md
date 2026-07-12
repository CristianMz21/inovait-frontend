# Informe de Auditoría de Integración E2E — Frontend Angular ↔ Backend .NET

**Rama:** `audit/e2e-integration-real-backend`
**HEAD auditado:** `050d14cd` (base `7d16e896`)
**Fecha:** 2026-07-12
**Alcance:** `inovait-frontend` (Angular) contra `inovait-backend` (.NET) real, stack local (SQL Server 2022, API `:5000`, frontend `ng serve --configuration production` `:4200`).

---

## 1. DIAGNÓSTICO

### Estado inicial y origen real de los datos

El frontend fue auditado en configuración de **producción** (`build:production` / `ng serve --configuration production`), la única en la que el gating de mocks está activo. El interceptor de mocks (`MockBackendInterceptor`) solo se registra condicionalmente cuando `environment.useMocks` es verdadero (`src/app/core/api/provide-api-http-client.ts:27-34`).

### Tabla de verdad del gating de mocks

| Build config | `fileReplacements` (angular.json) | Override runtime `window.__INOVAIT_USE_MOCKS__` | Mocks resultantes |
| --- | --- | --- | --- |
| `development` (`npm start`) | `environment.development.ts` (`useMocks:true`) | no seteado | **ON** (por diseño) |
| `development` | `environment.development.ts` | `false` | OFF (override explícito) |
| `production` (`build:production` / `ng serve --configuration production`) | ninguno — usa `environment.ts` (`useMocks:false`) | no seteado | **OFF** |
| `production` | `environment.ts` | `true` | ON (override explícito, solo usado por E2E) |
| cualquiera | — | valor no booleano | **OFF** (fail-closed) |

Referencias: `src/app/core/api/provide-api-http-client.ts:27-34`, `src/environments/environment-config.ts` (resolución fail-closed, unit-testeada), `angular.json` (fileReplacements solo en configuración `development`). Probado por `e2e/production/production-mock-toggle.spec.ts` (4 tests).

### Hallazgos F1–F4

| ID | Hallazgo | Severidad | Disposición |
| --- | --- | --- | --- |
| F1 | `DEFAULT_API_CONFIG.apiBaseUrl = "http://localhost:5000"` hardcodeado (`src/app/core/api/api-config.ts`), no environment-driven | Baja | Documentado, no tocado — correcto para el alcance local auditado; ver sketch de remediación en §3 |
| F2 | Los mappers no tienen validación de esquema en runtime; formas malformadas ya emergen como estados de error explícitos (probado por e2e existentes) | Baja | Documentado, no tocado — cumple "sin fallback silencioso" |
| F3 | Los caminos de error de `student-history` solo se ejercían contra mocks (`docs/evaluator-execution.md`) | Media | Cerrado — nuevo test `e2e/production/history-error-states.spec.ts` (commit `050d14cd`) + verificación manual contra backend real (Screen 6) |
| F4 | `npm run contract:verify` fallaba: backend HEAD `8878e668…` no estaba en el allowlist del script, pese a que el directorio de contratos era byte-idéntico | Media | Corregido — commit `10b3a705` |

### Veredicto de fabricación: CLEAN

Verificaciones realizadas sobre `src/`:

1. **1 solo `catchError`** en todo `src/` (`problem-details.interceptor.ts:19`), y **re-lanza** (re-throw) el error normalizado — no lo absorbe. Todas las facades setean `errorState(toSafeApiProblem(err))`; el estado `empty` solo se usa para un 200 con array vacío genuino.
2. **0 usos de web storage** — cero ocurrencias de `localStorage`/`sessionStorage`/`indexedDB`/cookies en `src/`.
3. **0 datos estáticos de dominio** — cero `of([...])` con datos de dominio fuera de `mocks/`/`fixtures`.

15 endpoints coinciden exactamente con el backend (paths/métodos/parámetros); JSON en camelCase; valores enum como strings PascalCase (`"Public"`/`"Confirmed"`/`"Effective"`...). Errores del backend en RFC7807 + extensión `code`; 400/404/409/422/201 implementados.

---

## 2. EVIDENCIA DE INTEGRACIÓN

Método: por cada pantalla, se ejecutó un `curl` fresco al backend inmediatamente antes de accionar la UI, y se comparó el valor mostrado en pantalla contra la respuesta cruda. Navegación exclusivamente vía `http://localhost:4200` (nunca `127.0.0.1`, por el allowlist de CORS).

**Nota metodológica**: las expectativas del brief original (schools=4, grades=14, top-schools enrollmentCount=10) fueron re-derivadas por curl fresco en cada pantalla porque la auditoría misma escribía datos (altas de matrícula/contratos) entre pasos, cambiando los conteos reales de forma esperada y verificable. Esto es evidencia adicional de datos vivos, no un defecto.

### Desviaciones documentadas vs. el seed booklet

| Campo | Esperado (brief / SEED_DATA.md) | Real (API) | Explicación |
| --- | --- | --- | --- |
| `GET /api/schools` count | 4 | 5 | `database/setup.sql` siempre siembra una fila canónica base ("North Learning Center", id=1) además del set demo; SEED_DATA.md documenta que `reset-demo.sql` "Nunca toca el seed canónico". El subconjunto `DEMO-%` es exactamente 4. |
| `GET /api/grades` count | 14 | 15 | Mismo motivo (grado canónico "First Grade", id=1, + 14 `DEMO-%`). |
| `teacher-counts-by-sector` field names | `publicCount`/`privateCount` (shorthand del brief) | `publicDistinctTeacherCount`/`privateDistinctTeacherCount` | Nombre real de campo del DTO .NET; valores coinciden (4/3). |
| `top-schools[].school` | se esperaba `code` (`COL-PUB-001`) | solo `id`/`name`/`sector` | El DTO no expone `code`; se verificó por `name`="Colegio Público Central" + `id`=2 (confirmado independientemente como Central/Public en el paso 1 de la matriz). |

Estas son desviaciones de forma/documentación, no defectos: en todos los casos los valores subyacentes (conteos DEMO-%, campos reales) coinciden exactamente con lo esperado.

### Matriz curl — 15 endpoints (Fase C)

| # | Endpoint | Método | Assert | Status | Resultado |
| --- | --- | --- | --- | --- | --- |
| 1 | `/api/schools` | GET | 4 `DEMO-%` + 1 canónico, sector ∈ {Public,Private}, Central=id 2 | 200 | PASS* |
| 2 | `/api/grades` | GET | 14 `DEMO-%` + 1 canónico, Quinto=id 9 | 200 | PASS* |
| 3 | `/api/academic-years` | GET | 3 total, exactamente 1 `isCurrent:true`=id 1 | 200 | PASS |
| 4 | `/api/class-groups?schoolId=2&gradeId=9&academicYearId=1` | GET | 1 item, code `DEMO-P105A-26`, id 17 | 200 | PASS |
| 5 | `/api/teachers` | GET | 8 items, DEMO-DOC-005=id 29 (Felipe Cardenas) | 200 | PASS |
| 6 | `/api/subjects` | GET | exactamente 4 (DEMO-MAT/LEN/CIE/SOC) | 200 | PASS |
| 7 | `/api/schools/2/teachers` | GET | 3 items, todos `effectiveStatus:"Effective"` | 200 | PASS |
| 8 | `/api/enrollments?schoolId=2&gradeId=9&academicYearId=1` (BEFORE) | GET | exactamente 3: DEMO-EST-006/012/011 | 200 | PASS |
| 9 | `/api/students/DNI/DEMO-EST-006/history` | GET | 3 años, Tercero→Cuarto→Quinto, DOC-001→DOC-006→DOC-005 | 200 | PASS |
| 10 | `/api/reports/age-distribution?academicYearId=1` | GET | `age3To7`/`age8To12`/`ageOver12` = 8/8/8 | 200 | PASS |
| 11 | `/api/reports/teacher-counts-by-sector` | GET | public 4 / private 3 | 200 | PASS |
| 12 | `/api/reports/top-schools?academicYearId=1` | GET | Central, enrollmentCount=10 | 200 | PASS |
| 13 | `/api/teachers/29/contracts` | GET | 2 contratos Confirmed/Effective (schools 4 y 2) | 200 | PASS |
| 14 | `/api/enrollments` (EVAL-NEW-001) | POST | `Location`, `enrollmentId:41` | **201** | PASS |
| 15 | `/api/teachers/29/contracts` (school 3) | POST | `id:11`, Confirmed/Effective | **201** | PASS |

\* Desviación de conteo documentada arriba, no defecto.

**Round-trip de escritura (API, paso #8 re-ejecutado):** BEFORE 3 → AFTER **4** (nueva fila `enrollmentId:41`, `documentNumber:EVAL-NEW-001`). PASS.

**Negativos RFC7807 (3/3 PASS):**

| Caso | Método/Endpoint | Status | `code` | `type` |
| --- | --- | --- | --- | --- |
| Estudiante inexistente | `GET /api/students/DNI/NO-EXISTE-999/history` | 404 | `student_not_found` | `.../problems/student-not-found` |
| Matrícula duplicada | `POST /api/enrollments` (repetir EVAL-NEW-001) | 409 | `enrollment_conflict` | `.../problems/enrollment-conflict` |
| Fecha de nacimiento futura | `POST /api/enrollments` (`birthDate:2030-01-01`) | 422 | `invalid_birth_date` | `.../problems/invalid-birth-date` |

**Bonus (no contado en los 15):** `POST /api/teachers/29/contracts` con `schoolIds:[2]` (contrato ya activo ahí) → **409**, `code:"teacher_contract_conflict"` — confirma reglas de negocio evaluadas contra estado real de BD, no una respuesta estática.

**CORS / preflight:**

```
OPTIONS http://localhost:5000/api/schools  (Origin: http://localhost:4200)
Access-Control-Allow-Methods: GET
Access-Control-Allow-Origin: http://localhost:4200
```
`node scripts/dev-check-backend.mjs` → health `GET /health` 200 `{"status":"ok"}`, preflight 204. PASS.

### Evidencia por pantalla (Componente → Facade → Servicio API → URL real → Método → operationId → Status → match)

| Pantalla | URL real capturada | Método | Status | Valor curl vs. pantalla |
| --- | --- | --- | --- | --- |
| `/student-search` | `:5000/api/enrollments?schoolId=2&gradeId=9&academicYearId=1` (+ `schools`/`grades`/`academic-years`) | GET | 200 | 4 filas exactas (EVAL-NEW-001, DEMO-EST-006, DEMO-EST-012, DEMO-EST-011) — match campo a campo |
| `/reports` (edad) | `:5000/api/reports/age-distribution?academicYearId=1` | GET | 200 | KPIs 8/9/8 — match (subida 8→9 en `age8To12` vs. Fase C por escritura intermedia, confirma dato vivo) |
| `/reports` (sector) | `:5000/api/reports/teacher-counts-by-sector` | GET | 200 | Público=4, Privado=3 — match |
| `/reports` (top schools) | `:5000/api/reports/top-schools?academicYearId=1` | GET | 200 | Central / Público / 11 — match (10→11 por escritura intermedia) |
| `/teacher-contracts` | `:5000/api/teachers/29/contracts` | GET | 200 | 3 contratos, mismo orden y campos que curl |
| `/student-history` (DEMO-EST-006) | `:5000/api/students/DNI/DEMO-EST-006/history` | GET | 200 | 3 años, incluidos `enrollmentId` #6/#26/#35 — match exacto |
| `/enrollments` (alta) | `:5000/api/enrollments` | POST | **201** | `enrollmentId:42`, `studentId:34` — match con lo enviado; round-trip 4→5 confirmado por re-curl |
| `/student-history` (error) | `:5000/api/students/DNI/NO-EXISTE-999/history` | GET | **404** | `title`/`detail` del problem+json coinciden verbatim con el texto en `history-error` |
| `/enrollments` (conflicto) | `:5000/api/enrollments` (duplicado EVAL-UI-001) | POST | **409** | alerta `enrollment-error`, formulario preservado, sin duplicado persistido (recount=5 sin cambio) |

**Nombres del seed real vs. nombres ficticios del mock (evidencia categórica de no-fabricación):**

| Fuente | Escuelas mostradas |
| --- | --- |
| Mock (`MockBackendInterceptor`, fixtures embebidas en el bundle) | "Escuela Río Claro", "Instituto Horizonte", "Colegio Pampa Azul" |
| Backend real (seed demo, vía curl y UI post-reset) | "Colegio Privado Horizonte", "Colegio Privado San Gabriel", "Colegio Público Central", "Colegio Público Distrital Norte", "North Learning Center" |

Los nombres no coinciden entre mock y seed real — la UI, tras el reset del harness (ver §3), mostró exclusivamente los nombres del seed real, nunca los del mock.

Capturas: `screen1-student-search.png`, `screen2-reports.png`, `screen3-teacher-contracts.png`, `screen4-student-history.png`, `screen5-enrollments-success.png`, `screen6-history-error.png`, `screen7-enrollments-conflict.png` (`scratchpad/screenshots/`).

En las 7 pantallas: cero requests `/api/*` a orígenes distintos de `localhost:5000`; cero errores de consola no explicados (los 2 únicos `console.error` registrados son el log nativo de Chromium para respuestas HTTP no-2xx en las pruebas negativas intencionales de Screens 6 y 7, no excepciones de la aplicación).

---

## 3. CAMBIOS Y VALIDACIONES

### Commit `10b3a705` — `fix(contract): approve current backend HEAD as verified successor`

**Qué:** se agregó `"8878e668790c01e110ac0de432d6be3189d1566f"` a `APPROVED_SUCCESSORS` en `src/app/scripts/verify-openapi-contract.mjs`, con comentario de procedencia siguiendo el estilo de la entrada existente.

**Por qué:** el allowlist estaba desactualizado (F4) — el HEAD actual del backend no figuraba, pese a que el árbol de contratos (`specs/001-school-enrollment-management/contracts`) es byte-idéntico (checksum combinado `802c13b9…` reproducido durante la planificación).

**Alternativas rechazadas:**
- *Checksum-primary* (aprobar por checksum sin allowlist) — descartada: elimina el gate de procedencia manual que el script está diseñado para forzar.
- *Ancestor-check* (auto-aprobar cualquier descendiente futuro del HEAD aprobado) — descartada: aprobaría automáticamente cualquier commit futuro del backend sin revisión, contradiciendo la intención de verificación manual del script.

`assertChecksum` sigue verificando el contenido byte a byte sin cambios. Ningún otro check (git-tracked, clean-tree, operationIds) fue tocado.

**Verificación (`npm run contract:verify`):**
```
✓ 10 archivos contractuales bajo seguimiento
✓ Directorio contractual limpio
✓ Commit autorizado: 8878e668790c01e110ac0de432d6be3189d1566f
✓ Checksum combinado verificado: 802c13b91bf5c6425d24c540b6841a2abe134e084ea310fc2b7041e32c24a81a
✓ 15 operationIds canónicos presentes
Contrato verificado correctamente.
```
PASS.

### Commit `050d14cd` — `test(e2e): assert history 404 renders explicit error state`

**Qué:** nuevo archivo `e2e/production/history-error-states.spec.ts`, intercepta `GET http://localhost:5000/api/students/*/*/history` con `route.fulfill({status:404, contentType:"application/problem+json", body:{...student_not_found...}})`, envía el formulario de historial y asserta `history-error` visible + `history-empty` ausente + sin violaciones axe.

**Por qué:** F3 — los caminos de error de `student-history` solo se ejercían contra mocks; faltaba un test CI-safe (route-interception) que fijara el comportamiento contra una respuesta 404 real.

**El incidente del harness (residual `addInitScript`):** la primera corrida del nuevo test falló el assert de "cero console.error" del fixture `monitoredPage`, no porque la app ocultara el 404, sino porque Chromium emite su propio `console.error` de devtools ("Failed to load resource…") para *cualquier* fetch/XHR no-2xx, independientemente de si la aplicación maneja el error correctamente. Ningún spec de producción existente había ejercido antes un `route.fulfill` con status no-2xx real (el test de "catalog failure" existente usa `status:200` con body malformado justamente para evitar este ruido). Se ajustó el fixture para permitir únicamente ese log de red específico, documentado y esperado (constante `EXPECTED_NETWORK_LOG` con comentario explicativo) — cualquier otro error/warning/pageerror real de la app sigue haciendo fallar el test. Tras el ajuste, el test pasó, confirmando que **no hay defecto de aplicación**: la app ya renderiza el 404 como error explícito, nunca como vacío silencioso. No se tocó código de aplicación.

**Diseño replicado del spec hermano** `e2e/production/production-mock-toggle.spec.ts`: fixture `monitoredPage`, helper `submitHistory`, helper `assertNoAxeViolations`, interceptación por URL absoluta contra `http://localhost:5000` (confirmado en `src/app/core/api/api-config.ts`: `DEFAULT_API_CONFIG.apiBaseUrl` no tiene override de producción).

### F1 / F2 — documentados, no tocados

- **F1** (`DEFAULT_API_CONFIG.apiBaseUrl` hardcodeado en `src/app/core/api/api-config.ts`): correcto para el alcance local auditado; no bloquea el consumo de datos reales ni oculta errores. **Sketch de remediación:** inyectar `apiBaseUrl` vía `environment.ts`/`environment.development.ts` (ya existe el mecanismo de `fileReplacements`) y resolverlo en `provide-api-http-client.ts`, análogo a como se resuelve `useMocks` hoy.
- **F2** (mappers sin validación de esquema en runtime): formas malformadas ya emergen como estados de error explícitos (probado por e2e existentes) — satisface el criterio "sin fallback silencioso"; no se requiere acción.

### Comandos ejecutados y resultados

| Comando | Resultado |
| --- | --- |
| `command npm run lint` (typecheck + eslint + prettier) | PASS |
| `command npm test` (unit) | PASS — 581 tests, 49 archivos |
| `command npm run build:production` | PASS |
| `command npm run e2e:mock -- e2e/frontend-remediation.spec.ts` | PASS — 27 passed, 1 skip preexistente (no relacionado) |
| `command npm run e2e:production` (suite completa, incl. test nuevo) | PASS — 10 passed |
| `command npm run contract:verify` | PASS (post commit `10b3a705`) |

Ningún path bajo `.atl/`, `.superpowers/`, `openspec/`, `coverage/`, `playwright-report*/` o `test-results/` fue staged en ninguno de los dos commits.

---

## 4. BLOQUEOS

**Ninguno definitivo.**

Bloqueos transitorios detectados y resueltos durante la puesta en marcha del stack local (limpieza de residuos propios del proyecto, sin tocar contenedores ajenos como `sonarqube`/`shoppipai-sonar-db`):

1. **Proceso `Inovait.Api` residual** (PID de una corrida anterior) ocupando el puerto 5000, con estado de BD contaminado/no determinista (5 escuelas incluyendo una "North Learning Center" con id=1 fuera de lugar). Acción: `kill` del proceso residual; confirmado muerto.
2. **Contenedor y volumen SQL Server obsoletos** con password de `sa` desincronizado: el contenedor previo había inicializado `master` con una contraseña distinta a la generada en el nuevo intento de bring-up (`MSSQL_SA_PASSWORD` solo aplica en la primera inicialización del volumen). Resultado: healthcheck fallando con `Login failed for user 'sa'`. Acción: `docker stop`/`rm` del contenedor + `docker volume rm` del volumen nombrado (`inovait-backend_inovait-sql-data`); reintento único de bring-up completo según el protocolo de limpieza de residuos — éxito en el segundo intento.

Ninguna contraseña, cadena de conexión ni variable de entorno fue registrada en la evidencia.

---

## 5. CONCLUSIÓN

Las 15 rutas del contrato, los 3 casos negativos RFC7807 y los round-trips de escritura (API 3→4, UI 4→5) fueron verificados contra el backend .NET real y coinciden campo a campo con lo mostrado en las 7 pantallas auditadas, sin fallback a mocks ni datos estáticos en la configuración de producción. Los hallazgos F1 y F2 quedan documentados sin impacto en el consumo de datos reales, F3 fue cerrado con test de regresión, y F4 fue corregido y verificado (`contract:verify` PASS); no quedan bloqueos abiertos.

La interfaz consume datos reales del backend .NET.
