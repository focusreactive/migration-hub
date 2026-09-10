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
