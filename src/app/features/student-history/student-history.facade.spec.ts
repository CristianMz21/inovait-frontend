import { HttpHeaders } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  API_CONFIG,
  DEFAULT_API_CONFIG,
  withApiProblemDetails,
} from '../../core/api';
import {
  apiProblemHistoryBadRequestFixture,
  apiProblemStudentNotFoundFixture,
  emptyStudentHistoryFixture,
  studentHistoryFixture,
  studentHistorySecondYearFixture,
} from '../../../testing/fixtures';
import { StudentHistoryApiService } from './student-history.api.service';
import { StudentHistoryFacade } from './student-history.facade';
import type { StudentHistoryFiltersVm } from './student-history.vm';

const completeFilters: StudentHistoryFiltersVm = {
  documentType: 'DNI',
  documentNumber: '99.001.101',
  asOfDate: null,
};

const incompleteFilters: StudentHistoryFiltersVm = {
  documentType: '',
  documentNumber: '99.001.101',
  asOfDate: null,
};

const historyUrl = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments/students/${completeFilters.documentType}/${completeFilters.documentNumber}/history`;

describe('StudentHistoryFacade (CT-HIST-FAC)', () => {
  let facade: StudentHistoryFacade;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withApiProblemDetails()),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        StudentHistoryApiService,
        StudentHistoryFacade,
      ],
    });
    facade = TestBed.inject(StudentHistoryFacade);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('canLoadHistory() rechaza la VM cuando falta cualquier filtro obligatorio', () => {
    expect(facade.canLoadHistory(completeFilters)).toBe(true);
    expect(facade.canLoadHistory(incompleteFilters)).toBe(false);
  });

  it('loadHistory() con VM inválida es no-op y conserva el estado idle', () => {
    facade.loadHistory(incompleteFilters);
    expect(facade.result().status).toBe('idle');
    http.expectNone((r) => r.url.startsWith(historyUrl.split('/DNI')[0]!));
  });

  it('loadHistory() expone loading y luego success al confirmar la consulta', () => {
    facade.loadHistory(completeFilters);
    expect(facade.result().status).toBe('loading');

    const req = http.expectOne((r) => r.url === historyUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('asOfDate')).toBe(false);
    req.flush(studentHistoryFixture);

    const state = facade.result();
    expect(state.status).toBe('success');
    if (state.status === 'success') {
      expect(state.data.identity.fullName).toBe('Ana María Solís');
      expect(state.data.enrollments).toHaveLength(1);
    }
  });

  it('loadHistory() con 200 enrollments: [] mapea a empty/noResults (no error)', () => {
    facade.loadHistory(completeFilters);
    http.expectOne((r) => r.url === historyUrl).flush(emptyStudentHistoryFixture);

    const state = facade.result();
    expect(state.status).toBe('empty');
    if (state.status === 'empty') {
      expect(state.reason).toBe('noResults');
    }
  });

  it('loadHistory() con 404 student_not_found mapea a error con ProblemDetails', () => {
    facade.loadHistory(completeFilters);
    http
      .expectOne((r) => r.url === historyUrl)
      .flush(apiProblemStudentNotFoundFixture, {
        status: 404,
        statusText: 'Not Found',
        headers: new HttpHeaders({ 'Content-Type': 'application/problem+json' }),
      });

    const state = facade.result();
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.problem.status).toBe(404);
      expect(state.problem.code).toBe('student_not_found');
    }
  });

  it('loadHistory() con 400 invalid_request mapea a error', () => {
    facade.loadHistory(completeFilters);
    http
      .expectOne((r) => r.url === historyUrl)
      .flush(apiProblemHistoryBadRequestFixture, {
        status: 400,
        statusText: 'Bad Request',
        headers: new HttpHeaders({ 'Content-Type': 'application/problem+json' }),
      });

    const state = facade.result();
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.problem.status).toBe(400);
      expect(state.problem.code).toBe('invalid_request');
    }
  });

  it('loadHistory() cancela la búsqueda previa cuando cambian los filtros (stale descartado)', () => {
    facade.loadHistory(completeFilters);
    const first = http.expectOne((r) => r.url === historyUrl);
    expect(facade.result().status).toBe('loading');

    facade.loadHistory({ ...completeFilters, documentNumber: '88.200.300' });
    const second = http.expectOne(
      (r) =>
        r.url ===
        `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments/students/DNI/88.200.300/history`,
    );
    expect(first.cancelled).toBe(true);

    second.flush(studentHistorySecondYearFixture);
    const state = facade.result();
    expect(state.status).toBe('success');
    if (state.status === 'success') {
      expect(state.data.enrollments).toHaveLength(2);
    }
  });

  it('descarta respuesta tardía si cambia el sequence antes de que llegue', () => {
    facade.loadHistory(completeFilters);
    const first = http.expectOne((r) => r.url === historyUrl);

    facade.loadHistory({ ...completeFilters, documentNumber: '88.200.300' });
    const second = http.expectOne(
      (r) =>
        r.url ===
        `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments/students/DNI/88.200.300/history`,
    );

    // La primera suscripción se cancela — `flush` rechaza lanzar sobre
    // un request cancelado, por lo que validamos el descarte stale a
    // través del estado de la fachada tras resolver la segunda.
    second.flush(studentHistorySecondYearFixture);
    const state = facade.result();
    expect(state.status).toBe('success');
    if (state.status === 'success') {
      expect(state.data.enrollments).toHaveLength(2);
    }
    expect(first.cancelled).toBe(true);
  });

  it('resetHistory() cancela la búsqueda en curso y vuelve a idle', () => {
    facade.loadHistory(completeFilters);
    const req = http.expectOne((r) => r.url === historyUrl);
    expect(facade.result().status).toBe('loading');

    facade.resetHistory();
    expect(req.cancelled).toBe(true);
    expect(facade.result().status).toBe('idle');
    expect(facade.filters()).toEqual({
      documentType: '',
      documentNumber: '',
      asOfDate: null,
    });
  });

  it('retryHistory() reenvía tras un error usando los filtros vigentes', () => {
    facade.loadHistory(completeFilters);
    http
      .expectOne((r) => r.url === historyUrl)
      .flush(apiProblemStudentNotFoundFixture, {
        status: 404,
        statusText: 'Not Found',
        headers: new HttpHeaders({ 'Content-Type': 'application/problem+json' }),
      });

    expect(facade.result().status).toBe('error');

    facade.retryHistory();
    const retryReq = http.expectOne((r) => r.url === historyUrl);
    expect(retryReq.request.params.has('asOfDate')).toBe(false);
    retryReq.flush(studentHistoryFixture);

    const state = facade.result();
    expect(state.status).toBe('success');
    if (state.status === 'success') {
      expect(state.data.identity.documentNumber).toBe('99.001.101');
    }
  });

  it('retryHistory() también dispara desde empty (noResults)', () => {
    facade.loadHistory(completeFilters);
    http.expectOne((r) => r.url === historyUrl).flush(emptyStudentHistoryFixture);
    expect(facade.result().status).toBe('empty');

    facade.retryHistory();
    const retryReq = http.expectOne((r) => r.url === historyUrl);
    retryReq.flush(studentHistoryFixture);
    expect(facade.result().status).toBe('success');
  });

  it('retryHistory() no hace nada si el estado vigente no es error ni empty', () => {
    facade.loadHistory(completeFilters);
    http.expectOne((r) => r.url === historyUrl);
    facade.retryHistory();
    expect(facade.result().status).toBe('loading');
  });

  it('loadHistory() persiste los filtros vigentes para futuros retry', () => {
    facade.loadHistory({ ...completeFilters, asOfDate: '2026-07-10' });
    const req = http.expectOne((r) => r.url === historyUrl);
    expect(req.request.params.get('asOfDate')).toBe('2026-07-10');
    req.flush(apiProblemStudentNotFoundFixture, {
      status: 404,
      statusText: 'Not Found',
      headers: new HttpHeaders({ 'Content-Type': 'application/problem+json' }),
    });

    expect(facade.filters().asOfDate).toBe('2026-07-10');

    facade.retryHistory();
    const retryReq = http.expectOne((r) => r.url === historyUrl);
    expect(retryReq.request.params.get('asOfDate')).toBe('2026-07-10');
    retryReq.flush(studentHistoryFixture);
    expect(facade.result().status).toBe('success');
  });
});
