import { expect, test } from "@playwright/test";

function futureLocalDate(daysAhead: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

test("creator validates, saves, resumes and navigates wizard draft", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("creator@demo.com");
  await page.getByLabel("Password", { exact: true }).fill("Creator@123");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("link", { name: "Create a surprise" }).click();
  await expect(page).toHaveURL(/\/create$/);
  await expect(page.locator('form[data-step="1"]')).toBeVisible();

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("alert").first()).toContainText(/occasion/i);
  await expect(page.locator('form[data-step="1"]')).toBeVisible();

  await page.getByRole("radio", { name: "Birthday" }).click();
  await page.getByLabel("Date of the occasion").fill(futureLocalDate(7));
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/create\?id=[a-f0-9]{24}$/);
  await expect(page.locator('form[data-step="2"]')).toBeVisible();

  const pageId = new URL(page.url()).searchParams.get("id");
  expect(pageId).toMatch(/^[a-f0-9]{24}$/);

  try {
    await page.getByLabel("Their name").fill("Responsive Draft Recipient");
    await page.getByLabel("Nickname (optional)").fill("Draft Name");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.locator('form[data-step="3"]')).toBeVisible();

    await page.reload();
    await expect(page.locator('form[data-step="2"]')).toBeVisible();
    await expect(page.getByLabel("Their name")).toHaveValue("Responsive Draft Recipient");
    await expect(page.getByLabel("Nickname (optional)")).toHaveValue("Draft Name");

    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.locator('form[data-step="1"]')).toBeVisible();
    await expect(page.getByRole("radio", { name: "Birthday" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.locator('form[data-step="2"]')).toBeVisible();
    await expect(page.getByLabel("Their name")).toHaveValue("Responsive Draft Recipient");
  } finally {
    const response = await page.request.delete(`/api/v1/pages/${pageId}`, {
      headers: { Origin: process.env.E2E_BASE_URL ?? "http://localhost:3000" },
    });
    expect(response.status()).toBe(200);
  }
});
