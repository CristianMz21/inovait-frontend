# Especificación de capacidad: `enrollment-management`

**Source change**: 001-school-enrollment-management (P0)

## Propósito

Implementar la experiencia de **Matrículas** en frontend respetando el contrato canónico de `inovait-backend`, sin cambiar rutas, `operationId`, payloads o reglas de negocio del backend.

## Requisitos

### Requisito: FR-ENR-001 — Identidad y matrícula atómica

La interfaz MUST tratar el tipo y número de documento como una identidad canónica compartida con el backend y realizar `Student` y `Enrollment` como una única operación de negocio visible para la persona operadora.

#### Scenario: Alta válida de nuevo estudiante

- GIVEN se completan documento, tipo y número canónicos, nombres, apellidos y fecha de nacimiento válida,
- WHEN se elige una cadena académica válida y se confirma,
- THEN el backend crea ambos recursos de forma atómica y la UI anuncia éxito de inscripción única.

#### Scenario: Identidad reutilizable con un año ya existente

- GIVEN el documento coincide canónicamente con un estudiante existente y no existe inscripción para el año seleccionado,
- WHEN se confirma la matrícula,
- THEN la UI muestra reutilización de `Student`, crea exclusivamente el `Enrollment` y conserva el histórico anual.

#### Scenario: Segundo alta del mismo año

- GIVEN el mismo estudiante ya tiene inscripción en el año solicitado,
- WHEN se intenta otra matrícula (incluso en otra escuela o grado del mismo año),
- THEN la UI muestra conflicto sin generar cambios parciales.

### Requisito: FR-ENR-002 — Selectores académicos dependientes y estado vigente

La interfaz MUST seguir la secuencia `School → AcademicYear → Grade → ClassGroup`, y MUST limpiar selecciones/resultados descendientes al cambiar cualquier dependencia superior antes de habilitar o recargar el nivel inmediato.

#### Scenario: Dependencias activas

- GIVEN `School` no está seleccionado,
- WHEN la operadora intenta elegir `AcademicYear`,
- THEN `AcademicYear` permanece deshabilitado hasta completar la selección superior y luego muestra carga/estado de éxito, vacío o error.

#### Scenario: Cambio de contexto superior

- GIVEN había una combinación inferior válida,
- WHEN cambia `School` o `AcademicYear`,
- THEN la UI limpia `grade`, `classGroup` y resultados; solo recupera opciones coherentes con el nuevo contexto.

### Requisito: FR-ENR-003 — Manejo de errores remotos por contrato

La interfaz MUST presentar errores de problema por estado HTTP canónico (`400`, `404`, `409`, `422`) con mensajes canónicos, asociar errores de campo cuando existan y no afirmar persistencia si el backend responde con fallo.

#### Scenario: Identidad con conflicto semántico

- GIVEN la identidad coincide por documento tras normalización pero nombres, apellidos o nacimiento difieren,
- WHEN el backend responde `409 ProblemDetails`,
- THEN la UI conserva datos corregibles y muestra conflicto explícito sin reintentar como éxito.

#### Scenario: Referencia inválida o combinación incompatible en escritura

- GIVEN falta referencia real o `ClassGroup` incompatibles,
- WHEN se envía la acción,
- THEN la UI muestra error contextual (`400`/`404`/`422`) y no guarda ninguna parte de la operación.

## Criterios de éxito

- SC-ENR-01: 100% de los escenarios `SCN-001` a `SCN-007` y `SCN-FE-001` a `SCN-FE-003` se ejecutan correctamente con flujo único y sin mutaciones parciales.
- SC-ENR-02: Los errores remotos `400`, `404`, `409`, `422` se ven por estado y ruta canónica, sin colisiones entre secciones de mensajes.
- SC-ENR-03: La secuencia de selectores conserva un estado determinista, con limpieza de descendientes y cancelación de solicitudes obsoletas.

## Riesgos abiertos y límites

- **Límite de alcance**: No crea administración de catálogos, traslados intranuales ni edición de identidad; esos comportamientos pertenecen al backend.
- **Riesgo**: Si el backend está en un commit no autorizado o catálogo obsoleto, la carga puede rechazar selecciones cargadas; la UI debe mostrar recarga sin tratar ese caso como éxito.
- **Riesgo abierto**: Dependencia de accesibilidad y pruebas contractuales de P0 aún bloqueada por la estrategia de PR no resuelta (`T003`).
