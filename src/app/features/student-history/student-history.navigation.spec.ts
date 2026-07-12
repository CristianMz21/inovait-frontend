import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StudentHistoryNavigationHandoff } from "./student-history.navigation";

const selections = [
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000002",
  "00000000-0000-4000-8000-000000000003",
  "00000000-0000-4000-8000-000000000004",
  "00000000-0000-4000-8000-000000000005",
  "00000000-0000-4000-8000-000000000006",
  "00000000-0000-4000-8000-000000000007",
  "00000000-0000-4000-8000-000000000008",
  "00000000-0000-4000-8000-000000000009",
  "00000000-0000-4000-8000-000000000010",
] as const;

describe("StudentHistoryNavigationHandoff transactional store", () => {
  let handoff: StudentHistoryNavigationHandoff;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    handoff = TestBed.inject(StudentHistoryNavigationHandoff);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it("navigates with an opaque query token and resolves identity only from volatile memory", async () => {
    const selection = "00000000-0000-4000-8000-000000000001";
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(selection);
    const navigate = vi.spyOn(router, "navigate").mockResolvedValue(true);

    await handoff.navigateToHistory({
      documentType: "DNI",
      documentNumber: "99.001.101",
    });

    expect(navigate).toHaveBeenCalledWith(["/student-history"], {
      queryParams: { selection },
    });
    expect(handoff.resolveSelection(selection)).toEqual({
      documentType: "DNI",
      documentNumber: "99.001.101",
    });
    expect(handoff.resolveSelection("unknown-selection")).toBeNull();
  });

  it("evicts the oldest selection when the volatile handoff reaches its bound", async () => {
    const randomUUID = vi.spyOn(globalThis.crypto, "randomUUID");
    for (const selection of selections.slice(0, 9)) {
      randomUUID.mockReturnValueOnce(selection);
    }
    vi.spyOn(router, "navigate").mockResolvedValue(true);

    for (const [index] of selections.slice(0, 9).entries()) {
      await handoff.navigateToHistory({
        documentType: "DNI",
        documentNumber: `document-${index + 1}`,
      });
    }

    expect(handoff.resolveSelection(selections[0] ?? null)).toBeNull();
    expect(handoff.resolveSelection(selections[8] ?? null)).toEqual({
      documentType: "DNI",
      documentNumber: "document-9",
    });
  });

  it("rolls back a false navigation at full capacity without evicting prior selections", async () => {
    const randomUUID = vi.spyOn(globalThis.crypto, "randomUUID");
    for (const selection of selections.slice(0, 9)) {
      randomUUID.mockReturnValueOnce(selection);
    }
    const navigate = vi.spyOn(router, "navigate").mockResolvedValue(true);
    for (const [index] of selections.slice(0, 8).entries()) {
      await handoff.navigateToHistory({
        documentType: "DNI",
        documentNumber: `preserved-${index + 1}`,
      });
    }
    navigate.mockResolvedValueOnce(false);

    const navigated = await handoff.navigateToHistory({
      documentType: "DNI",
      documentNumber: "discarded",
    });

    expect(navigated).toBe(false);
    for (const [index, selection] of selections.slice(0, 8).entries()) {
      expect(handoff.resolveSelection(selection)).toEqual({
        documentType: "DNI",
        documentNumber: `preserved-${index + 1}`,
      });
    }
    expect(handoff.resolveSelection(selections[8])).toBeNull();
    expect(randomUUID).toHaveBeenCalledTimes(9);
    expect(navigate).toHaveBeenCalledTimes(9);
  });

  it("rolls back a rejected navigation at full capacity without evicting prior selections", async () => {
    const randomUUID = vi.spyOn(globalThis.crypto, "randomUUID");
    for (const selection of selections.slice(0, 9)) {
      randomUUID.mockReturnValueOnce(selection);
    }
    const navigate = vi.spyOn(router, "navigate").mockResolvedValue(true);
    for (const [index] of selections.slice(0, 8).entries()) {
      await handoff.navigateToHistory({
        documentType: "DNI",
        documentNumber: `preserved-${index + 1}`,
      });
    }
    navigate.mockRejectedValueOnce(new Error("navigation failed"));

    await expect(
      handoff.navigateToHistory({
        documentType: "DNI",
        documentNumber: "discarded",
      }),
    ).rejects.toThrow("navigation failed");

    for (const [index, selection] of selections.slice(0, 8).entries()) {
      expect(handoff.resolveSelection(selection)).toEqual({
        documentType: "DNI",
        documentNumber: `preserved-${index + 1}`,
      });
    }
    expect(handoff.resolveSelection(selections[8])).toBeNull();
    expect(randomUUID).toHaveBeenCalledTimes(9);
    expect(navigate).toHaveBeenCalledTimes(9);
  });

  it("denies and purges selections at the five-minute TTL", async () => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(selections[0]);
    vi.spyOn(router, "navigate").mockResolvedValue(true);
    const now = vi.spyOn(Date, "now").mockReturnValue(1_000);

    await handoff.navigateToHistory({
      documentType: "DNI",
      documentNumber: "expires",
    });
    now.mockReturnValue(300_999);
    expect(handoff.resolveSelection(selections[0])).toEqual({
      documentType: "DNI",
      documentNumber: "expires",
    });

    now.mockReturnValue(301_000);
    expect(handoff.resolveSelection(selections[0])).toBeNull();
  });

  it("does not lose extra capacity when rapid duplicate navigation later fails", async () => {
    const randomUUID = vi.spyOn(globalThis.crypto, "randomUUID");
    for (const selection of selections) {
      randomUUID.mockReturnValueOnce(selection);
    }
    const navigate = vi.spyOn(router, "navigate").mockResolvedValue(true);
    for (let index = 0; index < 8; index += 1) {
      await handoff.navigateToHistory({
        documentType: "DNI",
        documentNumber: `preserved-${index + 1}`,
      });
    }

    let settleFailed: (value: boolean) => void = () => undefined;
    let settleSuccessful: (value: boolean) => void = () => undefined;
    const failedNavigation = new Promise<boolean>((resolve) => {
      settleFailed = resolve;
    });
    const successfulNavigation = new Promise<boolean>((resolve) => {
      settleSuccessful = resolve;
    });
    navigate
      .mockImplementationOnce(() => failedNavigation)
      .mockImplementationOnce(() => successfulNavigation);

    const failed = handoff.navigateToHistory({
      documentType: "DNI",
      documentNumber: "duplicate",
    });
    const successful = handoff.navigateToHistory({
      documentType: "DNI",
      documentNumber: "duplicate",
    });
    settleSuccessful(true);
    await successful;
    settleFailed(false);
    await expect(failed).resolves.toBe(false);

    expect(handoff.resolveSelection(selections[0])).toBeNull();
    expect(handoff.resolveSelection(selections[1])).toEqual({
      documentType: "DNI",
      documentNumber: "preserved-2",
    });
    expect(handoff.resolveSelection(selections[8])).toBeNull();
    expect(handoff.resolveSelection(selections[9])).toEqual({
      documentType: "DNI",
      documentNumber: "duplicate",
    });
  });
});
