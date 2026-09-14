import { join } from "node:path/posix";

import { ASSESSMENT_DIR } from "#ir/artifact.ts";
import { sanitizeFileName } from "#lib/fs.ts";
import { routeFromUrl } from "#lib/url.ts";

import type { MirrorKind } from "./types.ts";

export const MIRROR_DIR = join(ASSESSMENT_DIR, "mirror");

const FILE_KIND_DIRS: Record<Exclude<MirrorKind, "probe" | "page">, string> = {
  style: "styles",
};

export function pageMirrorPathForRoute(route: string): string {
  const segments = route
    .split("/")
    .filter(Boolean)
    .map((segment) => sanitizeFileName(segment));

  return join("pages", ...segments, "index.html");
}

export function mirrorPath(
  kind: Exclude<MirrorKind, "probe">,
  normalizedUrl: string,
  opts?: { existing?: ReadonlySet<string> },
): string {
  if (kind === "page") {
    return pageMirrorPathForRoute(routeFromUrl(normalizedUrl));
  }

  const fileName = sanitizeFileName(lastPathSegment(normalizedUrl), opts);

  return join(FILE_KIND_DIRS[kind], fileName);
}

function lastPathSegment(url: string): string {
  const segments = new URL(url).pathname.split("/").filter(Boolean);

  return segments.at(-1) ?? "";
}
