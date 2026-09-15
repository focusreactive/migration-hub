/** How far to descend from <body> through a sole full-height visible child. */
export const MAX_DESCENT_DEPTH = 8;

/** A sole visible child is treated as a wrapper only when it fills its parent this closely. */
export const SOLE_CHILD_HEIGHT_RATIO = 0.9;

/** Anything shorter than this is a divider or a spacer, not a section. */
export const MIN_CANDIDATE_HEIGHT_PX = 24;

/** Hard ceiling so a pathological page cannot flood the judged subject. */
export const MAX_CANDIDATES = 120;

export const SNIPPET_LENGTH = 120;
export const SIGNATURE_TEXT_LENGTH = 48;
export const MAX_SIGNATURE_CLASSES = 6;

export const CROP_JPEG_QUALITY = 80;

export const CROP_VIEWPORT = { width: 1440, height: 900 } as const;

export const CROP_MARK_ATTRIBUTE = "data-mig-crop";
export const CROP_ANCESTOR_ATTRIBUTE = "data-mig-crop-ancestor";
export const CROP_ISOLATION_STYLE_ID = "mig-crop-isolation";

const SPECIFICITY_GUARD = ":not(#mig-never-matches)";

export const CROP_ISOLATION_CSS =
  `body *${SPECIFICITY_GUARD} { visibility: hidden !important; }` +
  ` [${CROP_MARK_ATTRIBUTE}]${SPECIFICITY_GUARD},` +
  ` [${CROP_MARK_ATTRIBUTE}] *${SPECIFICITY_GUARD} { visibility: visible !important; }` +
  ` [${CROP_ANCESTOR_ATTRIBUTE}]${SPECIFICITY_GUARD} { visibility: visible !important; }`;
