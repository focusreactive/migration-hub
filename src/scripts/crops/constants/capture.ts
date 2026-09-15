import { ANCHOR_VIEWPORT } from "#lib/anchor/constants.ts";

export const CROP_JPEG_QUALITY = 80;

export const CROP_VIEWPORT = ANCHOR_VIEWPORT;

export const CROP_MARK_ATTRIBUTE = "data-mig-crop";
export const CROP_ANCESTOR_ATTRIBUTE = "data-mig-crop-ancestor";
export const CROP_ISOLATION_STYLE_ID = "mig-crop-isolation";

const SPECIFICITY_GUARD = ":not(#mig-never-matches)";

export const CROP_ISOLATION_CSS =
  `body *${SPECIFICITY_GUARD} { visibility: hidden !important; }` +
  ` [${CROP_MARK_ATTRIBUTE}]${SPECIFICITY_GUARD},` +
  ` [${CROP_MARK_ATTRIBUTE}] *${SPECIFICITY_GUARD} { visibility: visible !important; }` +
  ` [${CROP_ANCESTOR_ATTRIBUTE}]${SPECIFICITY_GUARD} { visibility: visible !important; }`;
