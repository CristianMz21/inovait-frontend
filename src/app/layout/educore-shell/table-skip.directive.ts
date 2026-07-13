/* Copyright (c) 2026. All rights reserved. */
import { DOCUMENT } from "@angular/common";
import { Directive, inject, input } from "@angular/core";

@Directive({
  selector: "button[appTableSkip]",
  host: {
    "(click)": "focusTarget()",
  },
})
export class TableSkipDirective {
  private readonly document = inject(DOCUMENT);

  readonly targetId = input.required<string>({ alias: "appTableSkip" });

  focusTarget(): void {
    this.document.getElementById(this.targetId())?.focus();
  }
}
