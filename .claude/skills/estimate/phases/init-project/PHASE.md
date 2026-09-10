# Init-project phase

Entering a run: resolve the project directory for a source URL and create it.
One script, one flag, one manifest step (`init-project`).

Every state change runs the script — never write `.estimate/*` by hand.

## Step 1 · prepare (script, manifest step `init-project`)

```
pnpm tsx src/scripts/init-project/index.ts --prepare --url <sourceUrl>
```

```json
{ "step": "init-project", "status": "created" | "existing", "projectPath": "…" }
```

`--url` is the only required flag; there is no `--project` flag here because
the project doesn't exist yet — `projectPath` in the output is what every
later phase takes as `--project <projectPath>`.

The project name is derived from the URL's hostname (`www.` stripped, dots
turned into dashes), and the project lives at
`<workspace.path from estimate.config.json>/<project-name>`. No network I/O
happens here.

- **`status: "created"`** — a fresh project. `.estimate/`, `run-config.json`
  and `manifest.json` were written, and the `init-project` step is marked
  `done`. Continue to `probe`.
- **`status: "existing"`** — a project for this same URL already has a
  manifest on disk. Nothing is written or overwritten; `run-config.json` and
  `manifest.json` are exactly what a previous run left. Read
  `<projectPath>/.estimate/manifest.json` and resume from the first step in
  the pipeline table that is not `done` — this is the resumability the whole
  pipeline is built on.

There is no `--force` for this step and no separate "confirm with the user"
step: the URL is the only input, so there is nothing to approve before
creating the project.

## Verify

Read `<projectPath>/.estimate/manifest.json`: it has `sourceUrl`,
`toolVersion` and `steps["init-project"].status == "done"`.
`<projectPath>/.estimate/run-config.json` holds `{ sourceUrl, projectName }`.
