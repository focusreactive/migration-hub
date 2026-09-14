import type { ReportInput } from "../types.ts";

export function narrativeSection(input: ReportInput): string {
  return `${input.narrative.site}\n\n${input.narrative.design}`;
}
