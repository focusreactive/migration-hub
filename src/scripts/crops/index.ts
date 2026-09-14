import { CliUsageError, parseServiceArgs } from "#lib/cli/index.ts";
import { readManifest } from "#lib/manifest/index.ts";

import { CROPS_STEP_IDS, CROPS_STEP_PREFIX } from "./constants/ids.ts";
import { runAnchorsAccept } from "./steps/anchors/accept.ts";
import { runAnchorsSchema } from "./steps/anchors/schema.ts";
import { runAnchorsSubject } from "./steps/anchors/subject.ts";
import { runCropCandidates } from "./steps/candidates.ts";
import { runCropCapture } from "./steps/capture.ts";

async function runState(projectPath: string): Promise<void> {
  const manifest = await readManifest(projectPath);
  const steps = CROPS_STEP_IDS.map((id) => ({ id, status: manifest.steps[id]?.status ?? "pending" }));

  console.log(JSON.stringify({ phase: CROPS_STEP_PREFIX, steps }));
}

async function main(): Promise<void> {
  const args = parseServiceArgs(process.argv.slice(2), {
    extraFlags: {
      candidates: { type: "boolean" },
      "anchors-schema": { type: "boolean" },
      "anchors-subject": { type: "boolean" },
      "anchors-accept": { type: "boolean" },
      capture: { type: "boolean" },
      state: { type: "boolean" },
      route: { type: "string" },
    },
  });
  const route = typeof args["route"] === "string" ? args["route"] : undefined;

  if (args["candidates"] === true) return runCropCandidates(args.projectPath, args.force);
  if (args["anchors-schema"] === true) return runAnchorsSchema(args.projectPath);
  if (args["anchors-subject"] === true) return runAnchorsSubject(args.projectPath, route);
  if (args["anchors-accept"] === true) {
    if (route === undefined) throw new CliUsageError("--route is required for --anchors-accept");
    return runAnchorsAccept(args.projectPath, route);
  }
  if (args["capture"] === true) return runCropCapture(args.projectPath, args.force);
  if (args["state"] === true) return runState(args.projectPath);

  throw new CliUsageError(
    "one of --candidates|--anchors-schema|--anchors-subject|--anchors-accept|--capture|--state is required",
  );
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(error instanceof CliUsageError ? error.exitCode : 1);
}
