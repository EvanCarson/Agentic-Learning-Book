import { test, expect } from "@playwright/test";

test.describe("landing", () => {
  test("renders and links to the curriculum", async ({ page }) => {
    const errs: string[] = [];
    page.on("pageerror", (e) => errs.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error" && !m.text().includes("favicon"))
        errs.push(m.text());
    });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: "Learn to build AI agents" }),
    ).toBeVisible();
    const cta = page.getByRole("link", { name: /Start the curriculum/i });
    await expect(cta).toHaveAttribute("href", "/learn");
    expect(errs, errs.join("\n")).toHaveLength(0);
  });
});

test.describe("curriculum", () => {
  test("syllabus shows the Foundations module and its lessons", async ({ page }) => {
    await page.goto("/learn");
    await expect(
      page
        .getByRole("main")
        .getByRole("heading", { level: 2, name: "Foundations" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /What Is an Agent\?/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /The Mock LLM/ }),
    ).toBeVisible();
  });

  test("prev/next navigates between lessons", async ({ page }) => {
    await page.goto("/learn/01-what-is-an-agent");
    await page.getByRole("link", { name: /The Agent Loop →/ }).click();
    await expect(page).toHaveURL(/\/learn\/02-the-agent-loop$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "The Agent Loop" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Curriculum" })
        .locator('a[aria-current="page"]'),
    ).toHaveAttribute("href", "/learn/02-the-agent-loop");
  });

  test("mark complete persists across reload", async ({ page }) => {
    await page.goto("/learn/04-agent-anatomy");
    const btn = page.getByRole("button", { name: /Mark complete/i });
    await btn.click();
    await expect(
      page.getByRole("button", { name: /Completed/i }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("button", { name: /Completed/i }),
    ).toBeVisible();
  });

  test("quiz lesson renders the accessible stub", async ({ page }) => {
    await page.goto("/learn/05-foundations-check");
    await expect(page.getByRole("note")).toContainText(/coming soon/i);
  });

  test("interactive lesson runs Python in-browser", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/learn/02-the-agent-loop");
    await page.getByRole("button", { name: /Run|Loading|Running/i }).click();
    const out = page.locator("pre[aria-live='polite']");
    await expect(out).toContainText("obs='unknown thing' -> action='search'", {
      timeout: 90_000,
    });
    await expect(out).toContainText("obs='unknown topic' -> action='search'");
    await expect(out).toContainText("obs='known fact' -> action='answer'");
  });

  test("old tutorials URL redirects to the new lesson path", async ({ page }) => {
    await page.goto("/tutorials/01-what-is-an-agent");
    await expect(page).toHaveURL(/\/learn\/01-what-is-an-agent\/?$/);
  });

  test("flagship lesson shows the model settings (mock default)", async ({ page }) => {
    await page.goto("/learn/02-the-agent-loop");
    await expect(
      page.getByRole("radio", { name: /Mock \(default/i }),
    ).toBeChecked();
    await expect(
      page.getByRole("radio", { name: /Real \(your key/i }),
    ).toBeVisible();
  });

  test("API key field is a password input and is cleared on reload", async ({ page }) => {
    await page.goto("/learn/02-the-agent-loop");
    await page.getByRole("radio", { name: /Real \(your key/i }).check();
    const key = page.getByLabel("API key");
    await expect(key).toHaveAttribute("type", "password");
    await key.fill("sk-not-a-real-key");
    await expect(key).toHaveValue("sk-not-a-real-key");
    await page.reload();
    await page.getByRole("radio", { name: /Real \(your key/i }).check();
    await expect(page.getByLabel("API key")).toHaveValue("");
  });
});
