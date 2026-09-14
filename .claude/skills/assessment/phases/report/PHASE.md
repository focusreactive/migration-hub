# Report phase

Rendering everything the earlier phases inventoried into one human-readable
`report.md` at the project root. One script, five manifest steps: a judged
narrative pass, then the render. This is the last phase — running it is how
the skill knows the pipeline is complete.

Entered once `inventory`, `assets` (`assets:media` and `assets:fonts`),
`forms`, `stitch` and `discovery` are all `done`. Every state change runs the
script — never write `.assessment/*` or `report.md` by hand.

```
pnpm tsx src/scripts/report/index.ts --project <projectPath> --state
```

prints one row per step; it is the fastest way to see where the phase stands.

## Step 1 · narrative schema, subject, accept (judged)

Writes the two hand-written paragraphs the report opens with —
`report/narrative.json`'s `site` and `design` — following the same
schema → subject → judge → accept shape as `discovery` (see its phase doc for
the general pattern). Delegate this to one subagent:

1. Runs `--narrative-schema`, which prints the JSON Schema a response must
   satisfy: `{site, design}`, both non-empty strings.
2. Runs `--narrative-subject`, which prints `{hostname, platform,
   homeScreenshotPath, sections, metrics, responsePath}` — the site's
   hostname and detected platform, the path to the home page's screenshot
   (or `null` if none was captured), every section's `role` and `summary`
   from `discovery/blocks.json` and `discovery/globals.json`, the computed
   metrics, and the path to write the response to.
3. Reads `homeScreenshotPath` (when not `null`) and the `sections`
   summaries, and writes both paragraphs as JSON to `responsePath`.
4. Runs `--narrative-accept` itself, and keeps fixing and rewriting the
   response until that command exits 0.

The **`site`** paragraph says what the site is and who it serves, in one or
two sentences — no counts (those belong in the Scope at a glance table) and
no publication date; it may close with one technical clause naming the
source stack. The **`design`** paragraph covers, in this order: palette,
typography, composition, element shapes, motion, and the overall impression.
It must not describe imagery — no photography, stock images, client logos or
icons.

Acceptance rejects a response that fails the schema (`SCHEMA`), a digit
anywhere in the `site` paragraph (`COUNTERS_IN_SITE_PARAGRAPH`), either
paragraph opening with the filler "This site" (`FILLER_OPENING`), and the
word "we" anywhere in either paragraph (`AGENCY_VOICE`) — the report speaks
about the site in the third person, never as the agency. Exit `0` writes
`report/narrative.json` and marks `report:narrative:subject`,
`report:narrative:judge` and `report:narrative:accept` all `done`; exit `1`
prints every error at once as `{"ok":false,"errors":[…]}` and writes nothing.

```json
{ "ok": true, "step": "report:narrative:accept" }
```

Once accepted, the paragraphs are frozen: re-running the render (Step 2) with
`--force` reproduces the same `report.md` byte for byte, since `narrative.json`
does not change.

## Step 2 · report (script, manifest step `report`)

```
pnpm tsx src/scripts/report/index.ts --project <projectPath> [--force]
```

```json
{ "step": "report", "status": "done" | "skipped", "reportPath": "…/report.md" }
```

**Run Step 1 first.** `report/narrative.json` is a hard input, not an
optional one: with it missing the script stops with a message naming the
narrative step and writes no `report.md`.

Reads `detect.json`, `pages.json`, `assets/media.json`, `assets/fonts.json`,
`forms.json`, `discovery/blocks.json`, `discovery/globals.json` and
`report/narrative.json`, and renders them into `<projectPath>/report.md`.
The report opens with the two narrative paragraphs from Step 1, then a
Scope-at-a-glance table of the route, unique-layout-page, collection,
section, global, media, font and form counts; a complexity assessment rating
five areas (content
model, page composition, design system & assets, forms & integrations,
content volume) Low/Medium/High from those counts, each with a paragraph
derived from the same numbers; the content-model, page-builder-page,
section-library, globals, forms and media inventories — including, per
block, whether it was found on a page-builder page, inside a collection
template page, or both (`kinds`, see `phases/discovery/PHASE.md`); a
risks-and-watch-outs list assembled from rules over those counts (form
handling, asset hosting, alt text, utility-page sections, dual-source
sections, interactions, inferred fields, redirects — each rule fires only
when its condition holds); the five migration steps; the tooling links for
the detected platform; and the agency close.

Every number and value in the file is derived from an artifact — the script
never invents a reading, so a surprising sentence means a surprising
artifact. The script refuses to run if `detect.json`'s verdict is not
`webflow` or `framer` — which cannot happen if `phases/detect/PHASE.md` was
followed, since the pipeline never reaches `inventory` on any other verdict.

**Repeating is safe.** On a project where the step is already `done` the
script prints `{"step":"report","status":"skipped","reportPath":"…"}` and
leaves the existing `report.md` untouched. Pass `--force` to regenerate it —
on an unchanged project this produces byte-for-byte the same file, since every
input artifact is unchanged; it is what to run after re-running an earlier
phase with `--force` and wanting the report to reflect it.

## Vocabulary

Every count in `report.md` counts one of the things defined in
`docs/glossary.md`, and that file is the arbiter when two numbers seem to
disagree. The terms that bite most often:

- a **route** is one published URL (`pages.json`, every entry);
- a **page-builder page** is a route composed by hand (`kind: "static"`);
- a **collection document** is one record in a collection (`kind: "item"`);
- a **collection template page** is the single layout all of a collection's
  documents render through, one per collection;
- a **unique layout page** is a page-builder page or a collection template
  page — every distinct layout on the site, exactly once. This is the capture
  set `stitch` screenshots and `discovery` segments, so it is also the
  denominator for every per-section and global-coverage claim.

Never write "page", "entry" or "template" unqualified in report copy — each is
ambiguous between two of the terms above.

## Verify

```
pnpm tsx src/scripts/report/index.ts --project <projectPath> --state
```

All five rows `done`. `report:narrative:judge` is marked by
`--narrative-accept`, never on its own — there is no separate `judge`
command. `<projectPath>/report.md` exists and opens as plain markdown — hand
its path back to the user as the deliverable. This is the last phase in the
table in `SKILL.md`; once it reports `done`, the assessment is finished.
