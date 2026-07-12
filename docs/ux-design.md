# Diseño UX: gestión escolar municipal

## Dirección y lenguaje

Interfaz institucional sobria, de alta legibilidad y densidad controlada: fondo claro, superficies delimitadas, tipografía de lectura y un color de acento reservado para acciones/foco. No usa gradientes decorativos, animaciones intensas ni gráficos complejos.

La identidad visual toma como referencia el template **EduCore**: paleta, tipografía y forma se retargetearon a sus valores sobre la UX ya especificada en este documento, sin reescribir pantallas ni flujos. `@angular/material` y `@angular/cdk` están instalados pero no se usan — los controles, la jerarquía y los mensajes son propios (HTML nativo + los primitivos `.ec-*` de abajo).

El copy visible se planifica en español neutro porque la evaluación y las personas operadoras objetivo son hispanohablantes. Esta es una elección contextual de producto; routes, componentes, servicios, métodos, DTO, enums y JSON permanecen en inglés.

### Tokens (`src/styles.scss`)

Custom properties (`--app-*`) en `:root`; única fuente de verdad, consumida por el shell y las cinco pantallas.

| Rol | Tokens | Valor |
| --- | --- | --- |
| Superficie | `--app-bg` / `--app-header-bg` | `#f7f8f4` / `#ffffff` |
| Texto | `--app-text` / `--app-muted` / `--app-text-alt` / `--app-text-tertiary` | `#172033` / `#475467` / `#344054` / `#98a2b3` |
| Borde | `--app-border` / `--app-border-soft` / `--app-border-subtle` | `#d7dce5` / `#e4e7ec` / `#eef0f4` |
| Acento | `--app-accent` | `#3949ab` |
| Semánticos | `--app-success` / `--app-error` / `--app-warning` / `--app-info` (+ variantes `-soft`) | `#18794e` / `#b42318` / `#7a4e0c` / `#1849a9` |
| Marca EduCore | `--app-primary` / `--app-sidebar-bg` / `--app-sidebar-active` | `#14213d` / `#14213d` / `#22325a` |
| Acento secundario | `--app-accent-teal` / `--app-teal-bright` | `#147d78` / `#4fd1c7` |
| Espaciado | `--app-space-1`…`--app-space-6` (consumidos) / `--app-space-7` / `--app-space-8` (reservados, completan la escala 8-pt) | `4px`…`32px` / `40px` / `48px` |

`--app-muted` (`#475467`) es el gris de texto secundario más usado en toda la app — encabezados de tabla, ayudas, leyendas — y es uno de los tres literales que el contrato de a11y (`src/app/a11y/`) verifica que existan en la hoja global.

**Forma**: `--app-radius-card: 16px` (tarjetas/KPIs), `--app-radius-alert: 14px` (alertas), `--app-radius-control: 10px` (botones/campos), `--app-radius-pill: 999px` (chips, segmented, year-chip).

**Tipografía**: Manrope (`--app-font-heading`, encabezados) e Inter (`--app-font-body`, cuerpo), autohospedadas vía `@fontsource/manrope` y `@fontsource/inter` — sin CDN externo.

**Iconografía**: `app-icon` (`src/app/layout/educore-shell/app-icon.component.ts`) renderiza SVG inline por nombre; siempre `aria-hidden="true"` + `focusable="false"` porque cada uso va acompañado de texto visible que sigue siendo el nombre accesible del control.

### Primitivos compartidos (`.ec-*`)

Clases globales en `styles.scss`, reutilizadas por el shell y las cinco pantallas — no se redefinen por feature:

| Primitivo | Uso |
| --- | --- |
| `.ec-card` | Contenedor de superficie base (formularios, paneles de éxito, KPIs). |
| `.ec-btn` (`--primary` / `--secondary` / `--outline`) | Botones de acción; `[aria-busy="true"]` gana sobre `:disabled` por orden de declaración. |
| `.ec-field` | Envoltorio label + control de formulario. |
| `.ec-alert` (`--success` / `--error` / `--warning` / `--info`) | Estados de feedback (loading/error/empty/éxito/stale) con icono `app-icon` + texto. |
| `.ec-table` | Tablas de resultados con encabezado sticky. |
| `.ec-badge` (`--status` / `--temporal`) | Par de familias de badge visualmente distintas (rectángulo vs. píldora) para no confundir un estado persistido con uno temporal, incluso sin color. |
| `.ec-legend` | Leyenda que explica los tonos de `.ec-badge` junto a la tabla que los usa. |
| `.ec-chip-toggle` | Checkbox nativo estilizado como píldora seleccionable (multiselección de escuelas). |
| `.ec-segmented` | Riel de navegación interna / toggle de dos vías. Definido para uso general; las pestañas de Reportes NO lo usan — son un `role=tablist` bespoke (`.reports-shell-tab`, ver Pantalla 4). |
| `.ec-kpi` (`--featured`) | Tarjeta de métrica destacada; `--featured` invierte a la superficie primaria para el valor más relevante del grupo. |

## Navegación y shell

Orden constante:

1. **Matrículas** (`/enrollments`)
2. **Consulta de estudiantes** (`/student-search`)
3. **Contratos docentes** (`/teacher-contracts`)
4. **Reportes** (`/reports`, P1 habilitado solo tras P0)
5. **Historial del estudiante** (`/student-history`, P1 habilitado solo tras P0; se llega también desde consulta de estudiantes)

El shell (`app.component.html`) es un riel de navegación fijo (`.ec-rail`, 264px, superficie `--app-sidebar-bg`) con marca, `nav[aria-label="Navegación principal"]` (ítem activo vía `aria-current="page"`, marcado también con un acento visual además del color) y una nota de pie. La columna principal tiene una barra superior (`.ec-topbar`, sticky) con el título de sección y un chip informativo del año académico vigente, y un `footer` con el resumen de disponibilidad de rutas P1.

Bajo 1024px el riel se convierte en un drawer off-canvas: se oculta con `transform`, un botón `.ec-hamburger` (`aria-expanded`, `aria-label="Abrir menú de navegación"`) lo revela, y un scrim (`aria-hidden`) permite cerrarlo tocando fuera. El resto del documento (`main`, `footer`, la propia barra) queda `inert` mientras el drawer está abierto. El shell incluye además "Saltar al contenido", un único `h1` y una región polite estable para navegación SPA.

| Ruta | `document.title` |
| --- | --- |
| `/enrollments` | `Matrículas · EduCore` |
| `/student-search` | `Consulta de estudiantes · EduCore` |
| `/teacher-contracts` | `Contratos docentes · EduCore` |
| `/reports` | `Reportes · EduCore` |
| `/student-history` | `Historial del estudiante · EduCore` |

Al completar cualquier navegación SPA, el shell actualiza el título, enfoca una
sola vez el `h1` con `tabindex="-1"` y anuncia el mismo nombre en la región
polite. Las cargas, resultados y errores dentro de la ruta usan sus regiones de
estado y no vuelven a aplicar esta política ni mueven foco por sí solos.

## Reglas transversales

- Tab sigue orden visual; Enter/Space activan elementos nativos; Escape cierra menú/dialog controlado sin perder foco.
- Foco visible con contraste ≥ 3:1, área mínima 24×24 CSS px y objetivo recomendado 44×44 en móvil.
- Labels persistentes, instrucciones y errores enlazados con `aria-describedby`; placeholder no sustituye label.
- Submit inválido enfoca el primer control erróneo; un error remoto general enfoca el resumen solo después de submit.
- `role="status"` anuncia carga, resultados y éxito; `role="alert"` anuncia error. No se superponen mensajes contradictorios.
- Estado, sector y errores usan texto/icono además de color.
- Confirmaciones son banners inline descartables, no modales ni snackbars fugaces. No mueven foco salvo reset exitoso solicitado.
- A 200 % zoom no hay scroll horizontal de página. Tablas se convierten en tarjetas semánticas en viewport estrecho sin ocultar campos/acciones; `display:none` o render condicional excluye completamente la representación inactiva del árbol accesible y del orden de foco.
- Los catálogos `School`, `Grade`, `AcademicYear` y `Teacher` muestran un único estado loading/error/empty/success. Error incluye “Reintentar”; empty explica la ausencia y no se confunde con un selector deshabilitado por dependencia.

## Pantalla 1 — Matrículas

### Wireframe escritorio

```text
┌ Navegación ───────┬─────────────────────────────────────────────┐
│ Matrículas ●      │ h1 Nueva matrícula                         │
│ Consulta          │ “Los campos con * son obligatorios.”       │
│ Contratos         │                                             │
│ Reportes          │ [Datos del estudiante]                      │
│                   │ Tipo doc.*  Número*                         │
│                   │ Nombres*    Apellidos*                      │
│                   │ Fecha de nacimiento*                        │
│                   │                                             │
│                   │ [Contexto académico]                        │
│                   │ Escuela* → Año* → Grado* → Grupo*           │
│                   │ (razón visible si un control está inactivo) │
│                   │                                             │
│                   │ [Resumen/error] [Guardar matrícula]         │
└───────────────────┴─────────────────────────────────────────────┘
```

### Comportamiento

- Campos: `documentType`, `documentNumber`, `firstNames`, `lastNames`, `birthDate`, `schoolId`, `academicYearId`, `gradeId`, `classGroupId`.
- Escuela habilita Año; Año habilita Grado; Grupo se habilita solo con los tres anteriores y muestra “Cargando grupos…” o “No hay grupos para esta combinación”. Los catálogos globales pueden estar precargados, pero el control descendiente permanece inactivo hasta completar el superior.
- Cambiar Escuela limpia Año, Grado y Grupo; cambiar Año limpia Grado y Grupo; cambiar Grado limpia Grupo. Opciones/resultados descendientes se invalidan antes de volver a cargar y nunca se presenta una petición obsoleta.
- Si una referencia cargada queda obsoleta y el backend la rechaza, se marca el selector afectado, se descartan opciones dependientes y se ofrece “Recargar opciones”; no se conserva como selección válida.
- Validación local: requeridos, longitudes canónicas, fecha legible y no futura. No intenta resolver identidad ni inscripción anual.
- Durante POST: botón “Guardando…” deshabilitado y estado anunciado. Se conserva el form ante 400/404/409/422.

### Errores y éxito

| Respuesta | Presentación |
| --- | --- |
| 400 | errores de forma junto a campos; resumen para claves desconocidas |
| 404 | referencia ya no disponible; marca selector y ofrece “Recargar opciones” |
| 409 | “La matrícula entra en conflicto con la identidad o historia existente”; sin sugerir sobrescritura |
| 422 | regla semántica contextual, por ejemplo grupo incompatible o fecha futura remota |
| 201 nuevo | “Estudiante y matrícula creados correctamente.” |
| 201 reutilizado | “Se reutilizó el estudiante existente y se creó la matrícula.” |

Tras 201, el banner permanece visible, se limpia toda información personal/académica, submit vuelve a quedar deshabilitado y el foco retorna a “Tipo de documento”. Esto evita reenvío accidental.

El panel de éxito usa `.ec-card` con un encabezado `.ec-alert--success` (icono `check_circle`) seguido de una lista de definición (`dl`) con los identificadores de matrícula/estudiante — no un banner de una sola línea.

### Móvil

Una columna; fieldsets apilados; submit ancho completo al final, no sticky. Los select se abren sin ocultar label. Mensaje de dependencia aparece antes del control inactivo.

## Pantalla 2 — Consulta de estudiantes

### Wireframe

```text
┌────────────────────────────────────────────────────────────────┐
│ h1 Consulta de estudiantes                                    │
│ Escuela* [________] Grado* [____] Año académico* [____]        │
│ Fecha de referencia (opcional) [____] [Buscar]                 │
│ ─ Resultados (región viva) ─────────────────────────────────── │
│ Documento | Estudiante | Edad | Escuela | Grado | Grupo | Año │
│ ...                                                   [Hist.]  │
└────────────────────────────────────────────────────────────────┘
```

Filtros obligatorios: Escuela, Grado y Año académico. `asOfDate` es opcional. Al cambiar un filtro, los resultados dejan de presentarse como vigentes hasta una nueva búsqueda: se anuncia con un banner `.ec-alert--warning` (icono `update`, `data-testid="search-stale"`) sobre la tabla existente, que sigue visible pero marcada como desactualizada hasta la próxima búsqueda.

Estados exclusivos:

- `idle`: instrucción para completar filtros;
- `invalid`: botón deshabilitado y razón visible;
- `loading`: “Buscando estudiantes…” y tabla marcada ocupada;
- `empty`: “No hay matrículas para los filtros seleccionados.”;
- `noGroups`: `listClassGroups` devolvió `200 []`; “La combinación es válida, pero no tiene grupos.” y no se solicita una lista de matrículas inútil;
- `error`: mensaje y “Reintentar”;
- `success`: tabla completa en orden recibido.

Cualquier combinación de Escuela, Grado y Año existentes es consultable. Si no
hay grupos o matrículas, la UI muestra `noGroups` o `empty` a partir de respuestas
`200`; nunca presenta “combinación incompatible” ni espera `422`. Un `404` indica
una referencia inexistente. `422` se presenta solo cuando la operación canónica
lo declara para otra regla semántica, por ejemplo una fecha de reporte inválida.

Los catálogos de Escuela, Grado y Año aplican la misma exclusividad y reintento.
Un fallo de catálogo no se representa como resultado de búsqueda vacío.

Columnas: Documento, Estudiante, Edad, Escuela, Grado, Grupo, Año y Acciones. “Ver historial” tiene nombre accesible que incluye al estudiante y navega con un token opaco `selection`; la identidad documental queda únicamente en un handoff volátil en memoria y nunca forma parte de la URL ni del estado del historial del navegador.

En móvil, cada fila se vuelve `article` con pares término/valor (`dl`) y acción al final. No se omite ningún dato. Los filtros académicos no sensibles viven en la query de `/student-search`, por lo que Back restaura formulario y resultados sin serializar filas ni identidad; no se fuerza scroll inesperado.

## Pantalla 3 — Contratos docentes

### Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ h1 Contratos docentes                                       │
│ Docente* [____________________]                              │
│ Escuelas* [multiselección con chips removibles]              │
│ Inicio* [____]  Fin (opcional) [____] [Crear contratos]      │
│ [resultado atómico / error]                                  │
│ ─ Contratos existentes del docente ───────────────────────── │
│ Escuela | Sector | Inicio | Fin | Estado | Vigencia al ...   │
└──────────────────────────────────────────────────────────────┘
```

- Selector de docente precargado; multiselect de una o más escuelas, sin duplicados.
- Fecha fin opcional; si existe, fin ≥ inicio. Se explica “Sin fecha de fin” para intervalo abierto.
- Una sola confirmación envía todas las escuelas. Durante POST no se puede reenviar.
- 201 anuncia cantidad creada y recarga la tabla. Un error dice “No se creó ningún contrato” y conserva selección/fechas.
- Superposición en escuelas distintas no se marca como error local; el backend decide conflictos por docente/escuela.
- El catálogo de docentes y escuelas, y la lista contractual del docente, tienen
  estados loading/error/empty/success independientes y exclusivos. Cada error
  ofrece reintento; una lista anterior deja de presentarse como vigente al
  cambiar docente o detectar un catálogo obsoleto.

La tabla muestra por separado:

- **Estado registrado**: Confirmado/Cancelado (`persistedStatus`).
- **Vigencia al {evaluatedAt}**: Próximo/Vigente/Vencido/Cancelado (`effectiveStatus`).

No se infiere uno del otro. Sector se presenta como Pública/Privada. Fin nulo se muestra “Sin fecha de fin”. En móvil, cada contrato es tarjeta con ambos estados etiquetados, nunca badges solo por color.

Cada estado se presenta con `.ec-badge` de una de dos familias visualmente distintas — `--status` (rectángulo, registrado) y `--temporal` (píldora, vigencia) — para que la forma, no solo el color, distinga qué se está mostrando. Una `.ec-legend` junto a la tabla explica el significado de cada tono.

## Pantalla 4 — Reportes

Reportes es P1 y no se considera disponible hasta validar P0. Un único `h1` y tres reportes independientes conmutados por pestañas ARIA — valores exactos por filtro, no charts. La Historia documental (BQ-005) ya no vive aquí: es la Pantalla 5 dedicada, alcanzable desde Consulta de estudiantes.

### Wireframe

```text
┌───────────────────────────────────────────────────────────────┐
│ h1 Reportes operativos                                        │
│ "Consulte los reportes operativos de matrícula y planta        │
│  docente. Seleccione una pestaña para ver un reporte a la vez."│
│ ┌ tablist ─────────────────────────────────────────────────┐  │
│ │ [Distribución por edad*][Docentes por sector][Escuelas    │  │
│ │  líderes]                                                  │  │
│ └─────────────────────────────────────────────────────────┘  │
│ ┌ tabpanel activo — los otros dos siguen montados, [hidden] ┐ │
│ │ Año* Escuela? Grado? Fecha? [Consultar] [Limpiar filtros] │ │
│ │ * Campo obligatorio.                                       │ │
│ │ idle → “Completa los filtros y consulta el reporte.”      │ │
│ │ success → [3–7: 4][8–12: 6][>12: 2] · Referencia 10/07/26 │ │
│ └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### Navegación entre reportes

- El shell (`ReportsShellComponent`) expone un único `role=tablist` etiquetado por el `h1` (`aria-labelledby="reports-title"`) con tres botones `role=tab`: **Distribución por edad**, **Docentes por sector**, **Escuelas líderes**.
- Activación manual (patrón WAI-ARIA APG): `ArrowRight`/`ArrowLeft`/`Home`/`End` solo mueven el foco entre pestañas; `aria-selected` y el panel visible cambian únicamente con Enter, Espacio o click. Tabindex circulante — la pestaña activa expone `tabindex="0"`, el resto `tabindex="-1"` — así Tab entra/sale del tablist en un solo salto.
- Cada reporte vive en su propio `role=tabpanel` (`#age-report`, `#sector-report`, `#top-schools-report`), etiquetado por su pestaña (`aria-labelledby="tab-{id}"`). Solo un panel es visible a la vez vía `[hidden]` — nunca `@if`/render condicional — porque los tres permanecen montados en el DOM para conservar formulario, resultados y error de cada reporte al alternar de pestaña.
- La pestaña activa se persiste en el fragmento de la URL (`#age-report` / `#sector-report` / `#top-schools-report`): sostiene deep-link directo a un reporte y back/forward del navegador sin perder la selección.
- En móvil, el propio riel de pestañas gana scroll horizontal (`overflow-x: auto`, cada pestaña `flex: 0 0 auto`); la página nunca gana scroll horizontal.

### Los tres reportes

Cada reporte tiene su propio `form`, encabezado y estados `idle`/`loading`/`error`/`success` (y `empty` solo donde aplica) exclusivos entre sí. Cambiar de pestaña no borra resultados de otro reporte ni comparte filtros implícitamente.

- **Distribución por edad** (BQ-001/BQ-002): filtros Año académico*, Escuela, Grado, Fecha de referencia. Idle: “Completa los filtros y consulta el reporte.” Tarjeta destacada 3–7 para BQ-001 y tabla/tarjetas de los tres buckets para BQ-002; muestra `asOfDate` devuelta y ceros explícitos. Toda combinación de año y filtros School/Grade existentes es válida; sin grupos o inscripciones el reporte sigue en `success` con ceros, nunca `empty` ni `422`.
- **Docentes por sector** (BQ-003): período completo o ninguno. Si se completa solo un extremo, ese campo gana `aria-required` dinámico y un mensaje inline `.ec-field-error` enlazado vía `aria-describedby`; si ambos extremos están definidos y fin < inicio, un segundo mensaje inline bloquea el submit local sin impedir que el backend aplique su propia regla canónica. Idle: “Completa el período y consulta el reporte. Sin período, se usa la fecha actual.” Cards Pública/Privada siempre visibles, incluidos ceros; copy aclara “docentes distintos”. Nunca `empty`.
- **Escuelas líderes** (BQ-004): filtro Año académico* únicamente. Idle: “Elige un año académico y consulta el reporte.” Tabla simple; todos los empates se conservan y un año existente sin inscripciones produce `200 []` → estado `empty` informativo con botón “Reintentar” (además del que ofrece el estado `error`).

Los campos obligatorios marcan su label con `.ec-required-mark` (asterisco `aria-hidden`, redundante con `aria-required`/`required` del control) y, donde corresponde, el formulario cierra con la nota `.ec-required-note` (“* Campo obligatorio.”). “Limpiar filtros” resetea formulario y estado remoto del reporte activo, sin tocar los otros dos.

Los valores de cada reporte se presentan como tarjetas `.ec-kpi`; el bucket o valor más relevante de cada resultado (por ejemplo 3–7 años en BQ-001) usa `.ec-kpi--featured`, que invierte a la superficie primaria en vez de depender solo de su tamaño para destacar.

En móvil, cada reporte apila filtros, estado y resultados en una sola columna bajo su pestaña activa. Las cifras usan texto y label; no dependen de posición/color.

## Pantalla 5 — Historial del estudiante

### Wireframe

```text
┌───────────────────────────────────────────────────────────────┐
│ [Volver a consulta]  h1 Historial del estudiante              │
│ Ana María Solís — DNI 99.001.101 — Nacimiento 10/07/2018      │
│ ┌ Año 2026 — Escuela Río Claro — Grado 1 — Grupo A ┐          │
│ │ Materia | Docente | Días                           │          │
│ │ Matemática | Lucía Benítez | Lun, Mié, Vie         │          │
│ └────────────────────────────────────────────────────┘          │
│ ┌ Año 2025 ... “Sin asignaciones docentes registradas.” ┐      │
└───────────────────────────────────────────────────────────────┘
```

Loading usa skeleton/texto sin perder `h1`. 404 presenta “No se encontró el estudiante” y enlace para corregir documento. Cada año permanece visible aunque `teachingAssignments` sea vacío. Múltiples docentes, materias y días se muestran sin colapsar relaciones. Los días 1–7 se localizan para display sin cambiar valores del DTO.

Los años se listan como una línea de tiempo semántica: una `ol` (`.history-list`) con un `li.history-entry` por año, cada uno con un `<time datetime="…">` legible y un `.ec-badge--current`/`.ec-badge--closed` que distingue el año en curso de años anteriores.

En móvil, cada año es sección y cada asignación tarjeta. “Volver” usa historial del Router cuando es seguro y conserva nombre accesible.

## Flujo de teclado y foco

| Acción | Resultado de foco |
| --- | --- |
| entrar a cualquier ruta | actualizar título, enfocar una vez el `h1` y anunciarlo en la región polite |
| submit inválido | primer campo inválido; resumen permanece enlazado |
| carga iniciada | foco permanece en acción; `role=status` anuncia |
| error remoto | resumen recibe foco programático una vez; datos se conservan |
| alta de matrícula exitosa | primer campo después del reset |
| contratos creados | foco permanece en banner/acción; tabla se anuncia, sin salto |
| abrir historial | aplica la misma política global de título, `h1` y anuncio |
| menú móvil cerrado | vuelve al botón que lo abrió |

## Checklist WCAG 2.2 AA

- Semántica: landmarks, `h1` único, jerarquía, fieldsets/legends y tablas con headers.
- Percepción: contraste 4.5:1 texto, 3:1 componentes/foco; iconos decorativos ocultos; estado no solo color.
- Operación: teclado completo, sin traps, foco no oculto, targets ≥ 24×24.
- Comprensión: labels/instrucciones, errores específicos, navegación/copy consistente y no reingreso tras éxito accidental.
- Robustez: controles nativos con nombres accesibles, live regions estables y DOM ordenado.
- Responsive: 320 CSS px y 200 % zoom sin pérdida de información; cards sustituyen tablas cuando es necesario.
- Representación: solo tabla o tarjetas está expuesta/enfocable en cada breakpoint.
- Movimiento: transiciones mínimas y respeto de `prefers-reduced-motion`.
