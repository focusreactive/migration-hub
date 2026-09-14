import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { describe, expect, it } from "vitest";

import { discoveryBlocksDataSchema, discoveryTypesDataSchema } from "../../../../src/ir/discovery.ts";
import { cropTargets, groupTargetsByRoute } from "../../../../src/scripts/crops/utils/crop-targets.ts";

const FIXTURE_DIR = join(process.cwd(), "tests", "fixtures", "artifacts", "pearlstudio");

async function readJson(relativePath: string): Promise<unknown> {
  return JSON.parse(await readFile(join(FIXTURE_DIR, relativePath), "utf8")) as unknown;
}

describe("cropTargets", () => {
  it("produces exactly one target per global and per block type", async () => {
    const blocks = discoveryBlocksDataSchema.parse(await readJson("discovery/blocks.json"));
    const globals = discoveryTypesDataSchema.parse(await readJson("discovery/globals.json"));

    const targets = cropTargets(blocks, globals);

    expect(targets).toHaveLength(blocks.types.length + globals.types.length);
    expect(new Set(targets.map((target) => target.typeId)).size).toBe(targets.length);
    expect(targets.slice(0, globals.types.length).every((target) => target.isGlobal)).toBe(true);
    expect(targets.slice(globals.types.length).every((target) => !target.isGlobal)).toBe(true);
  });

  it("takes each target's route and order from that type's exemplar", async () => {
    const blocks = discoveryBlocksDataSchema.parse(await readJson("discovery/blocks.json"));
    const globals = discoveryTypesDataSchema.parse(await readJson("discovery/globals.json"));

    const targets = cropTargets(blocks, globals);
    const first = blocks.types[0];
    const match = targets.find((target) => target.typeId === first?.id);

    expect(match?.route).toBe(first?.exemplar.route);
    expect(match?.order).toBe(first?.exemplar.order);
  });

  it("reads the exemplar, not the first member", () => {
    const blocks: z.infer<typeof discoveryBlocksDataSchema> = {
      types: [
        {
          id: "test-block",
          name: "Test Block",
          role: "test",
          instanceCount: 2,
          members: [
            { route: "/first", order: 0 },
            { route: "/second", order: 7 },
          ],
          exemplar: { route: "/second", order: 7 },
          kinds: ["block"],
        },
      ],
    };

    const globals: z.infer<typeof discoveryTypesDataSchema> = {
      types: [
        {
          id: "test-global",
          name: "Test Global",
          role: "test",
          instanceCount: 2,
          members: [
            { route: "/first", order: 0 },
            { route: "/second", order: 7 },
          ],
          exemplar: { route: "/second", order: 7 },
        },
      ],
    };

    const targets = cropTargets(blocks, globals);

    const globalTarget = targets[0];
    const blockTarget = targets[1];

    expect(globalTarget?.typeId).toBe("test-global");
    expect(globalTarget?.route).toBe("/second");
    expect(globalTarget?.order).toBe(7);
    expect(globalTarget?.isGlobal).toBe(true);

    expect(blockTarget?.typeId).toBe("test-block");
    expect(blockTarget?.route).toBe("/second");
    expect(blockTarget?.order).toBe(7);
    expect(blockTarget?.isGlobal).toBe(false);
  });

  it("groups by route and sorts each group by order", () => {
    const grouped = groupTargetsByRoute([
      { typeId: "b", name: "B", route: "/about", order: 3, isGlobal: false },
      { typeId: "a", name: "A", route: "/", order: 5, isGlobal: false },
      { typeId: "c", name: "C", route: "/about", order: 1, isGlobal: true },
      { typeId: "d", name: "D", route: "/", order: 0, isGlobal: true },
    ]);

    expect([...grouped.keys()]).toEqual(["/about", "/"]);
    expect(grouped.get("/about")?.map((target) => target.typeId)).toEqual(["c", "b"]);
    expect(grouped.get("/")?.map((target) => target.typeId)).toEqual(["d", "a"]);
  });
});
