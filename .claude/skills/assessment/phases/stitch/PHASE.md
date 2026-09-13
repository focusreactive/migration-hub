# Stitch phase

Rendering every route `discovery` needs visual evidence for as a full-page
desktop screenshot. One script, one step (`stitch`).

Entered once `inventory` is `done`. Every state change runs the script —
never write `.assessment/*` by hand.

## Step 1 · stitch (script, manifest step `stitch`)

```
pnpm tsx src/scripts/stitch/index.ts --project <projectPath> [--force]
```

```json
{ "step": "stitch", "status": "done" | "skipped", "routes": <n>, "captured": <n> }
```

The capture set (`src/scripts/stitch/utils/capture-routes.ts`) is every
**static** route plus **one exemplar item route per CMS collection** — the
first item page for each `collectionKey` in `pages.json`, picked
deterministically (`src/scripts/stitch/utils/collection-exemplar-routes.ts`).
A collection page template is one fixed layout shared by every item in it, so
one screenshot stands in for the whole collection; the other items are never
captured. Report `routes` (size of this combined set) and `captured` (how many
screenshots this run actually took). Each route is opened with Playwright at a
single 1440×900 desktop viewport and rendered full-page to
`.assessment/artifacts/stitch/<routeKey>/desktop.png`. A route whose PNG already
exists is skipped even without `--force` being passed, so a partially
completed run resumes route by route, not just phase by phase.

**Repeating is safe.** On a project where the step is already `done` the
script prints `{"step":"stitch","status":"skipped","routes":<n>,"captured":0}`
and exits 0 without opening a browser. Pass `--force` to recapture every
route, which you want after the site itself changed or after a forced
`inventory` re-run added or removed routes or collections.

## Verify

Read `<projectPath>/.assessment/manifest.json`: `steps["stitch"].status` is
`"done"`. For every route in the capture set (every static route in
`<projectPath>/.assessment/artifacts/pages.json`, plus one item route per
collection), `<projectPath>/.assessment/artifacts/stitch/<routeKey>/desktop.png`
exists — the `discovery` subject step prints this path without checking it,
so a missing PNG only surfaces when the subagent tries to read it.
