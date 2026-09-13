# Probe phase

Capturing the site's entry surface: the home page, `robots.txt`, the sitemap
and a 404 page. Everything the next phase judges the platform on comes from
here. One script, one step (`probe`).

Entered once `init-project` is `done`. Every state change runs the script —
never write `.assessment/*` by hand.

## Step 1 · probe (script, manifest step `probe`)

```
pnpm tsx src/scripts/probe/index.ts --project <projectPath> [--force]
```

```json
{ "step": "probe", "status": "done" | "skipped" }
```

Network I/O, in this order — `robots.txt` first, so its `Crawl-delay`
applies to everything fetched after it:

1. `<origin>/robots.txt` — parsed for `Crawl-delay` and `Sitemap:` directives.
   A `>=400` response is fine; the phase continues without it.
2. the source URL's home page — its response headers are what `detect` scores
   the platform on.
3. `<origin>/sitemap.xml`. If it answers `>=400`, the first same-origin
   `Sitemap:` directive from `robots.txt` is fetched in its place, into the
   same path.
4. a path that cannot exist on the site, to record how its own 404 handling
   responds.

Every fetch goes through the project's mirror store, so later phases reuse
these bytes instead of refetching.

**Repeating is safe.** On a project where the step is already `done` the
script prints `{"step":"probe","status":"skipped"}`, writes nothing and exits
0 — continue to `detect`. Pass `--force` to re-fetch, which you want only when
the source site itself has changed since the last run.

## Verify

Read `<projectPath>/.assessment/manifest.json`: `steps["probe"].status` is
`"done"`.

Under `<projectPath>/.assessment/mirror/probe/` there are up to five files:

| file             | holds                                          |
| ---------------- | ----------------------------------------------- |
| `home.html`      | the home page body                              |
| `headers.json`   | home page status and response headers           |
| `robots.txt`     | only when robots answered `<400`                |
| `sitemap.xml`    | the root sitemap, or the robots-declared fallback |
| `not-found.html` | the 404 body, whatever status the site returned |

`home.html` being absent (or the step never having run) is what makes every
later phase fail with a message about probe not having been run — if you see
that anywhere downstream, this phase is what is missing.
