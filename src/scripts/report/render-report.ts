import type { MediaAssetsData } from "#ir/assets.ts";
import type { DiscoveryContentKind } from "#ir/discovery.ts";
import type { FormField } from "#ir/forms.ts";
import type { PagesData } from "#ir/pages.ts";

import { distinctForms, type DistinctForm } from "./analysis/distinct-forms.ts";
import { KIND_LABEL, SOURCE_LABEL } from "./constants/labels.ts";
import { CONSULTATION_URL, CONTACT_EMAIL, TOOLS_BY_SOURCE } from "./constants/tools.ts";
import type { ReportInput } from "./types.ts";
import { collectionNameFromRoutePattern } from "./utils/collection-name.ts";
import { pageLabel } from "./utils/page-label.ts";

export type { ReportInput };

const MAX_LABEL_FIELDS = 5;

function countMedia(media: MediaAssetsData, kind: "image" | "video"): number {
  return media.assets.filter((asset) => asset.kind === kind && asset.duplicateOf === null).length;
}

function namedFieldNames(fields: FormField[]): string[] {
  return fields.map((field) => field.name).filter((name) => name !== "");
}

function formatFieldList(names: string[]): string {
  if (names.length <= MAX_LABEL_FIELDS) return names.join(", ");
  return `${names.slice(0, MAX_LABEL_FIELDS).join(", ")}, …`;
}

function anonymousFormLabel(fields: FormField[]): string {
  const named = namedFieldNames(fields);
  return named.length === 0 ? "—" : formatFieldList(named);
}

function formLabel(form: DistinctForm): string {
  return form.name ?? anonymousFormLabel(form.fields);
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|");
}

function table(header: string[], rows: string[][]): string {
  const divider = header.map(() => "---");
  return [header, divider, ...rows].map((row) => `| ${row.map(escapeCell).join(" | ")} |`).join("\n");
}

function pageMemberLabel(pages: PagesData, route: string): string {
  const page = pages.pages.find((candidate) => candidate.route === route);
  if (page?.kind !== "item") return route;

  const collection = pages.collections.find((candidate) => candidate.key === page.collectionKey);
  const name = collection === undefined ? route : collectionNameFromRoutePattern(collection.routePattern);
  return `${name} (collection template)`;
}

function memberPagesList(pages: PagesData, members: { route: string }[]): string {
  return members.map((member) => pageMemberLabel(pages, member.route)).join(", ");
}

function kindsLabel(kinds: DiscoveryContentKind[]): string {
  return kinds.map((kind) => KIND_LABEL[kind]).join(", ");
}

export function renderReport(input: ReportInput): string {
  const staticPages = input.pages.pages.filter((page) => page.kind === "static");
  const images = countMedia(input.media, "image");
  const videos = countMedia(input.media, "video");
  const forms = distinctForms(input.forms.forms);

  const sections: string[] = [];

  sections.push(`# Migration assessment — ${new URL(input.sourceUrl).hostname}`);
  sections.push(`Source CMS: **${SOURCE_LABEL[input.verdict]}**`);

  sections.push("## Scope");
  sections.push(
    table(
      ["What", "Count"],
      [
        ["Pages", String(input.pages.pages.length)],
        ["Collections", String(input.pages.collections.length)],
        ["Page builder pages", String(staticPages.length)],
        ["Block types", String(input.blocks.types.length)],
        ["Globals", String(input.globals.types.length)],
        ["Images", String(images)],
        ["Videos", String(videos)],
        ["Font families", String(input.fonts.families.length)],
        ["Forms", String(forms.length)],
      ],
    ),
  );

  sections.push("## Collections");
  sections.push(
    input.pages.collections.length === 0
      ? "No CMS collections found."
      : table(
          ["Collection", "Route pattern", "Pages"],
          input.pages.collections.map((collection) => [
            collectionNameFromRoutePattern(collection.routePattern),
            collection.routePattern,
            String(collection.itemCount),
          ]),
        ),
  );

  sections.push("## Page builder pages");
  sections.push(
    table(
      ["Page", "Slug"],
      staticPages.map((page) => {
        const label = pageLabel(page.route);
        return [label.name, label.slug];
      }),
    ),
  );

  sections.push("## Blocks");
  sections.push(
    input.blocks.types.length === 0
      ? "No blocks found."
      : table(
          ["Block", "Instances", "Pages", "Used as"],
          input.blocks.types.map((type) => [
            type.name,
            String(type.instanceCount),
            memberPagesList(input.pages, type.members),
            kindsLabel(type.kinds),
          ]),
        ),
  );

  sections.push("## Globals");
  sections.push(
    input.globals.types.length === 0
      ? "No globals found."
      : table(
          ["Global", "Instances", "Pages"],
          input.globals.types.map((type) => [
            type.name,
            String(type.instanceCount),
            memberPagesList(input.pages, type.members),
          ]),
        ),
  );

  sections.push("## Forms");
  sections.push(
    forms.length === 0
      ? "No forms found."
      : table(
          ["Form", "Fields", "Endpoint", "Pages"],
          forms.map((form) => [
            formLabel(form),
            String(form.fieldCount),
            form.action ?? "handled by the platform",
            form.routes.join(", "),
          ]),
        ),
  );

  sections.push("## Migrate this site");
  sections.push("You can use the following public FocusReactive tools as a demo of this migration:");
  sections.push(
    table(
      ["Target", "Tool"],
      TOOLS_BY_SOURCE[input.verdict].map((tool) => [tool.target, `[${tool.repo}](${tool.url})`]),
    ),
  );

  sections.push("## 🚀 Need a full migration?");
  sections.push(
    "This pipeline is maintained by [FocusReactive](https://focusreactive.com) — a specialized Next.js and Headless CMS migration agency. We help enterprise businesses migrate from legacy monoliths and visual builders like Webflow and Framer to modern stacks such as Sanity, Payload CMS, Storyblok, and MedusaJS.",
  );
  sections.push("### Why FocusReactive?");
  sections.push(
    [
      "- **Expertise:** Verified Sanity, Payload, and Storyblok partners.",
      "- **Speed:** We use our proprietary [CMS Kit](https://github.com/focusreactive/cms-kit) to speed up migrations by 40%.",
      "- **SEO & Performance:** Zero downtime migrations with 100/100 Lighthouse scores.",
    ].join("\n"),
  );
  sections.push(
    `👉 **[Get a Free Migration Consultation](${CONSULTATION_URL})** or contact us at ${CONTACT_EMAIL}.`,
  );

  return `${sections.join("\n\n")}\n`;
}
