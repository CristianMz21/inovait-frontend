import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-student-search-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="route-placeholder" aria-labelledby="route-title">
      <h1 id="route-title" tabindex="-1">Consulta de estudiantes</h1>
      <p role="status">
        Recorrido P0 planificado en WU03. La vista expondrá los filtros
        School + Grade + AcademicYear y la tabla de resultados con estados
        remotos excluyentes.
      </p>
    </section>
  `,
})
export class StudentSearchPlaceholderComponent {}
