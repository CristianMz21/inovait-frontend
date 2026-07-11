import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  type OnInit,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { AgeDistributionComponent } from "./age-distribution/age-distribution.component";
import { TeacherCountsBySectorComponent } from "./teacher-counts-by-sector/teacher-counts-by-sector.component";
import { TopSchoolsComponent } from "./top-schools/top-schools.component";

type ReportSectionId = "age-report" | "sector-report" | "top-schools-report";

interface ReportSection {
  readonly id: ReportSectionId;
  readonly label: string;
  readonly summary: string;
}

const REPORT_SECTIONS: readonly ReportSection[] = [
  {
    id: "age-report",
    label: "Distribución por edad",
    summary: "Rangos 3–7, 8–12 y mayores de 12 años",
  },
  {
    id: "sector-report",
    label: "Docentes por sector",
    summary: "Docentes distintos en escuelas públicas y privadas",
  },
  {
    id: "top-schools-report",
    label: "Escuelas líderes",
    summary: "Escuelas con mayor matrícula y empates preservados",
  },
];

function isReportSectionId(value: string | null): value is ReportSectionId {
  return REPORT_SECTIONS.some((section) => section.id === value);
}

/**
 * Shell operativo de `/reports` (WU10).
 *
 * Expone una sola ruta con navegación interna por anclas y tres secciones
 * autónomas. Cada sección aloja el componente de reporte correspondiente;
 * no hay child routes ni consumo de `student-history` en este cambio.
 *
 * La suscripción al fragmento se cierra con `takeUntilDestroyed()` y la
 * sección activa se conserva en Signals para mantener el template sin
 * suscripciones manuales.
 */
@Component({
  selector: "app-reports-shell",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    AgeDistributionComponent,
    TeacherCountsBySectorComponent,
    TopSchoolsComponent,
  ],
  templateUrl: "./reports-shell.component.html",
  styleUrl: "./reports-shell.component.scss",
})
export class ReportsShellComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly active = signal<ReportSectionId>("age-report");

  readonly sections =
    signal<readonly ReportSection[]>(REPORT_SECTIONS).asReadonly();
  readonly activeSectionId = this.active.asReadonly();
  readonly activeSectionLabel = computed(() => {
    const activeId = this.active();
    return (
      this.sections().find((section) => section.id === activeId)?.label ??
      "Distribución por edad"
    );
  });

  ngOnInit(): void {
    this.route.fragment
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((fragment) => {
        if (isReportSectionId(fragment)) {
          this.active.set(fragment);
        }
      });
  }

  isActive(sectionId: ReportSectionId): boolean {
    return this.active() === sectionId;
  }
}
