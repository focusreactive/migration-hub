import { SOURCE_LABEL } from "../constants/labels.ts";
import { MISSING_ALT_SHARE } from "../constants/thresholds.ts";
import type { ReportInput } from "../types.ts";
import { countLabel } from "../utils/count.ts";

import type { ReportMetrics } from "./metrics.ts";

export type RiskId =
  | "forms"
  | "assetHosting"
  | "altText"
  | "utilitySections"
  | "dualSourceSections"
  | "interactions"
  | "inferredFields"
  | "redirects";

export interface Risk {
  id: RiskId;
  title: string;
  body: string;
}

const MOTION_ROLES = ["accordion", "carousel", "marquee", "slider", "tabs"];

function hasMotionRole(input: ReportInput): boolean {
  return input.blocks.types.some((type) => MOTION_ROLES.some((role) => type.role.includes(role)));
}

function sentenceCount(count: number): string {
  return count === 1 ? "One" : String(count);
}

function platformHandledFormsClause(metrics: ReportMetrics): string {
  if (metrics.forms === 1) return "The one form on this site posts";
  if (metrics.platformHandledForms === 1) return `One of the ${metrics.forms} forms on this site posts`;
  return `${metrics.platformHandledForms} of the ${metrics.forms} forms on this site post`;
}

function hostedAssetsSubject(metrics: ReportMetrics): string {
  if (metrics.images === 0) return "Every asset on this site is";
  return metrics.images === 1 ? "The one image is" : `All ${metrics.images} images are`;
}

function publishedEntriesClause(metrics: ReportMetrics): string {
  if (metrics.entries === 0) return "With no published entry to read from";
  return `With ${countLabel(metrics.entries, "published entry", "published entries")}`;
}

export function assessRisks(input: ReportInput, metrics: ReportMetrics): Risk[] {
  const platform = SOURCE_LABEL[input.verdict];
  const risks: Risk[] = [];

  if (metrics.platformHandledForms > 0) {
    risks.push({
      id: "forms",
      title: "Form submissions have nowhere to go after cutover.",
      body:
        `${platformHandledFormsClause(metrics)} to ${platform}'s built-in handler — there is no external `
        + `endpoint to point the new site at. *Plan for:* a form handler, spam protection, notification `
        + `routing, and an export of existing submissions before the ${platform} subscription lapses.`,
    });
  }

  if (metrics.assetHosts.length > 0) {
    risks.push({
      id: "assetHosting",
      title: metrics.images === 0 ? "Every asset lives on the platform's CDN." : "Every image lives on the platform's CDN.",
      body:
        `${hostedAssetsSubject(metrics)} served from `
        + `${metrics.assetHosts.join(", ")}. Those URLs stop working `
        + `when the site is unpublished. *Plan for:* re-hosting assets into the new CMS as part of the content `
        + `migration, not after it — this is automated by our migration tooling, but it has to happen before the `
        + `old site is switched off.`,
    });
  }

  if (metrics.images > 0 && metrics.imagesWithoutAlt / metrics.images > MISSING_ALT_SHARE) {
    risks.push({
      id: "altText",
      title:
        metrics.images === 1
          ? "The one image has no alt text."
          : `${sentenceCount(metrics.imagesWithoutAlt)} of ${metrics.images} images `
            + `${metrics.imagesWithoutAlt === 1 ? "has" : "have"} no alt text.`,
      body:
        "That accessibility and SEO debt will be copied into the new site verbatim unless it is addressed. "
        + "*Plan for:* the migration is the cheapest moment to fix it, but writing alt text is manual content "
        + "work and should be scheduled as such.",
    });
  }

  if (metrics.utilitySectionTypes > 0) {
    risks.push({
      id: "utilitySections",
      title:
        metrics.sectionTypes === 1
          ? "The one section type exists only for the platform's own utility pages."
          : `${sentenceCount(metrics.utilitySectionTypes)} of the ${metrics.sectionTypes} section types `
            + `${metrics.utilitySectionTypes === 1 ? "exists" : "exist"} only for the platform's own utility pages.`,
      body:
        "Style guides, licence pages and changelogs are scaffolding that came with the template, not product "
        + "pages. *Plan for:* an early decision to drop them — it takes those section types out of scope "
        + "outright.",
    });
  }

  if (metrics.dualSourceSectionTypes > 0) {
    risks.push({
      id: "dualSourceSections",
      title:
        `${sentenceCount(metrics.dualSourceSectionTypes)} `
        + `${metrics.dualSourceSectionTypes === 1 ? "section is" : "sections are"} used in two different ways.`,
      body:
        `${metrics.dualSourceSectionTypes === 1 ? "It appears" : "They appear"} both as page-builder blocks and `
        + "inside collection templates. *Plan for:* components designed to take either author-picked content "
        + "or CMS-referenced content, decided before they are built rather than retrofitted.",
    });
  }

  if (hasMotionRole(input)) {
    risks.push({
      id: "interactions",
      title: "Interactive behaviour is not visible to static analysis.",
      body:
        `Accordions, marquees and carousels are ${platform} interactions; this report sees their markup, not `
        + "their motion. *Plan for:* a short pass to spec and rebuild animations, sized after a walkthrough of "
        + "the live site.",
    });
  }

  if (metrics.collections > 0) {
    risks.push({
      id: "inferredFields",
      title: "The CMS field model is inferred from rendered pages.",
      body:
        `${publishedEntriesClause(metrics)}, fields that exist in ${platform} but are not rendered by any `
        + "template are invisible to this analysis. *Plan for:* a short review of the source field list against "
        + "the proposed schema before content migration starts.",
    });
  }

  risks.push({
    id: "redirects",
    title: `${sentenceCount(metrics.routes)} ${metrics.routes === 1 ? "URL needs" : "URLs need"} a redirect map.`,
    body:
      "Route patterns are stable and map one-to-one, so this is bookkeeping rather than a problem — but it is "
      + "a launch blocker if it is skipped.",
  });

  return risks;
}
