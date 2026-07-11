# Especificación de feature: Gestión frontend de inscripción escolar y contratación docente

**Feature**: `001-school-enrollment-management`

**Rama activa**: `main`

**Creada**: 2026-07-10

**Estado**: Borrador validado para planificación P0-first

**Fuente canónica**: `inovait-backend/specs/001-school-enrollment-management/spec.md`

**Entrada**: experiencia frontend para inscripción escolar, búsqueda de estudiantes, contratación docente multiescuela y reportes municipales, sin alterar las reglas de negocio canónicas del backend.

## Alcance y prioridad *(obligatorio)*

La aplicación ofrece una navegación principal con las secciones “Matrículas”, “Consulta de estudiantes”, “Contratos docentes” y “Reportes”. El compromiso de una jornada incluye únicamente una base mínima, `US1`, `US2`, `US3`, pruebas críticas, evidencia crítica de errores y accesibilidad, integración real y walkthrough del evaluador. Es un pronóstico asistido por IA de riesgo alto condicionado a una ruta crítica de ocho horas con prerrequisitos listos, no una promesa incondicional. P1 conserva planificación completa como extensión condicional y NO DEBE iniciarse antes de la evidencia P0. Los cuatro recorridos P1 responden cinco preguntas de negocio, porque una sola capacidad de distribución por edad responde las preguntas 1 y 2.

La procedencia de la consigna original se referencia en
`../inovait-backend/docs/assessment-baseline.md`; esta especificación no la
duplica.

La especificación define comportamiento observable y criterios de experiencia. El OpenAPI publicado por `inovait-backend` es la única fuente para rutas, `operationId`, esquemas, payloads y errores; este documento no crea contratos alternativos.

## Clarifications

### Session 2026-07-10

- Q: ¿Cómo representa la UI la identidad normalizada, la inscripción anual y la inscripción actual? → A: Aplica la comparación canónica sin crear otra clave local, muestra `409` ante conflicto, admite un solo `Enrollment` por estudiante y año sin traslados y deriva la inscripción actual del `AcademicYear` actual.
- Q: ¿Cómo guía la UI la inscripción y representa los contratos multiescuela? → A: Usa selectores dependientes `School` → `AcademicYear` → `Grade` → `ClassGroup`; los intervalos son inclusivos y abiertos, la creación es todo-o-nada y el estado persistido se muestra separado de la validez temporal.
- Q: ¿Qué resultados deben presentar las capacidades de reporte? → A: Cuatro capacidades responden `BQ-001` a `BQ-005`: edad cumplida a `asOfDate`, docentes distintos por sector con doble pertenencia válida, todos los empates de escuelas e historia con múltiples docentes, materias y días.
- Q: ¿Cómo presenta la UI listas y errores canónicos? → A: Las listas acotadas son completas, no paginadas y deterministas; `400`, `404`, `409` y `422 ProblemDetails` se distinguen por causa con corrección contextual consistente. En listas, búsqueda y reportes, referencias académicas existentes sin datos producen `200` vacío o ceros; `422` solo aplica a otra regla semántica declarada por el contrato.
- Q: ¿Qué gobernanza aplica a la planificación frontend posterior? → A: Se mantiene una feature principal con documentos especializados trazables, unidades revisables de hasta 400 líneas y datos ficticios críticos; 3NF pertenece al backend y la UI no crea fuentes duplicadas ni agregados persistidos derivados.

## Escenarios de usuario y pruebas *(obligatorio)*

### Historia de usuario 1 - Inscribir un estudiante (Prioridad: P0)

Una persona operadora completa tipo y número de documento, nombres, apellidos, fecha de nacimiento, `School`, `AcademicYear`, `Grade` y `ClassGroup`. La interfaz guía las selecciones dependientes y permite crear o reutilizar `Student` y crear `Enrollment` como una única operación de negocio.

**Motivo de prioridad**: origina la historia académica y los conteos posteriores.

**Prueba independiente**: con catálogos ficticios precargados, completar una inscripción válida, comprobar la confirmación y verificar mediante búsqueda o historia que existe una sola identidad y la inscripción correspondiente.

**Clave de trazabilidad**: `FE-US1` ↔ backend `US1`, `SCN-001` a `SCN-007`, `REQ-001` a `REQ-011`.

**Escenarios de aceptación**:

1. **SCN-001 — Alta completa**: **Dado** un documento nuevo y una combinación académica válida, **cuando** se confirma el formulario, **entonces** se informa que `Student` y `Enrollment` fueron creados y no se permite un reenvío accidental.
2. **SCN-002 — Identidad existente coincidente**: **Dado** un documento que coincide tras la normalización canónica y datos de identidad equivalentes, sin inscripción en el año elegido, **cuando** se confirma, **entonces** la interfaz informa la reutilización de `Student` y la creación del nuevo `Enrollment` sin perder años anteriores.
3. **SCN-003 — Identidad en conflicto**: **Dado** un documento que coincide tras la normalización canónica pero cuyos nombres, apellidos o fecha de nacimiento no son equivalentes, **cuando** el backend devuelve `409 ProblemDetails`, **entonces** se muestra el conflicto, se conservan los datos corregibles y no se comunica éxito ni se sugiere modificar la identidad persistida.
4. **SCN-004 — Segunda inscripción anual**: **Dado** un `Student` ya inscrito en el año solicitado, **cuando** se intenta otra inscripción en cualquier escuela, grado o grupo del mismo año, **entonces** se muestra el conflicto y la inscripción original permanece sin cambios.
5. **SCN-005 — Fecha futura**: **Dado** una fecha de nacimiento posterior a la fecha actual, **cuando** se intenta confirmar, **entonces** el campo queda identificado como inválido y no se envía ni se registra la operación.
6. **SCN-006 — Referencia o combinación inválida**: **Dado** una referencia inexistente o un `ClassGroup` ajeno a la escuela, grado y año elegidos, **cuando** se intenta inscribir, **entonces** se presenta el error en el contexto afectado y no se comunica persistencia parcial.
7. **SCN-007 — Atomicidad**: **Dado** que el backend no puede completar `Enrollment`, **cuando** la solicitud también requería crear `Student`, **entonces** la interfaz comunica el fallo de toda la operación y nunca presenta uno de los registros como creado.
8. **SCN-FE-001 — Dependencias académicas**: **Dado** el orden `School` → `AcademicYear` → `Grade` → `ClassGroup`, **cuando** falta una selección superior válida, **entonces** los controles descendientes permanecen deshabilitados y no solicitan opciones; al completarla, muestran carga y luego opciones o el estado vacío aplicable.
9. **SCN-FE-002 — Cambio de selección superior**: **Dado** una selección descendiente, **cuando** cambia cualquier selector superior, **entonces** la interfaz limpia resultados y valores descendientes antes de cargar y validar nuevamente las opciones vigentes.
10. **SCN-FE-003 — Confirmación y estado posterior**: **Dado** un alta exitosa, **cuando** finaliza la operación, **entonces** se anuncia una confirmación no intrusiva, el formulario vuelve a estado inicial sin datos personales ni selección académica, el envío queda deshabilitado y el foco retorna de forma predecible al primer campo.

---

### Historia de usuario 2 - Buscar estudiantes inscritos (Prioridad: P0)

Una persona operadora elige conjuntamente `School`, `Grade` y `AcademicYear` y consulta las inscripciones coincidentes. La tabla permite reconocer documento, estudiante, edad, escuela, grado, grupo y año. La acción para consultar historia se incorpora únicamente con P1 después de la puerta P0.

**Motivo de prioridad**: demuestra que las inscripciones quedan disponibles en el contexto académico requerido.

**Prueba independiente**: preparar inscripciones ficticias en varios contextos, buscar una combinación y verificar resultados, orden, edad y estados remotos. El acceso a historia se valida en P1.

**Clave de trazabilidad**: `FE-US2` ↔ backend `US2`, `SCN-008` a `SCN-012`, `REQ-012` a `REQ-017`.

**Escenarios de aceptación**:

1. **SCN-008 — Coincidencias conjuntas**: **Dado** inscripciones en distintos contextos, **cuando** se seleccionan `School`, `Grade` y `AcademicYear` válidos y se busca, **entonces** la tabla muestra exclusivamente coincidencias simultáneas y las columnas requeridas en orden determinista.
2. **SCN-009 — Resultado vacío**: **Dado** un contexto válido sin estudiantes inscritos, **cuando** se busca, **entonces** se presenta un estado vacío informativo y no un error.
3. **SCN-010 — Año inexistente**: **Dado** un `AcademicYear` que dejó de estar disponible o no existe, **cuando** se busca, **entonces** se presenta el error de referencia y se permite corregir el filtro.
4. **SCN-011 — Filtros inválidos**: **Dado** que falta un filtro obligatorio o una referencia ya no existe, **cuando** se intenta buscar, **entonces** la acción permanece deshabilitada ante invalidez evidente o el backend responde `404` para permitir corregir la referencia. Tres referencias existentes siempre forman un contexto consultable.
5. **SCN-012 — Contexto sin grupos**: **Dado** cualquier combinación de `School`, `Grade` y `AcademicYear` existentes que no tiene `ClassGroup` ni inscripciones, **cuando** se consulta, **entonces** el backend responde `200` con colección vacía y la UI presenta el estado específico sin grupos o vacío, no un error.
6. **SCN-FE-004 — Estados de consulta**: **Dado** una búsqueda iniciada, **cuando** está pendiente, falla o finaliza, **entonces** la región de resultados distingue carga, error recuperable, vacío, sin grupos o tabla sin superponer mensajes contradictorios.
7. **SCN-FE-005 — Acceso condicional a historia (P1)**: **Dado** P0 aprobado y la historia P1 habilitada, **cuando** se activa “Ver historial” con teclado o puntero desde una fila, **entonces** se abre el recorrido con la identidad documental inequívoca del estudiante.

---

### Historia de usuario 3 - Crear y consultar contratos docentes (Prioridad: P0)

Una persona operadora selecciona un `Teacher` precargado, una o más `School`, fecha de inicio y fecha de fin opcional. La interfaz solicita un contrato independiente por escuela y muestra los contratos existentes con escuela, sector, fechas y estado.

**Motivo de prioridad**: cubre la relación multiescuela sin fusionar ni sobrescribir historia contractual.

**Prueba independiente**: elegir un docente y dos escuelas ficticias, registrar la solicitud y volver a consultar dos contratos independientes, además de verificar un conflicto que no cree resultados parciales.

**Clave de trazabilidad**: `FE-US3` ↔ backend `US3`, `SCN-013` a `SCN-019`, `REQ-018` a `REQ-026`.

**Escenarios de aceptación**:

1. **SCN-013 — Contratos multiescuela**: **Dado** un `Teacher` y dos escuelas válidas sin períodos incompatibles, **cuando** se confirma, **entonces** se informa la creación de un `TeacherContract` independiente por escuela y se actualiza la consulta.
2. **SCN-014 — Contrato abierto**: **Dado** que no se informa fecha de fin, **cuando** se registra, **entonces** el contrato se muestra sin límite final y presenta por separado su estado persistido y su validez temporal para la fecha consultada.
3. **SCN-015 — Rango inválido**: **Dado** una fecha de fin anterior a la fecha de inicio, **cuando** se intenta confirmar, **entonces** se identifica el rango inválido y no se envía ni crea ningún contrato.
4. **SCN-016 — Referencia inexistente**: **Dado** un docente o escuela que dejó de existir, **cuando** el backend rechaza la solicitud, **entonces** se informa la referencia afectada y no se muestra ningún contrato nuevo.
5. **SCN-017 — Duplicado o superposición**: **Dado** un contrato del mismo docente y escuela con intervalo superpuesto total o parcialmente, **cuando** se confirma otro, **entonces** se muestra el conflicto y no se crea ningún contrato de la solicitud multiescuela.
6. **SCN-018 — Superposición entre escuelas**: **Dado** contratos del mismo docente para escuelas distintas, **cuando** coinciden sus períodos, **entonces** la interfaz los presenta como contratos válidos e independientes.
7. **SCN-019 — Consulta posterior**: **Dado** contratos persistidos, **cuando** se selecciona el docente, **entonces** se muestran todos en orden determinista con escuela, sector, fechas y estado.
8. **SCN-FE-006 — Atomicidad visible**: **Dado** una selección multiescuela con al menos una referencia o período conflictivo, **cuando** la solicitud falla, **entonces** no se representa ninguna escuela como creada, se conserva la selección para corrección y se explicita que la operación completa fue rechazada.

### Escenarios transversales P0 de datos remotos

1. **SCN-FE-007 — Catálogos remotos y reintento**: **Dado** cualquiera de los catálogos `School`, `Grade`, `AcademicYear` o `Teacher`, **cuando** su carga está pendiente, falla, no contiene opciones o finaliza con datos, **entonces** la página muestra exactamente uno de loading/error/empty/success, permite reintentar el error y no habilita selecciones dependientes con datos obsoletos.
2. **SCN-FE-008 — Lista contractual remota**: **Dado** un docente seleccionado, **cuando** se consultan sus contratos, **entonces** loading/error/empty/success son mutuamente exclusivos, el error ofrece reintento y una selección que el backend rechace por obsoleta se invalida o recarga sin conservar filas como vigentes.

---

### Historia de usuario 4 - Consultar distribución por edad (Prioridad: P1)

Una persona analista selecciona `AcademicYear`, opcionalmente `School` y `Grade`, y puede informar `asOfDate`. Una única vista con tarjetas o tabla simple responde tanto el conteo de 3 a 7 años como la distribución de 3 a 7, 8 a 12 y mayores de 12.

**Motivo de prioridad**: responde las preguntas de negocio 1 y 2 con la misma población y regla de edad.

**Prueba independiente**: usar edades exactas de 2, 3, 7, 8, 12 y 13 años para una fecha de referencia y comparar los conteos visibles con el cálculo manual.

**Clave de trazabilidad**: `FE-US4` ↔ backend `US4`, `SCN-020` a `SCN-023`, `REQ-027` a `REQ-032`.

**Escenarios de aceptación**:

1. **SCN-020 — Dos preguntas, una capacidad**: **Dado** un año con inscripciones, **cuando** se ejecuta el reporte, **entonces** una presentación simple muestra el conteo de 3 a 7 y los tres rangos definidos.
2. **SCN-021 — Límites inclusivos**: **Dado** estudiantes de 3, 7, 8, 12 y 13 años, **cuando** se muestra la distribución, **entonces** 3 y 7 están en el primer rango, 8 y 12 en el segundo y 13 en el tercero.
3. **SCN-022 — Fecha de referencia**: **Dado** una `asOfDate`, **cuando** se consulta, **entonces** la vista identifica esa fecha y presenta edades en años cumplidos; si se omite, identifica la fecha actual usada.
4. **SCN-023 — Sin inscripciones**: **Dado** un contexto válido sin inscripciones, **cuando** se consulta, **entonces** todos los conteos visibles son cero.

---

### Historia de usuario 5 - Contar docentes distintos por sector (Prioridad: P1)

Una persona analista consulta cuántos docentes distintos tienen contratos en escuelas públicas y privadas para la fecha actual o para un período inclusivo.

**Motivo de prioridad**: responde la pregunta de negocio 3 sin confundir contratos con docentes.

**Prueba independiente**: preparar contratos repetidos en un sector, contratos del mismo docente en ambos sectores y contratos fuera del período; comparar los dos conteos visibles con el cálculo manual.

**Clave de trazabilidad**: `FE-US5` ↔ backend `US5`, `SCN-024` a `SCN-027`, `REQ-033` a `REQ-035`.

**Escenarios de aceptación**:

1. **SCN-024 — Conteo actual**: **Dado** que no se informa período, **cuando** se consulta, **entonces** se muestran conteos de contratos cuyo intervalo contiene la fecha actual y cuyo estado persistido es válido para reportes, identificando esa referencia temporal.
2. **SCN-025 — Conteo por período**: **Dado** un rango válido, **cuando** se consulta, **entonces** se incluyen contratos con estado válido para reportes y al menos un día de intersección inclusiva.
3. **SCN-026 — Distinción por docente y sector**: **Dado** varios contratos pertinentes del mismo docente en un sector, **cuando** se muestran los conteos, **entonces** ese docente aporta una sola unidad al sector.
4. **SCN-027 — Docente en ambos sectores**: **Dado** un docente con contratos pertinentes públicos y privados, **cuando** se consulta, **entonces** aporta una unidad a cada sector.

---

### Historia de usuario 6 - Identificar todas las escuelas líderes (Prioridad: P1)

Una persona analista selecciona `AcademicYear` y consulta todas las escuelas con el máximo de estudiantes inscritos.

**Motivo de prioridad**: responde la pregunta de negocio 4 y hace visibles los empates.

**Prueba independiente**: preparar dos escuelas empatadas y otra con menos inscripciones; verificar que la tabla simple muestre ambas líderes en orden estable.

**Clave de trazabilidad**: `FE-US6` ↔ backend `US6`, `SCN-028` a `SCN-030`, `REQ-036` y `REQ-037`.

**Escenarios de aceptación**:

1. **SCN-028 — Máximo anual**: **Dado** inscripciones en varias escuelas, **cuando** se consulta el año, **entonces** se muestra cada escuela cuya cantidad coincide con el máximo.
2. **SCN-029 — Empate**: **Dado** dos o más escuelas empatadas, **cuando** se presentan los resultados, **entonces** aparecen todas ordenadas por nombre y luego por identificador.
3. **SCN-030 — Año sin inscripciones**: **Dado** un año válido sin inscripciones, **cuando** se consulta, **entonces** se presenta una colección vacía informativa.

---

### Historia de usuario 7 - Consultar historia académica y docente (Prioridad: P1)

Una persona operadora identifica a un estudiante por tipo y número de documento y consulta cada inscripción por año, escuela, grado y grupo, junto con todos los docentes y materias vinculados.

**Motivo de prioridad**: responde la pregunta de negocio 5 y demuestra que la historia no se sobrescribe.

**Prueba independiente**: preparar dos años y varias asignaciones docentes y materias en uno de ellos; verificar que ninguna inscripción ni relación se pierda.

**Clave de trazabilidad**: `FE-US7` ↔ backend `US7`, escenarios frontend de lectura `SCN-031` a `SCN-034`, `REQ-038` a `REQ-041`. `SCN-035` es evidencia backend-only de escritura interna y no constituye aceptación ni tarea UI.

**Escenarios de aceptación**:

1. **SCN-031 — Historia multianual**: **Dado** un estudiante con varias inscripciones, **cuando** se consulta su historia, **entonces** cada año muestra escuela, grado y grupo sin sobrescribir años anteriores.
2. **SCN-032 — Múltiples docentes, materias y días**: **Dado** varias `TeachingAssignment` pertinentes, **cuando** se presenta el año, **entonces** se muestran todos los docentes, materias y días de semana sin colapsar relaciones distintas.
3. **SCN-033 — Año sin asignaciones**: **Dado** una inscripción sin asignaciones, **cuando** se consulta, **entonces** el año permanece visible con una colección vacía de docentes y materias.
4. **SCN-034 — Estudiante inexistente**: **Dado** un documento desconocido, **cuando** se consulta la historia, **entonces** se informa que el estudiante no existe y se permite corregir la identidad.

### Casos límite

- Dos documentos con igual número y distinto tipo representan identidades diferentes.
- La comparación de identidad sigue exactamente `REQ-001` a `REQ-005`: tipo recortado sin distinguir mayúsculas; número sin espacios, puntos ni guiones y sin distinguir mayúsculas; nombres y apellidos recortados, con espacios internos colapsados, sin distinguir mayúsculas y conservando diacríticos; nacimiento exacto.
- Un cumpleaños en `asOfDate` cuenta como cumplido; una `asOfDate` anterior al nacimiento es inválida.
- Otra escuela durante el mismo `AcademicYear` sigue siendo una segunda inscripción anual y se rechaza; no representa un traslado admitido.
- Un año posterior puede cambiar escuela, grado o grupo sin alterar años anteriores.
- Los intervalos contractuales incluyen inicio y fin; compartir un día constituye superposición.
- Un contrato sin fecha de fin se superpone con todo contrato posterior del mismo docente y escuela desde su inicio.
- Repetir una escuela dentro de la misma solicitud multiescuela es inválido y rechaza toda la solicitud.
- Cualquier combinación de `School`, `Grade` y `AcademicYear` existentes es válida para listas, búsqueda y reportes; sin grupos o inscripciones produce `200` vacío o conteos cero, nunca `422` por “incompatibilidad”.
- Los menores de 3 años no pertenecen a ninguno de los tres rangos.
- Todos los empates de escuelas se muestran; nunca se elige una líder arbitrariamente.
- Un grupo puede mostrar múltiples docentes, materias y días mediante sus asignaciones.
- Una `TeachingAssignment` cuya escuela no coincida con `TeacherContract` es inválida y no debe presentarse como historia válida.
- Si cambia un filtro superior mientras existen resultados, los resultados anteriores dejan de presentarse como vigentes hasta ejecutar una nueva consulta válida.
- Si un catálogo queda obsoleto entre carga y envío, prevalece el rechazo del backend y la interfaz permite recargar o corregir la selección.

## Requisitos *(obligatorio)*

### Requisitos funcionales

Los identificadores frontend son estables. La última columna conserva la trazabilidad exacta con la fuente canónica de backend.

| ID frontend | Requisito observable | ID backend |
| --- | --- | --- |
| **FR-001** | La UI DEBE tratar conjuntamente tipo y número de documento conforme a la normalización canónica, sin mantener una clave de identidad alternativa. | `REQ-001` |
| **FR-002** | El formulario DEBE exigir nombres, apellidos y fecha de nacimiento para crear o verificar `Student`. | `REQ-002` |
| **FR-003** | La interfaz DEBE tratar la creación de `Student` y `Enrollment` como una sola operación y comunicar éxito solo si ambos se confirman. | `REQ-003` |
| **FR-004** | Ante identidad coincidente, DEBE comunicar la reutilización de `Student` y la creación exclusiva de `Enrollment`. | `REQ-004` |
| **FR-005** | Ante datos distintos para un documento existente, DEBE presentar un conflicto sin sugerir modificación de identidad. | `REQ-005` |
| **FR-006** | El formulario DEBE rechazar una fecha de nacimiento futura. | `REQ-006` |
| **FR-007** | Solo DEBEN seleccionarse referencias existentes de `School`, `AcademicYear`, `Grade` y `ClassGroup`; el backend conserva la validación final. | `REQ-007` |
| **FR-008** | Los selectores DEBEN seguir `School` → `AcademicYear` → `Grade` → `ClassGroup`; cada cambio superior limpia opciones, valores y resultados descendientes antes de recargarlos, y `ClassGroup` solo se carga para la combinación válida. | `REQ-008` |
| **FR-009** | Una segunda inscripción del mismo estudiante y año DEBE mostrarse como conflicto, incluso para otra escuela. | `REQ-009` |
| **FR-010** | La UI DEBE permitir años posteriores con otro contexto y preservar el acceso a la historia anterior. | `REQ-010` |
| **FR-011** | La inscripción actual DEBE derivarse únicamente del `AcademicYear` que el catálogo designa como actual, sin una fuente mutable en `Student`; las demás permanecen como historia. | `REQ-011` |
| **FR-012** | “Consulta de estudiantes” DEBE exigir conjuntamente `School`, `Grade` y `AcademicYear`. | `REQ-012` |
| **FR-013** | Cada resultado canónico DEBE conservar documento, nombre completo, nacimiento, edad, escuela, grado, grupo y año; la tabla DEBE mostrar documento, estudiante, edad, escuela, grado, grupo y año. | `REQ-013` |
| **FR-014** | La edad DEBE corresponder a años cumplidos en `asOfDate` o en la fecha actual si se omite. | `REQ-014` |
| **FR-015** | Cualquier combinación de `School`, `Grade` y `AcademicYear` existentes DEBE ser consultable; sin grupos o inscripciones DEBE verse como `200` con colección vacía o estado sin grupos. | `REQ-015` |
| **FR-016** | Una referencia inexistente DEBE distinguirse del estado vacío; una combinación de referencias existentes NO DEBE tratarse como incompatible ni esperar `422` en `listEnrollments`. | `REQ-016` |
| **FR-017** | La búsqueda DEBE mostrar el conjunto acotado sin paginación y en el orden canónico determinista. | `REQ-017` |
| **FR-018** | “Contratos docentes” DEBE permitir únicamente un `Teacher` precargado y una o más escuelas existentes. | `REQ-018` |
| **FR-019** | Una solicitud válida DEBE representar un `TeacherContract` independiente por escuela con fechas y estado. | `REQ-019` |
| **FR-020** | La fecha de fin opcional DEBE ser igual o posterior al inicio. | `REQ-020` |
| **FR-021** | Un contrato sin fecha de fin DEBE presentarse sin límite final; su estado persistido y su validez temporal DEBEN mostrarse como conceptos distintos. | `REQ-021` |
| **FR-022** | Escuelas repetidas, duplicados y superposiciones inclusivas para el mismo docente y escuela DEBEN rechazarse como conflicto. | `REQ-022` |
| **FR-023** | La UI DEBE admitir períodos coincidentes del mismo docente en escuelas distintas. | `REQ-023` |
| **FR-024** | La solicitud multiescuela DEBE comunicarse como atómica: ante cualquier error no se muestra ningún contrato nuevo de esa solicitud. | `REQ-024` |
| **FR-025** | Los contratos DEBEN poder consultarse por docente y mostrar escuela, sector, inicio, fin y estado. | `REQ-025` + `School.sector` |
| **FR-026** | Los contratos DEBEN conservar el orden canónico por inicio, escuela e identificador. | `REQ-026` |
| **FR-027** | “Reportes” P1 NO DEBE considerarse completo ni iniciarse antes de validar `FE-US1`, `FE-US2` y `FE-US3`. | `REQ-027` |
| **FR-028** | “Reportes” DEBE ofrecer cuatro capacidades para las cinco preguntas canónicas, sin agregar preguntas ni alterar su agrupación. | `REQ-028` |
| **FR-029** | Edad DEBE exigir `AcademicYear`, admitir `School` y `Grade` opcionales acumulativos y tratar toda combinación de referencias existentes como consultable, con conteos cero cuando no haya grupos o inscripciones. | `REQ-029` |
| **FR-030** | Edad DEBE considerar solo estudiantes inscritos en el contexto y usar `asOfDate` o la fecha actual. | `REQ-030` |
| **FR-031** | Una misma respuesta DEBE mostrar el conteo 3–7 y la distribución 3–7, 8–12 y mayores de 12. | `REQ-031` |
| **FR-032** | Menores de 3 DEBEN excluirse; sin inscripciones, todos los conteos DEBEN ser cero. | `REQ-032` |
| **FR-033** | Docentes por sector DEBE usar la fecha actual sin período o un rango completo con intersección inclusiva y considerar solo estados persistidos válidos para reportes según el contrato canónico. | `REQ-033` |
| **FR-034** | Cada `Teacher` DEBE contarse una sola vez por sector. | `REQ-034` |
| **FR-035** | Un docente pertinente en ambos sectores DEBE contarse una vez en cada uno. | `REQ-035` |
| **FR-036** | Escuelas líderes DEBE exigir `AcademicYear` y mostrar todas las escuelas empatadas en el máximo. | `REQ-036` |
| **FR-037** | Las líderes DEBEN ordenarse por nombre e identificador; un año sin inscripciones DEBE mostrar vacío. | `REQ-037` |
| **FR-038** | La historia DEBE localizar por tipo y número de documento y mostrar inscripciones ordenadas por año con escuela, grado y grupo. | `REQ-038` |
| **FR-039** | Cada año DEBE incluir todos los docentes y materias; sin asignaciones, DEBE mostrar una colección vacía. | `REQ-039` |
| **FR-040** | La historia solo DEBE representar `TeachingAssignment` con docente contratado, materia, grupo y escuela compatibles. | `REQ-040` |
| **FR-041** | La historia DEBE preservar múltiples asignaciones, docentes, materias y días de semana. | `REQ-041` |
| **FR-042** | Los errores remotos DEBEN usar la información canónica disponible en `ProblemDetails`, asociar campos cuando corresponda y no exponer detalles internos. | `REQ-042` |
| **FR-043** | La UI DEBE presentar consistentemente `400` como contrato mal formado, `404` como referencia inexistente, `409` como conflicto de identidad o historia y `422` solo cuando la operación canónica declare una regla semántica: en escrituras puede ser una relación inválida entre referencias existentes y en reportes puede ser una fecha o período inválido; nunca una combinación académica existente en listas, búsqueda o reportes. | `REQ-043` |
| **FR-044** | Ningún recorrido del MVP DEBE exigir autenticación o autorización. | `REQ-044` |
| **FR-045** | Todos los datos visibles, ejemplos y demostraciones DEBEN ser ficticios y no contener secretos. | `REQ-045` |
| **FR-046** | `AcademicYear` DEBE seleccionarse por identificador desde el catálogo; no se acepta como entero libre y como máximo uno puede indicar el contexto actual. | `REQ-046` |
| **FR-047** | La UI DEBE presentar el estado persistido de `TeacherContract` separado de la validez temporal calculada y usar ambos criterios cuando el reporte lo requiera. | `REQ-047` |
| **FR-048** | Toda lista o colección anidada DEBE mostrarse completa, sin paginación y en el orden estable definido por el backend para el conjunto acotado. | `REQ-048` |
| **FR-049** | Los datos ficticios de demostración DEBEN cubrir límites de edad, ambos sectores, empates, múltiples docentes, materias y días, contratos abiertos y cerrados y varios años. | `REQ-049` |
| **GOV-001** | La feature principal DEBE producir después documentos especializados trazables y sin duplicar reglas canónicas. | `REQ-050` |
| **GOV-002** | Cada unidad revisable posterior DEBE respetar el presupuesto de 400 líneas modificadas. | `REQ-051` |
| **DATA-001** | 3NF y la ausencia de agregados persistidos son responsabilidades del backend; el frontend NO DEBE crear fuentes de verdad duplicadas ni persistir agregados derivados. | `REQ-052` |

### Requisitos de interfaz, estados y accesibilidad

- **UX-001**: La navegación principal DEBE exponer de forma consistente “Matrículas”, “Consulta de estudiantes”, “Contratos docentes” y “Reportes”, indicar la sección actual y permitir omitir la navegación repetida.
- **UX-002**: Cada pantalla DEBE usar encabezados jerárquicos, regiones y controles semánticos, con etiquetas e instrucciones asociadas programáticamente.
- **UX-003**: Toda función DEBE operarse con teclado, sin trampas, con orden lógico y foco visible que no quede oculto.
- **UX-004**: Los errores y estados NO DEBEN depender solo del color; DEBEN incluir texto comprensible y relación con los campos afectados.
- **UX-005**: Carga, errores, confirmaciones y cambios relevantes en resultados DEBEN anunciarse mediante una región viva adecuada sin mover el foco inesperadamente.
- **UX-006**: Formularios, navegación, tarjetas y tablas DEBEN ser legibles y operables en escritorio, tableta y móvil, con contenido utilizable al 200 % de zoom.
- **UX-007**: Cada flujo remoto DEBE tener estados mutuamente comprensibles de carga, error, éxito y vacío; la búsqueda también DEBE distinguir invalidez y contexto válido sin grupos.
- **UX-008**: Mientras una operación de escritura está pendiente, su confirmación DEBE quedar deshabilitada y comunicar carga; ante error, los datos corregibles DEBEN conservarse.
- **UX-009**: Las confirmaciones DEBEN ser no intrusivas, permanecer tiempo suficiente, anunciarse y no sustituir la evidencia visible del resultado.
- **UX-010**: Las tablas DEBEN tener título o contexto, encabezados claros y asociación inequívoca entre celdas y columnas; en pantallas pequeñas NO DEBEN perder datos ni acciones.
- **UX-011**: Los controles deshabilitados DEBEN tener una razón perceptible, especialmente `ClassGroup` antes de una combinación académica válida y acciones con formularios incompletos.
- **UX-012**: Los reportes DEBEN usar tarjetas o tablas simples; quedan prohibidos gráficos complejos que oculten valores exactos o agreguen una lectura no canónica.
- **UX-013**: Cada ruta DEBE establecer un título de documento significativo y aplicar una política única de navegación SPA: al completar el cambio, actualizar título, enfocar una vez el `h1` y anunciarlo mediante una única región polite; las actualizaciones remotas dentro de la ruta no mueven foco.
- **UX-014**: Cuando un resultado tenga tabla y tarjetas responsive, solo una representación semántica DEBE estar expuesta y ser enfocable en cada breakpoint.

### Frontera API y validación

- **API-001**: El frontend DEBE consumir conceptualmente operaciones y esquemas tipados tomados exclusivamente del OpenAPI canónico publicado por `inovait-backend`.
- **API-002**: Ninguna ruta, `operationId`, payload, enumeración, campo o variante de error DEBE inferirse o definirse en esta especificación si no existe en el OpenAPI canónico.
- **API-003**: La validación local DEBE orientar y bloquear solicitudes evidentemente inválidas, pero el resultado del backend DEBE prevalecer para reglas, referencias, conflictos y atomicidad.
- **API-004**: `ProblemDetails` DEBE tolerar sus campos opcionales, presentar el detalle seguro disponible y asociar errores de campo cuando el contrato los suministre.
- **API-005**: Los listados DEBEN consumirse sin paginación únicamente para el conjunto acotado del MVP y conservar el orden determinista definido por backend.

### Entidades clave

- **`School`**: escuela de la única ciudad, con sector Public o Private.
- **`Student`**: identidad única por tipo y número de documento con nombres, apellidos y nacimiento.
- **`AcademicYear`**: período académico; uno puede ser actual y los anteriores siguen consultables.
- **`Grade`**: nivel académico usado en inscripción, búsqueda y grupos.
- **`ClassGroup`**: grupo perteneciente a una combinación única de escuela, grado y año.
- **`Enrollment`**: vínculo histórico anual entre estudiante y contexto académico; máximo uno por estudiante y año.
- **`Teacher`**: docente precargado seleccionable para contratación.
- **`TeacherContract`**: período independiente entre docente y escuela, con estado y fin opcional.
- **`Subject`**, **`TeachingAssignment`** y **`ClassSchedule`**: materia, servicio docente compatible y días asociados que componen la historia docente.

## Trazabilidad de requisitos *(obligatorio)*

Los nombres concretos de rutas y `operationId` se tomarán del OpenAPI canónico durante planificación; registrarlos aquí sin contrato publicado violaría `API-002`.

| Requisitos frontend | Backend canónico | Historia y escenarios | Superficie | Capacidad OpenAPI canónica |
| --- | --- | --- | --- | --- |
| `FR-001`–`FR-011`, `UX-007`–`UX-009`, `UX-011` | `REQ-001`–`REQ-011` | `FE-US1` / `SCN-001`–`SCN-007`, `SCN-FE-001`–`003` | Matrículas | Creación atómica de `Student`/`Enrollment` y catálogos académicos |
| `FR-012`–`FR-017`, `UX-007`, `UX-010` | `REQ-012`–`REQ-017` | `FE-US2` / `SCN-008`–`SCN-012`, `SCN-FE-004`; acceso P1 `SCN-FE-005` | Consulta de estudiantes | Consulta conjunta de inscripciones; historia solo en P1 |
| `FR-018`–`FR-026`, `UX-007`–`UX-010` | `REQ-018`–`REQ-026` | `FE-US3` / `SCN-013`–`SCN-019`, `SCN-FE-006`–`008` | Contratos docentes | Creación atómica multiescuela y consulta por docente |
| `FR-027`–`FR-032`, `UX-007`, `UX-012` | `REQ-027`–`REQ-032` | `FE-US4` / `SCN-020`–`SCN-023` | `Reports` / edad | Distribución de edad con `asOfDate` |
| `FR-033`–`FR-035`, `UX-007`, `UX-012` | `REQ-033`–`REQ-035` | `FE-US5` / `SCN-024`–`SCN-027` | `Reports` / sectores | Docentes distintos por sector |
| `FR-036`, `FR-037`, `UX-007`, `UX-010`, `UX-012` | `REQ-036`, `REQ-037` | `FE-US6` / `SCN-028`–`SCN-030` | `Reports` / escuelas líderes | Máximo anual con empates |
| `FR-038`–`FR-041`, `UX-007`, `UX-010`, `UX-012` | `REQ-038`–`REQ-041` | `FE-US7` / `SCN-031`–`SCN-034`; backend-only `SCN-035` excluido | Reportes / historia; “Ver historial” | Historia académica-docente por documento |
| `FR-042`–`FR-045`, `UX-001`–`UX-014`, `API-001`–`API-005` | `REQ-042`–`REQ-045` | `FE-US1`–`FE-US7` / todos los estados | Toda la aplicación | `ProblemDetails`, catálogos y operaciones canónicas relacionadas |
| `FR-046`–`FR-049`, `GOV-001`, `GOV-002`, `DATA-001` | `REQ-046`–`REQ-052` | `FE-US1`–`FE-US7` / pruebas y revisión | Toda la aplicación y planificación | Catálogos, estado temporal, listas, datos ficticios y gobernanza canónica |

**Preguntas de negocio canónicas**

| Business Question ID | Capacidad UI | Trazabilidad frontend ↔ backend |
| --- | --- | --- |
| `BQ-001` | `Reports` / conteo de 3 a 7 años | `FE-US4`, `FR-031` ↔ `US4`, `REQ-031` |
| `BQ-002` | `Reports` / distribución por rangos | `FE-US4`, `FR-031`, `FR-032` ↔ `US4`, `REQ-031`, `REQ-032` |
| `BQ-003` | `Reports` / docentes distintos por sector | `FE-US5`, `FR-033`–`FR-035` ↔ `US5`, `REQ-033`–`REQ-035` |
| `BQ-004` | `Reports` / escuelas líderes | `FE-US6`, `FR-036`, `FR-037` ↔ `US6`, `REQ-036`, `REQ-037` |
| `BQ-005` | `Reports` / historia académica-docente | `FE-US7`, `FR-038`–`FR-041` ↔ `US7`, `REQ-038`–`REQ-041` |

## Datos e historia

- Una nueva inscripción anual, contrato o asignación agrega historia y NO DEBE sobrescribir años o períodos anteriores.
- Las fechas de nacimiento, contrato, `asOfDate` y períodos son fechas de negocio sin hora; los extremos contractuales son inclusivos.
- La interfaz NO DEBE ofrecer eliminación, traslado ni edición que destruya o reinterprete la historia canónica.

## Fuera de alcance

- Autenticación, autorización y recuperación de contraseñas.
- Traslados entre escuelas dentro del mismo año académico.
- Creación o mantenimiento de escuelas, años, grados, grupos, docentes, materias o estados contractuales.
- Interfaces administrativas ajenas a los recorridos y reportes definidos.
- Importación masiva, auditoría avanzada, notificaciones, archivos, cobros y facturación.
- Multiciudad, infraestructura cloud, microservicios, mensajería, CQRS complejo y event sourcing.
- Gráficos complejos, analítica adicional o preguntas distintas de las cinco canónicas.
- Paginación para el conjunto acotado de evaluación.
- Definir o modificar rutas, payloads o esquemas del backend desde el frontend.

## Seguridad de datos *(obligatorio)*

- Ejemplos, catálogos, resultados, pruebas y demostraciones usan exclusivamente datos ficticios.
- Ningún recorrido requiere secretos, credenciales ni datos personales reales.
- Los mensajes no exponen trazas, consultas, configuración ni detalles internos.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **SC-001**: El 100 % de los escenarios P0 produce el resultado visible esperado antes de iniciar validación P1. ↔ backend `OUT-001`.
- **SC-002**: En el 100 % de altas o contrataciones inválidas no se comunica persistencia parcial ni se altera historia válida. ↔ backend `OUT-002`.
- **SC-003**: Una persona evaluadora completa cada recorrido P0 válido en menos de 3 minutos con datos ficticios y sin asistencia técnica. ↔ backend `OUT-003`.
- **SC-004**: El 100 % de consultas repetidas con iguales datos y filtros presenta el mismo contenido y orden. ↔ backend `OUT-004`.
- **SC-005**: Los cinco resultados de negocio coinciden exactamente con un cálculo manual que incluya límites, multisector, empates y múltiples asignaciones. ↔ backend `OUT-005`.
- **SC-006**: Durante la demostración local se registra una ejecución calentada de cada consulta P0 como observación informativa. No existe umbral, porcentaje ni puerta de entrega; una demora evidente se documenta sin desplazar corrección funcional. ↔ backend `OUT-006`.
- **SC-007**: El 100 % de empates muestra todas las escuelas líderes y el 100 % de docentes pertinentes en ambos sectores aparece una vez en cada sector. ↔ backend `OUT-007`.
- **SC-008**: La revisión de datos visibles y evidencias encuentra cero datos personales reales, credenciales o secretos. ↔ backend `OUT-008`.
- **SC-009**: El 100 % de acciones, formularios, navegación y resultados P0 puede recorrerse con teclado, conserva foco visible, título/anuncio de ruta coherentes y sigue siendo utilizable a 320 CSS px y al 200 % de zoom, con una sola representación tabla/tarjetas expuesta.
- **SC-010**: El 100 % de flujos remotos P0 demuestra estados mutuamente exclusivos de carga, error, éxito y vacío con reintento; los catálogos School/Grade/AcademicYear/Teacher y la lista contractual cubren stale data, y Consulta de estudiantes distingue además invalidez y contexto válido sin grupos.

## Supuestos

- Todas las escuelas pertenecen a una única ciudad y cada `School` tiene sector Public o Private.
- Existe como máximo un `Enrollment` por estudiante y `AcademicYear`; no hay traslados intranuales.
- La coincidencia completa de identidad reutiliza `Student`; cualquier diferencia en nombres, apellidos o nacimiento genera conflicto.
- `ClassGroup` pertenece a una combinación única de `School`, `Grade` y `AcademicYear`.
- Los catálogos necesarios están precargados con información ficticia; la UI no los administra.
- Un `TeacherContract` sin fecha de fin es continuo; toda superposición para el mismo docente y escuela se rechaza, y entre escuelas distintas es válida.
- Una solicitud multiescuela se valida como unidad y crea todos sus contratos o ninguno; no existe comportamiento parcial que representar.
- El estado contractual procede del catálogo canónico; su mantenimiento no forma parte de la feature.
- El reporte docente sin período usa la fecha actual; con período usa intersección inclusiva.
- La edad usa años cumplidos en `asOfDate` o en la fecha actual cuando se omite.
- No hay paginación por el conjunto acotado; todos los listados mantienen el orden canónico.
- Después de una inscripción exitosa, el formulario se limpia por completo para evitar reenvío accidental y vuelve de forma predecible al primer campo; esta es una decisión de interacción que no cambia la persistencia canónica.
- La aplicación futura respetará las restricciones constitucionales de Angular, componentes standalone, TypeScript estricto, `Reactive Forms`, servicios HTTP tipados y Angular Material; su diseño corresponde a planificación.

## Dependencias y riesgos

- El OpenAPI canónico está versionado en el commit backend autorizado `1223630ab99bf1bfaa4f5919fccf5ff539379c8e`, con checksum `802c13b91bf5c6425d24c540b6841a2abe134e084ea310fc2b7041e32c24a81a`. La verificación exige ese commit o un sucesor aprobado explícitamente, los archivos bajo seguimiento, el directorio contractual clean y el checksum coincidente. Los slices P0 pueden usar fixtures congelados P0 y la integración real se exige en la puerta P0. Los DTO y fixtures P1 no se crean antes de esa puerta.
- La factibilidad de una jornada presupone que el baseline autorizado conserve esas garantías y que la estrategia de revisión esté aprobada, Node/npm listos y backend P0 disponible para la última hora. P1 está excluido; solo puede retirarse hardening no esencial, nunca los tres recorridos P0, evidencia crítica de errores/accesibilidad, integración real ni entregables requeridos.
- Datos ficticios insuficientes pueden ocultar errores de límites de edad, empates, multisector o multiplicidad de docentes y materias.
- La ausencia de paginación solo es adecuada para el conjunto acotado de evaluación; un volumen municipal real exigiría otra decisión.
- La historia docente depende de asociaciones temporales y escolares correctas en `TeachingAssignment`.
- Los controles dependientes pueden mostrar datos obsoletos si cambian selecciones durante una carga; el resultado visible debe corresponder únicamente a la combinación vigente.
- La presentación responsive de tablas extensas puede perder contexto si se ocultan columnas; toda adaptación debe preservar datos, encabezados y acciones.
