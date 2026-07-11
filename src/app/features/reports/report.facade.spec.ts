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
  ageDistributionFixture,
  apiProblemAsOfDateInvalidFixture,
  apiProblemBadRequestFixture,
  apiProblemNotFoundFixture,
  apiProblemPeriodInvalidFixture,
  emptyAgeDistributionFixture,
  emptyTeacherCountsBySectorFixture,
  teacherCountsBySectorFixture,
} from '../../../testing/fixtures';
import { ReportApiService } from './report.api.service';
import { ReportFacade } from './report.facade';
import type {
  AgeDistributionFiltersVm,
  TeacherCountsBySectorFiltersVm,
} from './report.vm';

const ageUrl = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/reports/age-distribution`;
const sectorUrl = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/reports/teacher-counts-by-sector`;

const validFilters: AgeDistributionFiltersVm = {
  academicYearId: 2,
  asOfDate: null,
  schoolId: null,
  gradeId: null,
};

const invalidFilters: AgeDistributionFiltersVm = {
  academicYearId: null,
  asOfDate: null,
  schoolId: null,
  gradeId: null,
};

const emptySectorFilters: TeacherCountsBySectorFiltersVm = {
  periodStart: null,
  periodEnd: null,
};

const validSectorFilters: TeacherCountsBySectorFiltersVm = {
  periodStart: '2026-07-01',
  periodEnd: '2026-07-10',
};

const asymmetricSectorFilters: TeacherCountsBySectorFiltersVm = {
  periodStart: '2026-07-01',
  periodEnd: null,
};

describe('ReportFacade (CT-AGE-AGE)', () => {
  let facade: ReportFacade;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withApiProblemDetails()),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        ReportApiService,
        ReportFacade,
      ],
    });
    facade = TestBed.inject(ReportFacade);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  // -- canLoadAge --------------------------------------------------------

  it('canLoadAge() rechaza la VM cuando falta academicYearId', () => {
    expect(facade.canLoadAge(validFilters)).toBe(true);
    expect(facade.canLoadAge(invalidFilters)).toBe(false);
  });

  // -- loadAge: validación ----------------------------------------------

  it('loadAge() con VM inválida es no-op y conserva el estado idle', () => {
    facade.loadAge(invalidFilters);
    expect(facade.ageState().status).toBe('idle');
    http.expectNone((r) => r.url === ageUrl);
  });

  // -- loadAge: success --------------------------------------------------

  it('loadAge() expone loading y luego success con la VM aplanada', () => {
    facade.loadAge(validFilters);
    expect(facade.ageState().status).toBe('loading');

    const req = http.expectOne(
      (r) => r.url === ageUrl && r.method === 'GET',
    );
    expect(req.request.params.get('academicYearId')).toBe('2');
    req.flush(ageDistributionFixture);

    const state = facade.ageState();
    expect(state.status).toBe('success');
    if (state.status === 'success') {
      expect(state.data.academicYearId).toBe(2);
      expect(state.data.bands).toHaveLength(3);
      expect(state.data.bands.map((b) => b.id)).toEqual([
        'age3To7',
        'age8To12',
        'ageOver12',
      ]);
      expect(state.data.totalCount).toBe(12);
    }
  });

  it('loadAge() mapea 200 con ceros a success (no error)', () => {
    facade.loadAge(validFilters);
    http
      .expectOne((r) => r.url === ageUrl && r.method === 'GET')
      .flush(emptyAgeDistributionFixture);

    const state = facade.ageState();
    expect(state.status).toBe('success');
    if (state.status === 'success') {
      expect(state.data.totalCount).toBe(0);
      expect(state.data.bands.every((b) => b.count === 0)).toBe(true);
    }
  });

  // -- loadAge: errores canónicos ---------------------------------------

  it('loadAge() mapea 400 con ProblemDetails a error', () => {
    facade.loadAge({ ...validFilters, academicYearId: 0 });
    const req = http.expectOne(
      (r) => r.url === ageUrl && r.method === 'GET',
    );
    req.flush(apiProblemBadRequestFixture, {
      status: 400,
      statusText: 'Bad Request',
      headers: new HttpHeaders({
        'Content-Type': 'application/problem+json',
      }),
    });

    const state = facade.ageState();
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.problem.status).toBe(400);
      expect(state.problem.code).toBe('invalid_request');
    }
  });

  it('loadAge() mapea 404 con ProblemDetails a error', () => {
    facade.loadAge({ ...validFilters, academicYearId: 9999 });
    http
      .expectOne((r) => r.url === ageUrl && r.method === 'GET')
      .flush(apiProblemNotFoundFixture, {
        status: 404,
        statusText: 'Not Found',
        headers: new HttpHeaders({
          'Content-Type': 'application/problem+json',
        }),
      });

    const state = facade.ageState();
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.problem.status).toBe(404);
      expect(state.problem.code).toBe('resource_not_found');
    }
  });

  it('loadAge() mapea 422 as_of_date_invalid a error conservando los filtros', () => {
    facade.loadAge({ ...validFilters, asOfDate: '2010-01-01' });
    const req = http.expectOne(
      (r) => r.url === ageUrl && r.method === 'GET',
    );
    expect(req.request.params.get('asOfDate')).toBe('2010-01-01');
    req.flush(apiProblemAsOfDateInvalidFixture, {
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: new HttpHeaders({
        'Content-Type': 'application/problem+json',
      }),
    });

    const state = facade.ageState();
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.problem.status).toBe(422);
      expect(state.problem.code).toBe('as_of_date_invalid');
    }
  });

  // -- loadAge: cancel-on-switch ----------------------------------------

  it('loadAge() cancela el envío previo cuando cambia academicYearId', () => {
    facade.loadAge({ ...validFilters, academicYearId: 1 });
    const first = http.expectOne(
      (r) =>
        r.url === ageUrl &&
        r.method === 'GET' &&
        r.params.get('academicYearId') === '1',
    );
    expect(facade.ageState().status).toBe('loading');

    facade.loadAge({ ...validFilters, academicYearId: 2 });
    const second = http.expectOne(
      (r) =>
        r.url === ageUrl &&
        r.method === 'GET' &&
        r.params.get('academicYearId') === '2',
    );
    // El primer GET fue cancelado al despachar el segundo; su respuesta
    // tardía se descarta sin mutar el estado.
    expect(first.cancelled).toBe(true);

    second.flush(ageDistributionFixture);
    const fresh = facade.ageState();
    expect(fresh.status).toBe('success');
    if (fresh.status === 'success') {
      expect(fresh.data.academicYearId).toBe(2);
    }
  });

  // -- resetAge ----------------------------------------------------------

  it('resetAge() cancela el envío en curso y vuelve a idle', () => {
    facade.loadAge(validFilters);
    const req = http.expectOne(
      (r) => r.url === ageUrl && r.method === 'GET',
    );
    expect(facade.ageState().status).toBe('loading');

    facade.resetAge();
    expect(req.cancelled).toBe(true);
    expect(facade.ageState().status).toBe('idle');
  });

  // -- retryAge ----------------------------------------------------------

  it('retryAge() reenvía tras un error con los filtros previos', () => {
    facade.loadAge(validFilters);
    http
      .expectOne((r) => r.url === ageUrl && r.method === 'GET')
      .flush(apiProblemAsOfDateInvalidFixture, {
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: new HttpHeaders({
          'Content-Type': 'application/problem+json',
        }),
      });
    expect(facade.ageState().status).toBe('error');

    facade.retryAge();
    const retryReq = http.expectOne(
      (r) => r.url === ageUrl && r.method === 'GET',
    );
    expect(retryReq.request.params.get('academicYearId')).toBe('2');
    retryReq.flush(ageDistributionFixture);

    const state = facade.ageState();
    expect(state.status).toBe('success');
  });

  it('retryAge() no hace nada si el estado vigente no es error', () => {
    facade.loadAge(validFilters);
    http.expectOne((r) => r.url === ageUrl && r.method === 'GET');

    facade.retryAge();
    // No se crea un nuevo request: el state sigue en `loading`.
    expect(facade.ageState().status).toBe('loading');
    http.expectNone((r) => r.url === ageUrl);
  });

  it('retryAge() no hace nada si los filtros previos son inválidos', () => {
    // No hay envío previo; el estado es `idle`. retryAge() no debe
    // disparar un GET sin filtros válidos.
    facade.retryAge();
    expect(facade.ageState().status).toBe('idle');
    http.expectNone((r) => r.url === ageUrl);
  });

  // -- canLoadSector -----------------------------------------------------

  it('canLoadSector() acepta filtros vacíos (backend usa fecha actual)', () => {
    expect(facade.canLoadSector(emptySectorFilters)).toBe(true);
  });

  it('canLoadSector() rechaza cuando los filtros son asimétricos', () => {
    expect(facade.canLoadSector(asymmetricSectorFilters)).toBe(false);
  });

  // -- loadSector: validación ------------------------------------------

  it('loadSector() con VM asimétrica es no-op y conserva el estado idle', () => {
    facade.loadSector(asymmetricSectorFilters);
    expect(facade.sectorState().status).toBe('idle');
    http.expectNone((r) => r.url === sectorUrl);
  });

  // -- loadSector: success ----------------------------------------------

  it('loadSector() expone loading y luego success con la VM aplanada', () => {
    facade.loadSector(validSectorFilters);
    expect(facade.sectorState().status).toBe('loading');

    const req = http.expectOne(
      (r) => r.url === sectorUrl && r.method === 'GET',
    );
    expect(req.request.params.get('periodStart')).toBe('2026-07-01');
    expect(req.request.params.get('periodEnd')).toBe('2026-07-10');
    req.flush(teacherCountsBySectorFixture);

    const state = facade.sectorState();
    expect(state.status).toBe('success');
    if (state.status === 'success') {
      expect(state.data.periodStart).toBe('2026-07-10');
      expect(state.data.periodEnd).toBe('2026-07-10');
      expect(state.data.sectors).toHaveLength(2);
      expect(state.data.sectors.map((s) => s.id)).toEqual(['public', 'private']);
      expect(state.data.sectors[0]?.distinctTeacherCount).toBe(3);
      expect(state.data.sectors[1]?.distinctTeacherCount).toBe(2);
      expect(state.data.totalDistinctTeacherCount).toBe(5);
    }
  });

  it('loadSector() con filtros vacíos envía GET sin query string', () => {
    facade.loadSector(emptySectorFilters);
    const req = http.expectOne(
      (r) => r.url === sectorUrl && r.method === 'GET',
    );
    expect(req.request.params.has('periodStart')).toBe(false);
    expect(req.request.params.has('periodEnd')).toBe(false);
    req.flush(teacherCountsBySectorFixture);

    expect(facade.sectorState().status).toBe('success');
  });

  it('loadSector() mapea 200 con conteos en 0 a success (no error)', () => {
    facade.loadSector(validSectorFilters);
    http
      .expectOne((r) => r.url === sectorUrl && r.method === 'GET')
      .flush(emptyTeacherCountsBySectorFixture);

    const state = facade.sectorState();
    expect(state.status).toBe('success');
    if (state.status === 'success') {
      expect(state.data.totalDistinctTeacherCount).toBe(0);
      expect(
        state.data.sectors.every((s) => s.distinctTeacherCount === 0),
      ).toBe(true);
    }
  });

  // -- loadSector: errores canónicos -----------------------------------

  it('loadSector() mapea 400 con ProblemDetails a error', () => {
    facade.loadSector({
      periodStart: '2026-07-10',
      periodEnd: '2026-07-10',
    });
    const req = http.expectOne(
      (r) => r.url === sectorUrl && r.method === 'GET',
    );
    req.flush(apiProblemBadRequestFixture, {
      status: 400,
      statusText: 'Bad Request',
      headers: new HttpHeaders({
        'Content-Type': 'application/problem+json',
      }),
    });

    const state = facade.sectorState();
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.problem.status).toBe(400);
      expect(state.problem.code).toBe('invalid_request');
    }
  });

  it('loadSector() mapea 422 period_invalid a error conservando los filtros', () => {
    facade.loadSector({
      periodStart: '2026-07-10',
      periodEnd: '2026-07-01',
    });
    const req = http.expectOne(
      (r) => r.url === sectorUrl && r.method === 'GET',
    );
    req.flush(apiProblemPeriodInvalidFixture, {
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: new HttpHeaders({
        'Content-Type': 'application/problem+json',
      }),
    });

    const state = facade.sectorState();
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.problem.status).toBe(422);
      expect(state.problem.code).toBe('period_invalid');
    }
  });

  // -- loadSector: cancel-on-switch ------------------------------------

  it('loadSector() cancela el envío previo cuando cambia el período', () => {
    facade.loadSector({
      periodStart: '2026-07-01',
      periodEnd: '2026-07-10',
    });
    const first = http.expectOne(
      (r) =>
        r.url === sectorUrl &&
        r.method === 'GET' &&
        r.params.get('periodStart') === '2026-07-01',
    );
    expect(facade.sectorState().status).toBe('loading');

    facade.loadSector({
      periodStart: '2026-08-01',
      periodEnd: '2026-08-10',
    });
    const second = http.expectOne(
      (r) =>
        r.url === sectorUrl &&
        r.method === 'GET' &&
        r.params.get('periodStart') === '2026-08-01',
    );
    // El primer GET fue cancelado al despachar el segundo; su
    // respuesta tardía se descarta sin mutar el estado.
    expect(first.cancelled).toBe(true);

    second.flush(teacherCountsBySectorFixture);
    const fresh = facade.sectorState();
    expect(fresh.status).toBe('success');
    if (fresh.status === 'success') {
      expect(fresh.data.periodStart).toBe('2026-07-10');
    }
  });

  // -- resetSector ------------------------------------------------------

  it('resetSector() cancela el envío en curso y vuelve a idle', () => {
    facade.loadSector(validSectorFilters);
    const req = http.expectOne(
      (r) => r.url === sectorUrl && r.method === 'GET',
    );
    expect(facade.sectorState().status).toBe('loading');

    facade.resetSector();
    expect(req.cancelled).toBe(true);
    expect(facade.sectorState().status).toBe('idle');
  });

  // -- retrySector ------------------------------------------------------

  it('retrySector() reenvía tras un error con los filtros previos', () => {
    facade.loadSector(validSectorFilters);
    http
      .expectOne((r) => r.url === sectorUrl && r.method === 'GET')
      .flush(apiProblemPeriodInvalidFixture, {
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: new HttpHeaders({
          'Content-Type': 'application/problem+json',
        }),
      });
    expect(facade.sectorState().status).toBe('error');

    facade.retrySector();
    const retryReq = http.expectOne(
      (r) => r.url === sectorUrl && r.method === 'GET',
    );
    expect(retryReq.request.params.get('periodStart')).toBe('2026-07-01');
    retryReq.flush(teacherCountsBySectorFixture);

    const state = facade.sectorState();
    expect(state.status).toBe('success');
  });

  it('retrySector() no hace nada si el estado vigente no es error', () => {
    facade.loadSector(validSectorFilters);
    http.expectOne((r) => r.url === sectorUrl && r.method === 'GET');

    facade.retrySector();
    expect(facade.sectorState().status).toBe('loading');
    http.expectNone((r) => r.url === sectorUrl);
  });

  it('retrySector() no hace nada si los filtros previos son inválidos', () => {
    facade.retrySector();
    expect(facade.sectorState().status).toBe('idle');
    http.expectNone((r) => r.url === sectorUrl);
  });

  // -- Independencia entre slots --------------------------------------

  it('loadAge() no afecta el estado del slot sector ni viceversa', () => {
    facade.loadSector(validSectorFilters);
    expect(facade.sectorState().status).toBe('loading');
    expect(facade.ageState().status).toBe('idle');

    http
      .expectOne((r) => r.url === sectorUrl && r.method === 'GET')
      .flush(teacherCountsBySectorFixture);

    facade.loadAge(validFilters);
    expect(facade.ageState().status).toBe('loading');
    expect(facade.sectorState().status).toBe('success');

    http
      .expectOne((r) => r.url === ageUrl && r.method === 'GET')
      .flush(ageDistributionFixture);

    expect(facade.ageState().status).toBe('success');
    expect(facade.sectorState().status).toBe('success');
  });
});