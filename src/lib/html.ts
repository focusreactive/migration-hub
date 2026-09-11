import { load, type CheerioAPI } from "cheerio";

export function loadHtml(html: string): CheerioAPI {
  return load(html);
}

export function extractAnchorHrefs(html: string): string[] {
  const $ = loadHtml(html);

  return $("a")
    .toArray()
    .map((el) => $(el).attr("href"))
    .filter((href) => href !== undefined);
}

export function extractStylesheetHrefs(html: string): string[] {
  const $ = loadHtml(html);

  return $("link[rel='stylesheet']")
    .toArray()
    .map((el) => $(el).attr("href"))
    .filter((href) => href !== undefined);
}
