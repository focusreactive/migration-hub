import type { FetchClient } from "#lib/fetch/create-fetch-client/index.ts";
import { loadHtml } from "#lib/html.ts";

import {
  DEFAULT_FONT_STYLE,
  DEFAULT_FONT_WEIGHT,
  FONT_FACE_BLOCK_PATTERN,
  FONT_PROVIDER_HOSTS,
} from "../../constants/fonts.ts";
import { HTTP_ERROR_STATUS_THRESHOLD } from "../../constants/http.ts";
import { extractCssUrls } from "../../utils/extract-css-urls.ts";

import type { ParsedFace } from "./build-font-families.ts";

export { buildFontFamilies, type ParsedFace } from "./build-font-families.ts";

function unquote(value: string): string {
  return value.replace(/^['"]|['"]$/g, "").trim();
}

function parseDeclarations(block: string): Map<string, string> {
  const declarations = new Map<string, string>();
  for (const declaration of block.split(";")) {
    const colon = declaration.indexOf(":");
    if (colon < 0) continue;
    const prop = declaration.slice(0, colon).trim().toLowerCase();
    const value = declaration.slice(colon + 1).trim();
    if (prop !== "" && value !== "") declarations.set(prop, value);
  }
  return declarations;
}

function firstFontUrl(srcDeclaration: string): string | undefined {
  const urls = extractCssUrls(srcDeclaration);
  return urls.find((url) => url.toLowerCase().includes(".woff2")) ?? urls[0];
}

export function parseFontFaces(css: string, baseUrl: string): ParsedFace[] {
  const faces: ParsedFace[] = [];

  for (const match of css.matchAll(FONT_FACE_BLOCK_PATTERN)) {
    const declarations = parseDeclarations(match[1] ?? "");
    const family = declarations.get("font-family");
    if (family === undefined) continue;

    const srcDeclaration = declarations.get("src");
    const srcUrl = srcDeclaration !== undefined ? firstFontUrl(srcDeclaration) : undefined;
    if (srcUrl === undefined) continue;

    let binaryUrl: string;
    try {
      binaryUrl = new URL(srcUrl, baseUrl).href;
    } catch {
      continue;
    }

    const rawStyle = declarations.get("font-style");

    faces.push({
      family: unquote(family),
      weight: declarations.get("font-weight") ?? DEFAULT_FONT_WEIGHT,
      style: rawStyle === "italic" ? "italic" : DEFAULT_FONT_STYLE,
      binaryUrl,
    });
  }

  return faces;
}

export function providerStylesheetUrls(html: string, baseUrl: string): string[] {
  const $ = loadHtml(html);
  const urls = new Set<string>();

  $("link[rel='stylesheet']").each((_, el) => {
    const href = $(el).attr("href");
    if (href === undefined) return;
    try {
      const resolved = new URL(href, baseUrl);
      if (FONT_PROVIDER_HOSTS.has(resolved.hostname)) urls.add(resolved.href);
    } catch {
      return;
    }
  });

  return [...urls];
}

export async function fetchProviderFontFaces(client: FetchClient, urls: readonly string[]): Promise<ParsedFace[]> {
  const faces: ParsedFace[] = [];

  for (const url of urls) {
    try {
      const response = await client.fetch(url);
      if (response.status >= HTTP_ERROR_STATUS_THRESHOLD) continue;
      faces.push(...parseFontFaces(response.body.toString("utf8"), url));
    } catch {
      continue;
    }
  }

  return faces;
}
