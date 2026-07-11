# Investigación técnica frontend

## Resultado

Se seleccionan Angular `21.2.18`, Angular CLI `21.2.19`, TypeScript `5.9.3`, RxJS `7.8.2` y Angular Material/CDK `21.2.14`. Angular 21 está en LTS, funciona con Node `24.11.1` y mantiene el runner oficial Vitest. Angular 22 es estable y activo, pero no es compatible con el Node instalado porque exige Node `^24.15.0` en la rama 24.

## Evidencia del entorno

El 2026-07-10 se ejecutaron solo inspecciones:

```text
node --version  -> v24.11.1
npm --version   -> 11.6.2
```

El OpenAPI canónico es `3.1.0`, API `1.0.0`. El baseline autorizado es el commit
backend `1223630ab99bf1bfaa4f5919fccf5ff539379c8e`. Su checksum SHA-256
combinado, calculado sobre `openapi.yaml`, cuatro archivos `paths` y cinco
archivos `components` en el orden documentado, es
`802c13b91bf5c6425d24c540b6841a2abe134e084ea310fc2b7041e32c24a81a`; los diez
YAML están versionados en ese commit.

## Decisiones

### Plataforma y versiones

**Decisión**: framework Angular `21.2.18`, CLI `21.2.19`, TypeScript `5.9.3`, RxJS `7.8.2`, Material/CDK `21.2.14`.

**Fundamento**: Angular 21 admite Node `^20.19.0 || ^22.12.0 || ^24.0.0`, está en LTS y su documentación versionada confirma Vitest para proyectos nuevos. Material y CDK comparten versión exacta y política de soporte con Angular; sus peer dependencies aceptan Angular 21. Las diferencias de patch entre CLI, framework y Material corresponden a los últimos patches publicados de cada paquete dentro del mismo major compatible.

**Alternativas consideradas**:

- Angular 22: última major activa, pero requiere Node `^22.22.3 || ^24.15.0 || ^26.0.0`; Node `24.11.1` no cumple. Actualizar Node solo para elegirla agrega riesgo y está fuera de esta planificación.
- Angular 20: compatible y en LTS hasta 2026-11-28, pero tiene una ventana restante menor para una aplicación nueva.
- Versiones preview: descartadas por estabilidad.

### Runner de pruebas

**Decisión**: conservar la configuración predeterminada Angular CLI 21 con Vitest y `jsdom`.

**Fundamento**: la guía oficial de Angular 21 declara Vitest como runner predeterminado y `ng test` como comando integrado. `TestBed`, `HttpTestingController` y Material Harnesses cubren formularios, HTTP y componentes sin configurar Karma.

**Alternativas consideradas**: Jasmine/Karma sigue soportado, pero ya no es el valor predeterminado y la nota del README es anterior a la decisión verificada. Configurar otro runner no aporta valor al MVP.

### Playwright

**Decisión**: no incluir Playwright ni un script E2E en el P0 comprometido.
Ejecutar el walkthrough P0 manual y pruebas de componente/HTTP. Una adopción
posterior requiere un cambio aprobado después de la puerta P0.

**Fundamento**: browser binaries, configuración y estabilización consumen una fracción desproporcionada del día. Los riesgos principales se prueban más rápido en Vitest; el recorrido real contra backend sigue documentado.

**Alternativas consideradas**: tres E2E P0 ofrecen confianza de integración superior, pero pueden desplazar pruebas de reglas y accesibilidad. Usar Playwright como browser provider de Vitest tampoco reemplaza un E2E completo.

### Estado y asincronía

**Decisión**: Signals locales para `RemoteState`, filtros y selección; RxJS para peticiones, `switchMap`, cancelación y composición. No usar NgRx.

**Fundamento**: ninguna selección debe sobrevivir a la ruta ni coordinar features simultáneamente. El estado local evita boilerplate; `switchMap` y una clave de contexto impiden que respuestas obsoletas reemplacen opciones vigentes.

**Alternativas consideradas**: NgRx/global store agrega acciones, reducers y selectors sin necesidad transversal. Signals sin RxJS dificultan cancelación y composición de `HttpClient`.

### Frontera API y generación

**Decisión**: DTO manuales estrictos y separados de form/view models, creados por
fase y conservando camelCase. Antes de la puerta se modelan los nueve consumidores
P0; después se agregan los cuatro consumidores P1 hasta totalizar 13. Las 15 operaciones se
verifican contractualmente; `listSubjects` y `listTeachersBySchool` no generan
métodos frontend hasta que exista un consumidor UI real. No generar cliente ni
copiar OpenAPI en esta fase.

`CreateEnrollmentResponseDto` se declara como forma independiente del schema
canónico, no como extensión/intersección de `EnrollmentListItemDto`. Conserva
`studentReused`; list nunca lo contiene. Los reportes mantienen propiedades fijas
y nullability exacta, y contratos mantienen `evaluatedAt` requerido.

**Fundamento**: el contrato es pequeño y la jornada no justifica instalar/gobernar un generador con referencias YAML externas. Los servicios mantienen rutas en un único lugar, los mappers verifican campos críticos y la coordinación usa versión, commit y checksum.

**Alternativas consideradas**: un cliente generado reduce deriva nominal, pero introduce tooling, artefactos voluminosos y revisión adicional. Tipos inline en componentes se descartan porque mezclan transporte y vista.

**Mitigación de deriva**: comprobar API `1.0.0`, el commit exacto
`1223630ab99bf1bfaa4f5919fccf5ff539379c8e` o un sucesor aprobado
explícitamente, los diez archivos bajo seguimiento, el directorio contractual
clean y el checksum aprobado coincidente
(`802c13b91bf5c6425d24c540b6841a2abe134e084ea310fc2b7041e32c24a81a` para el
baseline actual).
Cualquier diferencia debe fallar antes de revisar DTO, operaciones y pruebas.
Una automatización futura puede consumir un artefacto publicado por backend,
nunca mantener una copia editable local.

### Interceptor funcional de errores

**Decisión**: `problemDetailsInterceptor` funcional para errores de red, contenido no reconocible y normalización de `ProblemDetails`; preserva `status`, `code`, `detail` y `errors` íntegros.

**Fundamento**: elimina manejo repetido de transporte, pero deja a cada formulario decidir cómo mapear claves del backend a controles. El interceptor no muestra UI, no traduce reglas de negocio y no convierte todos los fallos en un mensaje genérico.

**Alternativas consideradas**: manejar `HttpErrorResponse` en cada servicio duplica lógica. Un servicio global de notificaciones ocultaría errores de campo y movería foco de forma impredecible.

### UI, accesibilidad y lenguaje

**Decisión**: Material/CDK con tema institucional de alto contraste, formularios directos y tablas/tarjetas simples. La prosa de planificación y las anotaciones UX usan español neutro; el copy visible también usa español por el contexto de evaluación y operadores hispanohablantes. Identificadores técnicos permanecen en inglés.

**Fundamento**: la elección contextual de copy mejora comprensión sin alterar contratos en inglés. Material aporta componentes y harnesses maduros, pero semántica, foco, instrucciones y estados siguen siendo responsabilidad de la aplicación.

**Alternativas consideradas**: otra biblioteca UI duplica capacidades; una interfaz ornamental o con animaciones intensas reduce claridad y puede afectar accesibilidad.

### Configuración y CORS

**Decisión**: exponer `API_BASE_URL` mediante un `InjectionToken` configurado desde `environment.apiBaseUrl`; valor local previsto `http://localhost:5000`. No contiene secretos. El backend deberá admitir explícitamente el origen local del frontend.

**Fundamento**: desacopla servicios del host y permite reemplazo por entorno sin introducir runtime config complejo para el MVP.

## Fuentes consultadas

- [Compatibilidad oficial de Angular](https://angular.dev/reference/versions), consultada 2026-07-10.
- [Política y calendario oficial de Angular](https://angular.dev/reference/releases), consultada 2026-07-10.
- [Testing oficial Angular 21](https://v21.angular.dev/guide/testing), Vitest predeterminado.
- [Angular Components 21.2.14](https://github.com/angular/components/tree/21.2.14), soporte y Material Harnesses.
- Metadatos oficiales npm de `@angular/core`, `@angular/cli`, `@angular/material`, `@angular/cdk`, `typescript` y `rxjs`, consultados sin instalar paquetes.
- OpenAPI y documentación canónica de `../inovait-backend/specs/001-school-enrollment-management/`.
