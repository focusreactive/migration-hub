# Migration assessment — pixwave.framer.website

**Source platform:** Framer · **Pages analysed:** 18 · **Unique layout pages:** 7 · **Overall complexity: Medium**

Pixwave is the marketing site of a social-media agency that plans, produces and manages branded content for the feeds of consumer brands and creators, and it is aimed squarely at prospective clients sizing that agency up against its rivals. Around the core service pitch sit an about page, case-study write-ups, an editorial blog and a contact route, all published from Framer.

The palette stays close to monochrome: a warm off-white ground, charcoal and black for type and buttons, pale grey card fills, and only small accents of colour held back for metric figures and status marks. Typography rests on one geometric sans throughout, with tightly set large display headings, mid-grey body copy at a comfortable reading size, and a recurring slashed eyebrow label introducing each band. Composition is a single centred column of stacked full-width bands that alternate among centred headings, split two-column strips and bento-style grids, each separated by generous vertical space. Element shapes are uniformly soft: pill-shaped buttons, deeply rounded cards and panels that float clear of the page background, with hairline dividers rather than hard frames.

## Scope at a glance

| What | Count | Reading |
| --- | --- | --- |
| Pages | 18 | 5 page-builder pages and 13 collection documents |
| Unique layout pages | 7 | 5 page-builder pages plus one document per collection template page — every distinct layout, once |
| Collections | 2 | Blogs (7), Case Studies (6) |
| Section types | 25 | 37 instances; 20 used only once |
| Shared globals | 2 | Site header and Site footer, on every page |
| Images | 57 | no duplicates found |
| Videos | 7 | — |
| Font families | 3 | Inter (Self-hosted), 2 weights; Inter Display (Self-hosted), 4 weights; Satoshi (Self-hosted), 2 weights |
| Forms | 2 | both submitted to Framer's endpoint |

## Complexity assessment

| Area | Rating |
| --- | --- |
| Content model | **Low** |
| Page composition | **Medium** |
| Design system & assets | **Medium** |
| Forms & integrations | **Medium** |
| Content volume | **Low** |

**Content model.** 2 collections, each with a single dynamic segment in its route. Collections like these map almost one-to-one onto document types in Sanity or collections in Payload, and the route patterns themselves tell us what the slug fields and templates need to be.

**Page composition.** 25 distinct section types across 37 instances is a wide surface, and it is wide rather than deep — 20 of those types appear exactly once. A section used once still needs a schema, a component and a round of visual QA, so a long tail costs nearly as much as a reused set of the same size while giving back none of the leverage. 2 types appear both as free-standing page-builder blocks and inside collection template pages, so those components have to accept content from two different sources — worth deciding deliberately at the start rather than retrofitting later.

**Design system & assets.** 3 typefaces across the type system — 3 families licensed or self-hosted and in need of a licence check before they move, and `next/font` handles it with no layout shift. The media library is 57 unique images, with 7 videos alongside them. The only real task here is re-hosting: the assets are served from framerusercontent.com, and those URLs stop working when the site is unpublished.

**Forms & integrations.** 2 forms collect input, and none of them post to an endpoint of their own — Framer's built-in submission handler takes them. That means there is nothing to point the new site at, and the new site has to bring its own handler, spam protection and notification routing, plus an export of the submissions already collected.

**Content volume.** 13 published documents across 2 collections. That fits into a single automated migration pass with room to review every record by hand afterwards, and it keeps the content freeze short.

## Content model

2 collections make up the CMS side of this site. Each is rendered through a single collection template page that every document in it reuses, so the documents below differ in content, not in layout.

| Collection | Route pattern | Documents |
| --- | --- | --- |
| Blogs | `/blogs/:slug` | 7 |
| Case Studies | `/case-studies/:slug` | 6 |

## Page-builder pages

5 page-builder pages stand on their own rather than being generated from a collection. Each is assembled section by section, so its sections are configured by hand as page-builder blocks — added, reordered and edited per page rather than driven by a template.

| Page | Route |
| --- | --- |
| Home | `/home` |
| About Us | `/about-us` |
| Blogs | `/blogs` |
| Case Studies | `/case-studies` |
| Contact | `/contact` |

## Section library

The 7 unique layout pages are built from 25 distinct section types used 37 times in total: 5 types appear more than once, 20 appear exactly once, 2 are used both as page-builder blocks and inside collection template pages, and 5 exist only inside a collection template page.

| Section | Instances | Where it appears | Used as |
| --- | --- | --- | --- |
| Closing CTA card | 7 | `/home`, `/about-us`, `/blogs`, `/case-studies`, `/contact`, Blogs template page, Case Studies template page | Block, Collection section |
| Centred page hero | 4 | `/about-us`, `/blogs`, `/case-studies`, Case Studies template page | Block, Collection section |
| Full-width cover image | 2 | Blogs template page, Case Studies template page | Collection section |
| Previous / next pager | 2 | Blogs template page, Case Studies template page | Collection section |
| Mission statement band | 2 | `/home`, `/about-us` | Block |
| Home photo hero | 1 | `/home` | Block |
| Introduction band | 1 | `/home` | Block |
| Results metrics band | 1 | `/home` | Block |
| Capability bento grid | 1 | `/home` | Block |
| Case study carousel | 1 | `/home` | Block |
| Client logo strip | 1 | `/home` | Block |
| Numbered service cards | 1 | `/home` | Block |
| Process steps band | 1 | `/home` | Block |
| Us vs them comparison | 1 | `/home` | Block |
| Testimonial grid | 1 | `/home` | Block |
| FAQ accordion band | 1 | `/home` | Block |
| Awards and recognition | 1 | `/about-us` | Block |
| Team portrait grid | 1 | `/about-us` | Block |
| Featured post banner | 1 | `/blogs` | Block |
| Blog post grid | 1 | `/blogs` | Block |
| Case study grid | 1 | `/case-studies` | Block |
| Contact form band | 1 | `/contact` | Block |
| Article title band | 1 | Blogs template page | Collection section |
| Article rich text body | 1 | Blogs template page | Collection section |
| Case study write-up | 1 | Case Studies template page | Collection section |

## Global sections

2 sections are shared rather than placed per page. They wrap every page-builder page and both collection template pages, so each is authored once and reused everywhere.

| Global | Instances | Appears on |
| --- | --- | --- |
| Site header | 7 | 5 page-builder pages · 2 collection template pages |
| Site footer | 7 | 5 page-builder pages · 2 collection template pages |

## Forms

2 distinct forms collect input on this site, listed below with the fields each one submits.

| Form | Fields |
| --- | --- |
| Contact enquiry | 8 (Full name, Email address, Current monthly social media budget, Service interest (first choice), Service interest (second choice), Service interest (third choice), Service interest (fourth choice), Message) |
| Newsletter signup | 1 (Email address) |

## Media & typography

Everything the pages load: the images and video behind the layouts, and the font families the type is set in.

| Media | Count |
| --- | --- |
| Unique images | 57 |
| Duplicates collapsed | 0 |
| Videos | 7 |
| Images without alt text | 32 |

| Font family | Weights | Styles | Source |
| --- | --- | --- | --- |
| Inter | 400, 600 | normal | Self-hosted |
| Inter Display | 400, 500, 600, 700 | normal, italic | Self-hosted |
| Satoshi | 500, 700 | normal, italic | Self-hosted |

## Risks & watch-outs

1. **Form submissions have nowhere to go after cutover.**
   2 of the 2 forms on this site post to Framer's built-in handler — there is no external endpoint to point the new site at. *Plan for:* a form handler, spam protection, notification routing, and an export of existing submissions before the Framer subscription lapses.

2. **Every image lives on the platform's CDN.**
   All 57 images are served from framerusercontent.com. Those URLs stop working when the site is unpublished. *Plan for:* re-hosting assets into the new CMS as part of the content migration, not after it — this is automated by our migration tooling, but it has to happen before the old site is switched off.

3. **32 of 57 images have no alt text.**
   That accessibility and SEO debt will be copied into the new site verbatim unless it is addressed. *Plan for:* the migration is the cheapest moment to fix it, but writing alt text is manual content work and should be scheduled as such.

4. **2 sections are used in two different ways.**
   They appear both as page-builder blocks and inside collection template pages. *Plan for:* components designed to take either author-picked content or CMS-referenced content, decided before they are built rather than retrofitted.

5. **The CMS field model is inferred from rendered pages.**
   With 13 published documents, fields that exist in Framer but are not rendered by any template are invisible to this analysis. *Plan for:* a short review of the source field list against the proposed schema before content migration starts.

6. **18 URLs need a redirect map.**
   Route patterns are stable and map one-to-one, so this is bookkeeping rather than a problem — but it is a launch blocker if it is skipped.

## How the migration runs

1. **Page discovery.** All 18 published pages are split into 5 page-builder pages and 2 collection template pages — 7 unique layout pages in all.
2. **Asset extraction.** The 57 unique images and 7 videos are pulled off the source CDN with their metadata, along with the 3 font families the site is set in.
3. **Schema and content extraction.** The content model is derived from the 2 collection template pages and the page structures first, then the 13 collection documents and the content of all 18 pages are extracted against it.
4. **Section generation.** A component is generated for each of the 25 section types, the 2 shared globals and the 2 forms.
5. **Project generation and seeding.** The target project is generated from those schemas and components, and seeded with the extracted content and assets.

## Migrate this site yourself

The analysis above was produced by our open pipeline, and the migration itself has open tooling too. If you want to see the shape of the output before talking to anyone:

| Target | Tool |
| --- | --- |
| Sanity | [framer-to-sanity-migration](https://github.com/focusreactive/framer-to-sanity-migration) |
| Payload | [framer-to-payload-migration](https://github.com/focusreactive/framer-to-payload-migration) |

## About FocusReactive

[FocusReactive](https://focusreactive.com) is a Next.js and headless-CMS migration agency. We move enterprise sites off legacy monoliths and visual builders — Webflow, Framer, WordPress, AEM — onto Sanity, Payload CMS, Storyblok and MedusaJS, and we do it without losing traffic, rankings or a publishing day.

- **Verified partners** of Sanity, Payload and Storyblok — we build on the platforms' own recommended patterns, not around them.
- **Our own [CMS Kit](https://github.com/focusreactive/cms-kit)** — the block and schema toolkit behind roughly 40% faster delivery on projects shaped like this one.
- **SEO and performance held as a requirement,** not a phase: redirect parity, metadata parity, 100/100 Lighthouse, zero-downtime cutover.
- **Open tooling.** The assessment you are reading was generated by a pipeline we publish, from the public version of your site alone.

👉 **[Get a free migration consultation](https://focusreactive.com/services/headless-cms-expert-agency/)** or write to contact@focusreactive.com — send this report along and we can go through the risks above line by line.
