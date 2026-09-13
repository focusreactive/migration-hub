import { CliUsageError, parseServiceArgs } from "#lib/cli/index.ts";
import { readManifest } from "#lib/manifest/index.ts";

import { REPORT_STEP_IDS, REPORT_STEP_PREFIX } from "./constants/ids.ts";
import { runReport } from "./report.ts";
import { runNarrativeAccept } from "./steps/narrative/accept.ts";
import { runNarrativeSchema } from "./steps/narrative/schema.ts";
import { runNarrativeSubject } from "./steps/narrative/subject.ts";

async function runState(projectPath: string): Promise<void> {
  const manifest = await readManifest(projectPath);
  const steps = REPORT_STEP_IDS.map((id) => ({ id, status: manifest.steps[id]?.status ?? "pending" }));

  console.log(JSON.stringify({ phase: REPORT_STEP_PREFIX, steps }));
}

async function main(): Promise<void> {
  const args = parseServiceArgs(process.argv.slice(2), {
    extraFlags: {
      "narrative-schema": { type: "boolean" },
      "narrative-subject": { type: "boolean" },
      "narrative-accept": { type: "boolean" },
      state: { type: "boolean" },
    },
  });

  if (args["narrative-schema"] === true) return runNarrativeSchema(args.projectPath);
  if (args["narrative-subject"] === true) return runNarrativeSubject(args.projectPath);
  if (args["narrative-accept"] === true) return runNarrativeAccept(args.projectPath);
  if (args["state"] === true) return runState(args.projectPath);

  return runReport(args.projectPath, args.force);
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);

  process.stderr.write(`${message}\n`);
  process.exit(error instanceof CliUsageError ? error.exitCode : 1);
}
