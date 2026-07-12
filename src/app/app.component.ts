import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from "@angular/router";
import { filter, map } from "rxjs";
import {
  AppIconComponent,
  type AppIconName,
} from "./layout/educore-shell/app-icon.component";

interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: AppIconName;
}

/**
 * Single source of truth for the five operative routes: renders the nav
 * rail links AND resolves the top-bar section title (see
 * {@link resolveSectionTitle}), so the two never drift apart.
 */
const NAV_ITEMS: readonly NavItem[] = [
  { path: "/enrollments", label: "Matrículas", icon: "person_add" },
  {
    path: "/student-search",
    label: "Consulta de estudiantes",
    icon: "manage_search",
  },
  {
    path: "/teacher-contracts",
    label: "Contratos docentes",
    icon: "badge",
  },
  { path: "/reports", label: "Reportes", icon: "assessment" },
  { path: "/student-history", label: "Historia", icon: "history_edu" },
];

const DEFAULT_SECTION_TITLE = "EduCore";

/** Desktop breakpoint above which the nav rail is static, not a drawer. */
const DESKTOP_BREAKPOINT_PX = 1024;

function resolveSectionTitle(url: string): string {
  const path = url.split("?")[0] ?? url;
  return (
    NAV_ITEMS.find((item) => path.startsWith(item.path))?.label ??
    DEFAULT_SECTION_TITLE
  );
}

/**
 * Shell raíz de la aplicación. Provee la navegación EduCore: un riel lateral
 * fijo (≥1024px) que se convierte en drawer accesible con scrim por debajo
 * de ese umbral, más la barra superior con el título de sección vigente.
 * La navegación principal queda expuesta como landmark `<nav>` con
 * etiqueta accesible y estado de página actual.
 */
@Component({
  selector: "app-root",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppIconComponent, RouterLink, RouterLinkActive, RouterOutlet],
  host: {
    "(document:keydown.escape)": "onEscapeKeydown()",
    "(window:resize)": "onWindowResize()",
  },
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class App {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);
  private readonly hamburgerButton =
    viewChild<ElementRef<HTMLButtonElement>>("hamburgerButton");

  protected readonly navItems = NAV_ITEMS;
  readonly routeAnnouncement = signal("");
  protected readonly drawerOpen = signal(false);
  protected readonly sectionTitle = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => resolveSectionTitle(event.urlAfterRedirects)),
    ),
    { initialValue: resolveSectionTitle(this.router.url) },
  );

  constructor() {
    // Any route change closes the drawer — it is mobile-only UX and a new
    // page has just taken focus via `onRouteActivate`, so there is nothing
    // left to contain.
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe(() => this.drawerOpen.set(false));
  }

  onRouteActivate(): void {
    queueMicrotask(() => {
      const heading =
        this.host.nativeElement.querySelector<HTMLElement>("#main h1");
      if (!heading) {
        return;
      }
      heading.focus();
      this.routeAnnouncement.set(heading.textContent?.trim() ?? "");
    });
  }

  protected openDrawer(): void {
    this.drawerOpen.set(true);
    queueMicrotask(() => {
      this.host.nativeElement
        .querySelector<HTMLElement>('nav[aria-label="Navegación principal"] a')
        ?.focus();
    });
  }

  protected closeDrawer(): void {
    if (!this.drawerOpen()) {
      return;
    }
    this.drawerOpen.set(false);
    queueMicrotask(() => {
      this.hamburgerButton()?.nativeElement.focus();
    });
  }

  protected onEscapeKeydown(): void {
    if (this.drawerOpen()) {
      this.closeDrawer();
    }
  }

  /**
   * Guards against a resize-to-desktop leaving `inert` stuck on the top
   * bar/main/footer: the scrim and `[inert]` bindings derive purely from
   * `drawerOpen()`, so if the drawer was left open at a narrow width and
   * the viewport grows past the breakpoint, closing it here is the only
   * way to release them (the CSS media query alone does not touch JS
   * state).
   */
  protected onWindowResize(): void {
    if (this.drawerOpen() && window.innerWidth >= DESKTOP_BREAKPOINT_PX) {
      this.drawerOpen.set(false);
    }
  }
}
