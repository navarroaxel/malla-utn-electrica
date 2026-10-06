import { test, expect, type Page } from "@playwright/test";

test.use({ locale: "es-AR", viewport: { width: 1400, height: 900 } });

/** Navigates and waits until React has hydrated, so shortcuts and controlled inputs are live. */
async function open(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}

const focusedId = (page: Page) =>
  page.evaluate(() => document.activeElement?.id);

test.describe("shareable URL", () => {
  test("selecting a subject and a lens is reflected in the URL and restored from it", async ({
    page,
  }) => {
    await open(page, "/");
    await page.locator("#subject-electrotecnia-1").click();
    await expect(page).toHaveURL(/[?&]s=electrotecnia-1/);
    await page
      .getByRole("combobox", { name: /^Competencia/ })
      .selectOption("cg-02");
    await expect(page).toHaveURL(/lens=cg-02/);

    await page.reload();
    await expect(
      page.getByRole("heading", { level: 2, name: "Electrotecnia I" }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: /^Competencia/ }),
    ).toHaveValue("cg-02");
  });

  test("opens a shared link and ignores unknown ids", async ({ page }) => {
    await open(page, "/?s=fisica-2&lens=cg-01");
    await expect(
      page.getByRole("heading", { level: 2, name: "Física II" }),
    ).toBeVisible();
    await expect(page.getByRole("status")).toContainText("CG 1");

    await open(page, "/?s=no-such-subject&lens=nope");
    await expect(
      page.getByText("Elegí una materia para ver su detalle."),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: /^Competencia/ }),
    ).toHaveValue("");
  });

  test("Escape clears the selection from the URL", async ({ page }) => {
    await open(page, "/?s=fisica-2");
    await page.keyboard.press("Escape");
    await expect(page).not.toHaveURL(/[?&]s=/);
  });
});

test.describe("search", () => {
  test("'/' opens the search; Enter selects the best match and focuses it", async ({
    page,
  }) => {
    await open(page, "/");
    await page.keyboard.press("/");
    const box = page.getByRole("combobox", { name: "Buscar materia" });
    await expect(box).toBeFocused();
    await box.fill("control autom");
    await expect(
      page.locator("#search-results").getByRole("option").first(),
    ).toContainText("Control Automático");
    await page.keyboard.press("Enter");

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page).toHaveURL(/s=control-automatico/);
    await expect.poll(() => focusedId(page)).toBe("subject-control-automatico");
  });

  test("Ctrl+K works, accents are ignored and numbers match", async ({
    page,
  }) => {
    await open(page, "/");
    await page.keyboard.press("Control+k");
    const box = page.getByRole("combobox", { name: "Buscar materia" });
    await box.fill("analisis");
    await expect(
      page.locator("#search-results").getByRole("option").first(),
    ).toContainText("Análisis Matemático I");
    await box.fill("41");
    await expect(
      page.locator("#search-results").getByRole("option"),
    ).toHaveCount(1);
    await expect(
      page.locator("#search-results").getByRole("option"),
    ).toContainText("Proyecto Final");
    await box.fill("zzzz");
    await expect(
      page.getByText("No hay materias que coincidan."),
    ).toBeVisible();
  });

  test("arrow keys move through the results and Escape closes without selecting", async ({
    page,
  }) => {
    await open(page, "/");
    await page.keyboard.press("/");
    await page.getByRole("combobox", { name: "Buscar materia" }).fill("fisica");
    await page.keyboard.press("ArrowDown");
    await expect(
      page.locator("#search-results").getByRole("option").nth(1),
    ).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page).not.toHaveURL(/[?&]s=/);
  });

  test("typing '/' inside a field does not open the search", async ({
    page,
  }) => {
    await open(page, "/");
    await page.getByRole("combobox", { name: /^Competencia/ }).focus();
    await page.keyboard.press("/");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test.describe("list view", () => {
  test("shows every subject in one table per level and opens the detail", async ({
    page,
  }) => {
    await open(page, "/?view=list");
    await expect(page.getByRole("table")).toHaveCount(5);
    await expect(page.locator("button[id^='list-subject-']")).toHaveCount(41);
    await expect(page.getByRole("caption").first()).toContainText("Nivel I");
    await page.locator("#list-subject-fisica-2").click();
    await expect(
      page.getByRole("heading", { level: 2, name: "Física II" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/s=fisica-2/);
  });

  test("is the default on narrow screens and can be switched to the map", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await open(page, "/");
    await expect(page.getByRole("table").first()).toBeVisible();
    await page.getByRole("button", { name: "Malla" }).click();
    await expect(page.locator("button[id^='subject-']")).toHaveCount(41);
    await expect(page).toHaveURL(/view=graph/);
  });

  test("shows the lens contribution as text", async ({ page }) => {
    await open(page, "/?view=list&lens=cg-01");
    const row = page.getByRole("row").filter({
      has: page.getByRole("rowheader", { name: "Control Automático" }),
    });
    await expect(row).toContainText("Desarrolla");
  });
});

test.describe("my progress", () => {
  const enable = async (page: Page) => {
    await page.getByRole("checkbox", { name: "Mi progreso" }).check();
  };
  const mark = async (
    page: Page,
    id: string,
    status: "Sin cursar" | "Cursada" | "Aprobada",
  ) => {
    await page.locator(`#subject-${id}`).click();
    await page.getByRole("radio", { name: status }).check();
  };

  test("marking prerequisites unlocks a blocked subject", async ({ page }) => {
    await open(page, "/");
    await enable(page);
    const fisica2 = page.locator("#subject-fisica-2");
    await expect(fisica2).toHaveAttribute("aria-label", /Bloqueada/);
    await expect(fisica2).toHaveAttribute(
      "title",
      /Te falta: .*Análisis Matemático I \(cursada\)/,
    );

    await mark(page, "analisis-matematico-1", "Cursada");
    await mark(page, "fisica-1", "Aprobada");
    await expect(fisica2).toHaveAttribute("aria-label", /Disponible/);
    await expect(page.locator("#subject-fisica-1")).toHaveAttribute(
      "aria-label",
      /Aprobada/,
    );
    await expect(
      page.getByRole("region", { name: "Resumen de mi progreso" }),
    ).toContainText("1 aprobadas · 1 cursadas");
  });

  test("a blocked subject lists what is missing in the detail", async ({
    page,
  }) => {
    await open(page, "/?s=fisica-2");
    await enable(page);
    await expect(page.getByText("Bloqueada · Te falta")).toBeVisible();
  });

  test("progress survives a reload", async ({ page }) => {
    await open(page, "/");
    await enable(page);
    await mark(page, "fisica-1", "Cursada");
    await page.reload();
    await enable(page);
    await expect(page.locator("#subject-fisica-1")).toHaveAttribute(
      "aria-label",
      /Cursada/,
    );
  });

  test("the code restores progress after clearing it, and rejects bad codes", async ({
    page,
  }) => {
    await open(page, "/");
    await enable(page);
    await mark(page, "fisica-1", "Aprobada");
    await mark(page, "quimica-general", "Cursada");
    const code = await page.getByLabel("Tu código").inputValue();
    expect(code).toMatch(/^1[A-Za-z0-9_-]{10,20}$/);

    page.once("dialog", (d) => void d.accept());
    await page.getByRole("button", { name: "Borrar progreso" }).click();
    await expect(page.locator("#subject-fisica-1")).not.toHaveAttribute(
      "aria-label",
      /Aprobada/,
    );

    await page.getByLabel("Importar código").fill("1basura!");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "no es válido" }),
    ).toBeVisible();

    await page.getByLabel("Importar código").fill(code);
    await page.getByRole("button", { name: "Aplicar" }).click();
    await expect(page.locator("#subject-fisica-1")).toHaveAttribute(
      "aria-label",
      /Aprobada/,
    );
    await expect(page.locator("#subject-quimica-general")).toHaveAttribute(
      "aria-label",
      /Cursada/,
    );
  });

  test("a shared link offers its progress and can be applied or ignored", async ({
    page,
  }) => {
    await open(page, "/");
    await enable(page);
    await mark(page, "fisica-1", "Aprobada");
    const code = await page.getByLabel("Tu código").inputValue();

    const other = await page
      .context()
      .browser()!
      .newContext({ locale: "es-AR", viewport: { width: 1400, height: 900 } });
    const guest = await other.newPage();
    await open(guest, `/?p=${code}`);
    await expect(
      guest.getByText("Este enlace trae un progreso guardado."),
    ).toBeVisible();
    await guest.getByRole("button", { name: "Reemplazar el mío" }).click();
    await expect(guest).not.toHaveURL(/[?&]p=/);
    await expect(guest.locator("#subject-fisica-1")).toHaveAttribute(
      "aria-label",
      /Aprobada/,
    );
    await other.close();
  });

  test("the list view edits the same progress", async ({ page }) => {
    await open(page, "/?view=list");
    await enable(page);
    await page
      .getByLabel(/Estado de esta materia: Física I$/)
      .selectOption("passed");
    await page.getByRole("button", { name: "Malla" }).click();
    await expect(page.locator("#subject-fisica-1")).toHaveAttribute(
      "aria-label",
      /Aprobada/,
    );
  });
});

test.describe("embed mode", () => {
  test("hides the page chrome but keeps the map and the detail", async ({
    page,
  }) => {
    await open(page, "/?embed=1");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Buscar/ })).toHaveCount(0);
    await expect(page.locator("button[id^='subject-']")).toHaveCount(41);
    await page.locator("#subject-fisica-2").click();
    await expect(
      page.getByRole("heading", { level: 2, name: "Física II" }),
    ).toBeVisible();
  });

  test("tells the parent page its height with postMessage", async ({
    page,
  }) => {
    // The host page shares the app's origin because Chromium blocks framing across loopback origins
    // (ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS). The message goes to "*", so its origin is irrelevant.
    await page.route("http://localhost:3100/host.html", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<script>window.msgs=[];addEventListener("message",e=>window.msgs.push({origin:e.origin,data:e.data}))</script>
               <iframe src="/?embed=1" width="1200" height="300"></iframe>`,
      }),
    );
    await page.goto("http://localhost:3100/host.html");
    type Msg = {
      origin: string;
      data: { source: string; type: string; height: number };
    };
    const messages = () =>
      page.evaluate(() => (window as unknown as { msgs: Msg[] }).msgs);
    await expect.poll(async () => (await messages()).length).toBeGreaterThan(0);
    const last = (await messages()).at(-1)!;
    expect(last.origin).toBe("http://localhost:3100");
    expect(last.data).toMatchObject({
      source: "malla-utn-electrica",
      type: "resize",
    });
    expect(last.data.height).toBeGreaterThan(500);
  });
});
