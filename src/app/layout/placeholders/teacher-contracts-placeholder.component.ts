import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
  selector: "app-teacher-contracts-placeholder",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="route-placeholder" aria-labelledby="route-title">
      <h1 id="route-title" tabindex="-1">Contratos docentes</h1>
      <p role="status">
        Recorrido P0 planificado en WU04. La vista gestionará creación
        multiescuela atómica y consulta por docente con validación local de
        rango de fechas.
      </p>
    </section>
  `,
})
export class TeacherContractsPlaceholderComponent {}
