import { test, expect, type Page } from "@playwright/test";

test.use({ locale: "es-AR", viewport: { width: 1400, height: 900 } });

async function open(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}

test.describe("subject pages without JavaScript (what a search engine sees)", () => {
  test.use({ javaScriptEnabled: false });

  test("carry the whole subject in the HTML", async ({ page }) => {
    await page.goto("/materias/control-automatico/");
    await expect(page).toHaveTitle(
      "Control Automático · Ingeniería en Energía Eléctrica · UTN FRBA",
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Control Automático",
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(
      page.getByText(/^Cómo se modelan y se controlan sistemas físicos/),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Correlativas" }),
    ).toBeVisible();
    await expect(
      page.getByText("Lunes: 19:00 a 23:00 (módulos 1–5)"),
    ).toBeVisible();
  });

  test("link to the neighbouring subjects", async ({ page }) => {
    await page.goto("/materias/control-automatico/");
    await expect(
      page.getByRole("link", { name: /Electrotecnia II/ }).first(),
    ).toHaveAttribute("href", "/materias/electrotecnia-2/");
    await expect(
      page.getByRole("link", { name: /Accionamientos y Controles Eléctricos/ }),
    ).toHaveAttribute(
      "href",
      "/materias/accionamientos-y-controles-electricos/",
    );
  });

  test("the home page already lists every subject and links to its page", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("button[id^='list-subject-']")).toHaveCount(41);
    await expect(page.locator("nav a[href^='/materias/']")).toHaveCount(41);
  });
});

test.describe("metadata", () => {
  test("description, canonical, Open Graph, Twitter and structured data", async ({
    page,
  }) => {
    await page.goto("/materias/electrotecnia-1/");
    const content = (selector: string) =>
      page.locator(selector).getAttribute("content");

    expect(await content('meta[name="description"]')).toMatch(
      /^La teoría de circuitos/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/materias\/electrotecnia-1\/$/,
    );
    expect(await content('meta[property="og:title"]')).toBe(
      "Electrotecnia I · Ingeniería en Energía Eléctrica · UTN FRBA",
    );
    expect(await content('meta[property="og:type"]')).toBe("article");
    expect(await content('meta[property="og:image"]')).toMatch(/\/og\.png$/);
    expect(await content('meta[property="og:image:width"]')).toBe("1200");
    expect(await content('meta[name="twitter:card"]')).toBe(
      "summary_large_image",
    );

    const ld = JSON.parse(
      (await page
        .locator('script[type="application/ld+json"]')
        .textContent()) ?? "{}",
    );
    expect(ld).toMatchObject({
      "@type": "Course",
      name: "Electrotecnia I",
      courseCode: "11",
      inLanguage: "es-AR",
    });
  });

  test("the home page has its own Open Graph image", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /\/og\.png$/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/$/,
    );
  });

  test("the social preview image exists and is 1200×630", async ({
    request,
  }) => {
    const response = await request.get("/og.png");
    expect(response.status()).toBe(200);
    const bytes = await response.body();
    expect(bytes.readUInt32BE(16)).toBe(1200); // PNG IHDR width
    expect(bytes.readUInt32BE(20)).toBe(630); // PNG IHDR height
  });

  test("sitemap and robots point at every page", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap.match(/<loc>/g)).toHaveLength(42);
    expect(sitemap).toContain("/materias/proyecto-final/");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/Allow: \//);
    expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);
  });
});

test.describe("navigation and language", () => {
  test("the map's panel links to the subject page, which links back to the map", async ({
    page,
  }) => {
    await open(page, "/");
    await page.locator("#subject-fisica-2").click();
    await page
      .getByRole("link", { name: /Abrir la página de esta materia/ })
      .click();
    await expect(page).toHaveURL(/\/materias\/fisica-2\/$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Física II" }),
    ).toBeVisible();

    await page.getByRole("link", { name: /Volver a la malla/ }).click();
    await expect(page).toHaveURL(/\/\?s=fisica-2$/);
    await expect(
      page.getByRole("heading", { level: 2, name: "Física II" }),
    ).toBeVisible();
  });

  test("a competency on the page opens the map with that lens", async ({
    page,
  }) => {
    await open(page, "/materias/control-automatico/");
    await page.getByRole("link", { name: /CG 1 Identificar/ }).click();
    await expect(page).toHaveURL(/lens=cg-01/);
    await expect(
      page.getByRole("combobox", { name: /^Competencia/ }),
    ).toHaveValue("cg-01");
  });

  test("the language switch translates the page and the tab title", async ({
    page,
  }) => {
    await open(page, "/materias/control-automatico/");
    await page.getByRole("button", { name: /English/ }).click();
    await expect(
      page.getByRole("heading", { level: 2, name: "Prerequisites" }),
    ).toBeVisible();
    await expect(page).toHaveTitle(
      "Control Automático · Curriculum map · Electrical Energy Engineering",
    );
    await expect(page).toHaveURL(/\/materias\/control-automatico\/$/); // still no language in the URL
  });

  test("an unknown subject gets a helpful 404", async ({ page }) => {
    const response = await page.goto("/materias/no-existe/");
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "No encontramos esta página",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Ir a la malla" }),
    ).toHaveAttribute("href", "/");
  });
});
