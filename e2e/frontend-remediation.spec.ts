import AxeBuilder from "@axe-core/playwright";
import { expect, test as base, type Page } from "@playwright/test";

const test = base.extend<{ appPage: Page }>({
  appPage: async ({ page }, use) => {
    const runtimeFailures: string[] = [];
    const apiRequests: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") {
        runtimeFailures.push(`console.${message.type()}: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) =>
      runtimeFailures.push(`pageerror: ${error.message}`),
    );
    page.on("request", (request) => {
      if (new URL(request.url()).pathname.startsWith("/api/")) {
        apiRequests.push(`${request.method()} ${request.url()}`);
      }
    });
    await page.addInitScript(() => {
      window.__INOVAIT_USE_MOCKS__ = true;
    });

    await use(page);

    expect(runtimeFailures, "browser runtime errors and warnings").toEqual([]);
    expect(
      apiRequests,
      "API requests must be handled before browser networking",
    ).toEqual([]);
  },
});

test("five operative screens render with unique IDs, labels, responsive layout, and no axe violations", async ({
  appPage,
}) => {
  const screens = [
    ["/enrollments", "Nueva matrícula"],
    ["/student-search", "Consulta de estudiantes"],
    ["/teacher-contracts", "Contratos docentes"],
    ["/reports", "Distribución por edad"],
    ["/student-history", "Historial académico-docente"],
  ] as const;

  for (const [path, heading] of screens) {
    await appPage.goto(path);
    await expect(
      appPage.getByRole("heading", { level: 1, name: heading }),
    ).toBeVisible();
    await waitForTerminalInitialState(appPage, path);
    await assertUniqueIdsAndLabels(appPage);
    await expect
      .poll(() =>
        appPage.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      )
      .toBe(true);
    await assertNoAxeViolations(appPage, `${path} initial terminal state`);
  }
});

test("keyboard navigation moves focus to each route heading", async ({
  appPage,
}) => {
  await appPage.goto("/enrollments");
  await appPage.getByRole("link", { name: "Consulta de estudiantes" }).focus();
  await appPage.keyboard.press("Enter");
  await expect(
    appPage.getByRole("heading", { level: 1, name: "Consulta de estudiantes" }),
  ).toBeFocused();

  await appPage.getByRole("link", { name: "Historia" }).focus();
  await appPage.keyboard.press("Enter");
  await expect(
    appPage.getByRole("heading", {
      level: 1,
      name: "Historial académico-docente",
    }),
  ).toBeFocused();
});

test("enrollment cascade synchronizes native and ARIA disabled state", async ({
  appPage,
}) => {
  await appPage.goto("/enrollments");
  const school = appPage.getByLabel("Escuela");
  const year = appPage.getByLabel("Año académico");
  const grade = appPage.getByLabel("Grado");
  const group = appPage.getByLabel("Grupo");

  await expect(year).toBeDisabled();
  await expect(year).toHaveAttribute("aria-disabled", "true");
  await school.selectOption({ label: "Escuela Río Claro · Público" });
  await expect(year).toBeEnabled();
  await expect(year).not.toHaveAttribute("aria-disabled", "true");
  await year.selectOption({ label: "2026 (actual)" });
  await expect(grade).toBeEnabled();
  await grade.selectOption({ label: "Grade 1" });
  await expect(group).toBeEnabled();
  await expect(group.getByRole("option", { name: "Grupo A" })).toBeAttached();
});

test("student search preserves native asOfDate and renders recalculated ages", async ({
  appPage,
}) => {
  await appPage.goto("/student-search");
  await appPage
    .getByLabel("Escuela")
    .selectOption({ label: "Escuela Río Claro · Público" });
  await appPage.getByLabel("Grado").selectOption({ label: "Grade 1" });
  await appPage
    .getByLabel("Año académico")
    .selectOption({ label: "2026 (actual)" });
  const date = appPage.getByLabel("Fecha de referencia (opcional)");
  await expect(date).toHaveAttribute("type", "date");
  await date.fill("2025-07-09");
  await appPage.getByRole("button", { name: "Buscar" }).click();

  const results = appPage.getByTestId("search-results");
  await expect(results).toContainText("2 inscripciones");
  await expect(appPage.getByTestId("search-loading")).toBeHidden();
  await expect(
    results.getByRole("cell", { name: "6", exact: true }),
  ).toBeVisible();
  await expect(
    results.getByRole("cell", { name: "8", exact: true }),
  ).toBeVisible();
  await assertUniqueIdsAndLabels(appPage);
  await assertNoAxeViolations(appPage, "student search success");
});

test("student search renders the valid empty state", async ({ appPage }) => {
  await appPage.goto("/student-search");
  await appPage
    .getByLabel("Escuela")
    .selectOption({ label: "Instituto Horizonte · Privado" });
  await appPage.getByLabel("Grado").selectOption({ label: "Grade 1" });
  await appPage
    .getByLabel("Año académico")
    .selectOption({ label: "2026 (actual)" });
  await appPage.getByRole("button", { name: "Buscar" }).click();
  await expect(appPage.getByTestId("search-empty")).toContainText(
    "Sin coincidencias",
  );
  await expect(appPage.getByTestId("search-loading")).toBeHidden();
  await assertNoAxeViolations(appPage, "student search empty");
});

test("student history ProblemDetails stops loading, restores controls, and shows an alert", async ({
  appPage,
}) => {
  await appPage.goto("/student-history");
  await appPage.getByLabel("Tipo de documento").fill("DNI");
  await appPage.getByLabel("Número de documento").fill("99.001.404");
  await appPage.getByRole("button", { name: "Consultar" }).click();

  await expect(appPage.getByRole("alert")).toContainText(
    "Estudiante no encontrado",
  );
  await expect(appPage.getByTestId("history-loading")).toBeHidden();
  await expect(appPage.getByLabel("Número de documento")).toBeEnabled();
  await expect(
    appPage.getByRole("button", { name: "Consultar" }),
  ).toBeEnabled();
  await assertNoAxeViolations(appPage, "student history error");
});

test("teacher contracts and reports load catalogs and submit mocked forms", async ({
  appPage,
}) => {
  await appPage.goto("/teacher-contracts");
  const createContractsForm = appPage.getByRole("form", {
    name: "Creación de contratos docentes",
  });
  await createContractsForm
    .getByRole("combobox", { name: "Docente", exact: true })
    .selectOption({ index: 1 });
  await createContractsForm.getByLabel("Fecha de inicio").fill("2026-08-01");
  await createContractsForm
    .getByRole("checkbox", { name: /Instituto Horizonte/ })
    .check();
  const createButton = createContractsForm.getByRole("button", {
    name: "Crear contratos",
  });
  await createButton.click();
  await expect(appPage.getByTestId("contracts-create-success")).toBeVisible();
  await assertNoAxeViolations(appPage, "teacher contracts success");

  await appPage.goto("/reports");
  const ageReportForm = appPage.getByRole("form", {
    name: "Filtros de distribución por edad",
  });
  await ageReportForm
    .getByLabel("Año académico")
    .selectOption({ label: "2026 (actual)" });
  await ageReportForm.getByRole("button", { name: "Consultar" }).click();
  const ageResults = appPage.getByTestId("age-results");
  await expect(ageResults).toContainText("3 a 7 años");
  await expect(ageResults).toContainText("8 a 12 años");
  await expect(appPage.getByTestId("age-loading")).toBeHidden();
  await assertNoAxeViolations(appPage, "age report success");
});

async function waitForTerminalInitialState(
  page: Page,
  path: string,
): Promise<void> {
  switch (path) {
    case "/enrollments":
      await expect(
        page
          .getByRole("form", { name: "Formulario de nueva matrícula" })
          .getByLabel("Escuela")
          .getByRole("option", { name: /Escuela Río Claro/ }),
      ).toBeAttached();
      break;
    case "/student-search":
      await expect(
        page
          .getByRole("form", {
            name: "Filtros de consulta de estudiantes",
          })
          .getByRole("option", { name: /Escuela Río Claro/ }),
      ).toBeAttached();
      break;
    case "/teacher-contracts":
      await expect(
        page
          .getByRole("form", { name: "Creación de contratos docentes" })
          .getByRole("combobox", { name: "Docente", exact: true })
          .getByRole("option", { name: /Benítez/ }),
      ).toBeAttached();
      break;
    case "/reports":
      await expect(
        page
          .getByRole("form", {
            name: "Filtros de distribución por edad",
          })
          .getByRole("option", { name: "2026 (actual)" }),
      ).toBeAttached();
      break;
    case "/student-history":
      await expect(
        page
          .getByRole("form", {
            name: "Consulta de historial académico-docente",
          })
          .getByRole("button", { name: "Consultar" }),
      ).toBeDisabled();
      break;
    default:
      throw new Error(`Missing terminal-state assertion for ${path}`);
  }
}

async function assertNoAxeViolations(page: Page, state: string): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, `axe violations: ${state}`).toEqual([]);
}

async function assertUniqueIdsAndLabels(page: Page): Promise<void> {
  const duplicateIds = await page.locator("[id]").evaluateAll((elements) => {
    const counts = new Map<string, number>();
    for (const element of elements) {
      counts.set(element.id, (counts.get(element.id) ?? 0) + 1);
    }
    return [...counts.entries()].filter(([, count]) => count > 1);
  });
  expect(duplicateIds).toEqual([]);

  const controlsWithoutLabels = await page
    .locator("input:not([type=hidden]), select, textarea")
    .evaluateAll((controls) =>
      controls
        .filter((control) => (control as HTMLInputElement).labels?.length === 0)
        .map((control) => control.id),
    );
  expect(controlsWithoutLabels).toEqual([]);
}
