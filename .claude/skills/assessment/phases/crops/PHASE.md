# Crops phase

Cropping one screenshot per section type and per global, so the HTML report has
a picture for every card it draws. One script, six manifest steps: a Playwright
candidates pass, a judged anchors pass fanned out over routes, and a Playwright
capture pass.

Entered once `stitch` and `discovery` are all `done`. Every state change runs
the script — never write `.assessment/*` by hand.

Why this is a phase of its own: `stitch` takes one full-page `desktop.png` per
route, and `discovery` describes each section as `{order, role, summary}` with
no selector and no coordinates. Nothing connects "section 3" to pixels. This
phase builds that connection without re-running either of them.

```
pnpm tsx src/scripts/crops/index.ts --project <projectPath> --state
```

prints one row per step; it is the fastest way to see where the phase stands.

## Step 1 · candidates (script, manifest step `crops:candidates`)

```
pnpm tsx src/scripts/crops/index.ts --project <projectPath> --candidates [--force]
```

```json
{ "step": "crops:candidates", "status": "done" | "skipped", "routes": <n>, "scanned": <n>, "candidates": { "min": <n>, "median": <n>, "total": <n> } }
```

Opens every route in the capture set (`stitch`'s set: every page-builder page
plus one exemplar document per collection) at 1440×900 with the same preamble
`stitch` uses, and records the DOM elements that could be sections into
`.assessment/artifacts/crops/candidates/<routeKey>.json`.

Candidates come from a descent that starts at `<body>` and keeps stepping into
a sole visible child that fills at least 90% of its parent's height — this eats
Webflow's `.page-wrapper` and Framer's `#main` — and then takes that
container's visible children. Every `fixed`/`sticky` element on the page is
added separately, wherever it sits in the tree. The list is sorted top to
bottom and each entry carries `{index, y, height, tag, classes, textSnippet,
isFixed, signature}`.

This is live geometry, not `cheerio` over the mirror: the static HTML has no
heights and no visibility, and on Framer it diverges from the rendered DOM.

A route whose shard already exists is skipped even without `--force`, so a
partially completed run resumes route by route.

`candidates` in the status line is `{min, median, total}` over the per-route
candidate counts scanned this run — a one-glance check for a descent that
collapsed a route to a single wrapper element, which a bare `routes`/`scanned`
count cannot distinguish from a normal scan. A `min` near 1-2 on a site with
real sections means open that route's shard by hand before trusting Step 2.

## Step 2 · anchors schema, subject, accept (judged, fan-out over routes)

Maps each section's `order` to a `candidateIndex`, **per route as a whole, not
one section type at a time** — a model that only sees one section cannot check
itself against the page's top-to-bottom order.

```
pnpm tsx src/scripts/crops/index.ts --project <projectPath> --anchors-schema
```

prints the JSON Schema a response must satisfy: `{route, anchors: [{order,
candidateIndex}], unmappable?: [order]}`.

Get the remaining routes next — no `--route`:

```
pnpm tsx src/scripts/crops/index.ts --project <projectPath> --anchors-subject
```

```json
{ "step": "crops:anchors:subject", "remaining": ["/", "/about"] }
```

**Fan out one subagent per remaining route, all at once, in a single wave.**
Each subagent:

1. Runs `--anchors-subject --route <route>`, which prints `{route,
   stitchPngPath, viewportWidth, sections, candidates, responsePath}` —
   `sections` is every section on the route, globals and blocks merged and
   sorted by `order`, each with its `role` and `summary`; `candidates` is
   Step 1's list for that route.
2. Reads that `desktop.png` and matches each section to the candidate whose
   `y` and `height` place it where the screenshot shows that section.
3. Writes its response as JSON to `responsePath`.
4. Runs `--anchors-accept --route <route>` itself, and keeps fixing and
   rewriting the response until that command exits 0.

Two shapes make the candidate list useless rather than merely imperfect, and
both are worth spotting before mapping anything. If a route's candidates come
back as one enormous element covering the whole page, the descent stopped
early — usually at a level with two visible children where neither is the
real content, such as a decorative full-height background sitting beside the
content column. If the only candidates are a single `fixed` element and
nothing else, a scroll-jacking wrapper (common in some Framer templates) has
swallowed the page. Both are collector failures — there is no plausible
mapping to attempt, so the subagent should report it rather than force one: a
wrong anchor puts the wrong picture beside a section's name in a client-facing
report, while a refused one only degrades to a labelled placeholder.

Do not confuse either shape with a route whose markup is merely coarser than
its perceived sections — a `styleguide-elements` block holding eleven
specimens, say, with no element narrower than the whole block. That is not a
collector failure and nothing to report: it is the ordinary case `unmappable`
exists for, below.

Give every subagent these rules verbatim:

> Every section in `sections` is accounted for — anchored or listed as
> unmappable — globals included. Candidates are sorted top to bottom and so
> are sections, so among in-flow candidates `candidateIndex` must increase as
> `order` increases. A `fixed`/`sticky` candidate is exempt from this: it sits
> outside document flow, so its position in the list says nothing about
> reading order, and it may map to any order regardless of the candidates
> around it. Match on position first: a candidate's `y` is its distance from
> the top of the full-page screenshot and `height` is how tall it is, so a
> section you can see starting 1200px down the screenshot is the candidate
> whose `y` is near 1200 — except for a `fixed`/`sticky` candidate (`isFixed:
> true`), whose `y` is where it sits in the *viewport*, not the page (a
> bottom-fixed element on a 2568px page can record `y: 860`), so locate it
> visually instead of by that number. Use `tag`, `classes` and `textSnippet`
> only to break ties. A `fixed`/`sticky` candidate is almost always a global —
> a header at `y: 0`, a cookie banner or a floating button further down.
>
> A section that genuinely has no element of its own goes in `unmappable`, by
> `order`. This is not an escape hatch for a hard match — it is for the real
> case where the page's markup is coarser than its perceived sections: a
> single container holding several specimen blocks, or one header element
> covering what reads as three bands. List every such section explicitly.
> Every section must be accounted for in exactly one of the two lists;
> acceptance rejects a section that appears in both, and a section that
> appears in neither.

Acceptance rejects a response for the wrong route (`ROUTE_MISMATCH`), an
`order` this route does not have, in either list (`UNKNOWN_ORDER`), a section
that is neither anchored nor listed as unmappable (`MISSING_ORDER`), a section
listed in both (`CONTRADICTORY_ORDER`), a repeated `order`
(`DUPLICATE_ORDER`), a `candidateIndex` past the end of the list
(`CANDIDATE_OUT_OF_RANGE`), two orders pointing at one candidate
(`DUPLICATE_CANDIDATE`), and a mapping that runs backwards (`NOT_MONOTONIC`).
Exit `0` writes `.assessment/artifacts/crops/anchors/<routeKey>.json`; exit
`1` prints every error at once as `{"ok":false,"errors":[…]}` and writes
nothing.

```json
{ "ok": true, "route": "/", "anchors": <n>, "unmappable": <m>, "remaining": ["/about"] }
```

`crops:anchors:subject`, `crops:anchors:judge` and `crops:anchors:accept` all
flip to `done` together, on the run that empties `remaining`.

If a route genuinely has an in-flow section whose element sits out of
document order — so no monotonic mapping exists among the in-flow candidates —
say so rather than inventing one: a wrong anchor produces a wrong picture on a
client-facing page, and a missing one only produces a labelled placeholder.
This does not apply to a `fixed`/`sticky` candidate, which is exempt from the
ordering check and may be mapped regardless of its position in the list.

## Step 3 · capture (script, manifest step `crops:capture`)

```
pnpm tsx src/scripts/crops/index.ts --project <projectPath> --capture [--force]
```

```json
{ "step": "crops:capture", "status": "done" | "skipped", "targets": <n>, "shots": <n>, "missing": <n> }
```

**One shot per type, not per instance.** Every type in `discovery/blocks.json`
and `discovery/globals.json` already names an `exemplar: {route, order}`, so a
site with 34 block types and 2 globals takes 36 shots, not one per instance.

For each route, the step reopens the page, re-derives the candidate list, and
checks that the candidate at the anchored index still has the `signature` Step 1
stored. If it does, the element is captured with `element.screenshot()` —
**whole element, no clipping by height**; sections run from 200px to 3000px and
are cut only at the element's own boundary. JPEG `quality: 80`, width 1440,
`deviceScaleFactor: 1`. Shots land at
`.assessment/artifacts/crops/shots/<typeId>.jpg`.

`.assessment/artifacts/crops/index.json` records both sides:

```json
{
  "shots": [{ "typeId": "…", "route": "…", "order": 0, "relativePath": "crops/shots/….jpg", "width": 1440, "height": 780 }],
  "missing": [{ "typeId": "…", "route": "…", "order": 3, "reason": "SIGNATURE_DRIFT" }]
}
```

**A missing crop is normal.** `NO_ANCHORS_SHARD`, `NO_ANCHOR_FOR_ORDER`,
`CANDIDATE_OUT_OF_RANGE`, `SIGNATURE_DRIFT` and `CAPTURE_FAILED` each leave the
type without a picture, and the report degrades that card to a labelled
placeholder of the same frame. The phase still completes.

**Repeating is safe.** On a project where a step is already `done` the script
reports `"skipped"` and re-runs nothing. `--force` on `--candidates` rescans
every route; `--force` on `--capture` re-shoots every type.

## Verify

The six manifest steps this phase owns, named literally: `crops:candidates`,
`crops:anchors:schema`, `crops:anchors:subject`, `crops:anchors:judge`,
`crops:anchors:accept` and `crops:capture`.

```
pnpm tsx src/scripts/crops/index.ts --project <projectPath> --state
```

All six rows `done`. `crops:anchors:judge` is marked by `--anchors-accept`,
never on its own — there is no separate `judge` command.

Under `<projectPath>/.assessment/artifacts/crops/`:

| path | holds |
| --- | --- |
| `candidates/<routeKey>.json` | Step 1's DOM candidates for one route |
| `anchors/<routeKey>.json` | Step 2's `order → candidateIndex` mapping for one route |
| `shots/<typeId>.jpg` | one cropped section screenshot |
| `index.json` | which types got a shot, and why the rest did not |

## Vocabulary

Every count here counts one of the things defined in `docs/glossary.md`. The
capture set is the **unique layout pages**; the shot set is one per **section
type** plus one per **global**. A **section instance** never gets its own shot.
