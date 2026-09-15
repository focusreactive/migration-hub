import { describe, expect, it } from "vitest";

import { renderHtmlReport } from "../../../../../src/scripts/report/html/render-html-report.ts";

import { loadFixtureInput } from "./fixture.ts";

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
});
