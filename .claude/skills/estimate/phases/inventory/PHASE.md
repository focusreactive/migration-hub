# Inventory phase

Crawling the site into the page/collection list every later phase indexes by:
routes from the sitemap (or a link crawl, or a platform search index),
classified into static pages and CMS collection items. One script, one step
(`inventory`).

Entered once `detect` has resolved to `webflow` or `framer` (see
`phases/detect/PHASE.md`). Every state change runs the script — never write
`.estimate/*` by hand.

## Step 1 · inventory (script, manifest step `inventory`)

```
pnpm tsx src/scripts/inventory/index.ts --project <projectPath> [--force]
```

```json
{ "step": "inventory", "status": "done" | "skipped", "pages": <n>, "collections": <n>, "truncated": true }
```

Report the page and collection counts. `truncated` is present (and `true`)
only when the crawl hit the configured page ceiling before it ran out of
routes to visit — mention it to the user when it appears.

The crawl strategy is picked from what `probe` and `detect` already found:
sitemap-first when one exists, a platform search index next, and a same-origin
link crawl from the source URL as the last resort. Whichever path is taken,
routes are written to a single artifact of static pages and collection
entries.

**Repeating is safe.** On a project where the step is already `done` the
script prints `{"step":"inventory","status":"skipped",…}` (with `truncated`
omitted, since the artifact isn't recomputed), writes nothing and exits 0.
Pass `--force` to recrawl, which you want after a forced `probe` re-run.

## Verify

Read `<projectPath>/.estimate/manifest.json`: `steps["inventory"].status` is
`"done"`. Read `<projectPath>/.estimate/artifacts/pages.json`:
`{pages: [...], collections: [...]}` — every phase from here on reads this
artifact instead of crawling again.
