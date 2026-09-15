import { describe, expect, it } from "vitest";

import { createShotStore } from "../../../../../src/scripts/report/html/utils/shots.ts";

const CROPS = {
  shots: [
    { typeId: "hero", route: "/", order: 1, relativePath: "crops/shots/hero.jpg", width: 1440, height: 720 },
    { typeId: "footer", route: "/", order: 8, relativePath: "crops/shots/footer.jpg", width: 1440, height: 400 },
  ],
  missing: [{ typeId: "cta", route: "/", order: 5, reason: "SIGNATURE_DRIFT" as const }],
};

const JPEGS = new Map([
  ["hero", Buffer.from([0xff, 0xd8, 0xff])],
  ["footer", Buffer.from([0xff, 0xd8, 0xfe])],
]);

const store = createShotStore({ crops: CROPS, jpegs: JPEGS });

describe("createShotStore", () => {
  it("knows which types have a shot", () => {
    expect(store.has("hero")).toBe(true);
    expect(store.has("cta")).toBe(false);
  });

  it("emits an img with no src, so the data URI lives only in the script map", () => {
    const img = store.img("hero", "Home hero");

    expect(img).toBe('<img data-shot="hero" alt="Home hero" />');
    expect(img).not.toContain("src=");
  });

  it("emits each data URI exactly once, whatever the number of uses", () => {
    store.img("hero", "a");
    store.img("hero", "b");
    store.box("hero", "c", { style: "aspect-ratio: 16 / 9;" });

    const map = store.scriptMap();
    const occurrences = map.split('"hero":').length - 1;

    expect(occurrences).toBe(1);
    expect(map).toContain("data:image/jpeg;base64,/9j/");
  });

  it("falls back to the NO SHOT placeholder for a type with no crop", () => {
    const box = store.box("cta", "CTA panel", { style: "aspect-ratio: 2 / 1;" });

    expect(box).toContain("NO SHOT");
    expect(box).not.toContain("data-shot");
  });

  it("reports the natural aspect ratio so the modal can size itself", () => {
    expect(store.aspectRatio("hero")).toBe("1440 / 720");
    expect(store.aspectRatio("cta")).toBeUndefined();
  });

  it("escapes the alt text", () => {
    expect(store.img("hero", 'Tom & "Jerry"')).toContain('alt="Tom &amp; &quot;Jerry&quot;"');
  });
});
