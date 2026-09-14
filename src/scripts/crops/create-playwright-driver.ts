import { chromium, type Browser, type Page } from "playwright";

import type { CropCandidate } from "#ir/crops.ts";
import { installEvaluateShim } from "#lib/capture/page-evaluate.ts";
import { RENDER_SETTLE_MS } from "#stitch/constants/capture.ts";
import { runCapturePreamble, waitForNetworkIdle } from "#stitch/utils/create-playwright-driver.ts";

import {
  CROP_JPEG_QUALITY,
  CROP_VIEWPORT,
  MAX_CANDIDATES,
  MAX_DESCENT_DEPTH,
  MAX_SIGNATURE_CLASSES,
  MIN_CANDIDATE_HEIGHT_PX,
  SIGNATURE_TEXT_LENGTH,
  SNIPPET_LENGTH,
  SOLE_CHILD_HEIGHT_RATIO,
} from "./constants/capture.ts";
import type { CaptureOutcome, CaptureRequest, CropDriver } from "./types.ts";
import { collectAndMark, unmarkCandidates, type CollectArgs } from "./utils/page-scripts.ts";

const MARK_ATTRIBUTE = "data-mig-crop";

const COLLECT_ARGS: CollectArgs = {
  maxDescentDepth: MAX_DESCENT_DEPTH,
  soleChildHeightRatio: SOLE_CHILD_HEIGHT_RATIO,
  minCandidateHeightPx: MIN_CANDIDATE_HEIGHT_PX,
  maxCandidates: MAX_CANDIDATES,
  snippetLength: SNIPPET_LENGTH,
  signatureTextLength: SIGNATURE_TEXT_LENGTH,
  maxSignatureClasses: MAX_SIGNATURE_CLASSES,
};

export function createCropDriver(): CropDriver {
  let browserPromise: Promise<Browser> | undefined;

  function getBrowser(): Promise<Browser> {
    browserPromise ??= chromium.launch();
    return browserPromise;
  }

  async function withPage<T>(url: string, fn: (page: Page) => Promise<T>): Promise<T> {
    const browser = await getBrowser();
    const context = await browser.newContext({ viewport: CROP_VIEWPORT, deviceScaleFactor: 1 });
    await installEvaluateShim(context);

    try {
      const page = await context.newPage();
      await page.goto(url, { waitUntil: "load" });
      await waitForNetworkIdle(page);
      await page.waitForTimeout(RENDER_SETTLE_MS);
      await runCapturePreamble(page, CROP_VIEWPORT);

      return await fn(page);
    } finally {
      await context.close();
    }
  }

  async function captureOne(page: Page, request: CaptureRequest): Promise<CaptureOutcome> {
    await page.evaluate(unmarkCandidates, MARK_ATTRIBUTE);

    const { markedSignature: signature } = await page.evaluate(collectAndMark, {
      ...COLLECT_ARGS,
      markIndex: request.candidateIndex,
      attribute: MARK_ATTRIBUTE,
    });

    if (signature === null) return { ok: false, typeId: request.typeId, reason: "CANDIDATE_OUT_OF_RANGE" };
    if (signature !== request.signature) return { ok: false, typeId: request.typeId, reason: "SIGNATURE_DRIFT" };

    const locator = page.locator(`[${MARK_ATTRIBUTE}]`);

    try {
      const box = await locator.boundingBox();
      if (box === null) return { ok: false, typeId: request.typeId, reason: "CAPTURE_FAILED" };

      const jpeg = await locator.screenshot({
        type: "jpeg",
        quality: CROP_JPEG_QUALITY,
        animations: "disabled",
      });

      return {
        ok: true,
        typeId: request.typeId,
        jpeg,
        width: Math.round(box.width),
        height: Math.round(box.height),
      };
    } catch {
      return { ok: false, typeId: request.typeId, reason: "CAPTURE_FAILED" };
    }
  }

  return {
    async candidates(url: string): Promise<CropCandidate[]> {
      return withPage(url, async (page) => {
        const { candidates } = await page.evaluate(collectAndMark, COLLECT_ARGS);
        return candidates;
      });
    },

    async capture(url: string, requests: CaptureRequest[]): Promise<CaptureOutcome[]> {
      return withPage(url, async (page) => {
        const outcomes: CaptureOutcome[] = [];
        for (const request of requests) outcomes.push(await captureOne(page, request));
        return outcomes;
      });
    },

    async close(): Promise<void> {
      if (!browserPromise) return;
      const browser = await browserPromise;
      await browser.close();
    },
  };
}
