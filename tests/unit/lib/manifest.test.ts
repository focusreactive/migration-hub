import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initManifest, readManifest, withStep } from "../../../src/lib/manifest/index.ts";

async function project(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "assessment-"));
  await initManifest(dir, { toolVersion: "0.1.0", sourceUrl: "https://example.com/" });
  return dir;
}

describe("withStep", () => {
  it("runs the body and marks the step done", async () => {
    const dir = await project();
    const result = await withStep(dir, "probe", () => Promise.resolve("ran"));

    expect(result).toBe("ran");
    expect((await readManifest(dir)).steps["probe"]?.status).toBe("done");
  });

  it("skips a step that is already done", async () => {
    const dir = await project();
    let calls = 0;
    await withStep(dir, "probe", () => { calls += 1; return Promise.resolve("first"); });
    const second = await withStep(dir, "probe", () => { calls += 1; return Promise.resolve("second"); });

    expect(calls).toBe(1);
    expect(second).toBeUndefined();
  });

  it("re-runs a done step when force is set", async () => {
    const dir = await project();
    await withStep(dir, "probe", () => Promise.resolve("first"));
    const second = await withStep(dir, "probe", () => Promise.resolve("second"), { force: true });

    expect(second).toBe("second");
  });

  it("marks the step failed and rethrows", async () => {
    const dir = await project();

    await expect(
      withStep(dir, "probe", () => { throw new Error("boom"); }),
    ).rejects.toThrow("boom");

    const step = (await readManifest(dir)).steps["probe"];
    expect(step?.status).toBe("failed");
    expect(step?.error?.message).toBe("boom");
  });

  it("clears a stale error after a forced retry succeeds", async () => {
    const dir = await project();

    await expect(
      withStep(dir, "probe", () => { throw new Error("boom"); }),
    ).rejects.toThrow("boom");

    const second = await withStep(dir, "probe", () => Promise.resolve("recovered"), { force: true });

    expect(second).toBe("recovered");
    const step = (await readManifest(dir)).steps["probe"];
    expect(step?.status).toBe("done");
    expect(step?.error).toBeUndefined();
  });
});
