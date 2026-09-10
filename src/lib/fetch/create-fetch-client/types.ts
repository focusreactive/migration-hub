export interface FetchClientOptions {
  concurrency: number;
  requestDelayMs: number;
  timeoutMs: number;
  userAgent: string;
  fetchImpl?: typeof globalThis.fetch;
  sleep?: (ms: number) => Promise<void>;
}

export interface FetchResponse {
  status: number;
  finalUrl: string;
  redirectChain: string[];
  headers: Record<string, string>;
  body: Buffer;
}

export interface FetchClient {
  fetch(url: string): Promise<FetchResponse>;
  setCrawlDelayMs(ms: number): void;
}

export interface HopResult {
  status: number;
  headers: Record<string, string>;
  body: Buffer;
}
