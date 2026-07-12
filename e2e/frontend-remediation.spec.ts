import AxeBuilder from "@axe-core/playwright";
import {
  expect,
  test as base,
  type Locator,
  type Page,
} from "@playwright/test";

const geometryTolerance = 1;

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

test("drawer navigation to a different route closes the drawer and moves focus to the destination heading", async ({
  appPage,
}, testInfo) => {
  // The drawer only exists below the 1024px breakpoint (see
  // app.component.scss `.ec-hamburger` display rule); on desktop-chromium
  // the hamburger is `display: none` and never actionable.
  test.skip(
    testInfo.project.name !== "mobile-chromium",
    "the drawer only exists below the 1024px breakpoint",
  );

  await appPage.goto("/enrollments");
  const hamburger = appPage.getByLabel("Abrir menú de navegación");
  await hamburger.click();
  await expect(hamburger).toHaveAttribute("aria-expanded", "true");

  // Real-browser guard for the suspected inert/focus race: with the drawer
  // open, `<main>` is `[inert]`. Clicking a nav link to a DIFFERENT route
  // closes the drawer (removing `[inert]` from `<main>`) and triggers
  // `onRouteActivate`'s `queueMicrotask(() => heading.focus())`. If the
  // `[inert]` DOM removal lags the focus microtask (zoneless CD flush is
  // itself microtask-scheduled), `focus()` is a silent no-op per the HTML
  // spec — jsdom does not enforce this, so only a real browser can prove it.
  await appPage.getByRole("link", { name: "Consulta de estudiantes" }).click();

  await expect(hamburger).toHaveAttribute("aria-expanded", "false");
  await expect(
    appPage.getByRole("heading", { level: 1, name: "Consulta de estudiantes" }),
  ).toBeVisible();

  const activeElement = await appPage.evaluate(() => ({
    tagName: document.activeElement?.tagName,
    text: document.activeElement?.textContent?.trim(),
  }));
  expect(activeElement).toEqual({
    tagName: "H1",
    text: "Consulta de estudiantes",
  });
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

for (const [path, width] of [
  ["/enrollments", 800],
  ["/enrollments", 320],
  ["/student-search", 1024],
  ["/student-search", 800],
  ["/student-search", 320],
] as const) {
  test(`responsive form containment: ${path} at ${width}px`, async ({
    appPage,
  }) => {
    await appPage.setViewportSize({ width, height: 900 });
    await appPage.goto(path);
    await waitForTerminalInitialState(appPage, path);

    const isEnrollment = path === "/enrollments";
    const form = appPage.getByRole("form", {
      name: isEnrollment
        ? "Formulario de nueva matrícula"
        : "Filtros de consulta de estudiantes",
    });
    const labels = isEnrollment
      ? ["Escuela", "Año académico", "Grado"]
      : ["Escuela", "Grado", "Año académico"];
    for (const label of labels) {
      const select = form.getByRole("combobox", { name: label, exact: true });
      await expect(select).toBeEnabled();
      await selectLongestValidOption(select);
    }

    const date = form.locator('input[type="date"]');
    await expect(date).toHaveAttribute("type", "date");
    await date.fill("2026-07-10");
    await expect(date).toHaveValue("2026-07-10");

    await date.focus();
    await appPage.keyboard.press("Shift+Tab");
    await appPage.keyboard.press("Tab");
    await assertFormGeometry(
      form.locator(isEnrollment ? ".enrollment-field" : ".search-field"),
      date,
      width > 320,
    );
    await expect
      .poll(() =>
        appPage.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      )
      .toBe(true);
  });
}

test("student history handoff stays opaque, restores query-backed search on Back, and resolves on Forward", async ({
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
  await appPage.getByLabel("Fecha de referencia (opcional)").fill("2026-07-10");
  await appPage.getByRole("button", { name: "Buscar" }).click();

  await expect
    .poll(() => new URL(appPage.url()).searchParams.get("schoolId"))
    .toBe("1");
  const searchUrl = new URL(appPage.url());
  expect(searchUrl.pathname).toBe("/student-search");
  expect(Object.fromEntries(searchUrl.searchParams)).toEqual({
    schoolId: "1",
    gradeId: "1",
    academicYearId: "2",
    asOfDate: "2026-07-10",
  });

  await appPage.reload();
  await expect(appPage.getByTestId("search-results")).toContainText(
    "2 inscripciones",
  );
  await expect(
    appPage.getByLabel("Fecha de referencia (opcional)"),
  ).toHaveValue("2026-07-10");

  await appPage
    .getByRole("button", { name: "Ver historial de Ana María Solís" })
    .click();

  await expect(appPage).toHaveURL(/\/student-history\?selection=/);
  const historyUrl = new URL(appPage.url());
  expect(historyUrl.pathname).toBe("/student-history");
  expect(historyUrl.searchParams.get("selection")).toMatch(/^[0-9a-f-]{36}$/);
  expect(historyUrl.href).not.toContain("DNI");
  expect(historyUrl.href).not.toContain("99.001.101");
  const browserHistoryState = await appPage.evaluate(() =>
    JSON.stringify(window.history.state),
  );
  expect(browserHistoryState).not.toContain("DNI");
  expect(browserHistoryState).not.toContain("99.001.101");
  await expect(
    appPage.getByRole("heading", {
      level: 2,
      name: "Línea de tiempo de Ana María Solís",
    }),
  ).toBeVisible();
  await expect(appPage.getByLabel("Tipo de documento")).toHaveValue("DNI");
  await expect(appPage.getByLabel("Número de documento")).toHaveValue(
    "99.001.101",
  );
  await assertUniqueIdsAndLabels(appPage);
  await assertNoAxeViolations(appPage, "student search to history success");

  await appPage.goBack();
  await expect(appPage).toHaveURL(searchUrl.href);
  await expect(appPage.getByTestId("search-results")).toContainText(
    "2 inscripciones",
  );
  await expect(
    appPage
      .getByLabel("Escuela")
      .getByRole("option", { name: "Escuela Río Claro · Público" }),
  ).toHaveJSProperty("selected", true);
  await expect(
    appPage.getByLabel("Grado").getByRole("option", { name: "Grade 1" }),
  ).toHaveJSProperty("selected", true);
  await expect(
    appPage
      .getByLabel("Año académico")
      .getByRole("option", { name: "2026 (actual)" }),
  ).toHaveJSProperty("selected", true);
  await expect(
    appPage.getByLabel("Fecha de referencia (opcional)"),
  ).toHaveValue("2026-07-10");
  await assertNoAxeViolations(appPage, "student search restored after Back");

  await appPage.goForward();
  await expect(appPage).toHaveURL(historyUrl.href);
  await expect(
    appPage.getByRole("heading", {
      level: 2,
      name: "Línea de tiempo de Ana María Solís",
    }),
  ).toBeVisible();

  await appPage.reload();
  await expect(appPage.getByLabel("Tipo de documento")).toHaveValue("");
  await expect(appPage.getByLabel("Número de documento")).toHaveValue("");
  await expect(
    appPage.getByRole("button", { name: "Consultar" }),
  ).toBeDisabled();
  await expect(appPage.getByTestId("history-results")).toBeHidden();
  await assertNoAxeViolations(appPage, "unknown selection after reload");
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

test("reports tabs are keyboard operable and contained at mobile width", async ({
  appPage,
}, testInfo) => {
  // Mobile containment is the point of this test; desktop-chromium already
  // covers the same tablist markup via the "five operative screens" test.
  test.skip(
    testInfo.project.name !== "mobile-chromium",
    "this test targets mobile-width containment",
  );

  await appPage.goto("/reports");
  await waitForTerminalInitialState(appPage, "/reports");

  const tabs = appPage.getByRole("tab");
  await expect(tabs).toHaveCount(3);
  await expect(appPage.locator('[role="tabpanel"]:not([hidden])')).toHaveCount(
    1,
  );
  await expect
    .poll(() =>
      appPage.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    )
    .toBe(true);

  const ageTab = appPage.getByRole("tab", { name: "Distribución por edad" });
  const sectorTab = appPage.getByRole("tab", { name: "Docentes por sector" });
  await expect(ageTab).toHaveAttribute("aria-selected", "true");
  await expect(sectorTab).toHaveAttribute("aria-selected", "false");

  await ageTab.focus();
  await appPage.keyboard.press("ArrowRight");
  await expect(sectorTab).toBeFocused();
  await expect(ageTab).toHaveAttribute("aria-selected", "true");
  await expect(sectorTab).toHaveAttribute("aria-selected", "false");

  await appPage.keyboard.press("Enter");
  await expect(sectorTab).toHaveAttribute("aria-selected", "true");
  await expect(ageTab).toHaveAttribute("aria-selected", "false");
  await expect(appPage.locator("#sector-report")).toBeVisible();
  await expect(appPage.locator('[role="tabpanel"]:not([hidden])')).toHaveCount(
    1,
  );
  await expect.poll(() => new URL(appPage.url()).hash).toBe("#sector-report");

  await assertNoAxeViolations(appPage, "reports tabs mobile");
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

async function selectLongestValidOption(select: Locator): Promise<void> {
  const labels = await select
    .locator("option:not([disabled])")
    .allTextContents();
  const label = labels
    .map((text) => text.trim())
    .sort((a, b) => b.length - a.length)[0]!;
  await select.selectOption({ label });
  await expect(select.locator("option:checked")).toHaveText(label);
}

async function assertFormGeometry(
  fields: Locator,
  focusedControl: Locator,
  requireAdjacentField: boolean,
): Promise<void> {
  await expect(focusedControl).toBeFocused();
  const result = await fields.evaluateAll(
    (elements, { focusedId, tolerance }) => {
      const overlaps = (first: DOMRect, second: DOMRect) =>
        first.left < second.right - tolerance &&
        first.right > second.left + tolerance &&
        first.top < second.bottom - tolerance &&
        first.bottom > second.top + tolerance;
      const pairs = elements.map((field) => {
        const control = field.querySelector<HTMLElement>(
          ':scope > input:not([type="checkbox"]), :scope > select, :scope > textarea',
        )!;
        return {
          field: field.getBoundingClientRect(),
          control: control.getBoundingClientRect(),
          id: control.id,
        };
      });
      const focused = pairs.find(({ id }) => id === focusedId)!;
      const style = getComputedStyle(document.getElementById(focusedId)!);
      const extent =
        parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
      const focusRect = new DOMRect(
        focused.control.left - extent,
        focused.control.top - extent,
        focused.control.width + extent * 2,
        focused.control.height + extent * 2,
      );
      const peers = pairs.filter(
        (pair) =>
          pair.id !== focusedId &&
          Math.abs(pair.field.top - focused.field.top) <= tolerance,
      );
      return {
        contained: pairs.every(
          ({ field, control }) =>
            control.width > 0 &&
            control.height > 0 &&
            control.left >= field.left - tolerance &&
            control.right <= field.right + tolerance,
        ),
        separated: pairs.every((current) =>
          pairs.every(
            (adjacent) =>
              current.id === adjacent.id ||
              Math.abs(current.field.top - adjacent.field.top) > tolerance ||
              !overlaps(current.control, adjacent.field),
          ),
        ),
        focusClear: peers.every((peer) => !overlaps(focusRect, peer.field)),
        peerCount: peers.length,
        outlineStyle: style.outlineStyle,
        outlineColor: style.outlineColor,
        outlineExtent: extent,
      };
    },
    {
      focusedId: (await focusedControl.getAttribute("id"))!,
      tolerance: geometryTolerance,
    },
  );

  expect(result.contained, "controls stay inside their field cells").toBe(true);
  expect(result.separated, "same-row controls stay separate").toBe(true);
  expect(result.focusClear, "focus extent stays clear of same-row fields").toBe(
    true,
  );
  expect(result.outlineStyle).not.toBe("none");
  expect(result.outlineColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(result.outlineExtent).toBeGreaterThan(0);
  if (requireAdjacentField) {
    expect(result.peerCount).toBeGreaterThan(0);
  }
}
