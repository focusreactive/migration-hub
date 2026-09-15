import type { Page } from "playwright";

import { createAnchorSession, resolveOn } from "#lib/anchor/create-anchor-session.ts";
import { anchorSignature } from "#lib/anchor/signature.ts";
import { scrollPageTo } from "#stitch/utils/page-scripts.ts";

import {
  CROP_ANCESTOR_ATTRIBUTE,
  CROP_ISOLATION_CSS,
  CROP_ISOLATION_STYLE_ID,
  CROP_JPEG_QUALITY,
  CROP_MARK_ATTRIBUTE,
  CROP_VIEWPORT,
} from "./constants/capture.ts";
import type { CaptureOutcome, CaptureRequest, CropDriver, ViewportShot } from "./types.ts";
import { isolateMarked, releaseIsolation, unmarkCandidates, type IsolateArgs } from "./utils/page-scripts.ts";

const ISOLATE_ARGS: IsolateArgs = {
  markAttribute: CROP_MARK_ATTRIBUTE,
  ancestorAttribute: CROP_ANCESTOR_ATTRIBUTE,
  styleId: CROP_ISOLATION_STYLE_ID,
  css: CROP_ISOLATION_CSS,
};

const RELEASE_ARGS = { ancestorAttribute: CROP_ANCESTOR_ATTRIBUTE, styleId: CROP_ISOLATION_STYLE_ID };

export function createCropDriver(): CropDriver {
  const session = createAnchorSession();

  async function captureOne(page: Page, request: CaptureRequest): Promise<CaptureOutcome> {
    await page.evaluate(scrollPageTo, 0);
    await page.evaluate(unmarkCandidates, CROP_MARK_ATTRIBUTE);
    await page.evaluate(releaseIsolation, RELEASE_ARGS);

    const resolved = await resolveOn(page, request.selector, CROP_MARK_ATTRIBUTE);
    if (resolved.status !== "ok" || resolved.union === null) {
      return { ok: false, typeId: request.typeId, reason: "SELECTOR_UNRESOLVED" };
    }

    if (anchorSignature(resolved.nodes) !== request.signature) {
      return { ok: false, typeId: request.typeId, reason: "SIGNATURE_DRIFT" };
    }

    try {
      if (!request.isFixed) await page.evaluate(isolateMarked, ISOLATE_ARGS);

      const single = resolved.nodes.length === 1;
      const jpeg = single
        ? await page.locator(`[${CROP_MARK_ATTRIBUTE}]`).screenshot({
            type: "jpeg",
            quality: CROP_JPEG_QUALITY,
            animations: "disabled",
          })
        : await page.screenshot({
            type: "jpeg",
            quality: CROP_JPEG_QUALITY,
            animations: "disabled",
            fullPage: !request.isFixed,
            clip: resolved.union,
          });

      return {
        ok: true,
        typeId: request.typeId,
        jpeg,
        width: resolved.union.width,
        height: resolved.union.height,
      };
    } catch {
      return { ok: false, typeId: request.typeId, reason: "CAPTURE_FAILED" };
    }
  }

  return {
    async capture(url: string, requests: CaptureRequest[]): Promise<CaptureOutcome[]> {
      return session.withPage(url, async (page) => {
        const outcomes: CaptureOutcome[] = [];
        for (const request of requests) outcomes.push(await captureOne(page, request));
        return outcomes;
      });
    },

    async viewport(url: string): Promise<ViewportShot | undefined> {
      return session.withPage(url, async (page) => {
        try {
          const jpeg = await page.screenshot({
            type: "jpeg",
            quality: CROP_JPEG_QUALITY,
            fullPage: false,
            animations: "disabled",
          });
          return { jpeg, width: CROP_VIEWPORT.width, height: CROP_VIEWPORT.height };
        } catch {
          return undefined;
        }
      });
    },

    async close(): Promise<void> {
      await session.close();
    },
  };
}
