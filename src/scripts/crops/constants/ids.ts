export const CROPS_STEP_PREFIX = "crops";

export const CROPS_CANDIDATES_STEP_ID = `${CROPS_STEP_PREFIX}:candidates` as const;

export const CROPS_ANCHORS_SCHEMA_STEP_ID = `${CROPS_STEP_PREFIX}:anchors:schema` as const;
export const CROPS_ANCHORS_SUBJECT_STEP_ID = `${CROPS_STEP_PREFIX}:anchors:subject` as const;
export const CROPS_ANCHORS_JUDGE_STEP_ID = `${CROPS_STEP_PREFIX}:anchors:judge` as const;
export const CROPS_ANCHORS_ACCEPT_STEP_ID = `${CROPS_STEP_PREFIX}:anchors:accept` as const;

export const CROPS_CAPTURE_STEP_ID = `${CROPS_STEP_PREFIX}:capture` as const;

export const CROPS_STEP_IDS = [
  CROPS_CANDIDATES_STEP_ID,
  CROPS_ANCHORS_SCHEMA_STEP_ID,
  CROPS_ANCHORS_SUBJECT_STEP_ID,
  CROPS_ANCHORS_JUDGE_STEP_ID,
  CROPS_ANCHORS_ACCEPT_STEP_ID,
  CROPS_CAPTURE_STEP_ID,
] as const;
