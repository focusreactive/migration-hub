import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { chromium, type Browser } from "playwright";
import { afterAll, describe, expect, it } from "vitest";

import { createCropDriver } from "../../../../src/scripts/crops/create-playwright-driver.ts";
import { candidateSignature } from "../../../../src/scripts/crops/utils/candidate-signature.ts";

const FIXTURE_URL = pathToFileURL(join(process.cwd(), "tests", "fixtures", "crops", "page.html")).toString();

const SERVICES_GREY = [204, 204, 204] as const;
const FOOTER_BLACK = [34, 34, 34] as const;

const PAST_THE_TEXT_X = 600;

const driver = createCropDriver();

let readerBrowser: Browser | undefined;

afterAll(async () => {
  await driver.close();
  await readerBrowser?.close();
});

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

async function captureOne(candidateIndex: number, typeId: string): Promise<{ jpeg: Buffer; width: number; height: number }> {
  const candidates = await driver.candidates(FIXTURE_URL);
  const candidate = candidates[candidateIndex];
  if (candidate === undefined) throw new Error(`fixture has no candidate ${candidateIndex}`);

  const [outcome] = await driver.capture(FIXTURE_URL, [
    { typeId, candidateIndex: candidate.index, signature: candidate.signature, isFixed: candidate.isFixed },
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

describe("createCropDriver", () => {
  it("descends past the page wrapper and returns one candidate per band", { timeout: 60_000 }, async () => {
    const candidates = await driver.candidates(FIXTURE_URL);

    // Six candidates: five content bands plus the pinned platform badge, which the collector
    // reports like any other pinned element — deciding it is not a section is the judged anchors
    // step's job, not this function's. It sorts in by y-position between `.s3` and the footer.
    expect(candidates.map((candidate) => candidate.tag)).toEqual([
      "header",
      "section",
      "section",
      "section",
      "a",
      "footer",
    ]);
    expect(candidates.map((candidate) => candidate.index)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(candidates.map((candidate) => candidate.height)).toEqual([60, 400, 300, 1600, 28, 200]);
    expect(candidates.map((candidate) => candidate.isFixed)).toEqual([true, false, false, false, true, false]);
    expect(candidates[1]?.classes).toEqual(["s1", "hero"]);
    expect(candidates[2]?.textSnippet).toBe("Logo strip");

    // R1: tie the in-page signature format to the standalone candidateSignature module so the
    // two copies (which cannot literally share code across the page.evaluate boundary) cannot
    // silently drift apart.
    expect(
      candidates.map((candidate) =>
        candidateSignature({
          tag: candidate.tag,
          classes: candidate.classes,
          height: candidate.height,
          textSnippet: candidate.textSnippet,
        }),
      ),
    ).toEqual(candidates.map((candidate) => candidate.signature));
  });

  it("reports platform chrome as an ordinary pinned candidate", { timeout: 60_000 }, async () => {
    // A hosting badge is on the page, so the collector reports it. Deciding that it is
    // not a section is the judged anchors step's job, not this function's.
    const candidates = await driver.candidates(FIXTURE_URL);
    const badge = candidates.find((candidate) => candidate.classes.includes("platform-badge"));

    expect(badge?.isFixed).toBe(true);
  });

  it("captures the whole element, not just the part inside the viewport", { timeout: 60_000 }, async () => {
    const candidates = await driver.candidates(FIXTURE_URL);
    const tall = candidates[3];
    if (tall === undefined) throw new Error("fixture must have a fourth candidate");

    const [outcome] = await driver.capture(FIXTURE_URL, [
      { typeId: "services-accordion", candidateIndex: tall.index, signature: tall.signature, isFixed: tall.isFixed },
    ]);

    if (outcome === undefined || !outcome.ok) throw new Error(`capture failed: ${JSON.stringify(outcome)}`);
    expect(outcome.width).toBe(1440);
    expect(outcome.height).toBe(1600);
    expect(jpegSize(outcome.jpeg)).toEqual({ width: 1440, height: 1600 });
  });

  it(
    "captures several targets in one call, in descending index order, without losing later ones to scroll drift",
    { timeout: 60_000 },
    async () => {
      // Each earlier locator.screenshot() in this loop scrolls the page and leaves it there.
      // The candidate list is re-collected per request, sorted by y, and a pinned candidate's
      // y used to move with the scroll — so descending order (captures the elements furthest
      // down the page first) used to shift every later index out from under the request that
      // expected it. All requests must still resolve to the candidate they were built from.
      const candidates = await driver.candidates(FIXTURE_URL);
      const requests = [...candidates]
        .sort((a, b) => b.index - a.index)
        .map((candidate) => ({
          typeId: `candidate-${candidate.index}`,
          candidateIndex: candidate.index,
          signature: candidate.signature,
          isFixed: candidate.isFixed,
        }));

      const outcomes = await driver.capture(FIXTURE_URL, requests);

      for (const outcome of outcomes) {
        expect(outcome.ok, `expected ${outcome.typeId} to succeed: ${JSON.stringify(outcome)}`).toBe(true);
      }
    },
  );

  it("captures the first screen as exactly one viewport, not the whole page", { timeout: 60_000 }, async () => {
    const shot = await driver.viewport(FIXTURE_URL);

    expect(shot).toBeDefined();
    expect(shot?.width).toBe(1440);
    expect(shot?.height).toBe(900);

    // The fixture page is far taller than one viewport, so a full-page screenshot would come
    // back taller than 900px. This is the guard that the hero shot stays the window, not the page.
    expect(jpegSize(shot!.jpeg)).toEqual({ width: 1440, height: 900 });
  });

  it("refuses a candidate whose signature no longer matches", { timeout: 60_000 }, async () => {
    const [outcome] = await driver.capture(FIXTURE_URL, [
      { typeId: "stale", candidateIndex: 1, signature: "section.gone|999|Something else", isFixed: false },
    ]);

    expect(outcome).toEqual({ ok: false, typeId: "stale", reason: "SIGNATURE_DRIFT" });
  });

  it("keeps overlapping chrome out of an in-flow section's crop", { timeout: 60_000 }, async () => {
    const { jpeg } = await captureOne(3, "services-accordion");

    expect(await fractionNear(jpeg, SERVICES_GREY, PAST_THE_TEXT_X)).toBe(1);
  });

  it("keeps floating chrome out of a global's crop when the global is in flow", { timeout: 60_000 }, async () => {
    const { jpeg } = await captureOne(5, "site-footer");

    expect(await fractionNear(jpeg, FOOTER_BLACK, PAST_THE_TEXT_X)).toBe(1);
  });

  it("captures a pinned target in context rather than isolating it", { timeout: 60_000 }, async () => {
    const { jpeg } = await captureOne(4, "platform-badge");

    expect(await fractionNear(jpeg, SERVICES_GREY)).toBeGreaterThan(0.3);
  });

  it("reports an out-of-range candidate index", { timeout: 60_000 }, async () => {
    const [outcome] = await driver.capture(FIXTURE_URL, [
      { typeId: "missing", candidateIndex: 99, signature: "whatever", isFixed: false },
    ]);

    expect(outcome).toEqual({ ok: false, typeId: "missing", reason: "CANDIDATE_OUT_OF_RANGE" });
  });
});
