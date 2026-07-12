import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from "@angular/core";
import { AppIconComponent } from "../../layout/educore-shell/app-icon.component";
import type { RemoteState } from "../api/remote-state";

@Component({
  selector: "app-catalog-status",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppIconComponent],
  templateUrl: "./catalog-status.component.html",
})
export class CatalogStatusComponent {
  readonly state = input.required<RemoteState<readonly unknown[]>>();
  readonly label = input.required<string>();
  readonly testId = input.required<string>();
  readonly retry = output<void>();
  readonly errorProblem = computed(() => {
    const current = this.state();
    return current.status === "error" ? current.problem : null;
  });
}
