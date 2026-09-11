import { z } from "zod";

import { readArtifact, writeArtifact } from "#ir/artifact.ts";
import { sectionsShardArtifactFor } from "#ir/discovery.ts";
import { pagesArtifact } from "#ir/pages.ts";
import { updateStep } from "#lib/manifest/index.ts";
import { routeDir } from "#lib/route-dir.ts";
import { captureRoutes } from "#stitch/utils/capture-routes.ts";

import {
  DISCOVERY_SECTIONS_ACCEPT_STEP_ID,
  DISCOVERY_SECTIONS_JUDGE_STEP_ID,
  DISCOVERY_SECTIONS_SUBJECT_STEP_ID,
} from "../../constants/ids.ts";
import { sectionsResponseRelativePath } from "../../constants/paths.ts";
import { sectionsResponseSchema } from "../../schemas/sections-response.ts";
import type { AcceptError } from "../../types.ts";
import { readResponse } from "../../utils/read-response.ts";
import { reportAcceptErrors } from "../../utils/report-accept-errors.ts";
import { routesMissingShard } from "../../utils/routes-missing-shard.ts";

import { validateSectionsResponse } from "./utils/validate-sections-response.ts";

export async function runSectionsAccept(projectPath: string, route: string): Promise<void> {
  const routeKey = routeDir(route);
  const raw = await readResponse(projectPath, sectionsResponseRelativePath(routeKey));

  const parsed = sectionsResponseSchema.safeParse(raw);
  if (!parsed.success) {
    reportAcceptErrors(schemaErrors(parsed.error.issues));
    return;
  }

  const errors = validateSectionsResponse({ response: parsed.data, requestedRoute: route });
  if (errors.length > 0) {
    reportAcceptErrors(errors);
    return;
  }

  const shardDef = sectionsShardArtifactFor(routeKey);
  await writeArtifact(projectPath, shardDef, {
    route: parsed.data.route,
    globals: parsed.data.globals,
    blocks: parsed.data.blocks,
  });

  const pages = await readArtifact(projectPath, pagesArtifact);
  const remaining = routesMissingShard(projectPath, captureRoutes(pages));
  if (remaining.length === 0) {
    const finishedAt = new Date().toISOString();
    for (const stepId of [
      DISCOVERY_SECTIONS_SUBJECT_STEP_ID,
      DISCOVERY_SECTIONS_JUDGE_STEP_ID,
      DISCOVERY_SECTIONS_ACCEPT_STEP_ID,
    ]) {
      await updateStep(projectPath, stepId, { status: "done", finishedAt });
    }
  }

  console.log(
    JSON.stringify({
      ok: true,
      route,
      globals: parsed.data.globals.length,
      blocks: parsed.data.blocks.length,
      remaining,
    }),
  );
}

function schemaErrors(issues: z.core.$ZodIssue[]): AcceptError[] {
  return issues.map((issue) => ({
    code: "SCHEMA",
    where: issue.path.join(".") || "(root)",
    detail: issue.message,
    fix: "Make the response match the schema printed by the schema step.",
  }));
}
