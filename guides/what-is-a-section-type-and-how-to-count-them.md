# What is a section type and how to count them

The new site needs a page builder: a library of components an editor assembles pages
from. The size of that library is the biggest single cost driver in the migration.

The source site will not tell you what it is. It doesn't know.

## The source has no model of sections

A designer draws on a canvas. The output is nested `div` elements carrying layout and
style — no component boundary, no notion that this band is "testimonials" and that one
is "pricing".

**Collections** are real and readable from the markup. Sections are not. The concept
has to be inferred from what the page looks like, which is why the counting is done
visually: render each page full-height, then read it the way a person reads it.

## A section is a horizontal band

> **Section** — one horizontal band of a page, as a reader perceives it.

Two ways to get the altitude wrong:

| mistake | symptom |
| --- | --- |
| counting atoms | a button, a heading, one card — 300 "sections" on one site |
| counting pages | "the about page" is a stack of 5–12 sections, not one |

Wrong altitude, wrong estimate — everything downstream inherits the error.

## Type vs instance

> **Section instance** — one occurrence on one unique layout page.
> **Section type** — one distinct design, after folding every instance site-wide into one.

The same testimonials design on three pages is **3 instances of 1 type**. Build once,
place three times.

**Types are what you build. Instances are what the editor assembles.**

## Globals are not section types

> **Global** — shared site-wide rather than placed per page: header, footer, cookie
> banner, announcement bar, floating button.

In the new CMS a global is usually a singleton document, not an item in the builder's
library. So it is counted separately and never added in:

```
section types  ·  globals  ·  two disjoint counts
```

The header is never one of the section types. Adding the two gives a number that
describes nothing.

**The test** is not "appears on many pages" — a CTA panel can appear on many pages and
still be placed deliberately on each. The test is whether an editor positions it per
page at all. If they cannot, it is a global.

### Coverage denominator is unique layout pages

A global's reach is a fraction, and the denominator is **unique layout pages** — never
the number of published URLs. Measure a header against every URL and you measure the
size of the blog, not the reach of the header. Where that denominator comes from:
[Assess a migration without CMS access](assess-a-migration-without-cms-access.md).

The page that drops the header is always worth a look. Usually a landing page built to
remove exits — and it needs an opt-out in the new CMS.

## One type, two homes

A type can appear both on a hand-composed page and inside a collection template page —
a "related work" panel on the services page and under every case study.

Still **one type**. But its component takes content from two sources: fields an editor
filled in, and fields resolved from a collection document. A handful of types on a
typical site are in this position.

Decide the input shape at the start. Retrofitting a hand-authored component to also
accept collection data rewrites its props, schema and queries — the most common
avoidable rework in these migrations.

## What the count becomes

| source | target CMS |
| --- | --- |
| section type | one schema + one component + editor fields + a QA pass |
| global | a singleton document |
| collection | a document type with its own template |

The section-type count *is* the estimate — and nothing in the source site hands it to
you, because the source site never had it.
