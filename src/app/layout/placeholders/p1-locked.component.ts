import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

/**
 * Placeholder para rutas P1 (`/reports`, `/student-history`) que permanecen
 * bloqueadas hasta que la puerta P0 esté aprobada. El componente anuncia el
 * estado de bloqueo y nunca invoca endpoints P1.
 */
@Component({
  selector: 'app-p1-locked',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="route-placeholder" aria-labelledby="route-title">
      <h1 id="route-title" tabindex="-1">{{ title() }}</h1>
      <p role="status">
        Esta sección pertenece a P1 y permanece bloqueada hasta que la puerta
        P0 esté aprobada. Las decisiones y la habilitación se registrarán en
        <code>docs/evaluator-execution.md</code> antes de abrir este recorrido.
      </p>
    </section>
  `,
})
export class P1LockedComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly feature = toSignal(
    this.route.data.pipe(map((data) => (data['lockedFeature'] as string) ?? '')),
    { initialValue: '' },
  );

  readonly title = () => {
    const feature = this.feature();
    if (feature === 'reports') {
      return 'Reportes';
    }
    if (feature === 'student-history') {
      return 'Historia del estudiante';
    }
    return 'Sección bloqueada';
  };
}
