import type {
  AgeBandResponse,
  AgeDistributionResponseDto,
} from "../../app/core/api/dtos/age-distribution.dto";

/**
 * Fixture "happy" de `AgeDistributionResponseDto` cuando el backend
 * responde `200` con el `example` declarado en
 * `paths/reports.yaml#/api/reports/age-distribution.get.responses.200.example`.
 * Refleja tres bandas pobladas para un año académico completo.
 */
export const ageDistributionFixture: AgeDistributionResponseDto = {
  academicYearId: 2,
  schoolId: null,
  gradeId: null,
  asOfDate: "2026-07-10",
  age3To7: { minimumAge: 3, maximumAge: 7, count: 4 },
  age8To12: { minimumAge: 8, maximumAge: 12, count: 6 },
  ageOver12: { minimumAge: 13, maximumAge: null, count: 2 },
};

/**
 * Fixture "empty / sin inscripciones" — un año académico sin
 * `Enrollment`. El contrato canónico garantiza conteos `0` y rangos
 * exactos; la UI debe mostrar los tres tramos en `0` sin error.
 */
export const emptyAgeDistributionFixture: AgeDistributionResponseDto = {
  academicYearId: 2,
  schoolId: 1,
  gradeId: null,
  asOfDate: "2026-07-10",
  age3To7: { minimumAge: 3, maximumAge: 7, count: 0 },
  age8To12: { minimumAge: 8, maximumAge: 12, count: 0 },
  ageOver12: { minimumAge: 13, maximumAge: null, count: 0 },
};

/**
 * Fixture `422 ProblemDetails` para el caso canónico
 * `as_of_date_invalid`: la fecha de referencia precede un nacimiento
 * incluido en el reporte. La UI debe exponer el problema con `role="alert"`
 * y conservar los filtros de la operadora.
 */
export const apiProblemAsOfDateInvalidFixture = {
  type: "https://inovait.local/problems/as-of-date-invalid",
  title: "La fecha de referencia no es válida",
  status: 422,
  code: "as_of_date_invalid",
} as const;

/**
 * Sub-banda auxiliar usada por specs de mappers para verificar la
 * igualdad exacta tras el aplanamiento. No se exporta desde el barrel
 * de fixtures.
 */
export const ageBandFixture: AgeBandResponse = {
  minimumAge: 3,
  maximumAge: 7,
  count: 4,
};
