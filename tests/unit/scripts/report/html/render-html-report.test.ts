import { describe, expect, it } from "vitest";

import { renderHtmlReport } from "../../../../../src/scripts/report/html/render-html-report.ts";

import { CROPPED_TYPE_SUMMARY, loadFixtureInput, loadFixtureInputWithCrops } from "./fixture.ts";

describe("renderHtmlReport", () => {
  it("emits one self-contained document", async () => {
    const html = renderHtmlReport(await loadFixtureInput());

    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html.trimEnd().endsWith("</html>")).toBe(true);
    expect(html).toContain("<style>");
    expect(html).toContain("<script>");
  });

  it("references no external resource except Google Fonts", async () => {
    const html = renderHtmlReport(await loadFixtureInput());
    const urls = [...html.matchAll(/(?:href|src)="(https?:\/\/[^"]+)"/g)].map((match) => match[1] ?? "");
    const stylesheetOrScript = urls.filter((url) => /\.(css|js)(\?|$)/.test(url) || url.includes("fonts.googleapis"));

    for (const url of stylesheetOrScript) expect(url.startsWith("https://fonts.googleapis.com")).toBe(true);
    expect(html).not.toContain("cdn.jsdelivr.net");
    expect(html).not.toContain("cdnjs.cloudflare.com");
    expect(html).not.toContain("../foundations/");
    expect(html).not.toContain("../assets/");
  });

  it("names the site in the title", async () => {
    expect(renderHtmlReport(await loadFixtureInput())).toContain(
      "<title>Migration assessment — pearlstudio.framer.website</title>",
    );
  });

  it("renders every band the fixture has data for", async () => {
    const html = renderHtmlReport(await loadFixtureInput());

    for (const heading of [
      "Scope at a glance",
      "Complexity assessment",
      "Content model",
      "Section library",
      "Page composition",
      "Global sections",
      "Forms",
      "Media &amp; typography",
      "Risks &amp; watch-outs",
      "How the migration runs",
      "Migrate this site yourself",
    ]) {
      expect(html).toContain(heading);
    }
  });

  it("is deterministic for a fixed generation date", async () => {
    const a = renderHtmlReport(await loadFixtureInput());
    const b = renderHtmlReport(await loadFixtureInput());

    expect(a).toBe(b);
  });

  it("substitutes every script placeholder", async () => {
    const html = renderHtmlReport(await loadFixtureInput());

    expect(html).not.toContain("__SITE__");
    expect(html).not.toContain("__TPL__");
    expect(html).not.toContain("__GLOBALS__");
    expect(html).not.toContain("__TYPES__");
  });

  it("closes every tag it opens at the top level", async () => {
    const html = renderHtmlReport(await loadFixtureInput());

    expect(html.split("<div").length).toBe(html.split("</div>").length);
  });

  it("degrades every screenshot to a placeholder when no crop was captured", async () => {
    const html = renderHtmlReport(await loadFixtureInput());

    expect(html).toContain("NO SHOT");
    expect(html).toContain("var SHOTS={}");
  });

  it("escapes model-written text embedded into the script so it cannot break out of it", async () => {
    const input = await loadFixtureInput();
    const payload = "</script><img onerror=alert(1)>";
    const globalType = input.globals.types[0];
    if (globalType === undefined) throw new Error("fixture has no global types to poison");
    globalType.name = payload;

    const html = renderHtmlReport(input);

    expect(html).not.toContain("</script><img");
    expect(html).toContain("\\u003cimg onerror=alert(1)>");
  });

  it("embeds the one captured screenshot's base64 payload exactly once", async () => {
    const html = renderHtmlReport(await loadFixtureInputWithCrops());
    const match = /var SHOTS=\{([^}]*)\};/.exec(html);
    if (match === null) throw new Error("SHOTS map not found in rendered output");
    const base64Match = /data:image\/jpeg;base64,([^"]+)"/.exec(match[1] ?? "");
    if (base64Match === null) throw new Error("no base64 payload found in SHOTS map");
    const base64 = base64Match[1] ?? "";

    expect(base64.length).toBeGreaterThan(0);
    expect(html.split(base64).length - 1).toBe(1);
  });

  it("resolves every img[data-shot] the page renders to a key in the emitted SHOTS map", async () => {
    // Scoped to <img data-shot> specifically: that is the set the page script itself
    // reads (`document.querySelectorAll('img[data-shot]')`) to fill in `src` from
    // SHOTS on load. A .seccard's own data-shot (an id carried for click-handling,
    // not a screenshot reference) is unrelated to whether a crop was captured.
    const html = renderHtmlReport(await loadFixtureInputWithCrops());
    const shotsMatch = /var SHOTS=\{([\s\S]*?)\};/.exec(html);
    if (shotsMatch === null) throw new Error("SHOTS map not found in rendered output");
    const shotIds = new Set([...(shotsMatch[1] ?? "").matchAll(/"([^"]+)":"data:/g)].map((m) => m[1]));

    const dataShotIds = [...html.matchAll(/<img[^>]*data-shot="([^"]*)"/g)].map((m) => m[1] ?? "");
    expect(dataShotIds.length).toBeGreaterThan(0);

    for (const id of dataShotIds) expect(shotIds.has(id)).toBe(true);
  });

  it("carries the shard summary through summaryForType into the rendered output", async () => {
    const html = renderHtmlReport(await loadFixtureInputWithCrops());

    expect(html).toContain(CROPPED_TYPE_SUMMARY);
  });
});
