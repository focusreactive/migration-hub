import { describe, expect, it } from "vitest";

import {
  PAGE_CSS,
  RESPONSIVE_CSS,
  SHOT_CSS,
  TOKENS_CSS,
} from "../../../../../src/scripts/report/html/constants/css.ts";
import { GOOGLE_FONTS_HREF } from "../../../../../src/scripts/report/html/constants/fonts.ts";
import { FR_WORDMARK_SVG } from "../../../../../src/scripts/report/html/constants/svg.ts";

describe("page CSS", () => {
  it("carries the design tokens", () => {
    expect(TOKENS_CSS).toContain("--fr-accent: #00e56d");
    expect(TOKENS_CSS).toContain(".chip {");
  });

  it("does not import Google Fonts from inside the stylesheet", () => {
    expect(TOKENS_CSS).not.toContain("@import");
  });

  it("drops the design's src-agnostic shotbox rule in favour of the src-aware one", () => {
    expect(TOKENS_CSS).not.toContain(".shotbox:has(> img)");
    expect(SHOT_CSS).toContain(".shotbox:has(> img[src])");
    expect(SHOT_CSS).toContain(".shotbox > img:not([src])");
  });

  it("carries the page layer and the term tooltip", () => {
    expect(PAGE_CSS).toContain("h2.sec");
    expect(PAGE_CSS).toContain(".term::after");
    expect(PAGE_CSS).toContain("dialog.secmodal");
  });

  it("carries the responsive layer's substring selectors intact", () => {
    expect(RESPONSIVE_CSS).toContain('[style*="grid-template-columns: repeat(4, minmax(0, 1fr))"]');
    expect(RESPONSIVE_CSS).toContain('[style*="height: 76px"][style*="backdrop-filter"]');
    expect(RESPONSIVE_CSS).toContain("@media (max-width: 560px)");
  });

  it("closes every block it opens", () => {
    for (const css of [TOKENS_CSS, PAGE_CSS, RESPONSIVE_CSS, SHOT_CSS]) {
      expect(css.split("{").length).toBe(css.split("}").length);
    }
  });
});

describe("fonts", () => {
  it("points at the two families the design uses", () => {
    expect(GOOGLE_FONTS_HREF).toContain("Inter+Tight");
    expect(GOOGLE_FONTS_HREF).toContain("JetBrains+Mono");
    expect(GOOGLE_FONTS_HREF).toContain("display=swap");
  });
});

describe("wordmark", () => {
  it("is an inline svg with an accessible label", () => {
    expect(FR_WORDMARK_SVG.startsWith("<svg")).toBe(true);
    expect(FR_WORDMARK_SVG).toContain('aria-label="FocusReactive"');
    expect(FR_WORDMARK_SVG).not.toContain("http://www.w3.org/1999/xlink");
  });
});
