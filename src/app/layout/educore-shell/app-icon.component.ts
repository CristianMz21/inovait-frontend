/* Copyright (c) 2026. All rights reserved. */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";

/** Names of the icons available through {@link AppIconComponent}. */
export type AppIconName =
  | "person_add"
  | "manage_search"
  | "badge"
  | "assessment"
  | "history_edu"
  | "menu"
  | "close"
  | "event_available"
  | "check_circle"
  | "error"
  | "update"
  | "star"
  | "inbox";

/**
 * Stroke-based path data for each icon, expressed on a 24x24 grid. Kept as a
 * small const record so adding an icon is a one-line addition — no new
 * markup or branching logic required. Every icon shares the same rendering
 * (fill:none + stroke) so a mix of `<path>` sub-commands stays visually
 * consistent without per-icon styling.
 */
const ICON_PATHS: Readonly<Record<AppIconName, string>> = {
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6L18 18M18 6L6 18",
  event_available: "M4 5h16v14H4ZM3 9.5h18M8 3v4M16 3v4M8.5 14.5l2 2 4-4.5",
  person_add:
    "M9 5A3 3 0 0 1 9 11A3 3 0 0 1 9 5ZM3.5 19A5.5 5.5 0 0 1 14.5 19M19 8v6M16 11h6",
  manage_search: "M11 4A7 7 0 0 1 11 18A7 7 0 0 1 11 4ZM16.5 16.5L21 21",
  badge:
    "M4 4h16v16H4ZM8 6A2 2 0 0 1 8 10A2 2 0 0 1 8 6ZM6 18C6.5 15.5 8 14 10 14S13.5 15.5 14 18M14 8h6M14 12h6",
  assessment: "M4 20V10M10 20V4M16 20V13M4 20h16",
  history_edu: "M12 5A7 7 0 0 1 12 19A7 7 0 0 1 12 5ZM12 9v4l3 2",
  check_circle: "M12 3A9 9 0 1 0 12 21A9 9 0 1 0 12 3ZM7.5 12.5l3 3 6-6.5",
  error: "M12 3A9 9 0 1 0 12 21A9 9 0 1 0 12 3ZM12 8v5M12 16.5v.01",
  update: "M4 12a8 8 0 0 1 14-5.3M20 4v5h-5M20 12a8 8 0 0 1-14 5.3M4 20v-5h5",
  star: "M12 2L14.9 8.5L22 9.3L16.8 14.1L18.2 21L12 17.5L5.8 21L7.2 14.1L2 9.3L9.1 8.5Z",
  inbox: "M4 4h16v14H4ZM4 14h4l2 3h4l2-3h4",
};

/**
 * Decorative inline-SVG icon used across the EduCore shell (nav rail, top
 * bar). Always `aria-hidden` + `focusable="false"`: every call site pairs
 * the icon with adjacent visible text, so the accessible name of the
 * enclosing control must remain that text alone.
 *
 * An unrecognized `name` renders nothing rather than throwing. `name` is
 * typed as {@link AppIconName}, so this only happens through a
 * type-unsafe call (e.g. dynamic data) — failing silently keeps the shell
 * resilient instead of crashing the whole app over a missing icon.
 */
@Component({
  selector: "app-icon",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (path(); as d) {
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path [attr.d]="d" />
      </svg>
    }
  `,
})
export class AppIconComponent {
  readonly name = input.required<AppIconName>();
  protected readonly path = computed(() => ICON_PATHS[this.name()]);
}
