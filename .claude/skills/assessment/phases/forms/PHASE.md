# Forms phase

Scanning every mirrored page for `<form>` elements and their fields — the
report's page-builder-adjacent "how many distinct forms need rebuilding"
number. One script, one step (`forms`).

Entered once `inventory` is `done`. Does not depend on `assets`; the two
phases can run in either order. Every state change runs the script — never
write `.assessment/*` by hand.

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

## Step 2 · names schema, subject, accept (judged)

Gives every distinct form and every one of its fields a **human name** — the
name a person filling the form in would recognise — so the HTML report can say
"Contact enquiry" and "Email address" where the markup only has
`wf-form-Contact-Form` and `email-2`. The raw attributes stay in `forms.json`
untouched under `name`; the labels are added alongside as `label`.
`report.md` does not use them.

Delegate this to one subagent — one pass over all the forms, not one per form:

1. Runs `--names-schema`, which prints the JSON Schema a response must
   satisfy: `{forms: [{index, label, fields: [{index, label}]}]}`.
2. Runs `--names-subject`, which prints every distinct form inline —
   `{index, sourceName, action, method, routes, fields: [{index, sourceName,
type, required}]}` — and the path to write the response to.
3. Writes its response as JSON to `responsePath`.
4. Runs `--names-accept` itself, and keeps fixing and rewriting the response
   until that command exits 0.

Give the subagent this instruction:

> Name each form for what it collects and each field for what the person
> types into it. Use the field names, types and the routes the form appears
> on as evidence: a one-field email form in the footer is a "Newsletter
> signup", a five-field form on `/contact` is a "Contact enquiry". Field
> names are the words a well-written label would use — "Full name", "Email
> address", "Phone number", "Message". Never repeat the source attribute:
> acceptance rejects a label containing an underscore, starting with `wf-`,
> or ending in a separator plus digits.

Acceptance rejects an unknown form or field index (`UNKNOWN_FORM`,
`UNKNOWN_FIELD`), anything left unlabelled (`MISSING_FORM`, `MISSING_FIELD`),
a repeated index (`DUPLICATE_FORM`, `DUPLICATE_FIELD`) and a label that is
still a source identifier (`RAW_IDENTIFIER`). Exit `0` rewrites `forms.json`
with the labels merged in and marks `forms:names:subject`,
`forms:names:judge` and `forms:names:accept` `done`; exit `1` prints every
error at once as `{"ok":false,"errors":[…]}` and writes nothing.

```json
{ "ok": true, "step": "forms:names:accept", "forms": <n> }
```

## Verify

Read `<projectPath>/.assessment/manifest.json`: `steps["forms"].status` is
`"done"`. Read `<projectPath>/.assessment/artifacts/forms.json`:
`{forms: [{route, name, action, method, fieldCount, fields: [{name, type,
required}]}]}`.

```
pnpm tsx src/scripts/forms/index.ts --project <projectPath> --state
```

All five rows `done`. `forms:names:judge` is marked by `--names-accept`, never
on its own.
