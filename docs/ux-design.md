# Diseño UX: gestión escolar municipal

## Dirección y lenguaje

Interfaz institucional sobria, de alta legibilidad y densidad controlada: fondo claro, superficies delimitadas, tipografía de lectura y un color de acento reservado para acciones/foco. No usa gradientes decorativos, animaciones intensas ni gráficos complejos. Angular Material aporta controles; la jerarquía, semántica y mensajes son propios.

El copy visible se planifica en español neutro porque la evaluación y las personas operadoras objetivo son hispanohablantes. Esta es una elección contextual de producto; routes, componentes, servicios, métodos, DTO, enums y JSON permanecen en inglés.

## Navegación y shell

Orden constante:

1. **Matrículas** (`/enrollments`)
2. **Consulta de estudiantes** (`/student-search`)
3. **Contratos docentes** (`/teacher-contracts`)
4. **Reportes** (`/reports`, P1 habilitado solo tras P0)

El shell incluye “Saltar al contenido”, `nav` con `aria-label="Navegación principal"`, `aria-current="page"`, un único `h1` y una región polite estable para navegación SPA. Escritorio usa barra lateral compacta; móvil usa encabezado y menú, sin cambiar orden ni nombres.

| Ruta | `document.title` |
| --- | --- |
| `/enrollments` | `Nueva matrícula — Inovait` |
| `/student-search` | `Consulta de estudiantes — Inovait` |
| `/teacher-contracts` | `Contratos docentes — Inovait` |
| `/reports` | `Reportes municipales — Inovait` |
| `/student-history` | `Historial del estudiante — Inovait` |

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

Filtros obligatorios: Escuela, Grado y Año académico. `asOfDate` es opcional. Al cambiar un filtro, los resultados dejan de presentarse como vigentes hasta una nueva búsqueda.

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

## Pantalla 4 — Reportes

Reportes es P1 y no se considera disponible hasta validar P0. Usa secciones con filtros propios y valores exactos; no hay charts.

### Wireframe

```text
┌─────────────────────────────────────────────────────────────┐
│ h1 Reportes municipales                                    │
│ [Distribución por edad — BQ-001/BQ-002]                     │
│ Año* Escuela? Grado? Fecha? [Consultar]                     │
│ [3–7: 4] [8–12: 6] [>12: 2]  Referencia: 10/07/2026       │
│ [Docentes por sector — BQ-003]                              │
│ Período opcional completo [Consultar] [Pública: 3][Privada:2]│
│ [Escuelas líderes — BQ-004] Año* [Consultar]                │
│ Escuela | Sector | Matrículas (incluye todos los empates)   │
│ [Historia — BQ-005] Tipo doc.* Número* [Consultar]          │
└─────────────────────────────────────────────────────────────┘
```

Cada bloque tiene su propio `form`, encabezado, status y error. Consultar un bloque no borra resultados de otros, pero tampoco comparte filtros implícitamente.

- Edad: tarjeta destacada 3–7 para BQ-001 y tabla/tarjetas de los tres buckets para BQ-002; muestra `asOfDate` devuelta y ceros explícitos. Toda combinación de año y filtros School/Grade existentes es válida; sin grupos o inscripciones devuelve `200` con ceros, no `422`.
- Sector: período completo o ninguno; cards Pública/Privada siempre visibles, incluidos ceros; copy aclara “docentes distintos”.
- Líderes: tabla simple; todos los empates y un año existente sin inscripciones produce `200 []` con estado vacío informativo.
- Historia: permite consulta documental directa y enlaza a la pantalla dedicada.

En móvil, report cards se apilan. Las cifras usan texto y label; no dependen de posición/color. Filtros de cada bloque permanecen antes de su resultado.

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
- Robustez: controles nativos/Material con nombres accesibles, live regions estables y DOM ordenado.
- Responsive: 320 CSS px y 200 % zoom sin pérdida de información; cards sustituyen tablas cuando es necesario.
- Representación: solo tabla o tarjetas está expuesta/enfocable en cada breakpoint.
- Movimiento: transiciones mínimas y respeto de `prefers-reduced-motion`.
