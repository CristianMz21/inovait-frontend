/* Copyright (c) 2026. All rights reserved. */
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChildren,
  type OnInit,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { AgeDistributionComponent } from "./age-distribution/age-distribution.component";
import { TeacherCountsBySectorComponent } from "./teacher-counts-by-sector/teacher-counts-by-sector.component";
import { TopSchoolsComponent } from "./top-schools/top-schools.component";

type ReportSectionId = "age-report" | "sector-report" | "top-schools-report";

interface ReportSection {
  readonly id: ReportSectionId;
  readonly label: string;
}

const REPORT_SECTIONS: readonly ReportSection[] = [
  { id: "age-report", label: "Distribución por edad" },
  { id: "sector-report", label: "Docentes por sector" },
  { id: "top-schools-report", label: "Escuelas líderes" },
];

function isReportSectionId(value: string | null): value is ReportSectionId {
  return REPORT_SECTIONS.some(section => section.id === value);
}

/**
 * Shell operativo de `/reports` (WU10 · rediseño de pestañas ARIA).
 *
 * Expone una sola ruta con un `tablist` ARIA de activación manual: las tres
 * secciones permanecen montadas en el DOM (`[hidden]`, nunca `@if`) para
 * conservar el estado de cada `ReportFacade` al alternar de pestaña. El
 * fragmento de la URL sigue siendo el mecanismo de persistencia (deep-link
 * + back/forward): la suscripción existente lo lee, y `activate()` ahora
 * también lo escribe.
 *
 * El `tablist` sigue el patrón de activación manual del WAI-ARIA APG: las
 * flechas y Home/End sólo mueven el foco entre pestañas (tabindex
 * circulante — activa en 0, resto en -1); Enter/Espacio/click son los
 * únicos disparadores de activación.
 */
@Component({
  selector: "app-reports-shell",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AgeDistributionComponent,
    TeacherCountsBySectorComponent,
    TopSchoolsComponent,
  ],
  templateUrl: "./reports-shell.component.html",
  styleUrl: "./reports-shell.component.scss",
})
export class ReportsShellComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly active = signal<ReportSectionId>("age-report");
  private readonly tabButtons =
    viewChildren<ElementRef<HTMLButtonElement>>("tabButton");

  readonly sections =
    signal<readonly ReportSection[]>(REPORT_SECTIONS).asReadonly();
  readonly activeSectionId = this.active.asReadonly();

  ngOnInit(): void {
    this.route.fragment
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(fragment => {
        if (isReportSectionId(fragment)) {
          this.active.set(fragment);
        }
      });
  }

  isActive(sectionId: ReportSectionId): boolean {
    return this.active() === sectionId;
  }

  tabIndexFor(sectionId: ReportSectionId): number {
    if (this.isActive(sectionId)) {
      return 0;
    }
    return -1;
  }

  activate(sectionId: ReportSectionId): void {
    this.active.set(sectionId);
    void this.router.navigate([], {
      relativeTo: this.route,
      fragment: sectionId,
    });
  }

  /**
   * Maneja el teclado del `tablist`. Flechas y Home/End mueven el foco
   * entre botones sin activar ninguno; Enter/Espacio activan la pestaña
   * enfocada. `preventDefault()` en Enter/Espacio evita que el `<button>`
   * dispare además su propio `click` sintético (ver HTML Standard,
   * "activation behavior"), así que cada tecla activa una única vez.
   */
  onTablistKeydown(event: KeyboardEvent, currentId: ReportSectionId): void {
    const sections = this.sections();
    const currentIndex = sections.findIndex(
      section => section.id === currentId,
    );

    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        this.focusTabAt((currentIndex + 1) % sections.length);
        return;
      case "ArrowLeft":
        event.preventDefault();
        this.focusTabAt((currentIndex - 1 + sections.length) % sections.length);
        return;
      case "Home":
        event.preventDefault();
        this.focusTabAt(0);
        return;
      case "End":
        event.preventDefault();
        this.focusTabAt(sections.length - 1);
        return;
      case "Enter":
      case " ":
        event.preventDefault();
        this.activate(currentId);
        return;
      default:
        return;
    }
  }

  private focusTabAt(index: number): void {
    this.tabButtons()[index]?.nativeElement.focus();
  }
}
