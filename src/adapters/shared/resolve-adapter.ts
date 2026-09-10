import { readArtifact } from "#ir/artifact.ts";
import { detectArtifact } from "#ir/detect.ts";

export async function resolveAdapter(projectPath: string): Promise<"webflow" | "framer"> {
  const data = await readArtifact(projectPath, detectArtifact);
  if (data.verdict === "webflow" || data.verdict === "framer") {
    return data.verdict;
  }

  throw new Error(`adapter unresolved: detect verdict is "${data.verdict}"`);
}
