import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
  selector: "app-enrollments-placeholder",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="route-placeholder" aria-labelledby="route-title">
      <h1 id="route-title" tabindex="-1">Matrículas</h1>
      <p role="status">
        Recorrido P0 planificado en WU02. Esta vista anuncia la ruta y prepara
        el foco para una transición accesible cuando se entregue el formulario
        de alta con selectores dependientes.
      </p>
    </section>
  `,
})
export class EnrollmentsPlaceholderComponent {}
