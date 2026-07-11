import type { TeacherSummary } from '../../app/core/api/dtos/teacher-summary.dto';

export const teachersFixture: readonly TeacherSummary[] = [
  {
    id: 5,
    documentType: 'DNI',
    documentNumber: '88001001',
    firstNames: 'Lucía',
    lastNames: 'Benítez',
  },
  {
    id: 6,
    documentType: 'DNI',
    documentNumber: '88002002',
    firstNames: 'Mariano',
    lastNames: 'Córdoba',
  },
];
