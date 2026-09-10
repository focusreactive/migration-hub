# Detect phase

Scoring the probed home page against the Webflow and Framer signal
registries (`src/scripts/detect/signals/{webflow,framer}.ts`) and writing a
verdict. One script, one step (`detect`).

Entered once `probe` is `done` (see `phases/probe/PHASE.md`). Every state
change runs the script — never write `.estimate/*` by hand.

## Step 1 · detect (script, manifest step `detect`)

```
pnpm tsx src/scripts/detect/index.ts --project <projectPath> [--force]
```

```json
{ "step": "detect", "status": "done" | "skipped", "verdict": "webflow" | "framer" | "unknown" | "ambiguous", "scores": { "webflow": <n>, "framer": <n> } }
```

Show the verdict and both scores.

**Repeating is safe.** On a project where the step is already `done`, the
script reads the existing artifact instead of rescoring and prints the same
shape. Pass `--force` to rescore — only useful if `probe` was re-run with
`--force` first, since detect scores whatever `probe` last captured.

## Step 2 · if the verdict is not `webflow` or `framer`, stop

This tool estimates Webflow and Framer migrations and nothing else. A verdict
of `unknown` (neither platform scored high enough with a strong signal) or
`ambiguous` (the winner didn't clear the runner-up by enough of a margin) ends
the run the same way: every phase after `inventory` resolves the adapter from
this verdict and refuses to run on anything else.

Read (do not write) `<projectPath>/.estimate/artifacts/detect.json`. Shape:
`{verdict, scores: {webflow: {score, hasTier1Strong, signals: [{id, tier,
evidence}]}, framer: {…}}, thresholds, platformHints}`. For both platforms,
show the top signals from `scores.<platform>.signals` ordered strong → medium
→ weak, so the user can see what was and was not found. Say plainly that the
site's platform was not recognized (`unknown`) or not recognized with enough
confidence (`ambiguous`), point them at
`https://focusreactive.com/services/headless-cms-expert-agency/` for a
consultation, and stop — do not continue to `inventory`.

The project stays on disk with `detect` marked `done`, so re-running
`--prepare --url <sourceUrl>` on the same URL later resumes from here; nothing
downstream can complete until a fresh `--force` detect run against a
different site returns a recognized verdict.
