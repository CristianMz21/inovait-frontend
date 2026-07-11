# Especificación de capacidad: `teacher-contracts`

**Source change**: 001-school-enrollment-management (P0)

## Propósito

Regular la creación y consulta de contratos docentes en frontend, manteniendo atomicidad por operación multiescuela, sin cambiar la autoridad de negocio del backend.

## Requisitos

### Requisito: FR-TC-001 — Solicitud atómica multiescuela

La interfaz MUST enviar una solicitud de contratos por docente con uno o más `schoolIds` y MUST tratarla atómicamente en UI: si cualquier parte falla, no debe representarse ninguna creación parcial.

#### Scenario: Contratos válidos para varias escuelas

- GIVEN un `Teacher` preexistente y dos escuelas elegibles,
- WHEN se confirma con fechas válidas,
- THEN se muestran contratos independientes por escuela con estado y rango.

#### Scenario: Error parcial

- GIVEN una de las escuelas de la solicitud ya tiene conflicto o datos inválidos,
- WHEN el backend rechaza la operación,
- THEN la UI conserva la selección para corrección y no muestra ningún contrato nuevo de esa solicitud.

### Requisito: FR-TC-002 — Validación local y reglas de período

El formulario MUST requerir al menos una escuela y SHOULD validar localmente que `endDate` sea nula o mayor o igual a `startDate`.

#### Scenario: Rango válido con fin opcional

- GIVEN `startDate` y `endDate` válidos con `endDate` igual o posterior,
- WHEN se confirma,
- THEN la solicitud puede completarse si el backend también lo acepta.

#### Scenario: Rango inválido

- GIVEN `endDate` anterior a `startDate`,
- WHEN se intenta enviar,
- THEN la operación queda bloqueada localmente y no se consulta al backend.

### Requisito: FR-TC-003 — Estados y consulta por docente

La vista MUST mostrar los contratos de un docente en orden canónico por fecha de inicio y escuela, y MUST usar `persistedStatus` y `effectiveStatus` como conceptos separados.

#### Scenario: Consulta inicial sin contratos

- GIVEN el docente no tiene contratos,
- WHEN se consulta su historial,
- THEN la UI muestra estado vacío sin errores y con acción de retry disponible.

#### Scenario: Contratos con escuela repetida

- GIVEN la solicitud incluye la misma escuela repetida o contratos superpuestos en la misma escuela,
- WHEN se consulta el docente,
- THEN la interfaz no muestra una sola vista inconsistente y el backend debe retornar el conflicto canónico.

### Requisito: FR-TC-004 — Errores canónicos y feedback de carga

La interfaz MUST mapear errores canónicos (`400`, `404`, `409`, `422`) al contexto correcto y MUST deshabilitar confirmación durante envío para evitar reenvíos duplicados.

#### Scenario: Error canónico durante envío

- GIVEN un documento docente válido y una fecha de rango inválida por backend,
- WHEN retorna `422`,
- THEN la interfaz conserva los datos corregibles y mantiene el formulario para ajuste.

#### Scenario: Envío en curso

- GIVEN el contrato está en proceso,
- WHEN el usuario pulsa enviar nuevamente,
- THEN el botón permanece deshabilitado y la UI indica estado de carga.

## Criterios de éxito

- SC-TC-01: `SCN-013` a `SCN-019` y `SCN-FE-006` a `SCN-FE-008` se ejecutan sin crear contratos fantasmas.
- SC-TC-02: Los contratos por docente muestran estado persistido, estado efectivo y `evaluatedAt` sin mezcla semántica.
- SC-TC-03: La validación local evita `POST` innecesarios en rango inválido y el estado remoto vuelve al control correcto con reintento.

## Riesgos abiertos y límites

- **Límite de alcance**: no se administra ni mantiene el catálogo de docentes, escuelas o estados; solo se consume lo canónico.
- **Riesgo**: un fin `null` puede requerir lógica de presentación separada para vigencia temporal, si se mezcla con `persistedStatus` produce ambigüedad de negocio.
- **Riesgo**: si el backend cambia la regla de contratos superpuestos por escuela, los tests P0 deben actualizarse tras verify de contrato.
