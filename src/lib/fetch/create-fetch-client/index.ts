import { BACKOFF_MULTIPLIER, INITIAL_BACKOFF_MS, MAX_REDIRECTS, MAX_RETRIES, REDIRECT_STATUSES } from "./constants.ts";
import { defaultSleep, headersToRecord, isRetryableStatus } from "./utils.ts";
import type { FetchClient, FetchClientOptions, FetchMethod, FetchRequestOpts, FetchResponse, HopResult } from "./types.ts";

export type { FetchClient, FetchResponse } from "./types.ts";

export function createFetchClient({
  concurrency,
  requestDelayMs,
  timeoutMs,
  userAgent,
  fetchImpl: fetchImplProp,
  sleep: sleepProp,
}: FetchClientOptions): FetchClient {
  const fetchImpl = fetchImplProp ?? globalThis.fetch;
  const sleep = sleepProp ?? defaultSleep;

  const queue: Array<() => void> = [];
  const slotWaiters: Array<() => void> = [];

  let crawlDelayMs = 0;
  let inFlight = 0;
  let hasStartedOnce = false;
  let pumping = false;

  const effectiveDelayMs = (): number => Math.max(requestDelayMs, crawlDelayMs);

  const releaseSlot = () => {
    inFlight--;
    slotWaiters.shift()?.();
  };

  const waitForSlot = (): Promise<void> => {
    return new Promise((resolve) => slotWaiters.push(resolve));
  };

  const pump = async (): Promise<void> => {
    if (pumping) return;
    pumping = true;

    while (queue.length > 0) {
      if (inFlight >= concurrency) {
        await waitForSlot();
        continue;
      }

      const start = queue.shift();
      if (!start) continue;

      if (hasStartedOnce) {
        const delayMs = effectiveDelayMs();
        if (delayMs > 0) await sleep(delayMs);
      }
      hasStartedOnce = true;

      inFlight++;
      start();
    }

    pumping = false;
  };

  function schedule<T>(job: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      queue.push(() => {
        job().then(
          (value) => {
            releaseSlot();
            resolve(value);
          },
          (error: unknown) => {
            releaseSlot();
            reject(error instanceof Error ? error : new Error(String(error)));
          },
        );
      });

      void pump();
    });
  }

  async function performOnce(url: string, method: FetchMethod): Promise<HopResult> {
    const response = await fetchImpl(url, {
      method,
      redirect: "manual",
      headers: { "User-Agent": userAgent },
      signal: AbortSignal.timeout(timeoutMs),
    });

    const body = method === "HEAD" ? Buffer.alloc(0) : Buffer.from(await response.arrayBuffer());

    return {
      status: response.status,
      headers: headersToRecord(response.headers),
      body,
    };
  }

  async function performHopWithRetries(url: string, method: FetchMethod): Promise<HopResult> {
    let attempt = 0;

    while (true) {
      let result: HopResult;
      try {
        result = await schedule(() => performOnce(url, method));
      } catch (error) {
        if (attempt < MAX_RETRIES) {
          await sleep(INITIAL_BACKOFF_MS * BACKOFF_MULTIPLIER ** attempt);
          attempt++;
          continue;
        }
        throw new Error(`Network request to ${url} failed after ${MAX_RETRIES + 1} attempts`, { cause: error });
      }

      if (isRetryableStatus(result.status) && attempt < MAX_RETRIES) {
        await sleep(INITIAL_BACKOFF_MS * BACKOFF_MULTIPLIER ** attempt);
        attempt++;
        continue;
      }

      return result;
    }
  }

  async function runFetch(url: string, opts?: FetchRequestOpts): Promise<FetchResponse> {
    const method = opts?.method ?? "GET";
    const redirectChain: string[] = [];
    let currentUrl = url;

    while (true) {
      const hop = await performHopWithRetries(currentUrl, method);
      const location = hop.headers["location"];

      if (REDIRECT_STATUSES.has(hop.status) && location !== undefined) {
        if (redirectChain.length >= MAX_REDIRECTS) {
          throw new Error(`Exceeded maximum of ${MAX_REDIRECTS} redirects starting from ${url}`);
        }
        redirectChain.push(currentUrl);
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      return {
        status: hop.status,
        finalUrl: currentUrl,
        redirectChain,
        headers: hop.headers,
        body: hop.body,
      };
    }
  }

  return {
    fetch: runFetch,
    setCrawlDelayMs(ms: number): void {
      crawlDelayMs = ms;
    },
  };
}
