import type { TeacherCountsBySectorResponseDto } from '../../app/core/api/dtos/sector-counts.dto';

/**
 * Fixture "happy" de `TeacherCountsBySectorResponseDto` cuando el backend
 * responde `200` con el `example` declarado en
 * `paths/reports.yaml#/api/reports/teacher-counts-by-sector.get.responses.200.example`.
 * Refleja un período vigente con conteos distintos para ambos sectores.
 */
export const teacherCountsBySectorFixture: TeacherCountsBySectorResponseDto = {
  periodStart: '2026-07-10',
  periodEnd: '2026-07-10',
  publicDistinctTeacherCount: 3,
  privateDistinctTeacherCount: 2,
};

/**
 * Fixture "empty / sin docentes" — un período vigente sin contratos
 * `Confirmed` en ambos sectores. El contrato canónico garantiza que
 * `publicDistinctTeacherCount` y `privateDistinctTeacherCount` se rellenan
 * con `0`. La UI debe presentar ambos sectores en `0` sin tratarlo como
 * error (es una respuesta `200`, no `[]`).
 */
export const emptyTeacherCountsBySectorFixture: TeacherCountsBySectorResponseDto = {
  periodStart: '2026-07-10',
  periodEnd: '2026-07-10',
  publicDistinctTeacherCount: 0,
  privateDistinctTeacherCount: 0,
};

/**
 * Fixture `422 ProblemDetails` para el caso canónico `period_invalid`:
 * `periodEnd < periodStart` viola la regla de rango temporal. La UI debe
 * exponer el problema con `role="alert"` y conservar los filtros.
 */
export const apiProblemPeriodInvalidFixture = {
  type: 'https://inovait.local/problems/period-invalid',
  title: 'El período no es válido',
  status: 422,
  code: 'period_invalid',
  errors: {
    periodEnd: ['Debe ser igual o posterior a periodStart.'],
  },
} as const;
