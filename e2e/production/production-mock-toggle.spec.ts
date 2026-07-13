import AxeBuilder from "@axe-core/playwright";
import { expect, test as base, type Page } from "@playwright/test";

const test = base.extend<{
  monitoredPage: Page;
  apiRequests: string[];
}>({
  apiRequests: async ({}, use) => use([]),
  monitoredPage: async ({ page, apiRequests }, use) => {
    const runtimeFailures: string[] = [];
    page.on("console", message => {
      if (message.type() === "error" || message.type() === "warning") {
        runtimeFailures.push(`console.${message.type()}: ${message.text()}`);
      }
    });
    page.on("pageerror", error => {
      runtimeFailures.push(`pageerror: ${error.message}`);
    });
    await page.route("http://localhost:5000/api/**", async route => {
      apiRequests.push(`${route.request().method()} ${route.request().url()}`);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          studentId: 999,
          documentType: "DNI",
          documentNumber: "99.001.101",
          firstNames: "Production",
          lastNames: "Smoke",
          birthDate: "2018-07-10",
          enrollments: [],
        }),
      });
    });

    await use(page);

    expect(runtimeFailures, "production browser errors and warnings").toEqual(
      [],
    );
  },
});

test("production defaults to mocks=false and reaches the blocked network layer", async ({
  monitoredPage,
  apiRequests,
}) => {
  await submitHistory(monitoredPage, "99.001.101");

  await expect(monitoredPage.getByTestId("history-empty")).toBeVisible();
  await expect(monitoredPage.getByTestId("history-loading")).toBeHidden();
  expect(apiRequests).toHaveLength(1);
  await assertNoAxeViolations(
    monitoredPage,
    "production default network empty",
  );
});

test("boolean false override keeps production mocks disabled", async ({
  monitoredPage,
  apiRequests,
}) => {
  await monitoredPage.addInitScript(() => {
    window.__INOVAIT_USE_MOCKS__ = false;
  });
  await submitHistory(monitoredPage, "99.001.101");

  await expect(monitoredPage.getByTestId("history-empty")).toBeVisible();
  expect(apiRequests).toHaveLength(1);
  await assertNoAxeViolations(monitoredPage, "production boolean false");
});

test("boolean true override enables production mocks without network access", async ({
  monitoredPage,
  apiRequests,
}) => {
  await monitoredPage.addInitScript(() => {
    window.__INOVAIT_USE_MOCKS__ = true;
  });
  await submitHistory(monitoredPage, "99.001.101");

  await expect(monitoredPage.getByTestId("history-results")).toBeVisible();
  expect(apiRequests).toEqual([]);
  await assertNoAxeViolations(monitoredPage, "production boolean true");
});

test("catalog failure renders an accessible retry state", async ({
  monitoredPage,
}) => {
  await monitoredPage.route(
    "http://localhost:5000/api/schools",
    async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ invalid: "catalog response" }),
      });
    },
  );
  await monitoredPage.route("http://localhost:5000/api/grades", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });
  await monitoredPage.route(
    "http://localhost:5000/api/academic-years",
    async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      });
    },
  );

  await monitoredPage.goto("/enrollments");

  const alert = monitoredPage.getByRole("alert");
  await expect(alert).toContainText("No se pudieron cargar escuelas");
  await expect(
    alert.getByRole("button", { name: "Reintentar escuelas" }),
  ).toBeVisible();
  await assertNoAxeViolations(monitoredPage, "catalog error with retry");
});

async function submitHistory(
  page: Page,
  documentNumber: string,
): Promise<void> {
  await page.goto("/student-history");
  const form = page.getByRole("form", {
    name: "Consulta de historial académico-docente",
  });
  await form.getByLabel("Tipo de documento").fill("DNI");
  await form.getByLabel("Número de documento").fill(documentNumber);
  await form.getByRole("button", { name: "Consultar" }).click();
}

async function assertNoAxeViolations(page: Page, state: string): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, `axe violations: ${state}`).toEqual([]);
}
