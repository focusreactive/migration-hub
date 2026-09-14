# Assets phase

Building the site's asset inventory: every image and video it references, and
every font family it uses. Two independent sub-steps, one script.

Entered once `inventory` is `done`. Every state change runs the script —
never write `.assessment/*` by hand.

## Step 1 · media (script, manifest step `assets:media`)

```
pnpm tsx src/scripts/assets/index.ts --project <projectPath> --media [--force]
```

```json
{ "step": "assets:media", "status": "done" | "skipped", "images": <n>, "videos": <n>, "duplicates": <n> }
```

Report the image and video counts, and flag `duplicates` whenever it is above
zero — those are records whose `ETag` matched another record's, so they are
the same upload served from two URLs, and are not counted twice by the
report.

Every mirrored page body already on disk (from `probe` and `inventory`) and
every mirrored stylesheet is scanned for image and video references, grouped
into one record per canonical URL. Each record is then HEAD-probed (no full
download) to read its `ETag` and `Content-Type` — this is what makes the
duplicate check below free of any asset-weight download.

**Repeating is safe.** On a project where the step is already `done` the
script re-reads the existing artifact instead of re-scanning, prints
`{"step":"assets:media","status":"skipped",…}` with the same counts, makes no
network request and exits 0. Pass `--force` to rebuild, which you want after a
forced `inventory` re-run.

## Step 2 · fonts (script, manifest step `assets:fonts`)

```
pnpm tsx src/scripts/assets/index.ts --project <projectPath> --fonts [--force]
```

```json
{ "step": "assets:fonts", "status": "done" | "skipped", "families": <n> }
```

Parses `@font-face` rules from every page's mirrored HTML and every mirrored
stylesheet — that half is offline, no network. It then **does** make live
requests: every `<link rel="stylesheet">` pointing at a known font-provider
host (Google Fonts, Typekit, Bunny Fonts, Fontshare) is fetched at run time,
because the `@font-face` rules for a provider-hosted family live in that
remote CSS, not in the mirror. A provider stylesheet that 404s, times out, or
fails to fetch is skipped — it does not abort the step, it just means that
family may come back with no weights or go undetected. **What is never
fetched, mirrored or provider-fetched, is the font binary itself** — no
`.woff2`, no `.ttf` is ever downloaded; only the `@font-face` text is read, to
learn which families and weights exist. Every parsed face is folded per
family and classified `google` / `fontshare` / `adobe` / `custom`.

**Repeating is safe**, the same way step 1 is: an already-`done` step re-reads
its artifact and prints `status: "skipped"`.

One of `--media` or `--fonts` is required on every invocation of this script —
there is no flag that runs both at once, so both commands above are needed to
finish the phase.

## Verify

Read `<projectPath>/.assessment/manifest.json`: `steps["assets:media"].status`
and `steps["assets:fonts"].status` are both `"done"`.

Read `<projectPath>/.assessment/artifacts/assets/media.json`:
`{assets: [{assetId, canonicalUrl, kind, contentType, etag, sources,
duplicateOf}]}` — `duplicateOf` is the asset id of the original when this
record is a recognized duplicate, otherwise `null`.

Read `<projectPath>/.assessment/artifacts/assets/fonts.json`:
`{families: [{family, weights, styles, classification, sources}]}`.
