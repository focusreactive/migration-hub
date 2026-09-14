import { assessComplexity, type ComplexityArea, type Rating } from "../analysis/complexity.ts";
import { computeMetrics, type ReportMetrics } from "../analysis/metrics.ts";
import { assessRisks, type Risk } from "../analysis/risks.ts";

import type { HtmlReportInput } from "./types.ts";
import { createLinker, type Linker } from "./utils/page-links.ts";
import { buildSectionIndex, type IndexedPage } from "./utils/section-index.ts";
import { createShotStore, type ShotStore } from "./utils/shots.ts";

export interface RenderContext {
  input: HtmlReportInput;
  metrics: ReportMetrics;
  areas: ComplexityArea[];
  overall: Rating;
  risks: Risk[];
  linker: Linker;
  shots: ShotStore;
  pagesIndex: IndexedPage[];
}

export function createRenderContext(input: HtmlReportInput): RenderContext {
  const metrics = computeMetrics(input);
  const { areas, overall } = assessComplexity(metrics);

  return {
    input,
    metrics,
    areas,
    overall,
    risks: assessRisks(input, metrics),
    linker: createLinker({ sourceUrl: input.sourceUrl, pages: input.pages }),
    shots: createShotStore({ crops: input.crops, jpegs: input.jpegs }),
    pagesIndex: buildSectionIndex({ pages: input.pages, blocks: input.blocks, globals: input.globals }),
  };
}
