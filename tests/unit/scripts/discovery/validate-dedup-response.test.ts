import { describe, expect, it } from "vitest";

import { validateDedupResponse } from "../../../../src/scripts/discovery/steps/dedup/utils/validate-dedup-response.ts";

const INSTANCES = [
  { kind: "global" as const, route: "/", order: 0, role: "header", summary: "nav" },
  { kind: "block" as const, route: "/", order: 1, role: "hero", summary: "title" },
  { kind: "block" as const, route: "/about", order: 1, role: "hero", summary: "title" },
];

function codes(groups: unknown): string[] {
  return validateDedupResponse({ response: { groups } as never, instances: INSTANCES }).map((e) => e.code);
}

describe("validateDedupResponse", () => {
  it("accepts a response covering every instance exactly once", () => {
    expect(
      codes([
        { kind: "global", name: "Header", role: "header", members: [{ route: "/", order: 0 }], exemplar: { route: "/", order: 0 } },
        {
          kind: "block",
          name: "Hero",
          role: "hero",
          members: [{ route: "/", order: 1 }, { route: "/about", order: 1 }],
          exemplar: { route: "/", order: 1 },
        },
      ]),
    ).toEqual([]);
  });

  it("rejects a member that was never listed", () => {
    expect(
      codes([
        { kind: "block", name: "Ghost", role: "ghost", members: [{ route: "/nope", order: 9 }], exemplar: { route: "/nope", order: 9 } },
      ]),
    ).toContain("UNKNOWN_MEMBER");
  });

  it("rejects an instance claimed by two groups", () => {
    expect(
      codes([
        { kind: "block", name: "A", role: "a", members: [{ route: "/", order: 1 }], exemplar: { route: "/", order: 1 } },
        { kind: "block", name: "B", role: "b", members: [{ route: "/", order: 1 }], exemplar: { route: "/", order: 1 } },
      ]),
    ).toContain("DUPLICATE_MEMBER");
  });

  it("rejects an exemplar that is not one of the group members", () => {
    expect(
      codes([
        { kind: "block", name: "Hero", role: "hero", members: [{ route: "/", order: 1 }], exemplar: { route: "/about", order: 1 } },
      ]),
    ).toContain("EXEMPLAR_NOT_MEMBER");
  });

  it("rejects a group whose kind disagrees with the instance kind", () => {
    expect(
      codes([
        { kind: "block", name: "Header", role: "header", members: [{ route: "/", order: 0 }], exemplar: { route: "/", order: 0 } },
      ]),
    ).toContain("KIND_MISMATCH");
  });

  it("rejects a response that leaves an instance uncovered", () => {
    expect(
      codes([
        { kind: "global", name: "Header", role: "header", members: [{ route: "/", order: 0 }], exemplar: { route: "/", order: 0 } },
      ]),
    ).toContain("INPUT_NOT_COVERED");
  });
});
