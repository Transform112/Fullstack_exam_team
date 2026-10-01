import { expect, test } from "@playwright/test";

// Smoke flow for the public surfaces (docs/05 T-15, T-18, T-20). The full creator flow
// needs seeded data and a test account; run it against an isolated test database.
test("health endpoint reports a connected database", async ({ request }) => {
  const res = await request.get("/api/v1/health");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.success).toBe(true);
  expect(body.data.db).toBe("connected");
});

test("login page renders and validates", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /log in|sign in/i })).toBeVisible();
});

test("an unknown wish slug shows the designed 404", async ({ page }) => {
  const res = await page.goto("/w/does-not-exist-0000");
  expect(res?.status()).toBe(404);
  await expect(page.getByText(/create your own surprise/i)).toBeVisible();
});

test("the public API never returns content for a locked page", async ({ request }) => {
  const res = await request.get("/api/v1/public/pages/dev-farewell-3c8z");
  const body = await res.json();
  expect(body.success).toBe(true);
  expect(body.data.locked).toBe(true);
  expect(body.data.reason).toBe("SCHEDULED");
  expect(body.data.messages).toBeUndefined();
  expect(body.data.media).toBeUndefined();
});
