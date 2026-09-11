# Discovery phase

Builds the two site-wide inventories the report is built from —
`discovery/blocks.json` and `discovery/globals.json` — in two judged passes:
first every route in the capture set is segmented into its own sections
(globals vs. content), then all of those per-route sections are folded into
site-wide types. One script, nine manifest steps.

The capture set is `stitch`'s (see its phase doc): every static route, plus
one exemplar item route per CMS collection. A page-builder block and a
collection-template section can be the same design — a "CTA panel" reused
both on a static page and inside a case-study template is one component, not
two — so both flow into the same `blocks.json` type space and the dedup pass
is free to merge them into one type. What's never lost is *where* a type
showed up: every block type carries `kinds`, a non-empty array of
`"block"` (found on a static, page-builder route) and/or `"collectionSection"`
(found on a collection-exemplar route) — `["block"]`, `["collectionSection"]`,
or `["block","collectionSection"]` when the same type was seen in both
places. `kinds` is computed by code from each member's route, never asked of
the model — see Step 2.

```
pnpm tsx src/scripts/discovery/index.ts --project <projectPath> --state
```

prints one row per step; it is the fastest way to see where the phase stands.

## How a judgement is delegated

Both judgements share one shape: a subagent runs the schema step, runs the
subject step, writes its answer to the path the subject printed, and runs
acceptance itself until acceptance passes. `accept` writes **only** the
artifact it validates into — an unvalidated answer never reaches
`.estimate/artifacts/`. Exit `0` writes the artifact (and, for `sections`,
the per-route shard) and marks the relevant steps; exit `1` prints **every**
error at once as `{"ok":false,"errors":[…]}` and writes nothing.

## Step 1 · sections schema, subject, accept (fan-out over routes)

Segments every route in the capture set — static pages and collection
exemplars alike — into its visible sections, splitting them into `globals`
and `blocks` in the same pass — there is no separate globals step in this
pipeline, and no separate step for collection-exemplar routes either: a
collection item template has a header, a footer and content sections just
like a static page, so the same split applies. This step never looks at
where a route came from — that distinction is resolved later, from the route
alone, when Step 2 computes each type's `kinds`.

```
pnpm tsx src/scripts/discovery/index.ts --project <projectPath> --sections-schema
```

prints the JSON Schema a response must satisfy:
`{route, globals: [{order, role, summary}], blocks: [{order, role,
summary}]}`.

Get the remaining routes next — no `--route`:

```
pnpm tsx src/scripts/discovery/index.ts --project <projectPath> --sections-subject
```

```json
{ "step": "discovery:sections:subject", "remaining": ["/", "/about", "/services"] }
```

A route drops off the list when its shard is written, so this is the progress
query for the whole fan-out.

**Fan out one subagent per remaining route, all at once, in a single wave,
with no cap on how many run in parallel.** This is not an optimization choice
— it is what was run and verified: six routes, six subagents, one wave, five
accepted on the first attempt. Each subagent:

1. Runs `--sections-subject --route <route>`, which prints
   `{route, stitchPngPath, responsePath}` — the route's own `desktop.png` and
   the exact path to write the response to.
2. Reads that `desktop.png` and decides the section split.
3. Writes its response as JSON to `responsePath`.
4. Runs `--sections-accept --route <route>` itself, and keeps fixing and
   rewriting the response until that command exits 0.

Give every subagent this instruction verbatim — it is the rule the whole
report's block/global split depends on:

> Перечисли все секции страницы сверху вниз, сквозной нумерацией `order`, начиная с 0.
>
> **Блоки** — это секции основного layout страницы. Они всегда находятся между хедером и футером, если те есть.
>
> **Глобалы** — это хедер, футер и фиксированные элементы, повторяющиеся на всём сайте: cookie-баннер, announcement bar, плавающая кнопка.
>
> Каждая секция попадает ровно в один из двух списков. Хедер и футер никогда не попадают в `blocks`.

**This rule is load-bearing and the validator does not enforce it.**
Acceptance checks that the response is for the route it was asked about, that
no two sections share an `order`, and that `order` runs `0, 1, 2, …` with no
gaps across `globals` and `blocks` together (`ROUTE_MISMATCH`,
`DUPLICATE_ORDER`, `ORDER_NOT_CONTIGUOUS`) — it never looks at which list a
`header` or `footer`-shaped section landed in. This was measured, not assumed:
across six real routes, one subagent put `footer` into `blocks` and acceptance
accepted it anyway, because nothing in the code checks that a role belongs to
its category. Tell every subagent this explicitly: before running
`--sections-accept`, re-read your own `globals` and `blocks` arrays and
confirm nothing that is a header, footer, cookie banner, announcement bar or
floating button ended up in `blocks` — acceptance passing is not proof this
rule was followed.

**A free-tier Framer site's screenshot includes the hosting platform's own
chrome** — a "Made in Framer" badge, a floating "Get … for Free" bar, a
template-promotion card — fixed elements captured at their natural position on
the page. Tell every subagent to **ignore these**: they belong to the hosting
platform, not the site, and disappear on migration. Treating one as a global
or a block manufactures a phantom global on every free-tier site. This was
verified in practice: subagents told about the chrome correctly ignored it.

Acceptance's success output names what is still missing:

```json
{ "ok": true, "route": "/", "globals": <n>, "blocks": <n>, "remaining": ["/about"] }
```

`discovery:sections:subject`, `discovery:sections:judge` and
`discovery:sections:accept` all flip to `done` together, on the run that
empties `remaining` — one row per step, one closure for the whole fan-out.

## Step 2 · dedup schema, subject, accept

Folds every route's sections into site-wide block and global types. Runs only
once every route in the capture set has a shard (Step 1's `remaining` is
empty). Unlike Step 1, the subject is delivered **inline** — the subject step
prints every section instance from every route's shard, and the response
must cover all of them.

```
pnpm tsx src/scripts/discovery/index.ts --project <projectPath> --dedup-schema
pnpm tsx src/scripts/discovery/index.ts --project <projectPath> --dedup-subject
```

The first prints the JSON Schema:
`{groups: [{kind: "global"|"block", name, role, members: [{route, order}],
exemplar: {route, order}}]}` — still only two kinds, exactly as before
collection exemplars existed: every non-global instance, whether its route is
a static page or a collection exemplar, is printed as `kind: "block"`. The
subagent is not asked to tell the two apart here; that split happens after
folding, from each member's route, not from anything the model states (see
below). The second prints every instance (`kind`, `route`, `order`, `role`,
`summary`) and the path to write the response to.

Run this as one subagent — one dedup pass, not one per route. Delegate with
this instruction:

Group the instances into site-wide types. **Actively look for the same design
repeated across pages** — the type-to-instance ratio is the report's headline
number, so merging what is genuinely the same section wherever it recurs
matters as much as not merging what only looks similar. This includes
merging across a static page and a collection-exemplar route: if a section on
`/about` and a section on the Blog template are genuinely the same design,
put them in the same group — a shared component doesn't stop being shared
just because one occurrence sits inside a CMS template. Merge two instances
only on a clear role and structure match; a section that only exists on one
page legitimately stays a singleton — a response that never merges anything
(every instance its own group) is exactly as wrong as one that over-merges
unrelated sections together. On the verified run this produced 15 block types
across 32 instances — a real fold, not a pass-through. Every listed instance
must land in exactly one group; the exemplar must be one of that group's own
members; a global can never share a group with a block; do not invent group
kinds or ids — the type id is minted by code from `role`.

Then the subagent runs `--dedup-accept` itself until it exits 0. Acceptance
rejects a member never listed (`UNKNOWN_MEMBER`), a member claimed by two
groups (`DUPLICATE_MEMBER`), a global and a block sharing one group
(`KIND_MISMATCH`), an exemplar outside its own group's members
(`EXEMPLAR_NOT_MEMBER`), and any listed instance left out of every group
(`INPUT_NOT_COVERED`):

```json
{ "ok": true, "blocks": <n>, "globals": <n> }
```

On success this writes `discovery/blocks.json` and `discovery/globals.json`,
and marks `discovery:dedup:subject`, `discovery:dedup:judge` and
`discovery:dedup:accept` all `done`. Writing `blocks.json` is where `kinds`
gets computed (`src/scripts/discovery/steps/dedup/utils/fold-types.ts`,
`foldBlockTypes`): for each accepted block group, every member's route is
checked against the project's collection-exemplar routes
(`src/scripts/stitch/utils/collection-exemplar-routes.ts`) and the type gets
`"block"` if any member is a static route, `"collectionSection"` if any
member is a collection-exemplar route — both, if it has both kinds of member.

## Step 3 · finalize (script, manifest step `discovery:finalize`)

```
pnpm tsx src/scripts/discovery/index.ts --project <projectPath> --finalize
```

```json
{ "ok": true, "blocks": <n>, "globals": <n> }
```

Deterministic, no AI: reads both type artifacts back — a missing or
schema-invalid one fails the step — and marks the phase done. `--force` has
no effect here and there is no `skipped` status; the step always re-reads and
re-marks, which is harmless to repeat.

## Verify

```
pnpm tsx src/scripts/discovery/index.ts --project <projectPath> --state
```

All nine rows `done`. `discovery:sections:judge` and `discovery:dedup:judge`
are marked by their respective `accept` step, never on their own — there is
no separate `judge` command.

Under `<projectPath>/.estimate/artifacts/discovery/`:

| path              | holds                                                                             |
| ----------------- | ---------------------------------------------------------------------------------- |
| `sections/<routeKey>.json` | the per-route shard Step 1 wrote: `{route, globals, blocks}`             |
| `blocks.json`     | site-wide block types: `{types: [{id, name, role, instanceCount, members, exemplar, kinds}]}` |
| `globals.json`    | the same shape minus `kinds`, for globals (header, footer, cookie banner, …)       |

A member's `route` in `blocks.json` can be a collection-exemplar item route
(e.g. `/blog/some-post`) when the type's `kinds` includes
`"collectionSection"` — the report resolves that back to the collection it
represents (e.g. "Blog (collection template)") rather than showing the raw
item route, since one exemplar stands for the whole collection.

The report phase reads `blocks.json` and `globals.json` — the per-route
shards under `sections/` are the intermediate, per-occurrence record.
