import type { ReportInput } from "../types.ts";
import { clampSentences } from "../utils/clamp.ts";

const SITE_SENTENCES = 2;
const DESIGN_SENTENCES = 4;

export function narrativeParagraphs(input: ReportInput): { site: string; design: string } {
  return {
    site: clampSentences(input.narrative.site, SITE_SENTENCES),
    design: clampSentences(input.narrative.design, DESIGN_SENTENCES),
  };
}

export function narrativeSection(input: ReportInput): string {
  const { site, design } = narrativeParagraphs(input);
  return `${site}\n\n${design}`;
}
