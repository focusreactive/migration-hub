# Assess a migration without CMS access

## 1. Get the page list

Three sources, in order of trust:

| source | when | catch |
| --- | --- | --- |
| sitemap | it exists | published deliberately — trust it first |
| platform search index | Framer, no usable sitemap | Framer ships a JSON index of its own pages |
| same-origin link crawl | last resort | finds only what something links to |

An unlinked campaign landing page survives only in the first two.

## 2. Split composed pages from generated ones

The whole estimate rests on this line, and both platforms draw it in the HTML.

**Webflow** — on the `<html>` element:

```html
<html data-wf-site="…" data-wf-page="…" data-wf-collection="…">
```

`data-wf-collection` present → **collection document**. Absent → **page-builder page**.

**Framer** — in the hydration payload:

```html
<div id="main" data-framer-hydrate-v2='{…,"collectionItemId":"…"}'>
```

`collectionItemId` present → **collection document**.

No login required. Both are in the CDN's response.

## 3. Read the collection off its documents

Group the collection documents. Each group gives you:

- **`routePattern`** — shared directory plus slug: `/blog/hello` + `/blog/second` → `/blog/:slug`
- **document count** — records held today

Enough to model it: one document type, one slug field, one template. Not enough for the
field list — see §6.

## 4. Count layouts, not URLs

A blog with 200 posts is 200 pages and one layout.

Each page-builder page is its own layout. Each collection contributes exactly one — its
**collection template page**.

Two identities that must always hold:

```
pages               = page-builder pages + collection documents
unique layout pages = page-builder pages + collections
```

Break either one and something has been counted under the wrong name. Collection
documents are content to move, not things to build.

The unique layout pages are also the capture set — the only pages screenshotted and
segmented into sections. Every per-section number describes that set and nothing else.

## 5. Inventory media from markup

No file is downloaded. Sources:

- **markup** — `src`, every `srcset` candidate, inline `background-image`, `og:image`,
  video `poster` and source URLs
- **mirrored stylesheets** — every `url()`, where decorative imagery hides
- **fonts** — `@font-face` and Google Fonts links → families, weights, and whether
  anything is licensed

Collapsing duplicates is its own trick, also download-free:
[Deduplicate assets without downloading them](deduplicate-assets-without-downloading-them.md).
