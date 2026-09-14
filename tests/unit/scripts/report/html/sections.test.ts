import { beforeAll, describe, expect, it } from "vitest";

import { complexitySection } from "../../../../../src/scripts/report/html/sections/complexity.ts";
import { contentModelSection } from "../../../../../src/scripts/report/html/sections/content-model.ts";
import { headerSection } from "../../../../../src/scripts/report/html/sections/header.ts";
import { heroSection } from "../../../../../src/scripts/report/html/sections/hero.ts";
import { scopeSection } from "../../../../../src/scripts/report/html/sections/scope.ts";
import type { RenderContext } from "../../../../../src/scripts/report/html/render-context.ts";

import { loadFixtureContext } from "./fixture.ts";

let ctx: RenderContext;

beforeAll(async () => {
  ctx = await loadFixtureContext();
});

describe("headerSection", () => {
  it("shows the generation date in the design's format", () => {
    expect(headerSection(ctx)).toContain("Generated 14 Sep 2026");
  });

  it("keeps the hardcoded wordmark, label and CTA", () => {
    const html = headerSection(ctx);

    expect(html).toContain('aria-label="FocusReactive"');
    expect(html).toContain("Migration assessment");
    expect(html).toContain("Book a consultation");
    expect(html).toContain('id="scrollProgress"');
  });

  it("keeps the style attribute the responsive layer matches on", () => {
    expect(headerSection(ctx)).toContain(
      'style="display: flex; align-items: center; justify-content: space-between; height: 76px;',
    );
  });
});

describe("heroSection", () => {
  it("names the detected platform in the eyebrow and in a chip", () => {
    const html = heroSection(ctx);

    expect(html).toContain("Framer &rarr; headless cms");
    expect(html).toContain("Source platform &middot; Framer");
  });

  it("uses the source hostname as the page title", () => {
    expect(heroSection(ctx)).toContain("<h1");
    expect(heroSection(ctx)).toContain("pearlstudio.framer.website");
  });

  it("reports the page count and the overall complexity", () => {
    const html = heroSection(ctx);

    expect(html).toContain(`${ctx.metrics.pages} pages analysed`);
    expect(html).toContain(`Overall complexity &middot; ${ctx.overall}`);
  });

  it("clamps the narrative paragraphs to two and four sentences", () => {
    const html = heroSection(ctx);

    expect(html).toContain("It sells brand and product work.");
    expect(html).not.toContain("A third sentence.");
    expect(html).toContain("It is monochrome.");
    expect(html).not.toContain("A fifth sentence.");
  });

  it("omits the hero image when no crop was captured", () => {
    expect(heroSection(ctx)).not.toContain("data-shot");
  });
});

describe("scopeSection", () => {
  it("keeps the hardcoded heading and card labels", () => {
    const html = scopeSection(ctx);

    expect(html).toContain("Scope at a glance");
    for (const label of [
      "Pages",
      "Collections",
      "Section types",
      "Globals",
      "Images",
      "Videos",
      "Font families",
      "Forms",
    ]) {
      expect(html).toContain(label);
    }
  });

  it("carries a glossary tooltip on each vocabulary term", () => {
    const html = scopeSection(ctx);

    expect(html).toContain(
      '<span class="term" tabindex="0" data-def="One published URL on the source site.">Pages</span>',
    );
    expect(html).toContain("unique layout pages</span> to build");
  });

  it("templates the breakdown heading from the page count", () => {
    expect(scopeSection(ctx)).toContain(`How the ${ctx.metrics.pages} pages break down`);
  });

  it("gives the stacked bar one segment per collection, weighted by documents", () => {
    const html = scopeSection(ctx);

    expect(html).toContain(`flex: ${ctx.metrics.pageBuilderPages}`);
    for (const collection of ctx.input.pages.collections) expect(html).toContain(`flex: ${collection.itemCount}`);
  });

  it("dims a zero count", () => {
    expect(scopeSection(ctx)).toContain("margin-top: 14px; color: #545454;");
  });
});

describe("complexitySection", () => {
  it("keeps the hardcoded heading, lead and five card names", () => {
    const html = complexitySection(ctx);

    expect(html).toContain("Complexity assessment");
    expect(html).toContain("Nothing here is a judgement call");
    for (const label of [
      "Content model",
      "Page composition",
      "Design system &amp; assets",
      "Forms &amp; integrations",
      "Content volume",
    ]) {
      expect(html).toContain(label);
    }
  });

  it("fills the meter according to the rating", () => {
    const html = complexitySection(ctx);
    const lowSegments = html.split("background: #00e56d;").length - 1;

    expect(lowSegments).toBeGreaterThan(0);
    expect(html).toContain("background: #1e1e1e;");
  });

  it("clamps each paragraph to three sentences", () => {
    const html = complexitySection(ctx);
    const paragraphs = [...html.matchAll(/<p class="body">([\s\S]*?)<\/p>/g)].map((match) => match[1] ?? "");

    expect(paragraphs).toHaveLength(5);
    for (const paragraph of paragraphs) {
      expect((paragraph.match(/[.!?](\s|$)/g) ?? []).length).toBeLessThanOrEqual(3);
    }
  });

  it("renders code spans from the markdown copy rather than backticks", () => {
    expect(complexitySection(ctx)).not.toContain("`next/font`");
  });
});

describe("contentModelSection", () => {
  it("names each collection and its document count", () => {
    const html = contentModelSection(ctx);

    for (const collection of ctx.input.pages.collections) expect(html).toContain(String(collection.itemCount));
    expect(html).toContain("Journal");
  });

  it("labels the route pattern but links to a real document", () => {
    const html = contentModelSection(ctx);

    expect(html).toContain("/journal/:slug");
    expect(html).toContain("Example document &middot; /journal/");
  });

  it("counts the sections on the collection's template page", () => {
    const template = ctx.pagesIndex.find((page) => page.isCollectionTemplate);

    expect(contentModelSection(ctx)).toContain(`${template?.sections.length ?? 0} sections in its template page`);
  });

  it("carries the glossary tooltips the design has in its lead", () => {
    const html = contentModelSection(ctx);

    expect(html).toContain("collection template page</span>");
    expect(html).toContain("document</span>");
  });
});
