# Especificación de capacidad: `municipal-reports`

**Source change**: 001-school-enrollment-management (P0)

## Propósito

Definir los recorridos analíticos municipales en P1 (edad, docentes por sector, escuelas líderes e histórico académico-docente), con activación posterior a la aprobación de P0 y del bloqueo de puerta operacional.

## Requisitos

### Requisito: FR-RPT-001 — Bloqueo por fase y activación

La UI MUST bloquear todos los recorridos `reports` y `student-history` hasta que la puerta P0 esté aprobada y exista una decisión explícita de habilitación de P1.

#### Scenario: Acceso en P0 bloqueado

- GIVEN la puerta P0 aún no aprobada,
- WHEN la operadora intenta navegar a reportes o historial,
- THEN la UI informa estado pendiente y no invoca endpoints P1.

#### Scenario: Desbloqueo controlado de P1

- GIVEN se habilita P1 por decisión explícita,
- WHEN se accede al mismo flujo,
- THEN la navegación procede y los datos se consumen con contratos canónicos.

### Requisito: FR-RPT-002 — Reporte por edad y fecha de referencia

La capacidad de distribución MUST mostrar conteo 3–7 y rangos `3–7`, `8–12` y `>12` usando `asOfDate` o fecha actual, y MUST reportar `0` cuando no hay inscripciones.

#### Scenario: Distribución canónica de edades

- GIVEN estudiantes con edades 2, 3, 7, 8, 12 y 13 y un `asOfDate` válido,
- WHEN se consulta el reporte,
- THEN el tramo 3–7 y los tres rangos reflejan conteos exactos sin agregar o truncar.

#### Scenario: Sin inscripciones

- GIVEN un contexto existente sin inscripciones,
- WHEN se ejecuta el reporte,
- THEN todos los conteos mostrados son cero y sin errores.

### Requisito: FR-RPT-003 — Docentes distintos por sector y escuelas líderes

El reporte de sector y líderes MUST deduplicar por `teacherId` por sector, MUST contar empates completos y MUST conservar el orden estable recibido por backend.

#### Scenario: Docente con doble presencia

- GIVEN un docente con contratos en ambos sectores,
- WHEN se calcula `public/private` de período vigente,
- THEN debe contar una vez en cada sector.

#### Scenario: Empates de líderes

- GIVEN dos o más escuelas empatan en matrícula máxima,
- WHEN se consulta el ranking anual,
- THEN la UI presenta todas las líderes en orden estable.

### Requisito: FR-RPT-004 — Historial académico-docente

El historial MUST consultar por `documentType` + `documentNumber` y MUST mostrar inscripciones por año con asignaciones múltiples sin colapsar relaciones.

#### Scenario: Identidad inexistente

- GIVEN un documento que no existe,
- WHEN se consulta historial,
- THEN el backend responde `404` y la UI informa sin romper la navegación.

#### Scenario: Estudiante con múltiples relaciones

- GIVEN un estudiante con asignaciones múltiples por año,
- WHEN se muestra el historial,
- THEN se preservan docentes, materias y días, incluyendo años sin asignaciones.

## Criterios de éxito

- SC-RPT-01: La apertura de P1 no avanza hasta aprobar `SC-001` de puerta P0 y completar evidencia P0 crítica.
- SC-RPT-02: Los recorridos P1 (`SCN-020` a `SCN-034`) cubren límites de edad, intersección de fechas/semanas, empates y multiplicidad sin recálculos cliente.
- SC-RPT-03: Se conservan límites del contrato en semántica de `422`, evitando estados de error inventados.

## Riesgos abiertos y límites

- **Límite de alcance**: estos recorridos NO forman parte de la puerta P0 y NO se implementan ni validan en la fase inicial.
- **Riesgo**: depende de datos ficticios P1 adicionales (`TeacherCount`, `Age`, `History`) que no deben mezclarse con P0 y solo se habilitan tras P035.
- **Riesgo**: cambios de negocio de backend sobre agregados históricos invalidarían los escenarios de prueba y exigirían re-trazado.
