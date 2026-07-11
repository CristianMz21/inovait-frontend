import { HttpHeaders } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  API_CONFIG,
  DEFAULT_API_CONFIG,
  withApiProblemDetails,
} from '../../core/api';
import {
  academicYearsFixture,
  apiProblemNotFoundFixture,
  emptyEnrollmentListResponseFixture,
  enrollmentListResponseFixture,
  gradesFixture,
  schoolsFixture,
} from '../../../testing/fixtures';
import { StudentSearchComponent } from './student-search.component';

describe('StudentSearchComponent', () => {
  let http: HttpTestingController;
  let component: StudentSearchComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        provideHttpClient(withApiProblemDetails()),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(StudentSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  /** Resuelve los tres GET de catálogos globales disparados en ngOnInit. */
  function flushInitialCatalogs(): void {
    http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools`).flush(schoolsFixture);
    http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/grades`).flush(gradesFixture);
    http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/academic-years`).flush(academicYearsFixture);
  }

  it('carga catálogos al inicializar', () => {
    flushInitialCatalogs();
    expect(component.schoolOptions().length).toBe(schoolsFixture.length);
    expect(component.gradeOptions().length).toBe(gradesFixture.length);
    expect(component.academicYearOptions().length).toBe(academicYearsFixture.length);
  });

  it('bloquea el botón Buscar hasta completar la combinación académica', () => {
    flushInitialCatalogs();
    expect(component.form.invalid).toBe(true);

    component.form.patchValue({ schoolId: 1, gradeId: 1 });
    expect(component.form.invalid).toBe(true);

    component.form.patchValue({ schoolId: 1, gradeId: 1, academicYearId: 2 });
    expect(component.form.invalid).toBe(false);
  });

  it('busca cuando la combinación es válida y refleja success con datos', () => {
    flushInitialCatalogs();
    component.form.patchValue({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
    });

    component.onSubmit();

    const req = http.expectOne(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('schoolId')).toBe('1');
    expect(req.request.params.get('gradeId')).toBe('1');
    expect(req.request.params.get('academicYearId')).toBe('2');
    expect(req.request.params.has('asOfDate')).toBe(false);
    req.flush(enrollmentListResponseFixture);

    expect(component.isSuccess()).toBe(true);
    expect(component.isLoading()).toBe(false);
    const rows = component.successData();
    expect(rows?.length).toBe(2);
    expect(rows?.[0].fullName).toBe('Ana María Solís');
  });

  it('envía asOfDate cuando se completa en el formulario', () => {
    flushInitialCatalogs();
    component.form.patchValue({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
      asOfDate: '2026-07-10',
    });

    component.onSubmit();

    const req = http.expectOne(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
    expect(req.request.params.get('asOfDate')).toBe('2026-07-10');
    req.flush(emptyEnrollmentListResponseFixture);

    expect(component.isEmpty()).toBe(true);
  });

  it('submit inválido no genera GET y marca todos los campos como touched', () => {
    flushInitialCatalogs();
    component.onSubmit();
    expect(component.form.touched).toBe(true);
    http.expectNone(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
  });

  it('respuesta 200 [] se traduce a estado empty/noResults', () => {
    flushInitialCatalogs();
    component.form.patchValue({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
    });
    component.onSubmit();
    http
      .expectOne((r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`)
      .flush(emptyEnrollmentListResponseFixture);

    expect(component.isEmpty()).toBe(true);
    expect(component.isSuccess()).toBe(false);
  });

  it('404 con ProblemDetails expone error mapeado', () => {
    flushInitialCatalogs();
    component.form.patchValue({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
    });
    component.onSubmit();
    http
      .expectOne((r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`)
      .flush(apiProblemNotFoundFixture, {
        status: 404,
        statusText: 'Not Found',
        headers: new HttpHeaders({ 'Content-Type': 'application/problem+json' }),
      });

    expect(component.hasError()).toBe(true);
    expect(component.errorProblem()?.code).toBe('resource_not_found');
  });

  it('retry() reenvía la búsqueda tras un error con los filtros vigentes', () => {
    flushInitialCatalogs();
    component.form.patchValue({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
    });
    component.onSubmit();
    http
      .expectOne((r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`)
      .flush(apiProblemNotFoundFixture, {
        status: 404,
        statusText: 'Not Found',
        headers: new HttpHeaders({ 'Content-Type': 'application/problem+json' }),
      });
    expect(component.hasError()).toBe(true);

    component.onRetry();

    const retryReq = http.expectOne(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
    expect(retryReq.request.params.get('schoolId')).toBe('1');
    retryReq.flush(enrollmentListResponseFixture);

    expect(component.isSuccess()).toBe(true);
    expect(component.successData()?.length).toBe(2);
  });

  it('reset() cancela la búsqueda en curso y vuelve a idle', () => {
    flushInitialCatalogs();
    component.form.patchValue({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
    });
    component.onSubmit();
    const req = http.expectOne(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
    expect(component.isLoading()).toBe(true);

    component.onReset();

    expect(req.cancelled).toBe(true);
    expect(component.result().status).toBe('idle');
    expect(component.form.controls.schoolId.value).toBeNull();
  });

  it('cambiar filtros durante loading cancela el GET previo (stale descartado)', () => {
    flushInitialCatalogs();
    component.form.patchValue({ schoolId: 1, gradeId: 1, academicYearId: 2 });
    component.onSubmit();
    const first = http.expectOne(
      (r) =>
        r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments` &&
        r.params.get('schoolId') === '1',
    );

    component.form.patchValue({ schoolId: 2 });
    component.onSubmit();
    const second = http.expectOne(
      (r) =>
        r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments` &&
        r.params.get('schoolId') === '2',
    );
    expect(first.cancelled).toBe(true);

    second.flush(enrollmentListResponseFixture);
    expect(component.isSuccess()).toBe(true);
  });
});
