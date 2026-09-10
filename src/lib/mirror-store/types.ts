import type { FetchResponse } from "#lib/fetch/create-fetch-client/index.ts";

import type { MirrorEntry } from "./schema.ts";

export type { MirrorEntry } from "./schema.ts";

export type MirrorKind = "page" | "style" | "probe";

export interface MirrorStore {
  has(url: string): boolean;
  get(url: string): MirrorEntry | undefined;
  entries(): MirrorEntry[];
  fetchInto(
    url: string,
    kind: MirrorKind,
    opts?: {
      relativePath?: string;
      onResponse?: (response: FetchResponse) => void;
    },
  ): Promise<MirrorEntry>;
  readBody(entry: MirrorEntry): Promise<Buffer>;
}
