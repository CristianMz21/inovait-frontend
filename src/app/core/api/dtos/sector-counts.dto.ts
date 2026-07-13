/* Copyright (c) 2026. All rights reserved. */
/**
 * Respuesta canónica de `getDistinctTeacherCountsBySector` (operationId
 * declarado en `paths/reports.yaml#/api/reports/teacher-counts-by-sector`).
 *
 * Refleja `components/reports.yaml#/schemas/TeacherCountsBySectorResponse`
 * del contrato backend:
 *
 * - `periodStart` / `periodEnd` definen el período vigente (extremos
 *   inclusivos) sobre el que se cuentan contratos `Confirmed`. Cuando la
 *   operadora omite estos parámetros, el backend usa la fecha actual y
 *   rellena ambos campos con ese mismo valor.
 * - `publicDistinctTeacherCount` y `privateDistinctTeacherCount` son los
 *   conteos de docentes distintos por sector: la deduplicación por
 *   `teacherId` la realiza el backend, **no** se recalcula ni se
 *   agrega en el cliente.
 *
 * `additionalProperties: false` en el contrato implica que la UI no debe
 * esperar ni propagar otras propiedades.
 */
export interface TeacherCountsBySectorResponseDto {
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly publicDistinctTeacherCount: number;
  readonly privateDistinctTeacherCount: number;
}
