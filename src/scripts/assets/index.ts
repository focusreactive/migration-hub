import { CliUsageError, parseServiceArgs } from "#lib/cli/index.ts";

import { runFonts } from "./steps/fonts/fonts.ts";
import { runMedia } from "./steps/media/media.ts";

async function main(): Promise<void> {
  const args = parseServiceArgs(process.argv.slice(2), {
    extraFlags: { media: { type: "boolean" }, fonts: { type: "boolean" } },
  });

  if (args["media"] !== true && args["fonts"] !== true) {
    throw new CliUsageError("--media or --fonts is required");
  }

  if (args["media"] === true) await runMedia(args.projectPath, args.force);
  if (args["fonts"] === true) await runFonts(args.projectPath, args.force);
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(error instanceof CliUsageError ? error.exitCode : 1);
}
