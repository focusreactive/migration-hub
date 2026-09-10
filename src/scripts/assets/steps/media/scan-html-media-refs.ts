import type { MediaAssetSource } from "#ir/assets.ts";
import { loadHtml } from "#lib/html.ts";

import { SOCIAL_IMAGE_KEYS, VIDEO_EXTENSIONS } from "../../constants/scan.ts";
import type { MediaAssetKind, ScannedMediaRef } from "../../types.ts";
import { extractCssUrls } from "../../utils/extract-css-urls.ts";
import { resolveUrl } from "./utils/resolve-url.ts";

interface LightboxJsonItem {
  url?: string;
}

interface LightboxJson {
  items: LightboxJsonItem[];
}

function parseLightboxJson(raw: string): LightboxJson | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (typeof parsed !== "object" || parsed === null) return undefined;

  const rawItems = (parsed as Record<string, unknown>)["items"];
  if (rawItems === undefined) return { items: [] };
  if (!Array.isArray(rawItems)) return undefined;

  const items = rawItems.map((item): LightboxJsonItem => {
    if (typeof item !== "object" || item === null) return {};
    const url = (item as Record<string, unknown>)["url"];
    return typeof url === "string" ? { url } : {};
  });

  return { items };
}

function srcsetCandidates(srcset: string): string[] {
  return srcset
    .split(",")
    .map((candidate) => candidate.trim().split(/\s+/, 1)[0] ?? "")
    .filter((url) => url !== "");
}

function videoUrlCandidates(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((value): value is string => typeof value === "string");
    }
  } catch {
    return raw.split(",").map((url) => url.trim());
  }
  return raw.split(",").map((url) => url.trim());
}

export function scanHtmlMediaRefs(html: string, baseUrl: string): ScannedMediaRef[] {
  const $ = loadHtml(html);
  const refs: ScannedMediaRef[] = [];

  const push = (rawUrl: string | undefined, source: MediaAssetSource, hint: MediaAssetKind, alt?: string): void => {
    if (rawUrl === undefined) return;
    const resolved = resolveUrl(rawUrl, baseUrl);
    if (resolved === undefined || resolved.startsWith("data:")) return;
    refs.push({ rawUrl: resolved, source, hint, ...(alt !== undefined && { alt }) });
  };

  $("img").each((_, el) => {
    const img = $(el);
    const alt = img.attr("alt");
    push(img.attr("src"), "img-src", "image", alt);
    const srcset = img.attr("srcset");
    if (srcset !== undefined) {
      for (const candidate of srcsetCandidates(srcset)) {
        push(candidate, "img-srcset", "image", alt);
      }
    }
  });

  $("[style]").each((_, el) => {
    const style = $(el).attr("style");
    if (style === undefined || !style.includes("background")) return;
    for (const url of extractCssUrls(style)) {
      push(url, "background-image", "image");
    }
  });

  $("script.w-json").each((_, el) => {
    const raw = $(el).text().trim();
    if (raw === "") return;
    const lightbox = parseLightboxJson(raw);
    if (lightbox === undefined) return;
    for (const item of lightbox.items) {
      push(item.url, "lightbox-json", "image");
    }
  });

  $("[data-video-urls]").each((_, el) => {
    const raw = $(el).attr("data-video-urls");
    if (raw === undefined) return;
    for (const url of videoUrlCandidates(raw)) {
      if (VIDEO_EXTENSIONS.some((ext) => url.toLowerCase().includes(ext))) {
        push(url, "video-urls", "video");
      }
    }
  });

  $("[data-poster-url]").each((_, el) => {
    push($(el).attr("data-poster-url"), "poster-url", "image");
  });

  $("video[src]").each((_, el) => {
    push($(el).attr("src"), "video-urls", "video");
  });

  $("video source[src]").each((_, el) => {
    push($(el).attr("src"), "video-urls", "video");
  });

  $("video[poster]").each((_, el) => {
    push($(el).attr("poster"), "poster-url", "image");
  });

  $("meta").each((_, el) => {
    const meta = $(el);
    const key = meta.attr("property") ?? meta.attr("name");
    if (key !== undefined && SOCIAL_IMAGE_KEYS.has(key)) {
      push(meta.attr("content"), "og-image", "image");
    }
  });

  return refs;
}
