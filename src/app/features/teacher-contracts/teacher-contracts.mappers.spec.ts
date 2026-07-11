import { describe, expect, it } from 'vitest';
import {
  teacherContractResponseToResult,
  teacherContractsFormIsValid,
  teacherContractsFormToRequest,
} from './teacher-contracts.mappers';
import type { TeacherContractsFormVm } from './teacher-contracts.vm';
import {
  teacherContractsCreatedFixture,
  teacherContractsListedFixture,
} from '../../../testing/fixtures';

const validForm: TeacherContractsFormVm = {
  teacherId: 5,
  schoolIds: [1, 2],
  startDate: '2026-03-01',
  endDate: null,
};

describe('TeacherContractsMappers', () => {
  describe('teacherContractsFormIsValid()', () => {
    it('acepta una VM válida con endDate null', () => {
      expect(teacherContractsFormIsValid(validForm)).toBe(true);
    });

    it('acepta una VM válida con endDate igual o posterior a startDate', () => {
      expect(
        teacherContractsFormIsValid({
          ...validForm,
          endDate: '2026-03-01',
        }),
      ).toBe(true);
      expect(
        teacherContractsFormIsValid({
          ...validForm,
          endDate: '2026-12-31',
        }),
      ).toBe(true);
    });

    it('rechaza cuando teacherId falta', () => {
      expect(
        teacherContractsFormIsValid({ ...validForm, teacherId: null }),
      ).toBe(false);
    });

    it('rechaza cuando schoolIds está vacío', () => {
      expect(
        teacherContractsFormIsValid({ ...validForm, schoolIds: [] }),
      ).toBe(false);
    });

    it('rechaza cuando schoolIds contiene duplicados (regla local 409)', () => {
      expect(
        teacherContractsFormIsValid({
          ...validForm,
          schoolIds: [1, 1],
        }),
      ).toBe(false);
    });

    it('rechaza cuando startDate no tiene formato YYYY-MM-DD', () => {
      expect(
        teacherContractsFormIsValid({ ...validForm, startDate: '' }),
      ).toBe(false);
      expect(
        teacherContractsFormIsValid({ ...validForm, startDate: '01-03-2026' }),
      ).toBe(false);
    });

    it('rechaza cuando endDate no tiene formato YYYY-MM-DD', () => {
      expect(
        teacherContractsFormIsValid({ ...validForm, endDate: 'foo' }),
      ).toBe(false);
    });

    it('rechaza cuando endDate es anterior a startDate', () => {
      expect(
        teacherContractsFormIsValid({
          ...validForm,
          endDate: '2026-02-28',
        }),
      ).toBe(false);
    });
  });

  describe('teacherContractsFormToRequest()', () => {
    it('produce el payload canónico del contrato', () => {
      const result = teacherContractsFormToRequest(validForm);
      expect(result).toEqual({
        teacherId: 5,
        request: {
          schoolIds: [1, 2],
          startDate: '2026-03-01',
          endDate: null,
        },
      });
    });

    it('devuelve null cuando la VM es inválida', () => {
      expect(teacherContractsFormToRequest({ ...validForm, teacherId: null })).toBeNull();
    });

    it('clona schoolIds para no exponer la referencia interna', () => {
      const input: TeacherContractsFormVm = {
        ...validForm,
        schoolIds: [1, 2],
      };
      const result = teacherContractsFormToRequest(input);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.request.schoolIds).not.toBe(input.schoolIds);
        expect(result.request.schoolIds).toEqual(input.schoolIds);
      }
    });
  });

  describe('teacherContractResponseToResult()', () => {
    it('aplana la respuesta 201 a la VM de presentación', () => {
      const [dto] = teacherContractsCreatedFixture;
      if (!dto) {
        throw new Error('fixture vacío');
      }
      const result = teacherContractResponseToResult(dto);
      expect(result).toEqual({
        id: 20,
        teacherId: 5,
        schoolId: 1,
        schoolName: 'Escuela Río Claro',
        schoolSector: 'Público',
        startDate: '2026-03-01',
        endDate: null,
        persistedStatus: 'Confirmed',
        effectiveStatus: 'Effective',
        evaluatedAt: '2026-07-10',
      });
    });

    it('conserva persistedStatus y effectiveStatus como enums separados (FR-TC-003)', () => {
      const [first, second] = teacherContractsListedFixture;
      if (!first || !second) {
        throw new Error('fixture vacío');
      }
      expect(teacherContractResponseToResult(first).persistedStatus).toBe(
        'Cancelled',
      );
      expect(teacherContractResponseToResult(first).effectiveStatus).toBe(
        'Expired',
      );
      expect(teacherContractResponseToResult(second).persistedStatus).toBe(
        'Confirmed',
      );
      expect(teacherContractResponseToResult(second).effectiveStatus).toBe(
        'Effective',
      );
    });

    it('mapea sector Private a etiqueta Privado', () => {
      const [, dto] = teacherContractsCreatedFixture;
      if (!dto) {
        throw new Error('fixture vacío');
      }
      expect(teacherContractResponseToResult(dto).schoolSector).toBe('Privado');
    });
  });
});