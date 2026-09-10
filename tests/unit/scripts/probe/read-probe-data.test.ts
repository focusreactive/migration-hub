import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import type { ProbeData } from "../../../../src/scripts/probe/read-probe-data.ts";

export async function probeFixture(platform: "framer" | "webflow", sourceUrl: string): Promise<ProbeData> {
  const dir = join(process.cwd(), "tests", "fixtures", "probe", platform);
  const read = (name: string): Promise<string> => readFile(join(dir, name), "utf8");

  return {
    sourceUrl,
    homeHtml: await read("home.html"),
    homeHttp: JSON.parse(await read("headers.json")) as ProbeData["homeHttp"],
    robotsTxt: await read("robots.txt"),
    sitemapXml: await read("sitemap.xml"),
    notFound: { html: await read("not-found.html"), status: 404 },
  };
}

describe("probe fixtures", () => {
  it("loads the framer fixture", async () => {
    const data = await probeFixture("framer", "https://pearlstudio.framer.website/");
    expect(data.homeHtml).toContain("framer");
    expect(data.sitemapXml).toContain("<urlset");
  });

  it("loads the webflow fixture", async () => {
    const data = await probeFixture("webflow", "https://nova-x.webflow.io/");
    expect(data.homeHtml).toContain("data-wf-site");
  });
});
