import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { API_CONFIG } from '../api/api-config';
import type { AcademicYearSummary } from '../api/dtos/academic-year-summary.dto';
import type { ClassGroupSummary } from '../api/dtos/class-group-summary.dto';
import type { GradeSummary } from '../api/dtos/grade-summary.dto';
import type { SchoolSummary } from '../api/dtos/school-summary.dto';
import type { SchoolTeacherSummary } from '../api/dtos/school-teacher-summary.dto';
import type { SubjectSummary } from '../api/dtos/subject-summary.dto';
import type { TeacherSummary } from '../api/dtos/teacher-summary.dto';

/**
 * Parámetros opcionales para `listClassGroups`. Cada filtro se omite cuando
 * es `undefined` para no forzar `422` por combinaciones inválidas: el
 * contrato declara que toda combinación existente es consultable.
 */
export interface ListClassGroupsParams {
  readonly schoolId?: number;
  readonly gradeId?: number;
  readonly academicYearId?: number;
}

function toHttpParams(params: ListClassGroupsParams | undefined): HttpParams {
  let httpParams = new HttpParams();
  if (!params) {
    return httpParams;
  }
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      httpParams = httpParams.set(key, String(value));
    }
  }
  return httpParams;
}

/**
 * Servicio de transporte HTTP para catálogos canónicos del backend.
 * Devuelve `Observable<T>` sin estado; los consumidores (facades) deben
 * aplicar cancelación y descarte de respuestas obsoletas.
 */
@Injectable({ providedIn: 'root' })
export class CatalogApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  listSchools(): Observable<readonly SchoolSummary[]> {
    return this.http
      .get<readonly SchoolSummary[]>(`${this.config.apiBaseUrl}/api/schools`)
      .pipe(map((data) => [...data]));
  }

  listGrades(): Observable<readonly GradeSummary[]> {
    return this.http
      .get<readonly GradeSummary[]>(`${this.config.apiBaseUrl}/api/grades`)
      .pipe(map((data) => [...data]));
  }

  listAcademicYears(): Observable<readonly AcademicYearSummary[]> {
    return this.http
      .get<readonly AcademicYearSummary[]>(
        `${this.config.apiBaseUrl}/api/academic-years`,
      )
      .pipe(map((data) => [...data]));
  }

  listClassGroups(
    params?: ListClassGroupsParams,
  ): Observable<readonly ClassGroupSummary[]> {
    return this.http
      .get<readonly ClassGroupSummary[]>(
        `${this.config.apiBaseUrl}/api/class-groups`,
        { params: toHttpParams(params) },
      )
      .pipe(map((data) => [...data]));
  }

  listTeachers(): Observable<readonly TeacherSummary[]> {
    return this.http
      .get<readonly TeacherSummary[]>(`${this.config.apiBaseUrl}/api/teachers`)
      .pipe(map((data) => [...data]));
  }

  listSubjects(): Observable<readonly SubjectSummary[]> {
    return this.http
      .get<readonly SubjectSummary[]>(`${this.config.apiBaseUrl}/api/subjects`)
      .pipe(map((data) => [...data]));
  }

  listTeachersBySchool(
    schoolId: number,
    asOfDate?: string,
  ): Observable<readonly SchoolTeacherSummary[]> {
    let params = new HttpParams();
    if (asOfDate) {
      params = params.set('asOfDate', asOfDate);
    }
    return this.http
      .get<readonly SchoolTeacherSummary[]>(
        `${this.config.apiBaseUrl}/api/schools/${schoolId}/teachers`,
        { params },
      )
      .pipe(map((data) => [...data]));
  }
}
