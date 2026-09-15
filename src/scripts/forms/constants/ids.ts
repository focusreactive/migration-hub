export const FORMS_STEP_PREFIX = "forms";

export const FORMS_STEP_ID = FORMS_STEP_PREFIX;

export const FORMS_NAMES_SCHEMA_STEP_ID = `${FORMS_STEP_PREFIX}:names:schema` as const;
export const FORMS_NAMES_SUBJECT_STEP_ID = `${FORMS_STEP_PREFIX}:names:subject` as const;
export const FORMS_NAMES_JUDGE_STEP_ID = `${FORMS_STEP_PREFIX}:names:judge` as const;
export const FORMS_NAMES_ACCEPT_STEP_ID = `${FORMS_STEP_PREFIX}:names:accept` as const;

export const FORMS_STEP_IDS = [
  FORMS_STEP_ID,
  FORMS_NAMES_SCHEMA_STEP_ID,
  FORMS_NAMES_SUBJECT_STEP_ID,
  FORMS_NAMES_JUDGE_STEP_ID,
  FORMS_NAMES_ACCEPT_STEP_ID,
] as const;
