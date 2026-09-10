import { chromium, type Browser } from "playwright";

import { installEvaluateShim } from "#lib/capture/page-evaluate.ts";

import { captureRouteStitch } from "./capture-route-stitch.ts";
import { RENDER_SETTLE_MS } from "./constants/capture.ts";
import type { BrowserDriver, CaptureViewport } from "./types.ts";
import { applyViewport, runCapturePreamble, waitForNetworkIdle } from "./utils/create-playwright-driver.ts";

export function createPlaywrightDriver(viewport: CaptureViewport): BrowserDriver {
  let browserPromise: Promise<Browser> | undefined;

  function getBrowser(): Promise<Browser> {
    browserPromise ??= chromium.launch();
    return browserPromise;
  }

  return {
    async render(url: string): Promise<Buffer> {
      const browser = await getBrowser();
      const context = await browser.newContext();
      await installEvaluateShim(context);

      try {
        const page = await context.newPage();
        const cdp = await context.newCDPSession(page);

        await applyViewport(page, cdp, viewport);
        await page.goto(url, { waitUntil: "load" });
        await waitForNetworkIdle(page);
        await page.waitForTimeout(RENDER_SETTLE_MS);

        await runCapturePreamble(page, viewport);

        return await captureRouteStitch(page, cdp, viewport);
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
