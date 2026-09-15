import { chromium, type Browser, type Page } from "playwright";

import { installEvaluateShim } from "#lib/capture/page-evaluate.ts";
import { RENDER_SETTLE_MS } from "#stitch/constants/capture.ts";
import { runCapturePreamble, waitForNetworkIdle } from "#stitch/utils/create-playwright-driver.ts";

import {
  ANCHOR_MAX_SIGNATURE_CLASSES,
  ANCHOR_SIGNATURE_TEXT_LENGTH,
  ANCHOR_SNIPPET_LENGTH,
  ANCHOR_VIEWPORT,
} from "./constants.ts";
import { clearMarks, resolveAnchor, type ResolveResult } from "./page-scripts.ts";

export interface AnchorSession {
  withPage<T>(url: string, fn: (page: Page) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export function createAnchorSession(): AnchorSession {
  let browserPromise: Promise<Browser> | undefined;

  function getBrowser(): Promise<Browser> {
    browserPromise ??= chromium.launch();
    return browserPromise;
  }

  return {
    async withPage<T>(url: string, fn: (page: Page) => Promise<T>): Promise<T> {
      const browser = await getBrowser();
      const context = await browser.newContext({ viewport: ANCHOR_VIEWPORT, deviceScaleFactor: 1 });
      await installEvaluateShim(context);

      try {
        const page = await context.newPage();
        await page.goto(url, { waitUntil: "load" });
        await waitForNetworkIdle(page);
        await page.waitForTimeout(RENDER_SETTLE_MS);
        await runCapturePreamble(page, ANCHOR_VIEWPORT);

        return await fn(page);
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

export async function resolveOn(page: Page, selector: string, markAttribute?: string): Promise<ResolveResult> {
  return page.evaluate(resolveAnchor, {
    selector,
    snippetLength: ANCHOR_SNIPPET_LENGTH,
    signatureTextLength: ANCHOR_SIGNATURE_TEXT_LENGTH,
    maxSignatureClasses: ANCHOR_MAX_SIGNATURE_CLASSES,
    ...(markAttribute === undefined ? {} : { markAttribute }),
  });
}

export async function clearMarksOn(page: Page, attribute: string): Promise<void> {
  await page.evaluate(clearMarks, attribute);
}
