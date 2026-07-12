import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
} from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";

/**
 * Shell raíz de la aplicación. Provee navegación entre las tres rutas P0
 * y dos entradas P1 visibles pero bloqueadas. El header anuncia el documento
 * y la navegación principal queda expuesta como landmark `<nav>` con
 * etiqueta accesible.
 */
@Component({
  selector: "app-root",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class App {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly routeAnnouncement = signal("");

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
}
