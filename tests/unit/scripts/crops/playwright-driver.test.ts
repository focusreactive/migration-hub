import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { chromium, type Browser } from "playwright";
import { afterAll, describe, expect, it } from "vitest";

import { createAnchorSession, resolveOn } from "../../../../src/lib/anchor/create-anchor-session.ts";
import { anchorNodeSignature, anchorSignature } from "../../../../src/lib/anchor/signature.ts";
import type { ResolveResult } from "../../../../src/lib/anchor/page-scripts.ts";
import { createCropDriver } from "../../../../src/scripts/crops/create-playwright-driver.ts";

const FIXTURE_URL = pathToFileURL(join(process.cwd(), "tests", "fixtures", "crops", "page.html")).toString();

const SERVICES_GREY = [204, 204, 204] as const;
const FOOTER_BLACK = [34, 34, 34] as const;

const PAST_THE_TEXT_X = 600;

const driver = createCropDriver();
const session = createAnchorSession();

let readerBrowser: Browser | undefined;

afterAll(async () => {
  await driver.close();
  await session.close();
  await readerBrowser?.close();
});

async function resolve(selector: string): Promise<ResolveResult> {
  return session.withPage(FIXTURE_URL, (page) => resolveOn(page, selector));
}

async function fractionNear(
  jpeg: Buffer,
  colour: readonly [number, number, number],
  fromX = 0,
): Promise<number> {
  readerBrowser ??= await chromium.launch();
  const page = await readerBrowser.newPage();
  try {
    return await page.evaluate(
      async ({ dataUrl, colour, fromX }) => {
        const TOLERANCE = 16;
        const STEP = 2;
        const bitmap = await createImageBitmap(await (await fetch(dataUrl)).blob());
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const context = canvas.getContext("2d");
        if (context === null) throw new Error("no 2d context");
        context.drawImage(bitmap, 0, 0);
        const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);

        let sampled = 0;
        let near = 0;
        for (let y = 0; y < bitmap.height; y += STEP) {
          for (let x = fromX; x < bitmap.width; x += STEP) {
            const offset = (y * bitmap.width + x) * 4;
            sampled += 1;
            const off = colour.some((channel, index) => Math.abs((data[offset + index] ?? 0) - channel) > TOLERANCE);
            if (!off) near += 1;
          }
        }
        return sampled === 0 ? 0 : near / sampled;
      },
      { dataUrl: `data:image/jpeg;base64,${jpeg.toString("base64")}`, colour: [...colour], fromX },
    );
  } finally {
    await page.close();
  }
}

async function captureOne(
  selector: string,
  typeId: string,
): Promise<{ jpeg: Buffer; width: number; height: number }> {
  const resolved = await resolve(selector);
  if (resolved.status !== "ok") throw new Error(`fixture selector ${selector} resolved ${resolved.status}`);

  const [outcome] = await driver.capture(FIXTURE_URL, [
    {
      typeId,
      selector,
      signature: anchorSignature(resolved.nodes),
      isFixed: resolved.nodes.some((node) => node.isFixed),
    },
  ]);
  if (outcome === undefined || !outcome.ok) throw new Error(`capture failed: ${JSON.stringify(outcome)}`);
  return { jpeg: outcome.jpeg, width: outcome.width, height: outcome.height };
}

function jpegSize(buffer: Buffer): { width: number; height: number } {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1] ?? 0;
    const length = buffer.readUInt16BE(offset + 2);
    const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isStartOfFrame) return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    offset += 2 + length;
  }
  throw new Error("no JPEG start-of-frame marker found");
}

describe("resolveAnchor", () => {
  it("reads geometry, identity and signature for a single element", { timeout: 60_000 }, async () => {
    const resolved = await resolve("section.s1");

    expect(resolved.status).toBe("ok");
    expect(resolved.nodes).toHaveLength(1);
    expect(resolved.union).toEqual({ x: 0, y: 60, width: 1440, height: 400 });
    expect(resolved.nodes[0]).toMatchObject({ tag: "section", classes: ["s1", "hero"], height: 400, isFixed: false });
    expect(resolved.nodes[0]?.textSnippet).toBe("Hero band");
  });

  it("ties the in-page signature format to the Node-side helper", { timeout: 60_000 }, async () => {
    const resolved = await resolve("section.s1");
    const node = resolved.nodes[0];
    if (node === undefined) throw new Error("fixture must resolve one node");

    expect(node.signature).toBe(
      anchorNodeSignature({
        tag: node.tag,
        classes: node.classes,
        height: node.height,
        textSnippet: node.textSnippet,
      }),
    );
  });

  it("reports a pinned element as pinned, in viewport coordinates", { timeout: 60_000 }, async () => {
    const resolved = await resolve(".platform-badge");

    expect(resolved.nodes[0]?.isFixed).toBe(true);
    expect(resolved.nodes[0]?.height).toBe(28);
  });

  it("unions a contiguous run of siblings into one band", { timeout: 60_000 }, async () => {
    const resolved = await resolve("section.s1, section.s2");

    expect(resolved.status).toBe("ok");
    expect(resolved.nodes).toHaveLength(2);
    expect(resolved.union).toEqual({ x: 0, y: 60, width: 1440, height: 700 });
  });

  it("refuses siblings with something else between them", { timeout: 60_000 }, async () => {
    const resolved = await resolve("section.s1, section.s3");

    expect(resolved.status).toBe("NOT_CONTIGUOUS");
    expect(resolved.union).toBeNull();
  });

  it("ignores a hidden twin of the same band", { timeout: 60_000 }, async () => {
    const resolved = await resolve(".nav");

    expect(resolved.status).toBe("ok");
    expect(resolved.nodes).toHaveLength(1);
    expect(resolved.nodes[0]?.tag).toBe("header");
    expect(resolved.union?.height).toBe(60);
  });

  it("refuses a selector that matches only hidden nodes", { timeout: 60_000 }, async () => {
    expect((await resolve(".mobile-only")).status).toBe("NO_MATCH");
  });

  it("treats a run separated only by hidden nodes as contiguous", { timeout: 60_000 }, async () => {
    const resolved = await resolve("section.s2, div.divider");

    expect(resolved.status).toBe("ok");
    expect(resolved.nodes).toHaveLength(2);
    expect(resolved.union?.height).toBe(308);
  });

  it("refuses a selector that matches nothing", { timeout: 60_000 }, async () => {
    expect((await resolve("section.nope")).status).toBe("NO_MATCH");
  });

  it("refuses a selector the browser cannot parse", { timeout: 60_000 }, async () => {
    expect((await resolve("section::((")).status).toBe("INVALID");
  });

  it("reports the page height, so a wrapper can be recognised as one", { timeout: 60_000 }, async () => {
    const resolved = await resolve(".page-wrapper");

    expect(resolved.pageHeight).toBeGreaterThan(2000);
    expect(resolved.union?.height).toBe(resolved.pageHeight);
  });
});

describe("createCropDriver", () => {
  it("captures the whole element, not just the part inside the viewport", { timeout: 60_000 }, async () => {
    const shot = await captureOne("section.s3", "services-accordion");

    expect(shot.width).toBe(1440);
    expect(shot.height).toBe(1600);
    expect(jpegSize(shot.jpeg)).toEqual({ width: 1440, height: 1600 });
  });

  it("captures a run of siblings as one frame covering their union", { timeout: 60_000 }, async () => {
    const shot = await captureOne("section.s1, section.s2", "two-band");

    expect(shot.height).toBe(700);
    expect(jpegSize(shot.jpeg)).toEqual({ width: 1440, height: 700 });
  });

  it("captures several targets in one call without losing later ones to scroll drift", { timeout: 60_000 }, async () => {
    const selectors = ["footer.site-footer", "section.s3", "section.s2", "section.s1", "header.nav"];
    const requests = [];
    for (const selector of selectors) {
      const resolved = await resolve(selector);
      requests.push({
        typeId: selector,
        selector,
        signature: anchorSignature(resolved.nodes),
        isFixed: resolved.nodes.some((node) => node.isFixed),
      });
    }

    const outcomes = await driver.capture(FIXTURE_URL, requests);

    for (const outcome of outcomes) {
      expect(outcome.ok, `expected ${outcome.typeId} to succeed: ${JSON.stringify(outcome)}`).toBe(true);
    }
  });

  it("captures the first screen as exactly one viewport, not the whole page", { timeout: 60_000 }, async () => {
    const shot = await driver.viewport(FIXTURE_URL);

    expect(shot).toBeDefined();
    expect(shot?.width).toBe(1440);
    expect(shot?.height).toBe(900);

    // The fixture page is far taller than one viewport, so a full-page screenshot would come
    // back taller than 900px. This is the guard that the hero shot stays the window, not the page.
    expect(jpegSize(shot!.jpeg)).toEqual({ width: 1440, height: 900 });
  });

  it("refuses an anchor whose signature no longer matches", { timeout: 60_000 }, async () => {
    const [outcome] = await driver.capture(FIXTURE_URL, [
      { typeId: "stale", selector: "section.s1", signature: "section.gone|999|Something else", isFixed: false },
    ]);

    expect(outcome).toEqual({ ok: false, typeId: "stale", reason: "SIGNATURE_DRIFT" });
  });

  it("reports a selector that no longer resolves", { timeout: 60_000 }, async () => {
    const [outcome] = await driver.capture(FIXTURE_URL, [
      { typeId: "missing", selector: "section.gone", signature: "whatever", isFixed: false },
    ]);

    expect(outcome).toEqual({ ok: false, typeId: "missing", reason: "SELECTOR_UNRESOLVED" });
  });

  it("keeps overlapping chrome out of an in-flow section's crop", { timeout: 60_000 }, async () => {
    const { jpeg } = await captureOne("section.s3", "services-accordion");

    expect(await fractionNear(jpeg, SERVICES_GREY, PAST_THE_TEXT_X)).toBe(1);
  });

  it("keeps floating chrome out of a global's crop when the global is in flow", { timeout: 60_000 }, async () => {
    const { jpeg } = await captureOne("footer.site-footer", "site-footer");

    expect(await fractionNear(jpeg, FOOTER_BLACK, PAST_THE_TEXT_X)).toBe(1);
  });

  it("captures a pinned target in context rather than isolating it", { timeout: 60_000 }, async () => {
    const { jpeg } = await captureOne(".platform-badge", "platform-badge");

    expect(await fractionNear(jpeg, SERVICES_GREY)).toBeGreaterThan(0.3);
  });
});
