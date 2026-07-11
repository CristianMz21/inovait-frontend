import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import {
  API_CONFIG,
  DEFAULT_API_CONFIG,
  withApiProblemDetails,
} from '../api';
import { CatalogApiService } from './catalog-api.service';

describe('CatalogApiService', () => {
  let service: CatalogApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withApiProblemDetails()),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        CatalogApiService,
      ],
    });
    service = TestBed.inject(CatalogApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('listSchools() invoca GET /api/schools y resuelve con el payload', () => {
    const payload = [
      { id: 1, name: 'A', sector: 'Public' },
      { id: 2, name: 'B', sector: 'Private' },
    ];

    let received: unknown;
    service.listSchools().subscribe((value) => (received = value));

    const req = http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools`);
    expect(req.request.method).toBe('GET');
    req.flush(payload);

    expect(received).toEqual(payload);
  });

  it('listGrades() invoca GET /api/grades', () => {
    service.listGrades().subscribe();
    const req = http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/grades`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('listAcademicYears() invoca GET /api/academic-years', () => {
    service.listAcademicYears().subscribe();
    const req = http.expectOne(
      `${DEFAULT_API_CONFIG.apiBaseUrl}/api/academic-years`,
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('listClassGroups() envía los filtros como query params', () => {
    service
      .listClassGroups({ schoolId: 1, gradeId: 2, academicYearId: 3 })
      .subscribe();

    const req = http.expectOne((r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/class-groups`);
    expect(req.request.params.get('schoolId')).toBe('1');
    expect(req.request.params.get('gradeId')).toBe('2');
    expect(req.request.params.get('academicYearId')).toBe('3');
    req.flush([]);
  });

  it('listClassGroups() omite filtros undefined', () => {
    service.listClassGroups({ schoolId: 1 }).subscribe();

    const req = http.expectOne((r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/class-groups`);
    expect(req.request.params.has('schoolId')).toBe(true);
    expect(req.request.params.has('gradeId')).toBe(false);
    expect(req.request.params.has('academicYearId')).toBe(false);
    req.flush([]);
  });

  it('listTeachers() invoca GET /api/teachers', () => {
    service.listTeachers().subscribe();
    const req = http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/teachers`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('listSubjects() invoca GET /api/subjects', () => {
    service.listSubjects().subscribe();
    const req = http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/subjects`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('listTeachersBySchool() envía schoolId en el path y asOfDate opcional', () => {
    service.listTeachersBySchool(7).subscribe();
    const req = http.expectOne(
      `${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools/7/teachers`,
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('asOfDate')).toBe(false);
    req.flush([]);

    service.listTeachersBySchool(7, '2026-07-10').subscribe();
    const req2 = http.expectOne(
      `${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools/7/teachers`,
    );
    expect(req2.request.params.get('asOfDate')).toBe('2026-07-10');
    req2.flush([]);
  });
});
