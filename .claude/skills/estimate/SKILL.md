---
name: estimate
description: Estimate a Webflow or Framer site migration. Use when the user asks how big a migration is, or to resume an existing estimate.
---

# /estimate

This skill **drives the estimator pipeline directly**: it resolves project
state by reading `.estimate/`, then runs each phase's script in a fixed order.

## Hard rule: scripts own writes, the skill owns orchestration

- The skill **reads** state directly with the Read tool:
  `.estimate/manifest.json` and `.estimate/artifacts/**/*.json`. These are the
  source of truth.
- The skill **never writes** under `.estimate/` by hand. Every state change
  runs a real script (`src/scripts/**/index.ts`) via Bash, invoked as
  `pnpm tsx src/scripts/<phase>/index.ts`.
- If a script fails, the fix is another script run with better input — never a
  hand-edit of project files.

## Hard rule: the tool repo is read-only

An estimate run **never modifies this repository**. Not `src/`, not `tests/`,
not configs (`package.json`, `estimate.config.json`), not `docs/`, not this
skill. No edits, no new files, no `git` subcommand that touches the tree. A run
writes only into `<workspace>/<project-name>`, where `<workspace>` is
`estimate.config.json`'s `workspace.path`. Read the tool source as much as you
like — write nothing outside the project path.

## The pipeline

Nine phases, in the order the skill runs them:

| phase          | link                            |
| -------------- | -------------------------------- |
| `init-project` | `phases/init-project/PHASE.md`  |
| `probe`        | `phases/probe/PHASE.md`         |
| `detect`       | `phases/detect/PHASE.md`        |
| `inventory`    | `phases/inventory/PHASE.md`     |
| `assets`       | `phases/assets/PHASE.md`        |
| `forms`        | `phases/forms/PHASE.md`         |
| `stitch`       | `phases/stitch/PHASE.md`        |
| `discovery`    | `phases/discovery/PHASE.md`     |
| `report`       | `phases/report/PHASE.md`        |

Every phase's status command prints **one line of JSON** to stdout and exits
0, or prints an error to stderr and exits 1 (2 on a usage error). Every phase
except `init-project` and `discovery` takes `--project <projectPath>
[--force]`; `--force` re-runs a step already marked `done`. `discovery` is
driven by a model rather than by code and has its own flag set, including two
flags that print a multi-line JSON Schema instead of a status line — see its
phase doc.

## Determining the next step

`init-project` is itself a manifest step — its single invocation both
resolves the project and creates it (see its phase doc); there is no separate
prepare/init split here, and no step ahead of the pipeline table to special-case.

Read `.estimate/manifest.json`'s `steps` object
(`{ [stepId]: { status, error? } }`, status one of
`pending`/`running`/`done`/`failed` — no script ever writes `skipped` into the
manifest). Walk "The pipeline" table in order; the first phase whose step(s)
are not `done` is the next one to run — `failed` means it failed before (show
the error, then retry), `running` means it was interrupted (retry). Open that
phase's `PHASE.md` and follow it; the phase doc owns its own step ids,
commands, `--force` semantics and (for `assets` and `discovery`) internal
sub-steps. Never plan a step from this file alone.

`"skipped"` is something a phase's script **reports** on stdout when it finds
the manifest step already `done` and re-runs nothing — it is not a manifest
status. A step you see reported `"skipped"` still reads `"done"` in
`manifest.json`; there is no third on-disk state to check for.

`assets` is two manifest steps (`assets:media`, `assets:fonts`); `discovery`
is nine (`discovery:sections:{schema,subject,judge,accept}`,
`discovery:dedup:{schema,subject,judge,accept}`, `discovery:finalize`). Every
other phase is exactly one step, named after the phase.

When every phase is done, run `phases/report/PHASE.md` last — it fails loudly
if any input phase never finished, so it doubles as a completeness check.

When invoked again on a project that already finished, every phase's script
reports `"skipped"` and the pipeline reaches `report` immediately, which
regenerates `report.md` from the same artifacts — same input, same output.
