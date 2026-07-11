import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_CONFIG, DEFAULT_API_CONFIG } from '../../core/api';
import { success } from '../../core/api/remote-state';
import { CatalogFacade } from '../../core/catalogs/catalog.facade';
import {
  academicYearsFixture,
  gradesFixture,
  schoolsFixture,
} from '../../../testing/fixtures';
import { routes } from '../../app.routes';
import { P1LockedComponent } from '../../layout/placeholders/p1-locked.component';
import { ReportsShellComponent } from './reports-shell.component';

function createCatalogFacadeStub(): CatalogFacade {
  const academicYears = signal(success(academicYearsFixture));
  const schools = signal(success(schoolsFixture));
  const grades = signal(success(gradesFixture));

  return {
    academicYearsState: academicYears.asReadonly(),
    schoolsState: schools.asReadonly(),
    gradesState: grades.asReadonly(),
    loadAcademicYears: () => undefined,
    loadSchools: () => undefined,
    loadGrades: () => undefined,
  } as unknown as CatalogFacade;
}

function styleText(): string {
  return Array.from(document.head.querySelectorAll('style'))
    .map((style) => style.textContent ?? '')
    .join('\n');
}

describe('ReportsShellComponent (WU10-RPT)', () => {
  let fixture: ComponentFixture<ReportsShellComponent>;
  let component: ReportsShellComponent;
  let fragment$: Subject<string | null>;

  beforeEach(() => {
    fragment$ = new Subject<string | null>();
    TestBed.configureTestingModule({
      imports: [ReportsShellComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        { provide: ActivatedRoute, useValue: { fragment: fragment$.asObservable() } },
        { provide: CatalogFacade, useValue: createCatalogFacadeStub() },
      ],
    });
    fixture = TestBed.createComponent(ReportsShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('renderiza tres <section> shell y aloja los tres reportes hijos', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const sections = compiled.querySelectorAll('section.reports-shell-section');

    expect(sections.length).toBe(3);
    expect(Array.from(sections).map((section) => section.id)).toEqual([
      'age-report',
      'sector-report',
      'top-schools-report',
    ]);
    expect(compiled.querySelector('app-age-distribution')).toBeTruthy();
    expect(compiled.querySelector('app-teacher-counts-by-sector')).toBeTruthy();
    expect(compiled.querySelector('app-top-schools')).toBeTruthy();
  });

  it('expone navegación interna por anclas sin child routes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const nav = compiled.querySelector(
      'nav[aria-label="Navegación interna de reportes"]',
    );
    const labels = Array.from(nav?.querySelectorAll('a') ?? []).map((link) =>
      link.querySelector('.reports-shell-link-label')?.textContent?.trim(),
    );

    expect(labels).toEqual([
      'Distribución por edad',
      'Docentes por sector',
      'Escuelas líderes',
    ]);
    expect(nav?.querySelector('a[aria-current="location"]')?.textContent).toContain(
      'Distribución por edad',
    );
  });

  it('actualiza la sección activa con signals y cancela la suscripción al destruir', () => {
    fragment$.next('sector-report');
    fixture.detectChanges();

    expect(component.activeSectionId()).toBe('sector-report');
    expect(component.activeSectionLabel()).toBe('Docentes por sector');

    fragment$.next('unknown-report');
    fixture.detectChanges();
    expect(component.activeSectionId()).toBe('sector-report');

    fixture.destroy();
    fragment$.next('top-schools-report');
    expect(component.activeSectionId()).toBe('sector-report');
  });

  it('mantiene /reports como ruta única y /student-history bloqueada', async () => {
    const reportsRoute = routes.find((route) => route.path === 'reports');
    const studentHistoryRoute = routes.find(
      (route) => route.path === 'student-history',
    );

    expect(reportsRoute?.data).toBeUndefined();
    const reportsComponent = await reportsRoute?.loadComponent?.();
    expect(reportsComponent).toBe(ReportsShellComponent);

    expect(studentHistoryRoute?.data).toEqual({
      lockedFeature: 'student-history',
    });
    const studentHistoryComponent = await studentHistoryRoute?.loadComponent?.();
    expect(studentHistoryComponent).toBe(P1LockedComponent);
  });

  it('incluye media query 320 px y tokens de contraste del sistema', () => {
    const css = styleText();

    expect(css).toContain('max-width: 320px');
    expect(css).toContain('--app-muted');
    expect(css).toContain('--app-accent');
    expect(css).toContain('--app-border');
  });
});
