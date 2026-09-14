import type { FontFamiliesData, MediaAssetsData } from "#ir/assets.ts";
import type { DiscoveryBlocksData, DiscoveryTypesData } from "#ir/discovery.ts";
import type { FormsData } from "#ir/forms.ts";
import type { NarrativeData } from "#ir/narrative.ts";
import type { PagesData } from "#ir/pages.ts";

export interface ReportInput {
  sourceUrl: string;
  verdict: "webflow" | "framer";
  pages: PagesData;
  media: MediaAssetsData;
  fonts: FontFamiliesData;
  forms: FormsData;
  blocks: DiscoveryBlocksData;
  globals: DiscoveryTypesData;
  narrative: NarrativeData;
}
