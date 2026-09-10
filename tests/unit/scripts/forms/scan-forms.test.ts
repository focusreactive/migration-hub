import { describe, expect, it } from "vitest";

import { scanForms } from "../../../../src/scripts/forms/scan-forms.ts";

const HTML = `
<html><body>
  <form name="Contact" action="https://api.hsforms.com/submit/1/2" method="post">
    <input type="email" name="email" required>
    <input type="text" name="company">
    <textarea name="message"></textarea>
    <select name="budget"><option>a</option></select>
    <button type="submit">Send</button>
  </form>
  <form data-name="Newsletter">
    <input type="email" name="subscriber">
  </form>
</body></html>`;

describe("scanForms", () => {
  it("finds every form on the page", () => {
    expect(scanForms(HTML, "/contact")).toHaveLength(2);
  });

  it("counts inputs, textareas and selects but not buttons", () => {
    const [contact] = scanForms(HTML, "/contact");
    expect(contact?.fieldCount).toBe(4);
  });

  it("records the endpoint and method", () => {
    const [contact] = scanForms(HTML, "/contact");
    expect(contact?.action).toBe("https://api.hsforms.com/submit/1/2");
    expect(contact?.method).toBe("post");
  });

  it("falls back to data-name and a null action for a platform-handled form", () => {
    const [, newsletter] = scanForms(HTML, "/contact");
    expect(newsletter?.name).toBe("Newsletter");
    expect(newsletter?.action).toBeNull();
    expect(newsletter?.method).toBe("get");
  });

  it("records the required flag on a field", () => {
    const [contact] = scanForms(HTML, "/contact");
    expect(contact?.fields.find((field) => field.name === "email")?.required).toBe(true);
  });

  it("stamps the route on every record", () => {
    expect(scanForms(HTML, "/contact").every((form) => form.route === "/contact")).toBe(true);
  });
});

const REPEATED_HTML = `
<html><body>
  <form name="Contact" action="https://api.hsforms.com/submit/1/2" method="post">
    <input type="email" name="email" required>
  </form>
  <form name="Contact" action="https://api.hsforms.com/submit/1/2" method="post">
    <input type="email" name="email" required>
  </form>
  <form name="Contact" action="https://api.hsforms.com/submit/1/2" method="post">
    <input type="email" name="email" required>
  </form>
</body></html>`;

const DISTINCT_HTML = `
<html><body>
  <form name="Contact" action="https://api.hsforms.com/submit/1/2" method="post">
    <input type="email" name="email" required>
  </form>
  <form name="Newsletter" action="https://api.hsforms.com/submit/9/9" method="post">
    <input type="email" name="subscriber">
  </form>
</body></html>`;

const SAME_ATTRS_DIFFERENT_FIELDS_HTML = `
<html><body>
  <form name="Contact" action="https://api.hsforms.com/submit/1/2" method="post">
    <input type="email" name="email" required>
  </form>
  <form name="Contact" action="https://api.hsforms.com/submit/1/2" method="post">
    <input type="email" name="email" required>
    <input type="text" name="company">
  </form>
</body></html>`;

const SAME_FIELDS_DIFFERENT_ORDER_HTML = `
<html><body>
  <form name="Contact" action="https://api.hsforms.com/submit/1/2" method="post">
    <input type="text" name="first">
    <input type="text" name="last">
  </form>
  <form name="Contact" action="https://api.hsforms.com/submit/1/2" method="post">
    <input type="text" name="last">
    <input type="text" name="first">
  </form>
</body></html>`;

describe("scanForms deduplication", () => {
  it("collapses byte-identical forms repeated on the same route into one record", () => {
    expect(scanForms(REPEATED_HTML, "/about")).toHaveLength(1);
  });

  it("keeps genuinely distinct forms on the same route separate", () => {
    expect(scanForms(DISTINCT_HTML, "/about")).toHaveLength(2);
  });

  it("keeps two forms separate when only their fields differ", () => {
    expect(scanForms(SAME_ATTRS_DIFFERENT_FIELDS_HTML, "/about")).toHaveLength(2);
  });

  it("keeps two forms separate when their fields carry the same names in a different order", () => {
    expect(scanForms(SAME_FIELDS_DIFFERENT_ORDER_HTML, "/about")).toHaveLength(2);
  });
});
