import { test, expect } from "@playwright/test";

test.describe("Spanish browser", () => {
  test.use({ locale: "es-AR" });

  test("renders in Spanish and switches to English without changing the URL", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "es-AR");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Malla curricular",
    );

    await page.getByRole("button", { name: "Cambiar a inglés" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Curriculum map",
    );
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page).toHaveURL(/\/$/);

    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Curriculum map",
    );
  });
});

test.describe("English browser", () => {
  test.use({ locale: "en-US" });

  test("renders in English by default", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Curriculum map",
    );
  });
});
