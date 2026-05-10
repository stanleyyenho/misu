import { expect, test } from "@playwright/test";

// Public, unauthenticated routes — safe to hit in CI without test users.
const PUBLIC_PAGES = [
  { path: "/marketing", name: "marketing landing" },
  { path: "/marketing/privacy", name: "privacy" },
  { path: "/marketing/terms", name: "terms" },
  { path: "/login", name: "login" },
];

for (const page of PUBLIC_PAGES) {
  test.describe(`${page.name} (${page.path})`, () => {
    test("renders without horizontal overflow", async ({ page: browserPage, viewport }) => {
      await browserPage.goto(page.path);
      await browserPage.waitForLoadState("domcontentloaded");

      const docWidth = await browserPage.evaluate(() => document.documentElement.scrollWidth);
      const viewportWidth = viewport?.width ?? 0;
      // Allow 1px of slop for sub-pixel rounding.
      expect(docWidth, "page should not scroll horizontally").toBeLessThanOrEqual(viewportWidth + 1);
    });

    test("body is visible and has content", async ({ page: browserPage }) => {
      await browserPage.goto(page.path);
      await expect(browserPage.locator("body")).toBeVisible();
      const text = await browserPage.locator("body").innerText();
      expect(text.trim().length).toBeGreaterThan(0);
    });
  });
}

test.describe("login page interactions", () => {
  test("email input is reachable and accepts text", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page.locator('input[type="email"], input[inputmode="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible();
    await emailInput.fill("test@example.com");
    await expect(emailInput).toHaveValue("test@example.com");
  });
});

test.describe("marketing landing call-to-action", () => {
  test("primary CTA is present and links somewhere", async ({ page }) => {
    await page.goto("/marketing");
    const cta = page.getByRole("link", { name: /get started/i }).first();
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute("href");
    expect(href).toBeTruthy();
  });
});
