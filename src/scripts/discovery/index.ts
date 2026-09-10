import { CliUsageError, parseServiceArgs } from "#lib/cli/index.ts";
import { readManifest } from "#lib/manifest/index.ts";

import { DISCOVERY_SECTIONS_STEP_IDS, DISCOVERY_STEP_PREFIX } from "./constants/ids.ts";
import { runSectionsAccept } from "./steps/sections/accept.ts";
import { runSectionsSchema } from "./steps/sections/schema.ts";
import { runSectionsSubject } from "./steps/sections/subject.ts";

async function runState(projectPath: string): Promise<void> {
  const manifest = await readManifest(projectPath);
  const steps = DISCOVERY_SECTIONS_STEP_IDS.map((id) => ({ id, status: manifest.steps[id]?.status ?? "pending" }));

  console.log(JSON.stringify({ phase: DISCOVERY_STEP_PREFIX, steps }));
}

async function main(): Promise<void> {
  const args = parseServiceArgs(process.argv.slice(2), {
    extraFlags: {
      "sections-schema": { type: "boolean" },
      "sections-subject": { type: "boolean" },
      "sections-accept": { type: "boolean" },
      state: { type: "boolean" },
      route: { type: "string" },
    },
  });
  const route = typeof args["route"] === "string" ? args["route"] : undefined;

  if (args["sections-schema"] === true) return runSectionsSchema(args.projectPath);
  if (args["sections-subject"] === true) return runSectionsSubject(args.projectPath, route);
  if (args["sections-accept"] === true) {
    if (route === undefined) throw new CliUsageError("--route is required for --sections-accept");
    return runSectionsAccept(args.projectPath, route);
  }
  if (args["state"] === true) return runState(args.projectPath);

  throw new CliUsageError("one of --sections-schema|--sections-subject|--sections-accept|--state is required");
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(error instanceof CliUsageError ? error.exitCode : 1);
}
