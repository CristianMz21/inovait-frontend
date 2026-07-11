import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { App } from './app.component';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('creates the root shell', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the navigation landmark with P0 links', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const nav = compiled.querySelector('nav[aria-label="Navegación principal"]');
    expect(nav).toBeTruthy();
    const links = nav?.querySelectorAll('a') ?? [];
    const labels = Array.from(links).map((a) => a.textContent?.trim() ?? '');
    expect(labels).toContain('Matrículas');
    expect(labels).toContain('Consulta de estudiantes');
    expect(labels).toContain('Contratos docentes');
    expect(labels).toContain('Reportes (P1)');
    expect(labels).toContain('Historia (P1)');
  });

  it('exposes a skip link to main content', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const skip = compiled.querySelector('a.skip-link');
    expect(skip?.getAttribute('href')).toBe('#main');
  });
});
