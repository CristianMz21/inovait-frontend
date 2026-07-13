/* Copyright (c) 2026. All rights reserved. */
import { Injectable, inject } from "@angular/core";
import { Router } from "@angular/router";
import { studentHistoryFiltersToParams } from "./student-history.mappers";
import type { StudentHistoryFiltersVm } from "./student-history.vm";
import { STUDENT_HISTORY_SELECTION_TTL_MS } from "./student-history.constants";

const MAX_VOLATILE_SELECTIONS = 8;

interface VolatileSelection {
  readonly filters: StudentHistoryFiltersVm;
  readonly createdAt: number;
  committed: boolean;
}

/**
 * Root-scoped handoff for navigating from student search to history without
 * persisting document identity in URLs, browser history state, or storage.
 *
 * The URL receives only a random opaque lookup token. Tokens are not an
 * authorization boundary and resolve only while this application instance
 * retains the corresponding bounded in-memory entry for at most five minutes.
 * Capacity eviction is committed only after successful Router navigation.
 */
@Injectable({ providedIn: "root" })
export class StudentHistoryNavigationHandoff {
  private readonly router = inject(Router);
  private readonly selections = new Map<string, VolatileSelection>();

  async navigateToHistory(identity: StudentHistoryFiltersVm): Promise<boolean> {
    const filters = studentHistoryFiltersToParams(identity);
    if (filters === null) {
      return false;
    }

    this.purgeExpired();
    const selection = this.createSelectionToken();
    const entry: VolatileSelection = {
      filters,
      createdAt: Date.now(),
      committed: false,
    };
    this.selections.set(selection, entry);

    let navigated: boolean;
    try {
      navigated = await this.router.navigate(["/student-history"], {
        queryParams: { selection },
      });
    } catch (error: unknown) {
      this.deleteIfCurrent(selection, entry);
      throw error;
    }
    if (!navigated) {
      this.deleteIfCurrent(selection, entry);
      return false;
    }

    const current = this.selections.get(selection);
    if (current === entry) {
      current.committed = true;
    }
    this.purgeExpired();
    this.enforceCommittedBound();
    return true;
  }

  resolveSelection(selection: string | null): StudentHistoryFiltersVm | null {
    this.purgeExpired();
    if (selection === null) {
      return null;
    }
    const entry = this.selections.get(selection);
    if (entry === undefined) {
      return null;
    }
    return { ...entry.filters };
  }

  private createSelectionToken(): string {
    let selection = globalThis.crypto.randomUUID();
    while (this.selections.has(selection)) {
      selection = globalThis.crypto.randomUUID();
    }
    return selection;
  }

  private deleteIfCurrent(
    selection: string,
    expected: VolatileSelection,
  ): void {
    if (this.selections.get(selection) === expected) {
      this.selections.delete(selection);
    }
  }

  private purgeExpired(): void {
    const expiresBefore = Date.now() - STUDENT_HISTORY_SELECTION_TTL_MS;
    for (const [selection, entry] of this.selections) {
      if (entry.createdAt <= expiresBefore) {
        this.selections.delete(selection);
      }
    }
  }

  private enforceCommittedBound(): void {
    const committedSelections = Array.from(this.selections.entries()).filter(
      ([, entry]) => entry.committed,
    );
    const overflow = committedSelections.length - MAX_VOLATILE_SELECTIONS;
    if (overflow <= 0) {
      return;
    }
    for (const [selection] of committedSelections.slice(0, overflow)) {
      this.selections.delete(selection);
    }
  }
}
