import { expect, test } from "@playwright/test";

import { FRAMES } from "./frames.js";

for (const frame of FRAMES) {
  test(frame.id, async ({ page }) => {
    await page.goto(frame.url, { waitUntil: "networkidle" });

    // Plus Jakarta Sans is loaded via next/font; screenshotting before it
    // settles produces fallback-font diffs.
    await page.evaluate(() => document.fonts.ready.then(() => true));

    // Bottom sheets mount through a Radix portal after hydration.
    if (frame.url.includes("sheet=")) {
      await expect(page.locator("[data-slot=sheet-content]")).toBeVisible();
    }

    await expect(page).toHaveScreenshot(`${frame.id}.png`);
  });
}
