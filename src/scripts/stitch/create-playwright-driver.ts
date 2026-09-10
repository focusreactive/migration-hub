import { chromium, type Browser } from "playwright";

import { installEvaluateShim } from "#lib/capture/page-evaluate.ts";

import { RENDER_SETTLE_MS } from "./constants/capture.ts";
import type { BrowserDriver, CaptureViewport } from "./types.ts";
import { runCapturePreamble, waitForNetworkIdle } from "./utils/create-playwright-driver.ts";

export function createPlaywrightDriver(viewport: CaptureViewport): BrowserDriver {
  let browserPromise: Promise<Browser> | undefined;

  function getBrowser(): Promise<Browser> {
    browserPromise ??= chromium.launch();
    return browserPromise;
  }

  return {
    async render(url: string): Promise<Buffer> {
      const browser = await getBrowser();
      const context = await browser.newContext({ viewport });
      await installEvaluateShim(context);

      try {
        const page = await context.newPage();
        await page.goto(url, { waitUntil: "load" });
        await waitForNetworkIdle(page);
        await page.waitForTimeout(RENDER_SETTLE_MS);

        await runCapturePreamble(page, viewport);

        return await page.screenshot({ fullPage: true, animations: "disabled" });
      } finally {
        await context.close();
      }
    },

    async close(): Promise<void> {
      if (!browserPromise) return;
      const browser = await browserPromise;
      await browser.close();
    },
  };
}
