# Crops phase

Cropping one screenshot per section type and per global, so the HTML report has
a picture for every card it draws. One script, one manifest step, no judgement:
`discovery` already recorded how each section is found in the markup, so this
phase only has to resolve those anchors and shoot them.

Entered once `stitch` and `discovery` are all `done`. Every state change runs
the script — never write `.assessment/*` by hand.

```
pnpm tsx src/scripts/crops/index.ts --project <projectPath> --state
```

prints one row per step; it is the fastest way to see where the phase stands.

## Why this is no longer a judged phase

It used to be. `stitch` took a full-page `desktop.png` per route and
`discovery` described each section as `{order, role, summary}` with no
selector and no coordinates, so nothing connected "section 3" to pixels. A
deterministic collector walked the DOM for candidate elements and a second
judged pass mapped sections onto them.

That seam did not hold: on a page whose markup is coarser than its perceived
bands — a style guide holding twenty specimens in two containers — the
collector had nothing finer to offer, and the judging pass anchored sections
to page-sized wrappers. The report then showed a whole page under one
section's name.

The anchor now travels with the section, decided by the same subagent that
perceived the band and verified against the live page before it was written
(see `phases/discovery/PHASE.md`, Step 1).

## Step 1 · capture (script, manifest step `crops:capture`)

```
pnpm tsx src/scripts/crops/index.ts --project <projectPath> --capture [--force]
```

```json
{ "step": "crops:capture", "status": "done" | "skipped", "targets": <n>, "shots": <n>, "missing": <n>, "hero": true | false }
```

**One shot per type, not per instance.** Every type in `discovery/blocks.json`
and `discovery/globals.json` names an `exemplar: {route, order}`, so a site
with 34 block types and 2 globals takes 36 shots. The step loads that route's
sections shard, reads the section's `anchor`, and resolves its `selector`.

**Plus one plain screenshot: the home page's first screen.** The report's hero
band shows the site as a visitor first sees it, which is not a section and needs
no anchor — so the step also opens `/` and takes one viewport screenshot
(1440x900, `fullPage: false`), after the same preamble that pre-scrolls for lazy
images and returns to the top. It lands at
`.assessment/artifacts/crops/hero.jpg` and is recorded under `hero` in the index,
beside `shots` rather than in it. `targets` does not count it; `hero` reports
whether it was taken.

Before shooting, the anchor's `signature` is re-derived from what the selector
resolves to now and compared with what acceptance stored. A mismatch is drift
and the type goes without a picture rather than getting the wrong one.

- an anchor matching **one** element is captured with `element.screenshot()` —
  whole element, no clipping by height; sections run from 200px to 3000px and
  are cut only at the element's own boundary;
- an anchor matching a **run of siblings** has no single element to shoot, so
  the frame is `page.screenshot({ clip })` over the union of their boxes — of
  the isolated render below, never of `desktop.png`.

JPEG `quality: 80`, width 1440, `deviceScaleFactor: 1`. Shots land at
`.assessment/artifacts/crops/shots/<typeId>.jpg`.

**The rest of the page is hidden while the shot is taken.** A screenshot of an
element is a screenshot of that rectangle of the composited page, so anything
painted over the section's box came out in the crop with it — the sticky header
pinned across its first 60px, a cookie bar, a platform badge, a chat bubble.
Before capturing an in-flow target the step injects one stylesheet that hides
`body *`, then puts visibility back on every matched node with its descendants
and on their ancestor chain up to `<body>`. Ancestors stay visible so a
transparent section keeps the wrapper background it visually sits on; their
other children do not, because `body *` matches those directly. Every rule
carries an inert `:not(#…)` that buys it an id's worth of specificity —
`!important` alone loses to a more specific `!important`, and Webflow's badge
ships exactly that (`.w-webflow-badge { visibility: visible !important }`), so
without the bump it rides into every crop. It hides with `visibility`, never
`display`, so nothing reflows: the element keeps the geometry its `signature`
was taken from and no scroll-triggered reveal re-runs.

**A pinned target is shot in context instead.** Chrome that floats over the page
— a transparent navbar over the hero, a cookie bar, a floating button — usually
has no background of its own, so isolating it would replace what shows through
with a blank page. Any anchor whose `isFixed` is true is captured exactly as a
visitor sees it. The branch is on `isFixed`, not on global-versus-block: an
in-flow global such as a footer is isolated like any section.

`.assessment/artifacts/crops/index.json` records both sides:

```json
{
  "shots": [{ "typeId": "…", "route": "…", "order": 0, "relativePath": "crops/shots/….jpg", "width": 1440, "height": 780 }],
  "missing": [{ "typeId": "…", "route": "…", "order": 3, "reason": "NO_ELEMENT" }],
  "hero": { "relativePath": "crops/hero.jpg", "width": 1440, "height": 900 }
}
```

**A missing crop is normal.** Each reason leaves the type without a picture, and
the report degrades that card to a labelled placeholder of the same frame:

| reason | meaning |
| --- | --- |
| `NO_ELEMENT` | the section declared it has no element of its own |
| `SECTIONS_SHARD_MISSING` | that route has no sections shard |
| `SELECTOR_UNRESOLVED` | the stored selector no longer resolves to a contiguous run |
| `SIGNATURE_DRIFT` | it resolves, but to different content than acceptance saw |
| `CAPTURE_FAILED` | the screenshot itself failed |

The phase still completes.

**Repeating is safe.** On a project where the step is already `done` the script
reports `"skipped"` and re-runs nothing. `--force` re-shoots every type.

## Verify

```
pnpm tsx src/scripts/crops/index.ts --project <projectPath> --state
```

One row, `crops:capture`, `done`.

Under `<projectPath>/.assessment/artifacts/crops/`:

| path | holds |
| --- | --- |
| `shots/<typeId>.jpg` | one cropped section screenshot |
| `hero.jpg` | the home page's first screen, one viewport |
| `index.json` | which types got a shot, and why the rest did not |

A project carried over from before anchors lived in `discovery` still has
`crops/candidates/` and `crops/anchors/` on disk. Nothing reads them; they are
stale, not an input.

## Vocabulary

Every count here counts one of the things defined in `docs/glossary.md`. The
capture set is the **unique layout pages**; the shot set is one per **section
type** plus one per **global**. A **section instance** never gets its own shot.
