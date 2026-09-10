# Stitch phase

Rendering every static route as a full-page desktop screenshot — the visual
evidence `discovery` segments into sections. One script, one step (`stitch`).

Entered once `inventory` is `done`. Every state change runs the script —
never write `.estimate/*` by hand.

## Step 1 · stitch (script, manifest step `stitch`)

```
pnpm tsx src/scripts/stitch/index.ts --project <projectPath> [--force]
```

```json
{ "step": "stitch", "status": "done" | "skipped", "routes": <n>, "captured": <n> }
```

Report `routes` (how many static routes exist) and `captured` (how many
screenshots this run actually took). Only **static** pages are captured —
collection item pages are not; `discovery` and everything after it works from
this same static-route set. Each route is opened with Playwright at a single
1440×900 desktop viewport and rendered full-page to
`.estimate/artifacts/stitch/<routeKey>/desktop.png`. A route whose PNG already
exists is skipped even without `--force` being passed, so a partially
completed run resumes route by route, not just phase by phase.

**Repeating is safe.** On a project where the step is already `done` the
script prints `{"step":"stitch","status":"skipped","routes":<n>,"captured":0}`
and exits 0 without opening a browser. Pass `--force` to recapture every
route, which you want after the site itself changed or after a forced
`inventory` re-run added or removed routes.

## Verify

Read `<projectPath>/.estimate/manifest.json`: `steps["stitch"].status` is
`"done"`. For every static route in `<projectPath>/.estimate/artifacts/pages.json`,
`<projectPath>/.estimate/artifacts/stitch/<routeKey>/desktop.png` exists — the
`discovery` subject step prints this path without checking it, so a missing
PNG only surfaces when the subagent tries to read it.
