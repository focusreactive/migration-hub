import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { FetchClient, FetchResponse } from "#lib/fetch/create-fetch-client/index.ts";
import { writeFileAtomic } from "#lib/fs.ts";
import { normalizeUrl } from "#lib/url.ts";

import { MIRROR_DIR } from "./paths.ts";
import {
  mirrorEntrySchema,
  mirrorIndexSchema,
  MIRROR_INDEX_SCHEMA_VERSION,
  type MirrorEntry,
  type MirrorIndex,
} from "./schema.ts";
import type { MirrorKind, MirrorStore } from "./types.ts";
import { indexPath, readIndexIfPresent, resolveRelativePath } from "./utils.ts";

export function readOnlyClient(): FetchClient {
  return {
    fetch(): Promise<FetchResponse> {
      return Promise.reject(new Error("mirror store is read-only here"));
    },
    setCrawlDelayMs(): void {
      return;
    },
  };
}

export async function openMirrorStore(projectPath: string, client: FetchClient): Promise<MirrorStore> {
  const mirrorDir = join(projectPath, MIRROR_DIR);
  const registry = new Map<string, MirrorEntry>();

  const reservedRawPaths = new Map<string, MirrorKind>();

  const existingIndex = await readIndexIfPresent(projectPath);
  if (existingIndex) {
    for (const [url, entry] of Object.entries(existingIndex.entries)) {
      registry.set(url, entry);
    }
  }

  let writeQueue: Promise<void> = Promise.resolve();

  function persistIndex(): Promise<void> {
    const write = async (): Promise<void> => {
      const index: MirrorIndex = {
        schemaVersion: MIRROR_INDEX_SCHEMA_VERSION,
        entries: Object.fromEntries(registry),
      };
      await writeFileAtomic(indexPath(projectPath), `${JSON.stringify(mirrorIndexSchema.parse(index), null, 2)}\n`);
    };

    const scheduled = writeQueue.then(write, write);

    writeQueue = scheduled.catch(() => undefined);
    return scheduled;
  }

  return {
    has(url: string): boolean {
      return registry.has(normalizeUrl(url));
    },

    get(url: string): MirrorEntry | undefined {
      return registry.get(normalizeUrl(url));
    },

    entries(): MirrorEntry[] {
      return [...registry.values()];
    },

    async fetchInto(
      url: string,
      kind: MirrorKind,
      opts?: {
        relativePath?: string;
        onResponse?: (response: FetchResponse) => void;
      },
    ): Promise<MirrorEntry> {
      const normalizedUrl = normalizeUrl(url);

      const existingEntry = registry.get(normalizedUrl);
      if (existingEntry) {
        if (existingEntry.kind === "probe" && kind !== "probe") {
          const promoted = mirrorEntrySchema.parse({ ...existingEntry, kind });
          registry.set(normalizedUrl, promoted);
          await persistIndex();
          return promoted;
        }

        return existingEntry;
      }

      const relativePath = resolveRelativePath(kind, normalizedUrl, opts?.relativePath, registry, reservedRawPaths);

      const isReservable = opts?.relativePath === undefined;
      if (isReservable) reservedRawPaths.set(relativePath, kind);

      try {
        const response = await client.fetch(normalizedUrl);
        opts?.onResponse?.(response);
        await writeFileAtomic(join(mirrorDir, relativePath), response.body);

        const { "content-type": contentType, etag, "last-modified": lastModified } = response.headers;

        const entry = mirrorEntrySchema.parse({
          url: normalizedUrl,
          kind,
          paths: { raw: relativePath },
          http: {
            status: response.status,
            finalUrl: response.finalUrl,
            redirectChain: response.redirectChain,
            ...(contentType !== undefined && { contentType }),
            ...(etag !== undefined && { etag }),
            ...(lastModified !== undefined && { lastModified }),
          },
          sha256: createHash("sha256").update(response.body).digest("hex"),
          size: response.body.length,
          fetchedAt: new Date().toISOString(),
        });

        registry.set(normalizedUrl, entry);
        try {
          await persistIndex();
        } catch (error) {
          registry.delete(normalizedUrl);
          throw new Error(`Failed to persist mirror index after fetching ${normalizedUrl}`, { cause: error });
        }

        return entry;
      } finally {
        if (isReservable) reservedRawPaths.delete(relativePath);
      }
    },

    async readBody(entry: MirrorEntry): Promise<Buffer> {
      return readFile(join(mirrorDir, entry.paths.raw));
    },
  };
}
