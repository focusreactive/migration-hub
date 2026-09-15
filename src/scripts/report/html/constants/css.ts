/**
 * Inlined page CSS. Copied verbatim from this repository's design source
 * (`docs/design/`) so the generated report page is a single self-contained
 * HTML file with no external stylesheet requests, except the two named
 * exceptions for TOKENS_CSS documented below.
 */

// Copied from docs/design/tokens.css, minus its first line (the @import of
// the Google Fonts stylesheet — GOOGLE_FONTS_HREF becomes a <link> instead)
// and minus the "body { margin: 0; padding: 32px; ... }" rule's padding —
// the report page overrides it with its own inline <style> rule
// (docs/design/report.design.html:11) — and minus the
// ".shotbox:has(> img)" rule, replaced by the src-aware rule in SHOT_CSS.
export const TOKENS_CSS = `
:root {
  --fr-black: #000; --fr-dark: #0e0e0e; --fr-surface: #0a0a0a;
  --fr-line: #1e1e1e; --fr-line-soft: #171717; --fr-border: #2c2c2c;
  --fr-dim: #545454; --fr-mute: #7b7b7b; --fr-soft: #9c9c9c; --fr-text: #fff;
  --fr-accent: #00e56d; --fr-accent-light: #00ff79; --fr-accent-dark: #00be5a;
  --fr-warn: #f2c94c; --fr-error: #ef4444;
}
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; background: var(--fr-black); color: var(--fr-text);
  font-family: "Inter Tight", -apple-system, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased; }
.mono { font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace; }
.card { background: var(--fr-dark); border: 1px solid var(--fr-line); border-radius: 16px; }
.num { font-variant-numeric: tabular-nums; letter-spacing: -0.03em; font-weight: 600; }
.chip { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 11px;
  border-radius: 100px; border: 1px solid var(--fr-border); color: var(--fr-soft);
  font-size: 12px; font-weight: 500; background: #101010; }
.chip-on { background: var(--fr-accent); border-color: var(--fr-accent); color: #000; font-weight: 600; }
.sub { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; margin: 0; }
.body { font-size: 15px; line-height: 1.66; color: var(--fr-soft); margin: 0; }
.eyebrow { display: flex; align-items: center; gap: 9px; font-size: 11px; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--fr-mute); font-weight: 500; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: var(--fr-accent); flex: none; }
.shotbox { display: flex; align-items: center; justify-content: center; overflow: hidden;
  background: repeating-linear-gradient(135deg, #0d0d0d 0 7px, #101010 7px 14px); }
.shotbox span { font-size: 10px; color: #3d3d3d; letter-spacing: 0.1em; }
.shotbox > img { max-width: 100%; max-height: 100%; width: auto; height: auto;
  display: block; object-fit: contain; }
.row { display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-start; }

.pathlink { color: #545454; text-decoration: none; transition: color 0.12s ease; }
.pathlink:hover { color: var(--fr-accent); }
a.code:hover { background: #10241a; border-color: #2a6b42; }
`;

// Copied from docs/design/page.css, verbatim.
export const PAGE_CSS = `
/* Page-level layout on top of tokens.css — used by the full report page,
   not by the individual component cards. */
html, body { padding: 0; overflow-x: clip; }
a { color: var(--fr-accent); text-decoration: none; }
a:hover { color: var(--fr-accent-light); }
.wrap { max-width: 1240px; margin: 0 auto; padding: 0 40px; }
.band { padding: 104px 0; border-top: 1px solid var(--fr-line-soft); }
h2.sec { font-size: 44px; line-height: 1.04; letter-spacing: -0.025em; font-weight: 600; margin: 20px 0 0; }
p.lead { font-size: 18px; line-height: 1.62; color: var(--fr-soft); max-width: 64ch; margin: 18px 0 0; }
.chip-link { color: #fff; text-decoration: none; }
.chip-link:hover { color: var(--fr-accent); border-color: var(--fr-accent); }
.code { font-family: "JetBrains Mono", ui-monospace, Menlo, monospace; font-size: 12.5px;
  color: var(--fr-accent); background: #0b1a12; border: 1px solid #17311f; border-radius: 6px; padding: 2px 7px; }
.btn { display: inline-flex; align-items: center; gap: 9px; height: 48px; padding: 0 24px;
  border-radius: 100px; background: var(--fr-accent); color: #000; font-weight: 600; font-size: 15px; }
.btn:hover { background: var(--fr-accent-light); color: #000; }
.btn-ghost { display: inline-flex; align-items: center; gap: 9px; height: 48px; padding: 0 24px;
  border-radius: 100px; border: 1px solid var(--fr-border); color: #fff; font-weight: 500; font-size: 15px; }
.btn-ghost:hover { border-color: var(--fr-dim); color: #fff; }
.shot { display: block; width: 100%; border-radius: 10px; border: 1px solid var(--fr-line); }
.term { position: relative; border-bottom: 1px dashed var(--fr-dim); cursor: help; }
.term:hover, .term:focus-visible { border-bottom-color: var(--fr-accent); color: #fff; outline: none; }
.term::after { content: attr(data-def); position: absolute; left: 0; bottom: calc(100% + 12px);
  width: min(300px, calc(100vw - 48px)); padding: 12px 14px; background: #171717; border: 1px solid var(--fr-border);
  border-radius: 12px; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7); color: #b4b4b4;
  font-size: 12.5px; line-height: 1.5; font-weight: 400; letter-spacing: 0;
  text-transform: none; white-space: normal; opacity: 0; visibility: hidden;
  transition: opacity 0.14s ease; pointer-events: none; z-index: 20; }
.term:hover::after, .term:focus-visible::after { opacity: 1; visibility: visible; }

/* Interactive report: clickable sections, detail modal, library filters */
.seccard { cursor: pointer; transition: border-color 0.15s ease, transform 0.15s ease; }
.seccard:hover { border-color: var(--fr-border); transform: translateY(-2px); }
.seccard:focus-visible, .tapshot:focus-visible { outline: 2px solid var(--fr-accent); outline-offset: 2px; }
.tapshot { cursor: zoom-in; transition: box-shadow 0.15s ease; }
.tapshot:hover { box-shadow: 0 0 0 1px var(--fr-accent); }
.chip-btn { cursor: pointer; font-family: inherit; }
.chip-btn:hover { border-color: var(--fr-dim); color: #fff; }
.chip-btn.chip-on:hover { background: var(--fr-accent-light); border-color: var(--fr-accent-light); color: #000; }
.searchbox { display: flex; align-items: center; gap: 10px; height: 38px; padding: 0 16px;
  border: 1px solid var(--fr-border); border-radius: 100px; min-width: 240px; }
.searchbox:focus-within { border-color: var(--fr-accent); }
.searchbox input { flex: 1; min-width: 0; border: 0; background: none; outline: none; color: #fff;
  font: inherit; font-size: 13.5px; }
.searchbox input::placeholder { color: var(--fr-dim); }
dialog.secmodal { width: min(880px, 92vw); max-height: 88vh; padding: 0; overflow: auto;
  border: 1px solid var(--fr-line); border-radius: 18px; background: #0b0b0b; color: #fff; }
dialog.secmodal::backdrop { background: rgba(0, 0, 0, 0.82); }
dialog.secmodal[open] { animation: secmodal-in 0.16s ease both; }
@keyframes secmodal-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.m-shot { aspect-ratio: auto; min-height: 200px; padding: 0; border-bottom: 1px solid var(--fr-line);
  align-items: center; justify-content: center; }
.m-shot > img { width: 100%; max-width: 100%; height: auto; max-height: 56vh; object-fit: contain; margin: 0 auto; }
.m-body { padding: 26px 30px 30px; }
.m-close { position: absolute; top: 14px; right: 14px; width: 34px; height: 34px; border-radius: 50%;
  border: 1px solid var(--fr-border); background: rgba(0, 0, 0, 0.72); color: var(--fr-soft);
  font-size: 17px; line-height: 1; cursor: pointer; z-index: 2; }
.m-close:hover { color: #fff; border-color: var(--fr-dim); }
.m-nav button { width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--fr-border);
  background: none; color: var(--fr-soft); font-size: 13px; line-height: 1; cursor: pointer; }
.m-nav button:hover { color: #fff; border-color: var(--fr-dim); }
`;

// Copied from docs/design/report-responsive.css, verbatim. These selectors
// match on inline style-attribute substrings — never reformat a style
// attribute in the generated markup, or these will silently stop matching.
export const RESPONSIVE_CSS = `
/* Responsive layer for pages/report.html — the page is built from inline styles,
   so these overrides match on style-attribute substrings. Loaded only by the report page. */

/* Fluid rhythm and type (all widths) */
.wrap { padding: 0 clamp(18px, 3.2vw, 40px); }
.band { padding: clamp(56px, 7.5vw, 104px) 0; }
h2.sec { font-size: clamp(27px, 4.4vw, 44px) !important; }
p.lead { font-size: clamp(15.5px, 1.5vw, 18px); }
h1[style*="font-size: 76px"] { font-size: clamp(33px, 8.4vw, 76px) !important; }
#talk { padding: clamp(56px, 7.5vw, 104px) 0 clamp(48px, 6.5vw, 88px) !important; }
#talk h2.sec[style*="font-size: 40px"] { font-size: clamp(26px, 4.6vw, 40px) !important; }
.num[style*="font-size: 54px"] { font-size: clamp(38px, 6vw, 54px) !important; }
.num[style*="font-size: 40px"] { font-size: clamp(30px, 4.2vw, 40px) !important; }
img.shot, .shot { max-width: 100%; }

/* Wide tablet / small laptop */
@media (max-width: 1080px) {
  [style*="grid-template-columns: repeat(5, minmax(0, 1fr))"] { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
  [style*="right: calc(20% - 34px)"] { display: none !important; }
  [style*="grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr)"] { gap: 36px !important; margin-top: 48px !important; }
}

/* Tablet */
@media (max-width: 920px) {
  [style*="grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr)"],
  [style*="grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr)"],
  [style*="grid-template-columns: 300px minmax(0, 1fr)"] { grid-template-columns: minmax(0, 1fr) !important; gap: 22px !important; }
  #talk [style*="grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)"] { grid-template-columns: minmax(0, 1fr) !important; gap: 40px !important; }
  [style*="grid-template-columns: repeat(4, minmax(0, 1fr))"] { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  /* long-tail chart + its header */
  [style*="align-items: flex-end"][style*="height: 130px"] { overflow-x: auto; padding-bottom: 8px !important; }
  [style*="align-items: flex-end"][style*="justify-content: space-between"] { flex-wrap: wrap; gap: 18px; }
}

/* Large phone / small tablet */
@media (max-width: 760px) {
  [style*="grid-template-columns: repeat(2, minmax(0, 1fr))"] { grid-template-columns: minmax(0, 1fr) !important; }
  [style*="grid-template-columns: repeat(3, minmax(0, 1fr))"] { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  [style*="grid-template-columns: repeat(5, minmax(0, 1fr))"] { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  /* sticky header: tighter, drop the generated-on date */
  [style*="height: 76px"][style*="backdrop-filter"] { height: 62px !important; padding: 0 clamp(16px, 4vw, 40px) !important; gap: 12px; }
  [style*="height: 76px"][style*="backdrop-filter"] svg { width: 78px; height: 27px; }
  [style*="height: 76px"][style*="backdrop-filter"] > div:last-child > span { display: none !important; }
  [style*="height: 76px"][style*="backdrop-filter"] .btn { height: 34px !important; font-size: 12.5px !important; padding: 0 14px !important; }
  .chip-btn { height: 34px; padding: 0 14px; }
  .searchbox { height: 40px; }
  /* page-composition snake strip → vertical flow */
  [style*="flex-direction: row"][style*="align-items: flex-start"] { flex-direction: column !important; gap: 0; }
  [style*="flex-direction: row-reverse"][style*="align-items: flex-start"] { flex-direction: column-reverse !important; gap: 0; }
  [style*="align-items: stretch"][style*="height: 20px"] { display: none !important; }
  [style*="flex: 1 1 0"]:empty { display: none !important; }
  [style*="flex: none; width: 22px"][style*="background: #262626"] { width: 1px !important; height: 18px !important; align-self: center; margin-top: 0 !important; }
  [style*="flex: none; width: 22px"]:not([style*="background"]) { display: none !important; }
  [style*="flex-direction: row"][style*="align-items: flex-start"] > [style*="flex: 1 1 0"],
  [style*="flex-direction: row-reverse"][style*="align-items: flex-start"] > [style*="flex: 1 1 0"] { width: 100%; max-width: 340px; margin: 0 auto; }
  /* composition card heading row + page footer bar */
  [style*="align-items: baseline"][style*="margin-bottom: 18px"] { flex-wrap: wrap; row-gap: 6px; }
  #talk [style*="justify-content: space-between"][style*="margin-top: 72px"] { flex-direction: column; align-items: flex-start; gap: 8px; margin-top: 48px !important; }
  #talk [style*="gap: 72px"] .btn, #talk [style*="gap: 72px"] .btn-ghost { width: 100%; justify-content: center; }
}

/* Phone */
@media (max-width: 560px) {
  [style*="grid-template-columns: repeat(4, minmax(0, 1fr))"],
  [style*="grid-template-columns: repeat(3, minmax(0, 1fr))"],
  [style*="grid-template-columns: repeat(5, minmax(0, 1fr))"] { grid-template-columns: minmax(0, 1fr) !important; }
  .card[style*="padding: 32px 34px"], .card[style*="padding: 30px 32px"], .card[style*="padding: 28px 30px"],
  .card[style*="padding: 26px 30px"], .card[style*="padding: 26px 28px"], .card[style*="padding: 28px 26px"],
  .card[style*="padding: 22px 24px"], .card[style*="padding: 24px"], .card[style*="padding: 20px"] { padding: 20px 18px !important; }
  .searchbox { width: 100%; min-width: 0; }
  /* stacked bar of page kinds: let the labels breathe */
  [style*="gap: 3px"][style*="height: 34px"] { height: auto !important; flex-direction: column; gap: 2px !important; }
  [style*="gap: 3px"][style*="height: 34px"] > div { flex: none !important; height: 32px; border-radius: 4px; padding-left: 12px !important; font-size: 12px !important; }
  [style*="grid-template-columns: minmax(0, 1fr) 84px"] { grid-template-columns: minmax(0, 1fr) 68px !important; gap: 10px !important; }
  #talk [style*="gap: 72px"] { gap: 32px !important; }
  /* section-detail modal */
  dialog.secmodal { width: calc(100vw - 16px); max-height: 92vh; border-radius: 14px; }
  .m-body { padding: 20px 18px 24px; }
  .m-shot > img { max-height: 42vh; }
  .m-body > [style*="justify-content: space-between"] { flex-wrap: wrap; gap: 12px !important; }
  #mMeta { flex-wrap: wrap; row-gap: 6px; }
}
`;

// The two deltas that pay for embedding each screenshot once, instead of the
// design's src-agnostic ".shotbox:has(> img)" rule that TOKENS_CSS drops.
export const SHOT_CSS = `
.shotbox:has(> img[src]) { background: var(--fr-black); }
.shotbox > img:not([src]) { display: none; }
`;
