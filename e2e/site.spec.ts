import { test, expect } from "@playwright/test";

test.describe("landing page", () => {
  test("landing renders", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => {
      consoleErrors.push(err.message);
    });

    await page.goto("/");

    // Heading visible
    await expect(page.getByRole("heading", { name: "Learn to build AI agents" })).toBeVisible();

    // Begin link with correct href
    const beginLink = page.getByRole("link", { name: /Begin/i });
    await expect(beginLink).toBeVisible();
    await expect(beginLink).toHaveAttribute("href", "/tutorials/01-what-is-an-agent");

    // No severe console errors (ignore favicon 404s)
    const severeErrors = consoleErrors.filter(
      (msg) => !msg.includes("favicon") && !msg.includes("favicon.ico"),
    );
    expect(severeErrors, `Console errors: ${severeErrors.join("\n")}`).toHaveLength(0);
  });
});

test.describe("tutorial page", () => {
  test("tutorial renders + sidebar nav", async ({ page }) => {
    await page.goto("/tutorials/01-what-is-an-agent");

    // H1 heading
    await expect(page.getByRole("heading", { name: "What Is an Agent?", level: 1 })).toBeVisible();

    // Sidebar nav landmark with active link
    const sidebar = page.getByRole("navigation", { name: "Tutorials" });
    await expect(sidebar).toBeVisible();
    const activeLink = sidebar.getByRole("link", { name: "What Is an Agent?" });
    await expect(activeLink).toBeVisible();
    await expect(activeLink).toHaveAttribute("aria-current", "page");

    // Prose text (paragraph containing the agent definition)
    await expect(page.getByText("is a system that repeatedly")).toBeVisible();
  });

  test("PyRunner executes Python in-browser", async ({ page }) => {
    await page.goto("/tutorials/01-what-is-an-agent");

    // Find the Run button inside the PyRunner widget
    const runButton = page.getByRole("button", { name: /Run|Loading|Running/i });
    await expect(runButton).toBeVisible();

    // Click to trigger Pyodide load + execution
    await runButton.click();

    // Wait for the aria-live output pre to appear with expected text
    const outputPre = page.locator("pre[aria-live='polite']");

    await expect(outputPre).toContainText("obs='unknown topic' -> action='search'", {
      timeout: 90_000,
    });
    await expect(outputPre).toContainText("obs='known fact' -> action='answer'", {
      timeout: 90_000,
    });
    await expect(outputPre).toContainText("obs='unknown thing' -> action='search'", {
      timeout: 90_000,
    });

    // Button should be re-enabled after completion
    await expect(runButton).not.toBeDisabled({ timeout: 5_000 });
  });

  test("prev/next nav present", async ({ page }) => {
    await page.goto("/tutorials/01-what-is-an-agent");

    // Tutorial navigation landmark exists
    const tutorialNav = page.getByRole("navigation", { name: "Tutorial navigation" });
    await expect(tutorialNav).toBeVisible();

    // With only one tutorial, there should be no prev/next links
    // (both are empty <span> elements)
    const navLinks = tutorialNav.getByRole("link");
    await expect(navLinks).toHaveCount(0);
  });
});
