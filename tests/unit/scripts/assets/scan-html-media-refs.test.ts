import { describe, expect, it } from "vitest";

import { scanHtmlMediaRefs } from "../../../../src/scripts/assets/steps/media/scan-html-media-refs.ts";

const HTML = `
<html><head><meta property="og:image" content="/og.png"></head>
<body>
  <img src="/a.jpg" alt="A" srcset="/a.jpg 1x, /a@2x.jpg 2x">
  <div style="background-image:url('/bg.jpg')"></div>
  <video data-video-urls='["/clip.mp4"]'></video>
</body></html>`;

describe("scanHtmlMediaRefs", () => {
  it("finds img, srcset, background-image, video and og:image references", () => {
    const refs = scanHtmlMediaRefs(HTML, "https://example.com/page");
    const urls = refs.map((ref) => ref.rawUrl);

    expect(urls).toContain("https://example.com/a.jpg");
    expect(urls).toContain("https://example.com/a@2x.jpg");
    expect(urls).toContain("https://example.com/bg.jpg");
    expect(urls).toContain("https://example.com/clip.mp4");
    expect(urls).toContain("https://example.com/og.png");
  });

  it("marks the video reference with a video hint", () => {
    const refs = scanHtmlMediaRefs(HTML, "https://example.com/page");
    expect(refs.find((ref) => ref.rawUrl.endsWith("clip.mp4"))?.hint).toBe("video");
  });

  it("carries the alt text", () => {
    const refs = scanHtmlMediaRefs(HTML, "https://example.com/page");
    expect(refs.find((ref) => ref.source === "img-src")?.alt).toBe("A");
  });
});
