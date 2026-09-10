import { z } from "zod";

import { writeArtifact } from "#ir/artifact.ts";
import { discoveryBlocksArtifact, discoveryGlobalsArtifact } from "#ir/discovery.ts";
import { updateStep } from "#lib/manifest/index.ts";

import {
  DISCOVERY_DEDUP_ACCEPT_STEP_ID,
  DISCOVERY_DEDUP_JUDGE_STEP_ID,
  DISCOVERY_DEDUP_SUBJECT_STEP_ID,
} from "../../constants/ids.ts";
import { dedupResponseRelativePath } from "../../constants/paths.ts";
import { dedupResponseSchema } from "../../schemas/dedup-response.ts";
import type { AcceptError } from "../../types.ts";
import { readResponse } from "../../utils/read-response.ts";
import { reportAcceptErrors } from "../../utils/report-accept-errors.ts";

import { readDedupInstances } from "./subject.ts";
import { foldTypes } from "./utils/fold-types.ts";
import { validateDedupResponse } from "./utils/validate-dedup-response.ts";

export async function runDedupAccept(projectPath: string): Promise<void> {
  const raw = await readResponse(projectPath, dedupResponseRelativePath());

  const parsed = dedupResponseSchema.safeParse(raw);
  if (!parsed.success) {
    reportAcceptErrors(schemaErrors(parsed.error.issues));
    return;
  }

  const instances = await readDedupInstances(projectPath);
  const errors = validateDedupResponse({ response: parsed.data, instances });
  if (errors.length > 0) {
    reportAcceptErrors(errors);
    return;
  }

  const blockGroups = parsed.data.groups.filter((group) => group.kind === "block");
  const globalGroups = parsed.data.groups.filter((group) => group.kind === "global");

  const blocks = foldTypes(blockGroups, []);
  const globals = foldTypes(globalGroups, []);

  await writeArtifact(projectPath, discoveryBlocksArtifact, { types: blocks });
  await writeArtifact(projectPath, discoveryGlobalsArtifact, { types: globals });

  const finishedAt = new Date().toISOString();
  for (const stepId of [
    DISCOVERY_DEDUP_SUBJECT_STEP_ID,
    DISCOVERY_DEDUP_JUDGE_STEP_ID,
    DISCOVERY_DEDUP_ACCEPT_STEP_ID,
  ]) {
    await updateStep(projectPath, stepId, { status: "done", finishedAt });
  }

  console.log(JSON.stringify({ ok: true, blocks: blocks.length, globals: globals.length }));
}

function schemaErrors(issues: z.core.$ZodIssue[]): AcceptError[] {
  return issues.map((issue) => ({
    code: "SCHEMA",
    where: issue.path.join(".") || "(root)",
    detail: issue.message,
    fix: "Make the response match the schema printed by the schema step.",
  }));
}
