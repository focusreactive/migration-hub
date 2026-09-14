import { assessComplexity } from "./analysis/complexity.ts";
import { computeMetrics } from "./analysis/metrics.ts";
import { assessRisks } from "./analysis/risks.ts";
import { aboutSection } from "./sections/about.ts";
import { complexitySection } from "./sections/complexity.ts";
import { contentModelSection } from "./sections/content-model.ts";
import { formsSection } from "./sections/forms.ts";
import { globalsSection } from "./sections/globals.ts";
import { headerSection } from "./sections/header.ts";
import { mediaSection } from "./sections/media.ts";
import { migrationStepsSection } from "./sections/migration-steps.ts";
import { narrativeSection } from "./sections/narrative.ts";
import { pageBuilderPagesSection } from "./sections/page-builder-pages.ts";
import { risksSection } from "./sections/risks.ts";
import { scopeSection } from "./sections/scope.ts";
import { sectionLibrarySection } from "./sections/section-library.ts";
import { toolsSection } from "./sections/tools.ts";
import type { ReportInput } from "./types.ts";

export type { ReportInput };

export function renderReport(input: ReportInput): string {
  const metrics = computeMetrics(input);
  const { areas, overall } = assessComplexity(metrics);
  const risks = assessRisks(input, metrics);

  const sections = [
    headerSection(input, metrics, overall),
    narrativeSection(input),
    scopeSection(input, metrics),
    complexitySection(areas, input, metrics),
    contentModelSection(input, metrics),
    pageBuilderPagesSection(input, metrics),
    sectionLibrarySection(input, metrics),
    globalsSection(input, metrics),
    formsSection(input, metrics),
    mediaSection(input, metrics),
    risksSection(risks),
    migrationStepsSection(metrics),
    toolsSection(input),
    aboutSection(),
  ];

  return `${sections.join("\n\n")}\n`;
}
