# Forms phase

Scanning every mirrored page for `<form>` elements and their fields — the
report's page-builder-adjacent "how many distinct forms need rebuilding"
number. One script, one step (`forms`).

Entered once `inventory` is `done`. Does not depend on `assets`; the two
phases can run in either order. Every state change runs the script — never
write `.estimate/*` by hand.

## Step 1 · forms (script, manifest step `forms`)

```
pnpm tsx src/scripts/forms/index.ts --project <projectPath> [--force]
```

```json
{ "step": "forms", "status": "done" | "skipped", "forms": <n> }
```

Report the form count. Pure parsing of what `inventory` already mirrored — no
network. Each `<form>` is read for its `name`, `action`, `method` and its
input/textarea/select fields; a field that is a submit/button/hidden input,
`aria-hidden="true"`, or `tabindex="-1"` is dropped as chrome or a honeypot,
not a field the user would actually see and fill in. Forms with identical
name, action, method and field list on the same route collapse into one
record — the count in the output is per-route distinct forms, not raw `<form>`
tags.

**Repeating is safe.** On a project where the step is already `done` the
script prints `{"step":"forms","status":"skipped","forms":<n>}`, writes
nothing and exits 0. Pass `--force` to rescan, which you want after a forced
`inventory` re-run.

## Verify

Read `<projectPath>/.estimate/manifest.json`: `steps["forms"].status` is
`"done"`. Read `<projectPath>/.estimate/artifacts/forms.json`:
`{forms: [{route, name, action, method, fieldCount, fields: [{name, type,
required}]}]}`.
