import { z } from "zod";

import { readArtifact, writeArtifact } from "#ir/artifact.ts";
import { cropAnchorsShardArtifactFor, cropCandidatesShardArtifactFor } from "#ir/crops.ts";
import { sectionsShardArtifactFor } from "#ir/discovery.ts";
import { pagesArtifact } from "#ir/pages.ts";
import type { AcceptError } from "#discovery/types.ts";
import { readResponse } from "#discovery/utils/read-response.ts";
import { reportAcceptErrors } from "#discovery/utils/report-accept-errors.ts";
import { updateStep } from "#lib/manifest/index.ts";
import { routeDir } from "#lib/route-dir.ts";
import { captureRoutes } from "#stitch/utils/capture-routes.ts";

import {
  CROPS_ANCHORS_ACCEPT_STEP_ID,
  CROPS_ANCHORS_JUDGE_STEP_ID,
  CROPS_ANCHORS_SUBJECT_STEP_ID,
} from "../../constants/ids.ts";
import { anchorsResponseRelativePath } from "../../constants/paths.ts";
import { anchorsResponseSchema } from "../../schemas/anchors-response.ts";
import { routesMissingAnchors } from "../../utils/routes-missing-anchors.ts";

import { validateAnchorsResponse } from "./utils/validate-anchors-response.ts";

export async function runAnchorsAccept(projectPath: string, route: string): Promise<void> {
  const routeKey = routeDir(route);
  const raw = await readResponse(projectPath, anchorsResponseRelativePath(routeKey));

  const parsed = anchorsResponseSchema.safeParse(raw);
  if (!parsed.success) {
    reportAcceptErrors(schemaErrors(parsed.error.issues));
    return;
  }

  const sections = await readArtifact(projectPath, sectionsShardArtifactFor(routeKey));
  const candidates = await readArtifact(projectPath, cropCandidatesShardArtifactFor(routeKey));
  const orders = [...sections.globals, ...sections.blocks].map((section) => section.order).sort((a, b) => a - b);

  const errors = validateAnchorsResponse({
    response: parsed.data,
    requestedRoute: route,
    orders,
    candidates: candidates.candidates,
  });
  if (errors.length > 0) {
    reportAcceptErrors(errors);
    return;
  }

  const unmappable = [...(parsed.data.unmappable ?? [])].sort((a, b) => a - b);

  await writeArtifact(projectPath, cropAnchorsShardArtifactFor(routeKey), {
    route: parsed.data.route,
    anchors: [...parsed.data.anchors].sort((a, b) => a.order - b.order),
    unmappable,
  });

  const pages = await readArtifact(projectPath, pagesArtifact);
  const remaining = routesMissingAnchors(projectPath, captureRoutes(pages));
  if (remaining.length === 0) {
    const finishedAt = new Date().toISOString();
    for (const stepId of [CROPS_ANCHORS_SUBJECT_STEP_ID, CROPS_ANCHORS_JUDGE_STEP_ID, CROPS_ANCHORS_ACCEPT_STEP_ID]) {
      await updateStep(projectPath, stepId, { status: "done", finishedAt });
    }
  }

  console.log(
    JSON.stringify({ ok: true, route, anchors: parsed.data.anchors.length, unmappable: unmappable.length, remaining }),
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
