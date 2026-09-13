import { z } from "zod";

import { writeArtifact } from "#ir/artifact.ts";
import { narrativeArtifact, narrativeDataSchema, type NarrativeData } from "#ir/narrative.ts";
import { updateStep } from "#lib/manifest/index.ts";

import {
  REPORT_NARRATIVE_ACCEPT_STEP_ID,
  REPORT_NARRATIVE_JUDGE_STEP_ID,
  REPORT_NARRATIVE_SUBJECT_STEP_ID,
} from "../../constants/ids.ts";
import { narrativeResponseRelativePath } from "../../constants/paths.ts";
import type { AcceptError } from "../../../discovery/types.ts";
import { readResponse } from "../../../discovery/utils/read-response.ts";
import { reportAcceptErrors } from "../../../discovery/utils/report-accept-errors.ts";

const FILLER_OPENING = "This site";

function schemaErrors(issues: z.core.$ZodIssue[]): AcceptError[] {
  return issues.map((issue) => ({
    code: "SCHEMA",
    where: issue.path.join(".") || "(root)",
    detail: issue.message,
    fix: "Make the response match the schema printed by the schema step.",
  }));
}

function copyErrors(narrative: NarrativeData): AcceptError[] {
  const errors: AcceptError[] = [];

  if (/\d/.test(narrative.site)) {
    errors.push({
      code: "COUNTERS_IN_SITE_PARAGRAPH",
      where: "site",
      detail: "the site paragraph contains a digit",
      fix: "Describe what the site is and who it serves. Counts belong in the Scope at a glance table.",
    });
  }

  for (const [key, value] of Object.entries(narrative)) {
    if (value.trim().startsWith(FILLER_OPENING)) {
      errors.push({
        code: "FILLER_OPENING",
        where: key,
        detail: `the paragraph starts with the hostname-free filler "${FILLER_OPENING}"`,
        fix: "Open with the hostname or a concrete subject, not a generic filler.",
      });
    }

    if (/\bwe\b/i.test(value)) {
      errors.push({
        code: "AGENCY_VOICE",
        where: key,
        detail: 'the paragraph says "we"',
        fix: "Describe the site, not the agency. Keep the paragraph in the third person.",
      });
    }
  }

  return errors;
}

export async function runNarrativeAccept(projectPath: string): Promise<void> {
  const raw = await readResponse(projectPath, narrativeResponseRelativePath());

  const parsed = narrativeDataSchema.safeParse(raw);
  if (!parsed.success) {
    reportAcceptErrors(schemaErrors(parsed.error.issues));
    return;
  }

  const errors = copyErrors(parsed.data);
  if (errors.length > 0) {
    reportAcceptErrors(errors);
    return;
  }

  await writeArtifact(projectPath, narrativeArtifact, parsed.data);

  const finishedAt = new Date().toISOString();
  for (const stepId of [
    REPORT_NARRATIVE_SUBJECT_STEP_ID,
    REPORT_NARRATIVE_JUDGE_STEP_ID,
    REPORT_NARRATIVE_ACCEPT_STEP_ID,
  ]) {
    await updateStep(projectPath, stepId, { status: "done", finishedAt });
  }

  console.log(JSON.stringify({ ok: true, step: REPORT_NARRATIVE_ACCEPT_STEP_ID }));
}
