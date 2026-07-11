import { describe, expect, it } from 'vitest';
import {
  emptyStudentHistoryFixture,
  studentHistoryFixture,
  studentHistoryNoAssignmentsFixture,
  studentHistorySecondYearFixture,
} from '../../../testing/fixtures';
import {
  enrollmentHistoryItemToVm,
  studentHistoryFiltersAreValid,
  studentHistoryFiltersToParams,
  studentHistoryResponseToVm,
  weekdayListLabel,
} from './student-history.mappers';
import type { StudentHistoryFiltersVm } from './student-history.vm';

const validFilters: StudentHistoryFiltersVm = {
  documentType: 'DNI',
  documentNumber: '99.001.101',
  asOfDate: null,
};

describe('StudentHistoryMappers (CT-HIST-MAP)', () => {
  describe('studentHistoryFiltersAreValid()', () => {
    it('acepta una VM con ambos segmentos dentro de las longitudes canónicas', () => {
      expect(studentHistoryFiltersAreValid(validFilters)).toBe(true);
    });

    it('rechaza cuando documentType es cadena vacía o sólo espacios', () => {
      expect(
        studentHistoryFiltersAreValid({ ...validFilters, documentType: '' }),
      ).toBe(false);
      expect(
        studentHistoryFiltersAreValid({ ...validFilters, documentType: '   ' }),
      ).toBe(false);
    });

    it('rechaza cuando documentType excede 20 caracteres', () => {
      expect(
        studentHistoryFiltersAreValid({
          ...validFilters,
          documentType: 'A'.repeat(21),
        }),
      ).toBe(false);
    });

    it('rechaza cuando documentNumber es cadena vacía o sólo espacios', () => {
      expect(
        studentHistoryFiltersAreValid({
          ...validFilters,
          documentNumber: '',
        }),
      ).toBe(false);
      expect(
        studentHistoryFiltersAreValid({
          ...validFilters,
          documentNumber: '   ',
        }),
      ).toBe(false);
    });

    it('rechaza cuando documentNumber excede 32 caracteres', () => {
      expect(
        studentHistoryFiltersAreValid({
          ...validFilters,
          documentNumber: 'A'.repeat(33),
        }),
      ).toBe(false);
    });

    it('tolera espacios en los extremos y los recorta', () => {
      expect(
        studentHistoryFiltersAreValid({
          documentType: '  DNI  ',
          documentNumber: '  99.001.101  ',
          asOfDate: null,
        }),
      ).toBe(true);
    });
  });

  describe('studentHistoryFiltersToParams()', () => {
    it('produce el payload canónico mínimo sin query', () => {
      expect(studentHistoryFiltersToParams(validFilters)).toEqual({
        documentType: 'DNI',
        documentNumber: '99.001.101',
      });
    });

    it('envía asOfDate sólo cuando la operadora lo define', () => {
      expect(
        studentHistoryFiltersToParams({
          ...validFilters,
          asOfDate: '2026-07-10',
        }),
      ).toEqual({
        documentType: 'DNI',
        documentNumber: '99.001.101',
        asOfDate: '2026-07-10',
      });
    });

    it('omite asOfDate cuando es vacío o sólo espacios', () => {
      expect(
        studentHistoryFiltersToParams({ ...validFilters, asOfDate: '' }),
      ).toEqual({ documentType: 'DNI', documentNumber: '99.001.101' });
      expect(
        studentHistoryFiltersToParams({ ...validFilters, asOfDate: '   ' }),
      ).toEqual({ documentType: 'DNI', documentNumber: '99.001.101' });
    });

    it('recorta espacios en los segmentos antes de enviarlos', () => {
      expect(
        studentHistoryFiltersToParams({
          documentType: '  DNI  ',
          documentNumber: '  99.001.101  ',
          asOfDate: null,
        }),
      ).toEqual({
        documentType: 'DNI',
        documentNumber: '99.001.101',
      });
    });

    it('devuelve null cuando falta cualquier segmento obligatorio', () => {
      expect(
        studentHistoryFiltersToParams({ ...validFilters, documentType: '' }),
      ).toBeNull();
      expect(
        studentHistoryFiltersToParams({
          ...validFilters,
          documentNumber: '',
        }),
      ).toBeNull();
    });
  });

  describe('weekdayListLabel()', () => {
    it('etiqueta días ISO canónicos en español', () => {
      expect(weekdayListLabel([1, 3, 5])).toBe('Lunes, Miércoles, Viernes');
    });

    it('emite días desconocidos como "Día N" sin lanzar', () => {
      expect(weekdayListLabel([0, 8])).toBe('Día 0, Día 8');
    });
  });

  describe('enrollmentHistoryItemToVm()', () => {
    it('aplana una inscripción con asignaciones preservando el shape canónico', () => {
      const vm = enrollmentHistoryItemToVm(studentHistoryFixture.enrollments[0]!);
      expect(vm.enrollmentId).toBe(100);
      expect(vm.academicYearId).toBe(2);
      expect(vm.academicYearName).toBe('2026');
      expect(vm.academicYearIsCurrent).toBe(true);
      expect(vm.schoolName).toBe('Escuela Río Claro');
      expect(vm.schoolSector).toBe('Public');
      expect(vm.schoolSectorLabel).toBe('Público');
      expect(vm.gradeName).toBe('Grade 1');
      expect(vm.classGroupCode).toBe('A');
    });

    it('preserva teachingAssignments verbatim sin reordenar', () => {
      const vm = enrollmentHistoryItemToVm(
        studentHistorySecondYearFixture.enrollments[0]!,
      );
      expect(vm.teachingAssignments).toHaveLength(2);
      expect(vm.teachingAssignments[0]?.subjectCode).toBe('MATH');
      expect(vm.teachingAssignments[1]?.subjectCode).toBe('LANG');
    });

    it('preserva teachingAssignments: [] para inscripciones sin docentes', () => {
      const vm = enrollmentHistoryItemToVm(
        studentHistoryNoAssignmentsFixture.enrollments[0]!,
      );
      expect(vm.teachingAssignments).toEqual([]);
    });
  });

  describe('studentHistoryResponseToVm() (CT-HIST-MAP)', () => {
    it('aplana la identidad canónica a StudentIdentityVm', () => {
      const vm = studentHistoryResponseToVm(studentHistoryFixture);
      expect(vm.identity.studentId).toBe(50);
      expect(vm.identity.documentType).toBe('DNI');
      expect(vm.identity.documentNumber).toBe('99.001.101');
      expect(vm.identity.firstNames).toBe('Ana María');
      expect(vm.identity.lastNames).toBe('Solís');
      expect(vm.identity.birthDate).toBe('2018-07-10');
    });

    it('compone fullName normalizando espacios múltiples', () => {
      const vm = studentHistoryResponseToVm({
        ...studentHistoryFixture,
        firstNames: 'Ana   María',
        lastNames: 'Solís',
      });
      expect(vm.identity.fullName).toBe('Ana María Solís');
    });

    it('preserva el orden estable de inscripciones (desc por academicYear.startDate)', () => {
      const vm = studentHistoryResponseToVm(studentHistorySecondYearFixture);
      expect(vm.enrollments.map((entry) => entry.academicYearName)).toEqual([
        '2026',
        '2025',
      ]);
    });

    it('mapea una respuesta vacía (200 []) a una VM con enrollments: []', () => {
      const vm = studentHistoryResponseToVm(emptyStudentHistoryFixture);
      expect(vm.enrollments).toEqual([]);
      expect(vm.enrollments).toHaveLength(0);
      expect(vm.identity.documentType).toBe('DNI');
    });

    it('preserva los IDs y etiquetas de asignaciones sin reordenar', () => {
      const vm = studentHistoryResponseToVm(studentHistorySecondYearFixture);
      const firstYear = vm.enrollments[0]!;
      expect(firstYear.teachingAssignments[0]?.weekdaysLabel).toBe(
        'Lunes, Miércoles, Viernes',
      );
      expect(firstYear.teachingAssignments[1]?.weekdaysLabel).toBe(
        'Martes, Jueves',
      );
    });

    it('no muta el DTO de entrada', () => {
      const original = JSON.stringify(studentHistoryFixture);
      studentHistoryResponseToVm(studentHistoryFixture);
      expect(JSON.stringify(studentHistoryFixture)).toBe(original);
    });
  });
});
