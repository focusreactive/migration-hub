import { describe, expect, it } from "vitest";

import { validateNamesResponse } from "../../../../src/scripts/forms/steps/names/utils/validate-names-response.ts";

const FORMS = [{ fieldCount: 2 }, { fieldCount: 1 }];

const GOOD = {
  forms: [
    {
      index: 0,
      label: "Contact enquiry",
      fields: [
        { index: 0, label: "Full name" },
        { index: 1, label: "Email address" },
      ],
    },
    { index: 1, label: "Newsletter signup", fields: [{ index: 0, label: "Email address" }] },
  ],
};

function codes(response: typeof GOOD): string[] {
  return validateNamesResponse({ response, forms: FORMS }).map((error) => error.code);
}

describe("validateNamesResponse", () => {
  it("accepts a complete set of human labels", () => {
    expect(codes(GOOD)).toEqual([]);
  });

  it("rejects a form index that was never printed", () => {
    expect(codes({ forms: [...GOOD.forms, { index: 5, label: "Ghost", fields: [] }] })).toContain("UNKNOWN_FORM");
  });

  it("rejects a form left unlabelled", () => {
    expect(codes({ forms: [GOOD.forms[0]!] })).toContain("MISSING_FORM");
  });

  it("rejects the same form labelled twice", () => {
    expect(codes({ forms: [...GOOD.forms, GOOD.forms[0]!] })).toContain("DUPLICATE_FORM");
  });

  it("rejects a field index past the end of the form", () => {
    expect(
      codes({
        forms: [
          {
            index: 0,
            label: "Contact enquiry",
            fields: [
              { index: 0, label: "Full name" },
              { index: 9, label: "X" },
            ],
          },
          GOOD.forms[1]!,
        ],
      }),
    ).toContain("UNKNOWN_FIELD");
  });

  it("rejects a field left unlabelled", () => {
    expect(
      codes({
        forms: [{ index: 0, label: "Contact enquiry", fields: [{ index: 0, label: "Full name" }] }, GOOD.forms[1]!],
      }),
    ).toContain("MISSING_FIELD");
  });

  it("rejects a duplicated field index", () => {
    expect(
      codes({
        forms: [
          {
            index: 0,
            label: "Contact enquiry",
            fields: [
              { index: 0, label: "A" },
              { index: 0, label: "B" },
            ],
          },
          GOOD.forms[1]!,
        ],
      }),
    ).toContain("DUPLICATE_FIELD");
  });

  it.each(["wf-form-Contact-Form", "email_address", "Email-2", "wf-Newsletter"])(
    "rejects %s as a raw source identifier",
    (label) => {
      expect(
        codes({
          forms: [
            {
              index: 0,
              label,
              fields: [
                { index: 0, label: "Full name" },
                { index: 1, label: "Email address" },
              ],
            },
            GOOD.forms[1]!,
          ],
        }),
      ).toContain("RAW_IDENTIFIER");
    },
  );

  it("allows a hyphen inside a real phrase", () => {
    expect(
      codes({
        forms: [
          {
            index: 0,
            label: "Follow-up request",
            fields: [
              { index: 0, label: "Full name" },
              { index: 1, label: "Email address" },
            ],
          },
          GOOD.forms[1]!,
        ],
      }),
    ).toEqual([]);
  });
});
