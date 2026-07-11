import type { SchoolSummary } from '../../app/core/api/dtos/school-summary.dto';

export const schoolsFixture: readonly SchoolSummary[] = [
  { id: 1, name: 'Escuela Río Claro', sector: 'Public' },
  { id: 2, name: 'Instituto Horizonte', sector: 'Private' },
  { id: 3, name: 'Colegio Pampa Azul', sector: 'Public' },
];
