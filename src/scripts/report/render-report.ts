import type { FontFamiliesData, MediaAssetsData } from "#ir/assets.ts";
import type { DiscoveryBlocksData, DiscoveryContentKind, DiscoveryTypesData } from "#ir/discovery.ts";
import type { FormField, FormRecord, FormsData } from "#ir/forms.ts";
import type { PagesData } from "#ir/pages.ts";

import { CONSULTATION_URL, CONTACT_EMAIL, TOOLS_BY_SOURCE } from "./constants/tools.ts";
import { collectionNameFromRoutePattern } from "./utils/collection-name.ts";
import { pageLabel } from "./utils/page-label.ts";

export interface ReportInput {
  sourceUrl: string;
  verdict: "webflow" | "framer";
  pages: PagesData;
  media: MediaAssetsData;
  fonts: FontFamiliesData;
  forms: FormsData;
  blocks: DiscoveryBlocksData;
  globals: DiscoveryTypesData;
}

interface DistinctForm {
  name: string | null;
  action: string | null;
  method: string;
  fieldCount: number;
  fields: FormField[];
  routes: string[];
}

const SOURCE_LABEL: Record<"webflow" | "framer", string> = { webflow: "Webflow", framer: "Framer" };
const KIND_LABEL: Record<DiscoveryContentKind, string> = { block: "Block", collectionSection: "Collection section" };
const MAX_LABEL_FIELDS = 5;

function countMedia(media: MediaAssetsData, kind: "image" | "video"): number {
  return media.assets.filter((asset) => asset.kind === kind && asset.duplicateOf === null).length;
}

function formSignature(form: FormRecord): string {
  return JSON.stringify([form.name, form.action, form.method, form.fields]);
}

function compareForms(a: DistinctForm, b: DistinctForm): number {
  const aName = a.name ?? "";
  const bName = b.name ?? "";
  if (aName !== bName) return aName < bName ? -1 : 1;

  const aAction = a.action ?? "";
  const bAction = b.action ?? "";
  if (aAction !== bAction) return aAction < bAction ? -1 : 1;

  if (a.method !== b.method) return a.method < b.method ? -1 : 1;

  if (a.fieldCount !== b.fieldCount) return a.fieldCount - b.fieldCount;

  const aRoute = a.routes[0] ?? "";
  const bRoute = b.routes[0] ?? "";
  if (aRoute !== bRoute) return aRoute < bRoute ? -1 : 1;

  return 0;
}

function distinctForms(forms: FormRecord[]): DistinctForm[] {
  const groups = new Map<string, DistinctForm>();

  for (const form of forms) {
    const signature = formSignature(form);
    const existing = groups.get(signature);
    if (existing === undefined) {
      groups.set(signature, {
        name: form.name,
        action: form.action,
        method: form.method,
        fieldCount: form.fieldCount,
        fields: form.fields,
        routes: [form.route],
      });
    } else {
      existing.routes.push(form.route);
    }
  }

  return [...groups.values()].map((group) => ({ ...group, routes: [...group.routes].sort() })).sort(compareForms);
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

  sections.push(`# Migration estimate — ${new URL(input.sourceUrl).hostname}`);
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
  sections.push(
    table(
      ["Target", "Tool"],
      TOOLS_BY_SOURCE[input.verdict].map((tool) => [tool.target, `[${tool.repo}](${tool.url})`]),
    ),
  );

  sections.push(
    `Want this migration done for you? [Get a free migration consultation](${CONSULTATION_URL}) or write to ${CONTACT_EMAIL}.`,
  );

  return `${sections.join("\n\n")}\n`;
}
