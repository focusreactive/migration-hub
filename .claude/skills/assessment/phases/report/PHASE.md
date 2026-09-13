# Report phase

Rendering everything the earlier phases inventoried into one human-readable
`report.md` at the project root. One script, one step (`report`). This is the
last phase — running it is how the skill knows the pipeline is complete.

Entered once `inventory`, `assets` (`assets:media` and `assets:fonts`),
`forms`, `stitch` and `discovery` are all `done`. Every state change runs the
script — never write `.assessment/*` or `report.md` by hand.

## Step 1 · report (script, manifest step `report`)

```
pnpm tsx src/scripts/report/index.ts --project <projectPath> [--force]
```

```json
{ "step": "report", "status": "done" | "skipped", "reportPath": "…/report.md" }
```

Reads `detect.json`, `pages.json`, `assets/media.json`, `assets/fonts.json`,
`forms.json`, `discovery/blocks.json` and `discovery/globals.json`, and
renders them into `<projectPath>/report.md`: page and collection counts,
media and font counts, the distinct-form list, and the block/global
inventory with its instance counts — including, per block, whether it was
found on a page-builder page, inside a CMS collection template, or both
(`kinds`, see `phases/discovery/PHASE.md`). The script refuses to run if
`detect.json`'s verdict is not `webflow` or `framer` — which cannot happen if
`phases/detect/PHASE.md` was followed, since the pipeline never reaches
`inventory` on any other verdict.

**Repeating is safe.** On a project where the step is already `done` the
script prints `{"step":"report","status":"skipped","reportPath":"…"}` and
leaves the existing `report.md` untouched. Pass `--force` to regenerate it —
on an unchanged project this produces byte-for-byte the same file, since every
input artifact is unchanged; it is what to run after re-running an earlier
phase with `--force` and wanting the report to reflect it.

## Verify

Read `<projectPath>/.assessment/manifest.json`: `steps["report"].status` is
`"done"`. `<projectPath>/report.md` exists and opens as plain markdown — hand
its path back to the user as the deliverable. This is the last phase in the
table in `SKILL.md`; once it reports `done`, the assessment is finished.
