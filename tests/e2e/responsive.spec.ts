import { expect, test, type Page } from "@playwright/test";

const screens = [
  { name: "small phone", width: 320, height: 568 },
  { name: "phone", width: 360, height: 800 },
  { name: "large phone", width: 390, height: 844 },
  { name: "landscape phone", width: 844, height: 390 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "small desktop", width: 1024, height: 768 },
  { name: "desktop", width: 1280, height: 800 },
  { name: "wide desktop", width: 1440, height: 900 },
];

const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/templates",
  "/occasions",
  "/occasions/birthday",
  "/help",
];

async function expectNoPageOverflow(page: Page) {
  const bounds = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(bounds.document, JSON.stringify(bounds)).toBeLessThanOrEqual(bounds.viewport + 1);
  expect(bounds.body, JSON.stringify(bounds)).toBeLessThanOrEqual(bounds.viewport + 1);
  const clipped = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll<HTMLElement>("h1, h2, form input, form textarea, form select"),
    )
      .filter((element) => !element.closest(".wish-root"))
      .filter(
        (element) =>
          element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden",
      )
      .map((element) => ({
        label: element.textContent?.slice(0, 60) ?? element.tagName,
        rect: element.getBoundingClientRect(),
      }))
      .filter(({ rect }) => rect.left < -1 || rect.right > document.documentElement.clientWidth + 1)
      .map(({ label, rect }) => ({ label, left: rect.left, right: rect.right })),
  );
  expect(clipped, "Headings and form controls must not be clipped outside the page").toEqual([]);
}

async function openPage(page: Page, route: string) {
  const response = await page.goto(route);
  expect(response?.status(), route).toBe(200);
  await expect(page.locator("h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

for (const screen of screens) {
  test(`public layouts fit ${screen.name} (${screen.width}x${screen.height})`, async ({ page }) => {
    await page.setViewportSize(screen);
    for (const route of publicRoutes) {
      await test.step(route, async () => {
        await openPage(page, route);
        await expectNoPageOverflow(page);
      });
    }
  });
}

test("mobile menu traps focus, supports Escape, and closes on desktop resize", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await openPage(page, "/help");
  const toggle = page.getByRole("button", { name: "Open menu" });
  const box = await toggle.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(box?.width).toBeGreaterThanOrEqual(44);
  await toggle.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (let index = 0; index < 16; index += 1) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Main navigation", exact: true }),
  ).toBeVisible();
});

test("mobile menu can navigate after scrolling in a short viewport", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await openPage(page, "/templates");
  await page.getByRole("button", { name: "Open menu" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("link", { name: "A little help" }).click();
  await expect(page).toHaveURL(/\/help$/);
  await expect(dialog).not.toBeVisible();
  await expectNoPageOverflow(page);
});

test("unknown wish-page 404 remains readable and contained on phones", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    const response = await page.goto("/w/does-not-exist-0000");
    expect(response?.status()).toBe(404);
    await expect(page.getByText(/create your own surprise/i)).toBeVisible();
    await expectNoPageOverflow(page);
  }
});

test("template preview fits small and landscape phones and restores focus", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await openPage(page, "/templates");
    for (const template of ["Neon Night", "Pastel Dream", "Royal Gold"]) {
      for (const label of [`Preview the ${template} template`, `Open ${template} preview`]) {
        const opener = page.getByRole("button", { name: label });
        await opener.click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        const bounds = await dialog.boundingBox();
        expect(bounds?.x).toBeGreaterThanOrEqual(0);
        expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(viewport.width + 1);
        expect(bounds?.height).toBeLessThanOrEqual(viewport.height);
        expect(
          await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
        ).toBe(true);
        const preview = dialog.locator(".full-template-preview");
        await expect(preview.locator(".wish-root").first()).toBeVisible();
        const fits = await preview.evaluate((element) => {
          const container = element.getBoundingClientRect();
          const frame = element.querySelector(".border-ink")?.getBoundingClientRect();
          return !!frame && frame.left >= container.left - 1 && frame.right <= container.right + 1;
        });
        expect(fits, "Phone frame must fit its preview container without clipping").toBe(true);
        await dialog.getByRole("button", { name: "Close", exact: true }).click();
        await expect(dialog).not.toBeVisible();
        await expect(opener).toBeFocused();
      }
    }
  }
});

test("long empty searches recover and keep keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await openPage(page, "/help");
  const helpSearch = page.getByRole("searchbox");
  await helpSearch.fill("unmatched".repeat(40));
  await expect(page.getByRole("heading", { name: "No exact match yet." })).toBeVisible();
  await expectNoPageOverflow(page);
  await page.getByRole("button", { name: "Show all questions" }).click();
  await expect(helpSearch).toBeFocused();
  await expect(helpSearch).toHaveValue("");

  await openPage(page, "/templates");
  await page.getByRole("searchbox").fill("unmatched".repeat(40));
  await expect(page.getByRole("heading", { name: "No designs found, just yet." })).toBeVisible();
  await expectNoPageOverflow(page);
  await page.getByRole("button", { name: "Show all designs" }).click();
  await expect(page.getByRole("button", { name: "Preview the Neon Night template" })).toBeVisible();
});

test("auth forms expose invalid fields without overflowing", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await openPage(page, "/login");
  await page.getByRole("button", { name: /log in|sign in/i }).click();
  await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
  await expectNoPageOverflow(page);
  await openPage(page, "/signup");
  await page.getByRole("button", { name: /create account|sign up/i }).click();
  await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
  await expectNoPageOverflow(page);
});

test("anonymous dashboard and admin access redirects to login on phones", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    for (const route of ["/dashboard", "/admin"]) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
      await expect(page.locator("h1").first()).toBeVisible();
      await expectNoPageOverflow(page);
    }
  }

  const response = await page.request.get("/api/v1/auth/me");
  expect(response.status()).toBe(401);
  const body = await response.json();
  expect(body.success).toBe(false);
  expect(body.error.code).toBe("UNAUTHENTICATED");
});

test("enlarged text and reduced motion preserve public controls", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of ["/help", "/templates", "/login"]) {
    await openPage(page, route);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    await expectNoPageOverflow(page);
    await expect(page.locator("h1").first()).toBeVisible();
  }
});

test("compact search and filter controls remain touch-sized", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await openPage(page, "/templates");
  await page.getByRole("searchbox").fill("not-found");
  const targets = page.locator(
    ".discovery-search-field button, .discovery-moods button, .discovery-results-line button, .discovery-empty button",
  );
  for (const target of await targets.all()) {
    const bounds = await target.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(44);
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
  }
});

test("signup account-switch link has a phone-sized hit target", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await openPage(page, "/signup");
    const loginLink = page.locator(".auth-footer a");
    const bounds = await loginLink.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(44);
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
    await expectNoPageOverflow(page);
  }
});

test("long login failure feedback wraps and leaves the form recoverable", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const message = `Sign-in service unavailable: ${"unexpected".repeat(40)}`;
  await page.route("**/api/v1/auth/login", (route) =>
    route.fulfill({
      status: 503,
      json: { success: false, error: { code: "SERVICE_UNAVAILABLE", message } },
    }),
  );
  await openPage(page, "/login");
  await page.getByLabel("Email", { exact: true }).fill("ui-test@example.invalid");
  await page.getByLabel("Password", { exact: true }).fill("Test1234");
  const submit = page.getByRole("button", { name: /log in|sign in/i });
  await submit.click();
  await expect(page.getByText(message, { exact: true })).toBeVisible();
  await expect(submit).toBeEnabled();
  await expectNoPageOverflow(page);
});
