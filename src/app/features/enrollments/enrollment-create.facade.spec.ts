import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  API_CONFIG,
  DEFAULT_API_CONFIG,
  withApiProblemDetails,
} from '../../core/api';
import { apiProblemEnrollmentConflictFixture, createEnrollmentResponseFixture } from '../../../testing/fixtures';
import { EnrollmentApiService } from './enrollment.api.service';
import { EnrollmentCreateFacade } from './enrollment-create.facade';
import type { EnrollmentFormVm } from './enrollment-create.vm';

const validForm: EnrollmentFormVm = {
  documentType: 'DNI',
  documentNumber: '99.001.101',
  firstNames: 'Ana María',
  lastNames: 'Solís',
  birthDate: '2018-07-10',
  schoolId: 1,
  academicYearId: 2,
  gradeId: 1,
  classGroupId: 10,
};

const invalidForm: EnrollmentFormVm = {
  ...validForm,
  classGroupId: null,
};

describe('EnrollmentCreateFacade', () => {
  let facade: EnrollmentCreateFacade;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withApiProblemDetails()),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        EnrollmentApiService,
        EnrollmentCreateFacade,
      ],
    });
    facade = TestBed.inject(EnrollmentCreateFacade);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('canSubmit() rechaza la VM cuando falta cualquier referencia académica', () => {
    expect(facade.canSubmit(validForm)).toBe(true);
    expect(facade.canSubmit(invalidForm)).toBe(false);
  });

  it('submit() con VM inválida es no-op y conserva el estado idle', () => {
    facade.submit(invalidForm);
    expect(facade.result().status).toBe('idle');
    http.expectNone(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`);
  });

  it('submit() expone loading y luego success al confirmar la matrícula', () => {
    facade.submit(validForm);
    expect(facade.result().status).toBe('loading');

    const req = http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`);
    req.flush(createEnrollmentResponseFixture);

    const state = facade.result();
    expect(state.status).toBe('success');
    if (state.status === 'success') {
      expect(state.data.enrollmentId).toBe(100);
      expect(state.data.studentReused).toBe(false);
      expect(state.data.fullName).toBe('Ana María Solís');
    }
  });

  it('submit() mapea 409 a error con ProblemDetails sin mutar nada', () => {
    facade.submit(validForm);
    const req = http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`);
    req.flush(apiProblemEnrollmentConflictFixture, {
      status: 409,
      statusText: 'Conflict',
      headers: { 'Content-Type': 'application/problem+json' },
    });

    const state = facade.result();
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.problem.status).toBe(409);
      expect(state.problem.code).toBe('enrollment_conflict');
    }
  });

  it('submit() cancela el envío previo cuando se reenvía (rollback de mutación)', () => {
    facade.submit(validForm);
    const first = http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`);
    expect(facade.result().status).toBe('loading');

    facade.submit(validForm);
    const second = http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`);
    // El primer POST fue cancelado por `unsubscribe()`; HttpTestingController
    // lo refleja marcándolo como cancelado.
    expect(first.cancelled).toBe(true);

    // Si la respuesta tardía del primer POST llega, debe descartarse.
    first.flush(createEnrollmentResponseFixture);
    expect(facade.result().status).toBe('loading');

    // La segunda respuesta sí muta el estado.
    second.flush({
      ...createEnrollmentResponseFixture,
      enrollmentId: 200,
    });
    const state = facade.result();
    expect(state.status).toBe('success');
    if (state.status === 'success') {
      expect(state.data.enrollmentId).toBe(200);
    }
  });

  it('reset() cancela el envío en curso y vuelve a idle', () => {
    facade.submit(validForm);
    const req = http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`);
    expect(facade.result().status).toBe('loading');

    facade.reset();
    expect(req.cancelled).toBe(true);
    expect(facade.result().status).toBe('idle');
  });

  it('retry() reenvía tras un error', () => {
    facade.submit(validForm);
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`)
      .flush(apiProblemEnrollmentConflictFixture, {
        status: 409,
        statusText: 'Conflict',
        headers: { 'Content-Type': 'application/problem+json' },
      });

    expect(facade.result().status).toBe('error');

    facade.retry(validForm);
    const retryReq = http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`);
    retryReq.flush({
      ...createEnrollmentResponseFixture,
      enrollmentId: 300,
    });

    const state = facade.result();
    expect(state.status).toBe('success');
    if (state.status === 'success') {
      expect(state.data.enrollmentId).toBe(300);
    }
  });

  it('retry() no hace nada si el estado vigente no es error', () => {
    facade.submit(validForm);
    http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`);

    facade.retry(validForm);
    // No se emitió un segundo POST: la fachada sigue en `loading`.
    expect(facade.result().status).toBe('loading');
  });
});