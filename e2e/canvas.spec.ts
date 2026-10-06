import { test, expect } from "@playwright/test";

test.use({ locale: "es-AR", viewport: { width: 1400, height: 900 } });

test("renders every subject of the plan as a focusable button", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("button[id^='subject-']")).toHaveCount(42);
});

test("clicking a subject opens its detail and energizes its conductors", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#subject-electrotecnia-2").click();
  await expect(
    page.getByRole("heading", { level: 2, name: "Electrotecnia II" }),
  ).toBeVisible();
  await expect(page.getByText("Tenés que tenerlas cursadas")).toBeVisible();
  expect(await page.locator(".prereq-energize").count()).toBeGreaterThan(0);
  expect(
    await page.locator(".prereq-edge[data-state='dim']").count(),
  ).toBeGreaterThan(0);

  await page.keyboard.press("Escape");
  await expect(page.locator(".prereq-energize")).toHaveCount(0);
});

test("is fully operable with the keyboard", async ({ page }) => {
  await page.goto("/");
  await page.locator("#subject-fisica-2").focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { level: 2, name: "Física II" }),
  ).toBeVisible();

  const focusedId = () => page.evaluate(() => document.activeElement?.id);

  await page.keyboard.press("ArrowLeft");
  await expect
    .poll(focusedId)
    .toMatch(/^subject-(analisis-matematico-1|fisica-1)$/);

  await page.keyboard.press("ArrowRight");
  await expect.poll(focusedId).toMatch(/^subject-/);
});

test("the detail panel links to related subjects", async ({ page }) => {
  await page.goto("/");
  await page.locator("#subject-fisica-2").click();
  await page
    .getByRole("button", { name: /Análisis Matemático I$/ })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { level: 2, name: "Análisis Matemático I" }),
  ).toBeVisible();
});

test("shows more conductors when all prerequisites are requested", async ({
  page,
}) => {
  await page.goto("/");
  const edges = page.locator(".prereq-edge");
  await expect(edges).toHaveCount(148);
  await page.getByLabel("Mostrar todas las correlativas").check();
  await expect(edges).toHaveCount(153);
});

test("the detail panel shows the graduate profile section as a draft", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#subject-analisis-matematico-1").click();
  await expect(
    page.getByRole("heading", { level: 3, name: "Qué aporta a tu perfil" }),
  ).toBeVisible();
  await expect(page.getByText("Borrador", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Todavía no hay competencias asignadas a esta materia."),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Todavía no hay alcances del título vinculados a esta materia.",
    ),
  ).toBeVisible();
});

test("the competency lens lists every official competency and explains an empty result", async ({
  page,
}) => {
  await page.goto("/");
  const select = page.getByRole("combobox", { name: /^Competencia/ });
  await expect(select.locator("optgroup")).toHaveCount(3);
  await expect(select.locator("option")).toHaveCount(1 + 10 + 18);

  await select.selectOption("cg-03");
  const status = page.getByRole("status");
  await expect(status).toContainText("CG 3");
  await expect(status).toContainText(
    "Todavía no hay materias asignadas a esta competencia",
  );
  // An empty lens must not dim the whole map.
  await expect(page.locator("#subject-fisica-1")).toHaveCSS("opacity", "1");

  await select.selectOption("");
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("the lens and the labels follow the language", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Cambiar a inglés" }).click();
  await expect(
    page.getByRole("combobox", { name: /^Competency/ }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: /^Competency/ })
    .selectOption("cg-01");
  await expect(page.getByRole("status")).toContainText(
    "Identify, formulate and solve engineering problems",
  );
});

test("a subject with a drafted profile shows its competencies and drives the lens", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#subject-integracion-electrica-1").click();
  await expect(
    page.getByText("Tu primer contacto con la ingeniería eléctrica"),
  ).toBeVisible();
  await expect(page.getByText("Borrador", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /CG 1 Identificar/ }).click();
  await expect(
    page.getByRole("combobox", { name: /^Competencia/ }),
  ).toHaveValue("cg-01");
  await expect(page.locator("#subject-integracion-electrica-1")).toContainText(
    "◔",
  );
  await expect(
    page.locator("#subject-fundamentos-de-informatica"),
  ).toContainText("◔");
  // Subjects outside the lens are dimmed; contributing ones are not.
  await expect(page.locator("#subject-quimica-general")).not.toHaveCSS(
    "opacity",
    "1",
  );
  await expect(page.locator("#subject-fisica-2")).toHaveCSS("opacity", "1");
});

test("a drafted subject can link a reserved activity", async ({ page }) => {
  await page.goto("/");
  await page.locator("#subject-control-automatico").click();
  await expect(page.getByText("AR 1")).toBeVisible();
  await expect(
    page.getByText(/sistemas de control y automatización/),
  ).toBeVisible();
});

test("the panel shows the reference timetable, clearly marked as unconfirmed", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#subject-control-automatico").click();
  await expect(
    page.getByRole("heading", { level: 3, name: "Horarios" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /Referencia: horarios del ciclo 2022 \(Plan 95A\)\. Todavía no están confirmados para 2026\./,
    ),
  ).toBeVisible();
  await expect(page.getByText("Comisión Q4051")).toBeVisible();
  await expect(
    page.getByText("Lunes: 19:00 a 23:00 (módulos 1–5)"),
  ).toBeVisible();
  await expect(page.getByText("Sede: Campus")).toBeVisible();
  await expect(
    page.getByText(/tabla de horas cátedra de la UTN/),
  ).toBeVisible();

  await page.locator("#subject-fisica-1").click();
  await expect(
    page.getByText("Todavía no hay horarios cargados para esta materia."),
  ).toBeVisible();
});

test("several divisions are listed for first-year subjects, in English too", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Cambiar a inglés" }).click();
  await page.locator("#subject-integracion-electrica-1").click();
  await expect(page.getByText(/^Division Q109\d/)).toHaveCount(4);
  await expect(
    page.getByText("Monday: 18:15 to 20:30 (modules 0–2)"),
  ).toBeVisible();
  await expect(page.getByText("Venue: Campus")).toBeVisible();
  await expect(page.getByText(/Not yet confirmed for 2026/)).toBeVisible();
});

test("the detail shows the official data of Ord. 1873: hours, block, competencies, scopes and syllabus", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#subject-electrotecnia-1").click();
  const detail = page.getByRole("complementary", {
    name: "Detalle de la materia",
  });
  await expect(detail.getByText("6", { exact: true }).first()).toBeVisible(); // class hours per week
  await expect(detail.getByText("144 h reloj")).toBeVisible();
  await expect(detail.getByText("Tecnologías básicas")).toBeVisible();
  // Official specific competencies carry no level: they "contribute".
  await expect(
    detail.getByRole("button", {
      name: /CE 1\.1 Desarrollar y aplicar metodologías/,
    }),
  ).toBeVisible();
  await expect(detail.getByText("Aporta").first()).toBeVisible();
  // Scopes derived from them: AR 1 and AR 4.
  await expect(detail.getByText("AR 4")).toBeVisible();
  await expect(
    detail.getByText("AR: actividad reservada · AL: otro alcance del título"),
  ).toBeVisible();

  await detail.getByText("Contenidos mínimos").click();
  await expect(detail.getByText("Transformador.")).toBeVisible();
  await expect(
    detail.getByText("Texto oficial del programa sintético (Ord. C.S. 1873)."),
  ).toBeVisible();
});

test("a competency without level shades the lens as 'contributes' and lists its subjects", async ({
  page,
}) => {
  await page.goto("/?lens=ce-9.1");
  const status = page.getByRole("status");
  await expect(status).toContainText("CE 9.1");
  await expect(status).toContainText("Aporta"); // legend: only what appears
  await expect(status).not.toContainText("Consolida");
  // CE9.1 (computer programs for engineering): Fundamentos de Informática, Cálculo Numérico, Análisis de Señales…
  await expect(
    page.locator("#subject-fundamentos-de-informatica"),
  ).toContainText("◆");
  await expect(page.locator("#subject-calculo-numerico")).toContainText("◆");
  await expect(page.locator("#subject-quimica-general")).not.toHaveCSS(
    "opacity",
    "1",
  );
});

test("the list view names the contribution of an official competency", async ({
  page,
}) => {
  await page.goto("/?view=list&lens=ce-5.1");
  const row = page.getByRole("row").filter({
    has: page.getByRole("rowheader", { name: "Control Automático" }),
  });
  await expect(row).toContainText("Aporta");
});
