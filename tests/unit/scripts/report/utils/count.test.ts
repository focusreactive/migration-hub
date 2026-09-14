import { describe, expect, it } from "vitest";

import {
  countLabel,
  sentenceCountLabel,
  sentenceCountWord,
} from "../../../../../src/scripts/report/utils/count.ts";

describe("countLabel", () => {
  it("spells out a single item and keeps the singular noun", () => {
    expect(countLabel(1, "font family", "font families")).toBe("one font family");
  });

  it("uses digits and the plural noun for anything else", () => {
    expect(countLabel(3, "collection template page", "collection template pages")).toBe("3 collection template pages");
  });

  it("uses digits and the plural noun for zero", () => {
    expect(countLabel(0, "form", "forms")).toBe("0 forms");
  });
});

describe("sentenceCountWord", () => {
  it("capitalises the word for one so a sentence can start with it", () => {
    expect(sentenceCountWord(1)).toBe("One");
  });

  it("uses digits for anything else", () => {
    expect(sentenceCountWord(4)).toBe("4");
    expect(sentenceCountWord(0)).toBe("0");
  });
});

describe("sentenceCountLabel", () => {
  it("capitalises the word for one and keeps the singular noun", () => {
    expect(sentenceCountLabel(1, "collection makes", "collections make")).toBe("One collection makes");
  });

  it("uses digits and the plural noun for anything else", () => {
    expect(sentenceCountLabel(3, "collection makes", "collections make")).toBe("3 collections make");
    expect(sentenceCountLabel(0, "form", "forms")).toBe("0 forms");
  });
});
