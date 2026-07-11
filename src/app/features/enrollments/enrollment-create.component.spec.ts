import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
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
  apiProblemEnrollmentConflictFixture,
  classGroupsFixture,
  createEnrollmentResponseFixture,
  gradesFixture,
  schoolsFixture,
} from '../../../testing/fixtures';
import { EnrollmentCreateComponent } from './enrollment-create.component';

describe('EnrollmentCreateComponent', () => {
  let http: HttpTestingController;
  let component: EnrollmentCreateComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        provideHttpClient(withApiProblemDetails()),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(EnrollmentCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  /** Resuelve los tres GET de catálogos globales disparados en ngOnInit. */
  function flushInitialCatalogs(): void {
    http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools`).flush(schoolsFixture);
    http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/grades`).flush(gradesFixture);
    http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/academic-years`).flush(academicYearsFixture);
  }

  /** Resuelve el GET /api/class-groups disparado por onGradeChange. */
  function flushClassGroupsRequest(): void {
    const req = http.expectOne(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/class-groups`,
    );
    req.flush(classGroupsFixture);
  }

  it('carga catálogos al inicializar', () => {
    flushInitialCatalogs();
    expect(component.schoolOptions().length).toBe(schoolsFixture.length);
    expect(component.academicYearOptions().length).toBe(academicYearsFixture.length);
    expect(component.gradeOptions().length).toBe(gradesFixture.length);
  });

  it('bloquea niveles inferiores hasta seleccionar el padre (School → Year → Grade → Group)', () => {
    flushInitialCatalogs();
    expect(component.isAcademicYearDisabled()).toBe(true);
    expect(component.isGradeDisabled()).toBe(true);
    expect(component.isClassGroupDisabled()).toBe(true);

    component.form.controls.schoolId.setValue(1);
    expect(component.isAcademicYearDisabled()).toBe(false);
    expect(component.isGradeDisabled()).toBe(true);
    expect(component.isClassGroupDisabled()).toBe(true);

    component.form.controls.academicYearId.setValue(2);
    expect(component.isGradeDisabled()).toBe(false);
    expect(component.isClassGroupDisabled()).toBe(true);

    component.form.controls.gradeId.setValue(1);
    expect(component.isClassGroupDisabled()).toBe(false);
  });

  it('limpia selecciones descendientes al cambiar un nivel superior', () => {
    flushInitialCatalogs();
    component.form.controls.schoolId.setValue(1);
    component.form.controls.academicYearId.setValue(2);
    component.form.controls.gradeId.setValue(1);
    flushClassGroupsRequest();
    component.form.controls.classGroupId.setValue(10);
    expect(component.form.controls.classGroupId.value).toBe(10);

    component.form.controls.schoolId.setValue(2);
    expect(component.form.controls.academicYearId.value).toBeNull();
    expect(component.form.controls.gradeId.value).toBeNull();
    expect(component.form.controls.classGroupId.value).toBeNull();
  });

  it('recurre a loadClassGroups cuando la cadena padre está completa', () => {
    flushInitialCatalogs();
    component.form.controls.schoolId.setValue(1);
    component.form.controls.academicYearId.setValue(2);
    component.form.controls.gradeId.setValue(1);

    const req = http.expectOne(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/class-groups`,
    );
    expect(req.request.params.get('schoolId')).toBe('1');
    expect(req.request.params.get('gradeId')).toBe('1');
    expect(req.request.params.get('academicYearId')).toBe('2');
    req.flush(classGroupsFixture);

    expect(component.classGroupOptions().length).toBe(classGroupsFixture.length);
  });

  it('cancela classGroups anterior cuando cambia school antes de responder', () => {
    flushInitialCatalogs();
    component.form.controls.schoolId.setValue(1);
    component.form.controls.academicYearId.setValue(2);
    component.form.controls.gradeId.setValue(1);
    const first = http.expectOne(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/class-groups`,
    );

    component.form.controls.schoolId.setValue(2);
    expect(component.form.controls.academicYearId.value).toBeNull();
    expect(component.form.controls.gradeId.value).toBeNull();
    expect(component.form.controls.classGroupId.value).toBeNull();
    // `first` fue cancelado al limpiar la dependencia.
    expect(first.cancelled).toBe(true);
  });

  it('submit válido ejecuta POST /api/enrollments y refleja success', () => {
    flushInitialCatalogs();
    component.form.patchValue({
      documentType: 'DNI',
      documentNumber: '99.001.101',
      firstNames: 'Ana María',
      lastNames: 'Solís',
      birthDate: '2018-07-10',
    });
    component.form.controls.schoolId.setValue(1);
    component.form.controls.academicYearId.setValue(2);
    component.form.controls.gradeId.setValue(1);

    component.onSubmit();

    flushClassGroupsRequest();

    component.form.controls.classGroupId.setValue(10);
    component.onSubmit();

    const enrollmentReq = http.expectOne(
      `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
    expect(enrollmentReq.request.method).toBe('POST');
    enrollmentReq.flush(createEnrollmentResponseFixture);

    expect(component.isSuccess()).toBe(true);
    const state = component.result();
    if (state.status === 'success') {
      expect(state.data.enrollmentId).toBe(100);
      expect(state.data.fullName).toBe('Ana María Solís');
    }
  });

  it('submit inválido no genera POST y marca todos los campos como touched', () => {
    flushInitialCatalogs();
    component.onSubmit();
    expect(component.form.touched).toBe(true);
    http.expectNone(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`);
  });

  it('submit con 409 expone error mapeado', () => {
    flushInitialCatalogs();
    component.form.patchValue({
      documentType: 'DNI',
      documentNumber: '99.001.101',
      firstNames: 'Ana María',
      lastNames: 'Solís',
      birthDate: '2018-07-10',
      schoolId: 1,
      academicYearId: 2,
      gradeId: 1,
    });
    flushClassGroupsRequest();
    component.form.controls.classGroupId.setValue(10);
    component.onSubmit();

    const req = http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`);
    req.flush(apiProblemEnrollmentConflictFixture, {
      status: 409,
      statusText: 'Conflict',
      headers: { 'Content-Type': 'application/problem+json' },
    });

    expect(component.hasError()).toBe(true);
    expect(component.errorProblem()?.code).toBe('enrollment_conflict');
  });

  it('reset() limpia resultado y valores del formulario', () => {
    flushInitialCatalogs();
    component.form.patchValue({
      documentType: 'DNI',
      documentNumber: '99.001.101',
      firstNames: 'Ana',
      lastNames: 'Solís',
      birthDate: '2018-07-10',
      schoolId: 1,
      academicYearId: 2,
      gradeId: 1,
    });
    flushClassGroupsRequest();
    component.form.controls.classGroupId.setValue(10);
    component.onSubmit();
    http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`).flush(createEnrollmentResponseFixture);

    expect(component.isSuccess()).toBe(true);

    component.onReset();

    expect(component.form.controls.documentType.value).toBe('');
    expect(component.form.controls.schoolId.value).toBeNull();
    expect(component.result().status).toBe('idle');
  });
});