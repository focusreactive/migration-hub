import { describe, expect, it } from "vitest";

import { clampChars, clampSentences } from "../../../../../src/scripts/report/html/utils/clamp.ts";
import { escapeAttr, escapeHtml } from "../../../../../src/scripts/report/html/utils/escape.ts";
import { formatReportDate } from "../../../../../src/scripts/report/html/utils/format-date.ts";
import { inlineMarkdown } from "../../../../../src/scripts/report/html/utils/inline-markdown.ts";

describe("escapeHtml", () => {
  it("escapes the five markup-significant characters", () => {
    expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;",
    );
  });

  it("escapes ampersands before anything else", () => {
    // The probe must contain a character the other replacements act on. "&lt;" does
    // not: it yields "&amp;lt;" whether & is replaced first or last, so it cannot
    // detect a reordered chain. "<" can — the wrong order turns it into "&amp;lt;".
    expect(escapeHtml("<")).toBe("&lt;");
  });
});

describe("escapeAttr", () => {
  it("also collapses newlines so a data- attribute stays one line", () => {
    expect(escapeAttr("a\nb")).toBe("a b");
  });
});

describe("inlineMarkdown", () => {
  it("renders code spans and emphasis over escaped text", () => {
    expect(inlineMarkdown("*Plan for:* a handler using `next/font` & co")).toBe(
      '<em>Plan for:</em> a handler using <span class="mono">next/font</span> &amp; co',
    );
  });

  it("leaves a lone asterisk alone", () => {
    expect(inlineMarkdown("2 * 3")).toBe("2 * 3");
  });
});

describe("clampSentences", () => {
  const three = "One thing. Two things! Three things? Four things.";

  it("keeps whole sentences up to the cap", () => {
    expect(clampSentences(three, 2)).toBe("One thing. Two things!");
  });

  it("returns the text unchanged when it is already short enough", () => {
    expect(clampSentences("Only one.", 3)).toBe("Only one.");
  });

  it("handles text with no terminator", () => {
    expect(clampSentences("no full stop here", 1)).toBe("no full stop here");
  });

  it("keeps dotted identifiers whole instead of dropping the text before them", () => {
    const prose = "Next.js requires Node.js 18. It also needs pnpm.";

    expect(clampSentences(prose, 1)).toBe("Next.js requires Node.js 18.");
  });

  it("returns the whole text when it has fewer sentences than the cap", () => {
    expect(clampSentences("Next.js only. ", 5)).toBe("Next.js only. ");
  });
});

describe("clampChars", () => {
  it("cuts at a word boundary and adds an ellipsis", () => {
    expect(clampChars("the quick brown fox jumps", 15)).toBe("the quick brown…");
  });

  it("leaves short text alone", () => {
    expect(clampChars("short", 15)).toBe("short");
  });

  it("never returns more than max characters before the ellipsis", () => {
    const clamped = clampChars("supercalifragilisticexpialidocious rocks", 10);

    expect(clamped).toBe("supercalif…");
    expect(clamped.length - 1).toBeLessThanOrEqual(10);
  });
});

describe("formatReportDate", () => {
  it("renders the design's date format", () => {
    expect(formatReportDate(new Date(Date.UTC(2026, 8, 14)))).toBe("14 Sep 2026");
  });

  it("does not pad single-digit days", () => {
    expect(formatReportDate(new Date(Date.UTC(2026, 0, 3)))).toBe("3 Jan 2026");
  });
});
