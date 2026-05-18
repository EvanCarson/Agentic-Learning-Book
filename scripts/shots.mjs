import { chromium } from "@playwright/test";
const base = process.env.BASE || "http://localhost:4321";
const tag = process.env.TAG || "after";
const b = await chromium.launch();
const pages = [
  ["/", "landing", 1280, 900],
  ["/learn", "syllabus", 1280, 1100],
  ["/learn/01-what-is-an-agent", "lesson", 1280, 1100],
  ["/learn/05-foundations-check", "quiz", 1280, 1100],
  ["/learn", "syllabus-mobile", 390, 900],
];
for (const [url, name, w, h] of pages) {
  for (const dark of [false, true]) {
    const p = await b.newPage({ colorScheme: dark ? "dark" : "light" });
    await p.setViewportSize({ width: w, height: h });
    await p.goto(base + url, { waitUntil: "networkidle" });
    await p.waitForTimeout(800);
    await p.screenshot({
      path: `/tmp/ui-${tag}-${name}-${dark ? "dark" : "light"}.png`,
      fullPage: true,
    });
    await p.close();
  }
}
await b.close();
console.log("screenshots written to /tmp/ui-" + tag + "-*");
