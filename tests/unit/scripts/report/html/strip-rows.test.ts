import { describe, expect, it } from "vitest";

import { chunkStripRows } from "../../../../../src/scripts/report/html/utils/strip-rows.ts";

const nine = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];

describe("chunkStripRows", () => {
  it("wraps at seven and keeps every item", () => {
    const rows = chunkStripRows(nine, 7);

    expect(rows).toHaveLength(2);
    expect(rows[0]?.cells).toEqual(["a", "b", "c", "d", "e", "f", "g"]);
    expect(rows[1]?.cells.slice(0, 2)).toEqual(["h", "i"]);
  });

  it("pads the last row so every row has the same number of columns", () => {
    const rows = chunkStripRows(nine, 7);

    expect(rows[1]?.cells).toHaveLength(7);
    expect(rows[1]?.cells.slice(2)).toEqual([null, null, null, null, null]);
  });

  it("alternates direction row by row", () => {
    const rows = chunkStripRows(new Array(20).fill("x"), 7);

    expect(rows.map((row) => row.reversed)).toEqual([false, true, false]);
  });

  it("puts the bridge on the right of a left-to-right row and the left of a reversed one", () => {
    const rows = chunkStripRows(new Array(20).fill("x"), 7);

    expect(rows.map((row) => row.bridgeColumn)).toEqual([6, 0, null]);
  });

  it("draws no bridge when everything fits on one row", () => {
    const rows = chunkStripRows(["a", "b"], 7);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.bridgeColumn).toBeNull();
    expect(rows[0]?.reversed).toBe(false);
  });

  it("returns nothing for an empty list", () => {
    expect(chunkStripRows([], 7)).toEqual([]);
  });
});
