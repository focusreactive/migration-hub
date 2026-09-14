import type { MediaAssetsData } from "#ir/assets.ts";

import type { ReportInput } from "../types.ts";

import { distinctForms } from "./distinct-forms.ts";
import { isUtilitySectionType } from "./utility-pages.ts";

export interface ReportMetrics {
  pages: number;
  pageBuilderPages: number;
  collections: number;
  collectionDocuments: number;
  uniqueLayoutPages: number;
  sectionTypes: number;
  sectionInstances: number;
  reusedSectionTypes: number;
  singleUseSectionTypes: number;
  dualSourceSectionTypes: number;
  collectionOnlySectionTypes: number;
  utilitySectionTypes: number;
  globals: number;
  forms: number;
  platformHandledForms: number;
  images: number;
  videos: number;
  duplicateAssets: number;
  imagesWithoutAlt: number;
  assetHosts: string[];
  fonts: number;
  licensedFonts: number;
}

function uniqueAssets(media: MediaAssetsData) {
  return media.assets.filter((asset) => asset.duplicateOf === null);
}

function hostOf(url: string): string | undefined {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

export function computeMetrics(input: Omit<ReportInput, "narrative">): ReportMetrics {
  const unique = uniqueAssets(input.media);
  const images = unique.filter((asset) => asset.kind === "image");
  const forms = distinctForms(input.forms.forms);

  const hosts = new Set<string>();
  for (const asset of unique) {
    const host = hostOf(asset.canonicalUrl);
    if (host !== undefined) hosts.add(host);
  }

  const pageBuilderPages = input.pages.pages.filter((page) => page.kind === "static").length;
  const collections = input.pages.collections.length;

  return {
    pages: input.pages.pages.length,
    pageBuilderPages,
    collections,
    collectionDocuments: input.pages.collections.reduce((total, collection) => total + collection.itemCount, 0),
    uniqueLayoutPages: pageBuilderPages + collections,
    sectionTypes: input.blocks.types.length,
    sectionInstances: input.blocks.types.reduce((total, type) => total + type.instanceCount, 0),
    reusedSectionTypes: input.blocks.types.filter((type) => type.instanceCount > 1).length,
    singleUseSectionTypes: input.blocks.types.filter((type) => type.instanceCount === 1).length,
    dualSourceSectionTypes: input.blocks.types.filter((type) => type.kinds.length > 1).length,
    collectionOnlySectionTypes: input.blocks.types.filter(
      (type) => type.kinds.length === 1 && type.kinds[0] === "collectionSection",
    ).length,
    utilitySectionTypes: input.blocks.types.filter((type) => isUtilitySectionType(type)).length,
    globals: input.globals.types.length,
    forms: forms.length,
    platformHandledForms: forms.filter((form) => form.action === null).length,
    images: images.length,
    videos: unique.filter((asset) => asset.kind === "video").length,
    duplicateAssets: input.media.assets.length - unique.length,
    imagesWithoutAlt: images.filter((asset) => asset.alt === undefined || asset.alt === "").length,
    assetHosts: [...hosts].sort(),
    fonts: input.fonts.families.length,
    licensedFonts: input.fonts.families.filter(
      (family) => family.classification === "custom" || family.classification === "adobe",
    ).length,
  };
}
