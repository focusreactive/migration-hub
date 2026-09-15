import { z } from "zod";

import { readArtifact, writeArtifact } from "#ir/artifact.ts";
import { sectionsShardArtifactFor, type Section } from "#ir/discovery.ts";
import { pagesArtifact } from "#ir/pages.ts";
import { createAnchorSession, resolveOn } from "#lib/anchor/create-anchor-session.ts";
import type { ResolveResult } from "#lib/anchor/page-scripts.ts";
import { updateStep } from "#lib/manifest/index.ts";
import { routeDir } from "#lib/route-dir.ts";
import { loadRunConfig } from "#run-config/load.ts";
import { captureRoutes } from "#stitch/utils/capture-routes.ts";

import {
  DISCOVERY_SECTIONS_ACCEPT_STEP_ID,
  DISCOVERY_SECTIONS_JUDGE_STEP_ID,
  DISCOVERY_SECTIONS_SUBJECT_STEP_ID,
} from "../../constants/ids.ts";
import { sectionsResponseRelativePath } from "../../constants/paths.ts";
import { isNoElement, sectionsResponseSchema, type SectionResponse } from "../../schemas/sections-response.ts";
import type { AcceptError } from "../../types.ts";
import { readResponse } from "../../utils/read-response.ts";
import { reportAcceptErrors } from "../../utils/report-accept-errors.ts";
import { routesMissingShard } from "../../utils/routes-missing-shard.ts";

import { validateAnchors, type AnchorInput } from "./utils/validate-anchors.ts";
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

  const sections = [...parsed.data.globals, ...parsed.data.blocks];

  const runConfig = await loadRunConfig(projectPath);
  const url = new URL(route, new URL(runConfig.sourceUrl).origin).toString();

  const session = createAnchorSession();
  let inputs: AnchorInput[];
  try {
    inputs = await session.withPage(url, async (page) => {
      const resolved: AnchorInput[] = [];
      for (const section of sections) {
        if (isNoElement(section.anchor)) {
          resolved.push({ order: section.order, proposal: section.anchor, resolution: undefined });
          continue;
        }

        let resolution: ResolveResult | undefined;
        try {
          resolution = await resolveOn(page, section.anchor.selector);
        } catch {
          resolution = undefined;
        }
        resolved.push({ order: section.order, proposal: section.anchor, resolution });
      }
      return resolved;
    });
  } finally {
    await session.close();
  }

  const { errors: anchorErrors, anchors } = validateAnchors(inputs);
  if (anchorErrors.length > 0) {
    reportAcceptErrors(anchorErrors);
    return;
  }

  const withAnchor = (section: SectionResponse): Section => ({
    order: section.order,
    role: section.role,
    summary: section.summary,
    anchor: anchors.get(section.order) ?? null,
  });

  await writeArtifact(projectPath, sectionsShardArtifactFor(routeKey), {
    route: parsed.data.route,
    globals: parsed.data.globals.map(withAnchor),
    blocks: parsed.data.blocks.map(withAnchor),
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
      anchored: [...anchors.values()].filter((anchor) => anchor !== null).length,
      noElement: [...anchors.values()].filter((anchor) => anchor === null).length,
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
