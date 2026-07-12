import AxeBuilder from "@axe-core/playwright";
import { expect, test as base, type Page } from "@playwright/test";

// Chromium logs a devtools-only `console.error` ("Failed to load resource:
// the server responded with a status of 404 (Not Found)") for *any* fetch/XHR
// that completes with a non-2xx status, regardless of whether the app handles
// it correctly. This is unavoidable browser instrumentation, not an
// application-level failure, so it is the only message this suite's negative
// path allows through the runtime-failures gate below.
const EXPECTED_NETWORK_LOG =
  "console.error: Failed to load resource: the server responded with a status of 404 (Not Found)";

const test = base.extend<{
  monitoredPage: Page;
}>({
  monitoredPage: async ({ page }, use) => {
    const runtimeFailures: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") {
        runtimeFailures.push(`console.${message.type()}: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => {
      runtimeFailures.push(`pageerror: ${error.message}`);
    });

    await use(page);

    const unexpectedFailures = runtimeFailures.filter(
      (failure) => failure !== EXPECTED_NETWORK_LOG,
    );
    expect(
      unexpectedFailures,
      "production browser errors and warnings",
    ).toEqual([]);
  },
});

test("history 404 renders an explicit error state, never a silent empty", async ({
  monitoredPage,
}) => {
  await monitoredPage.route(
    "http://localhost:5000/api/students/*/*/history",
    async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/problem+json",
        body: JSON.stringify({
          type: "https://inovait.local/problems/student-not-found",
          title: "Estudiante no encontrado",
          status: 404,
          code: "student_not_found",
        }),
      });
    },
  );

  await submitHistory(monitoredPage, "DNI", "99.999.999");

  await expect(monitoredPage.getByTestId("history-error")).toBeVisible();
  await expect(monitoredPage.getByTestId("history-empty")).not.toBeVisible();
  await expect(monitoredPage.getByTestId("history-empty")).toHaveCount(0);
  await assertNoAxeViolations(monitoredPage, "history 404 error state");
});

async function submitHistory(
  page: Page,
  documentType: string,
  documentNumber: string,
): Promise<void> {
  await page.goto("/student-history");
  const form = page.getByRole("form", {
    name: "Consulta de historial académico-docente",
  });
  await form.getByLabel("Tipo de documento").fill(documentType);
  await form.getByLabel("Número de documento").fill(documentNumber);
  await form.getByRole("button", { name: "Consultar" }).click();
}

async function assertNoAxeViolations(page: Page, state: string): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, `axe violations: ${state}`).toEqual([]);
}
