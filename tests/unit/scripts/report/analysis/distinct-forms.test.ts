import { describe, expect, it } from "vitest";

import { distinctForms } from "../../../../../src/scripts/report/analysis/distinct-forms.ts";

const FIELD = { name: "Email", type: "email", required: true };

describe("distinctForms", () => {
  it("collapses the same form on three routes into one record listing every route", () => {
    const groups = distinctForms([
      { route: "/", name: "Newsletter", action: null, method: "get", fieldCount: 1, fields: [FIELD] },
      { route: "/about", name: "Newsletter", action: null, method: "get", fieldCount: 1, fields: [FIELD] },
      { route: "/contact", name: "Newsletter", action: null, method: "get", fieldCount: 1, fields: [FIELD] },
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.routes).toEqual(["/", "/about", "/contact"]);
  });

  it("keeps two forms with different fields apart", () => {
    const groups = distinctForms([
      { route: "/contact", name: "Contact", action: null, method: "post", fieldCount: 1, fields: [FIELD] },
      { route: "/contact", name: "Contact", action: null, method: "post", fieldCount: 0, fields: [] },
    ]);

    expect(groups).toHaveLength(2);
  });
});
