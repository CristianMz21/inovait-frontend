# Especificación de capacidad: `student-search`

**Source change**: 001-school-enrollment-management (P0)

## Propósito

Definir el comportamiento de **Consulta de estudiantes** para buscar inscripciones con filtros académicos mínimos, presentarlas de forma completa y determinista, y distinguir estados de carga, vacío, error y éxito sin introducir nuevas APIs.

## Requisitos

### Requisito: FR-SRCH-001 — Búsqueda conjunta por referencias

La interfaz MUST requerir conjuntamente `School`, `Grade` y `AcademicYear`, y MUST usar esa combinación como filtro único de consulta.

#### Scenario: Búsqueda con resultados

- GIVEN existen inscripciones para la combinación `School` + `Grade` + `AcademicYear`,
- WHEN la operadora ejecuta la consulta,
- THEN la tabla muestra únicamente coincidencias de esa combinación con campos canónicos y orden estable.

#### Scenario: Sin coincidencias con contexto existente

- GIVEN la combinación consultada existe en catálogos pero no tiene inscripciones,
- WHEN se ejecuta la búsqueda,
- THEN la vista muestra estado `empty` sin tratarlo como error.

### Requisito: FR-SRCH-002 — Combos existentes sin excepción de inoperabilidad

La interfaz MUST considerar válida cualquier combinación existente de `School`, `Grade` y `AcademicYear`, sin convertirla en inválida por falta de grupos o inscripciones.

#### Scenario: Combinación sin grupos

- GIVEN la combinación consulta existe y no tiene `ClassGroup`,
- WHEN la búsqueda se ejecuta,
- THEN la vista informa estado de "sin grupos" de forma separada del estado de error.

#### Scenario: Referencia inexistente

- GIVEN una referencia de filtro inexistente,
- WHEN se intenta consultar,
- THEN el backend devuelve `404` y la UI permite corregir ese filtro sin presentar resultados previos.

### Requisito: FR-SRCH-003 — Estados remotos mutuamente excluyentes

Cada recorrido remoto MUST presentar exactamente uno entre `loading`, `error`, `empty` y `success` y debe soportar reintento sin perder el estado de filtros.

#### Scenario: Error recuperable con reintento

- GIVEN falla la consulta por problema transitorio,
- WHEN la operadora pulsa reintentar,
- THEN se reinicia el estado a `loading` y puede volver a `success` o `empty`.

#### Scenario: Cambio de filtros mientras había resultados

- GIVEN existe una lista activa,
- WHEN cambian filtros de referencia,
- THEN la lista previa deja de mostrarse como vigente hasta completar una consulta válida.

### Requisito: FR-SRCH-004 — Acceso a historia condicionado a la puerta P1

La acción “Ver historial” MUST permanecer inaccesible en P0 y MAY become visible solo tras validar la puerta P0 y habilitar P1.

#### Scenario: Acción P1 bloqueada

- GIVEN la puerta P0 no está aprobada,
- WHEN se habilita una fila de estudiante,
- THEN la acción de historial está oculta o deshabilitada y no expone datos sensibles.

#### Scenario: Acción P1 habilitada

- GIVEN P1 ya fue desbloqueada y un documento existe,
- WHEN la operadora invoca “Ver historial”,
- THEN la vista consultada muestra identidad y años con docentes y materias.

## Criterios de éxito

- SC-SRCH-01: `SCN-008` a `SCN-012` y `SCN-FE-004` cumplen en consulta manual y/o automatizada sin paginación ni reordenamientos.
- SC-SRCH-02: La UI distingue correctamente `200` vacío/no-groups de `404` y mantiene `AcademicYear` / `School` / `Grade` requeridos antes de disparar consulta.
- SC-SRCH-03: Ninguna combinación válida existente causa error `422` por "incompatibilidad".

## Riesgos abiertos y límites

- **Límite de alcance**: no se implementa ni edita historial en P0.
- **Riesgo**: variación en la latencia de red puede dejar resultados obsoletos si no se invalida la consulta anterior.
- **Riesgo**: el estado de "sin grupos" debe mostrarse aunque el backend acepte la combinación; si se interpreta como error, la especificación rompe `FR-015/016`.
