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

  test("quiz: all-correct submission passes and completes the lesson", async ({
    page,
  }) => {
    await page.goto("/learn/05-foundations-check");
    // Precondition: the lesson is not yet complete, so a later "Completed"
    // is attributable to the quiz pass (not pre-existing/auto state).
    await expect(
      page.getByRole("button", { name: /Mark complete/i }),
    ).toBeVisible();
    await page
      .getByRole("radio", {
        name: "Perceive, then decide, then act, repeated each step",
        exact: true,
      })
      .check();
    await page
      .getByRole("radio", {
        name: "Reproducible, free runs with no API keys or flakiness",
        exact: true,
      })
      .check();
    await page
      .getByRole("radio", {
        name: "Chooses the next action from the observation",
        exact: true,
      })
      .check();
    await page
      .getByRole("radio", {
        name: "Perception, policy, action, memory",
        exact: true,
      })
      .check();
    await page
      .getByRole("radio", {
        name: "The agent loop and the policy interface",
        exact: true,
      })
      .check();
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByRole("status")).toContainText("You scored 5 / 5");
    await expect(
      page.getByRole("button", { name: /Completed/i }),
    ).toBeVisible();
    await page.reload();
    // After reload the quiz remounts unsubmitted (in-memory answers reset,
    // so the score status is gone) — yet the lesson is still complete,
    // which can only come from the persisted ProgressStore (localStorage).
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Completed/i }),
    ).toBeVisible();
  });

  test("quiz: Tool Use all-correct submission passes and completes", async ({
    page,
  }) => {
    await page.goto("/learn/13-tools-check");
    await expect(
      page.getByRole("button", { name: /Mark complete/i }),
    ).toBeVisible();
    for (const name of [
      "Name, description, typed arguments, and deterministic implementation",
      "The model selects a name from a registry you control; your runtime maps that name to a registered function and calls it",
      "The tool result becomes the next observation and is fed back to the policy",
      "It is a structured observation returned to the policy, which can then retry or degrade gracefully",
      "A bounded attempt budget prevents runaway cost when a tool is broken or a resource does not exist",
    ]) {
      await page.getByRole("radio", { name, exact: true }).check();
    }
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByRole("status")).toContainText("You scored 5 / 5");
    await expect(
      page.getByRole("button", { name: /Completed/i }),
    ).toBeVisible();
    await page.reload();
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Completed/i }),
    ).toBeVisible();
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
    const mock = page.getByRole("radio", { name: /Mock \(default/i });
    const real = page.getByRole("radio", { name: /Real \(your key/i });
    await expect(mock).toBeChecked();
    await real.check();
    await expect(real).toBeChecked();
    await expect(mock).not.toBeChecked();
  });

  test("API key field is a password input and is cleared on reload", async ({ page }) => {
    await page.goto("/learn/02-the-agent-loop");
    const real = page.getByRole("radio", { name: /Real \(your key/i });
    await real.check();
    await expect(real).toBeChecked();
    const key = page.getByLabel("API key");
    await expect(key).toHaveAttribute("type", "password");
    await key.fill("sk-not-a-real-key");
    await expect(key).toHaveValue("sk-not-a-real-key");
    await page.reload();
    const realAfter = page.getByRole("radio", { name: /Real \(your key/i });
    await realAfter.check();
    await expect(realAfter).toBeChecked();
    await expect(page.getByLabel("API key")).toHaveValue("");
  });

  test("reworked interactive lesson runs Python in-browser (mock default)", async ({
    page,
  }) => {
    await page.goto("/learn/03-the-mock-llm");
    await page.getByRole("button", { name: /Run|Loading|Running/i }).click();
    const out = page.locator("pre[aria-live='polite']");
    await expect(out).toContainText(
      "prompt='weather in nyc?' -> 'tool:get_weather'",
      { timeout: 90_000 },
    );
    await expect(out).toContainText("prompt='say hi' -> 'answer:hello'");
    await expect(out).toContainText(
      "prompt='unknown request' -> 'answer:i_dont_know'",
    );
  });
});
