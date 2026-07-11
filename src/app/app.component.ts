import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/**
 * Shell raíz de la aplicación. Provee navegación entre las tres rutas P0
 * y dos entradas P1 visibles pero bloqueadas. El header anuncia el documento
 * y la navegación principal queda expuesta como landmark `<nav>` con
 * etiqueta accesible.
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class App {}
