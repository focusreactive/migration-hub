import { CliUsageError, parseServiceArgs } from "#lib/cli/index.ts";
import { readManifest } from "#lib/manifest/index.ts";

import { CROPS_STEP_IDS, CROPS_STEP_PREFIX } from "./constants/ids.ts";
import { runCropCapture } from "./steps/capture.ts";

async function runState(projectPath: string): Promise<void> {
  const manifest = await readManifest(projectPath);
  const steps = CROPS_STEP_IDS.map((id) => ({ id, status: manifest.steps[id]?.status ?? "pending" }));

  console.log(JSON.stringify({ phase: CROPS_STEP_PREFIX, steps }));
}

async function main(): Promise<void> {
  const args = parseServiceArgs(process.argv.slice(2), {
    extraFlags: {
      capture: { type: "boolean" },
      state: { type: "boolean" },
    },
  });

  if (args["capture"] === true) return runCropCapture(args.projectPath, args.force);
  if (args["state"] === true) return runState(args.projectPath);

  throw new CliUsageError("one of --capture|--state is required");
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(error instanceof CliUsageError ? error.exitCode : 1);
}
