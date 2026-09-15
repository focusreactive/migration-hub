import { describe, expect, it } from "vitest";

import { formsDataSchema } from "../../../src/ir/forms.ts";

describe("forms schema with human labels", () => {
  it("accepts a form with no labels at all", () => {
    const data = formsDataSchema.parse({
      forms: [
        {
          route: "/contact",
          name: "wf-form-Contact-Form",
          action: null,
          method: "post",
          fieldCount: 1,
          fields: [{ name: "email-2", type: "email", required: true }],
        },
      ],
    });

    expect(data.forms[0]?.label).toBeUndefined();
    expect(data.forms[0]?.fields[0]?.label).toBeUndefined();
  });

  it("accepts labels on the form and on each field", () => {
    const data = formsDataSchema.parse({
      forms: [
        {
          route: "/contact",
          name: "wf-form-Contact-Form",
          label: "Contact enquiry",
          action: null,
          method: "post",
          fieldCount: 1,
          fields: [{ name: "email-2", type: "email", required: true, label: "Email address" }],
        },
      ],
    });

    expect(data.forms[0]?.label).toBe("Contact enquiry");
    expect(data.forms[0]?.fields[0]?.label).toBe("Email address");
  });

  it("rejects an empty label", () => {
    expect(() =>
      formsDataSchema.parse({
        forms: [{ route: "/", name: null, label: "", action: null, method: "post", fieldCount: 0, fields: [] }],
      }),
    ).toThrow();
  });
});
