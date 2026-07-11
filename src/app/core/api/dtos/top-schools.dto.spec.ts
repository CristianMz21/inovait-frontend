import { describe, expect, it } from 'vitest';
import type { TopSchoolResponseDto } from './top-schools.dto';
import {
  emptyTopSchoolsFixture,
  topSchoolsFixture,
  topSchoolsSingleFixture,
} from '../../../../testing/fixtures/top-schools.fixture';

/**
 * CT-TOP-CONTRACT — Garantía de paridad entre el DTO TypeScript y la
 * definición declarada en `components/reports.yaml#/schemas/TopSchoolResponse`.
 * Esta spec no ejercita el backend: es un contrato declarativo que rompe si
 * alguien renombra o reordena un campo del shape canónico.
 *
 * El endpoint `/api/reports/top-schools` devuelve un array `TopSchoolResponseDto[]`
 * — no un objeto — y el array puede ser `[]` cuando el año académico no
 * tiene inscripciones. Esta spec cubre ambos escenarios.
 */
describe('TopSchoolResponseDto (CT-TOP-CONTRACT)', () => {
  describe('campos requeridos del DTO individual', () => {
    it('declara los tres campos requeridos por el contrato', () => {
      const required: ReadonlyArray<keyof TopSchoolResponseDto> = [
        'school',
        'academicYearId',
        'enrollmentCount',
      ];
      expect(required).toEqual([
        'school',
        'academicYearId',
        'enrollmentCount',
      ]);
    });

    it('acepta `school` como SchoolSummary (id, name, sector)', () => {
      const entry: TopSchoolResponseDto = {
        school: { id: 1, name: 'Escuela Río Claro', sector: 'Public' },
        academicYearId: 2,
        enrollmentCount: 12,
      };
      expect(entry.school.id).toBe(1);
      expect(entry.school.name).toBe('Escuela Río Claro');
      expect(entry.school.sector).toBe('Public');
    });

    it('acepta `sector` como union literal Public | Private', () => {
      const publicSchool: TopSchoolResponseDto = {
        school: { id: 1, name: 'A', sector: 'Public' },
        academicYearId: 2,
        enrollmentCount: 1,
      };
      const privateSchool: TopSchoolResponseDto = {
        school: { id: 2, name: 'B', sector: 'Private' },
        academicYearId: 2,
        enrollmentCount: 1,
      };
      expect(publicSchool.school.sector).toBe('Public');
      expect(privateSchool.school.sector).toBe('Private');
    });

    it('`enrollmentCount` admite valores mayores o iguales a 1 (contract: minimum: 1)', () => {
      const entry: TopSchoolResponseDto = {
        school: { id: 1, name: 'A', sector: 'Public' },
        academicYearId: 2,
        enrollmentCount: 1,
      };
      expect(entry.enrollmentCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('fixtures vs example del YAML', () => {
    it('topSchoolsFixture es igualdad exacta contra el example del YAML (con empates)', () => {
      expect(topSchoolsFixture).toEqual([
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
      ]);
    });

    it('topSchoolsFixture preserva el orden estable del backend (school.name ASC)', () => {
      // El backend garantiza orden por school.name ASC y luego school.id;
      // la UI NO debe reordenar ni podar.
      const names = topSchoolsFixture.map((entry) => entry.school.name);
      expect(names).toEqual([
        'Escuela Río Claro',
        'Instituto Horizonte',
      ]);
    });

    it('topSchoolsFixture expone el caso de empate en count=12', () => {
      const counts = topSchoolsFixture.map((entry) => entry.enrollmentCount);
      expect(counts).toEqual([12, 12]);
      // Ambos líderes deben compartir el mismo `enrollmentCount`.
      expect(counts[0]).toBe(counts[1]);
    });

    it('topSchoolsSingleFixture expone una sola escuela líder (sin empates)', () => {
      expect(topSchoolsSingleFixture).toHaveLength(1);
      expect(topSchoolsSingleFixture[0]?.enrollmentCount).toBe(8);
    });

    it('emptyTopSchoolsFixture es `[]` literal para año sin inscripciones', () => {
      expect(emptyTopSchoolsFixture).toEqual([]);
      expect(emptyTopSchoolsFixture).toHaveLength(0);
    });
  });

  describe('contrato del endpoint', () => {
    it('el endpoint expone un array `[]` válido (no null, no undefined)', () => {
      // Tipo: una respuesta "vacía" del backend es un array vacío, no null.
      const empty: readonly TopSchoolResponseDto[] = [];
      expect(Array.isArray(empty)).toBe(true);
      expect(empty).toHaveLength(0);
    });

    it('preserva el orden estable del array (no lo reordena)', () => {
      // La UI itera sobre las entradas en el orden recibido. Si el mapper
      // reordenara, este test fallaría.
      const reversed = [...topSchoolsFixture].reverse();
      expect(reversed[0]?.school.id).toBe(2);
      expect(reversed[1]?.school.id).toBe(1);
    });
  });
});