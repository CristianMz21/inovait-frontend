/**
 * Sub-banda de edad reportada por `getAgeDistribution`. Refleja la
 * definición de `components/reports.yaml#/schemas/AgeBandResponse` del
 * contrato canónico: `minimumAge` y `maximumAge` definen el rango
 * inclusivo (`maximumAge: null` indica "sin tope superior"). `count`
 * reporta la cantidad de estudiantes cuya edad efectiva cae dentro del
 * rango a la fecha de referencia.
 *
 * La UI conserva los campos exactos del backend: no se recalculan ni se
 * agregan rangos en el cliente.
 */
export interface AgeBandResponse {
  readonly minimumAge: number;
  readonly maximumAge: number | null;
  readonly count: number;
}

/**
 * Respuesta canónica de `getAgeDistribution` (operationId declarado en
 * `paths/reports.yaml`). Devuelve el conteo de inscripciones agrupadas en
 * las tres bandas oficiales (`age3To7`, `age8To12`, `ageOver12`) para un
 * año académico concreto, opcionalmente acotado por una escuela o grado.
 *
 * - `academicYearId` es obligatorio.
 * - `schoolId`/`gradeId` son filtros opcionales que el backend rellena con
 *   `null` cuando no se aplicaron.
 * - `asOfDate` refleja la fecha que el backend usó para calcular la edad
 *   efectiva (puede ser la actual si la operadora omitió el parámetro).
 *
 * El shape es exacto: cualquier propiedad nueva o renombrada requiere
 * un delta en el contrato y, eventualmente, un delta en
 * `openspec/specs/municipal-reports/spec.md`.
 */
export interface AgeDistributionResponseDto {
  readonly academicYearId: number;
  readonly schoolId: number | null;
  readonly gradeId: number | null;
  readonly asOfDate: string;
  readonly age3To7: AgeBandResponse;
  readonly age8To12: AgeBandResponse;
  readonly ageOver12: AgeBandResponse;
}
