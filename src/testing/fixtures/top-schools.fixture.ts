import type { TopSchoolResponseDto } from '../../app/core/api/dtos/top-schools.dto';

/**
 * Fixture "happy / con empates" de `TopSchoolResponseDto[]` cuando el
 * backend responde `200` con el `example` declarado en
 * `paths/reports.yaml#/api/reports/top-schools.get.responses.200.example`.
 *
 * Refleja el caso canónico de **empates en el máximo** (`count=12`)
 * para un año académico con dos escuelas líderes. El orden es
 * importante: el backend garantiza `school.name` ascendente y luego
 * `school.id`, y la UI debe preservarlo sin reordenar.
 */
export const topSchoolsFixture: readonly TopSchoolResponseDto[] = [
  {
    school: { id: 1, name: 'Escuela Río Claro', sector: 'Public' },
    academicYearId: 2,
    enrollmentCount: 12,
  },
  {
    school: { id: 2, name: 'Instituto Horizonte', sector: 'Private' },
    academicYearId: 2,
    enrollmentCount: 12,
  },
];

/**
 * Fixture "empty / año sin inscripciones" — un año académico sin
 * `Enrollment`. El contrato canónico declara explícitamente que "Un año
 * sin inscripciones devuelve []" (`paths/reports.yaml` descripción del
 * response `200`).
 *
 * La UI debe mapear esta respuesta `200 []` al estado `empty` de
 * `RemoteState<TopSchoolsVm>`, NO a `error` ni a `success` con datos
 * vacíos.
 */
export const emptyTopSchoolsFixture: readonly TopSchoolResponseDto[] = [];

/**
 * Fixture "happy / sin empates" — una sola escuela líder con el
 * `enrollmentCount` máximo y sin empates. Útil para verificar que el
 * mapper preserva una lista unitaria sin reordenar ni podar.
 */
export const topSchoolsSingleFixture: readonly TopSchoolResponseDto[] = [
  {
    school: { id: 3, name: 'Colegio Pampa Azul', sector: 'Public' },
    academicYearId: 2,
    enrollmentCount: 8,
  },
];