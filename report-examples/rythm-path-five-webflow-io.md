# Migration assessment — rythm-path-five.webflow.io

**Source platform:** Webflow · **Pages analysed:** 28 · **Unique layout pages:** 9 · **Overall complexity: Medium**

Rythm is the marketing site of a creative branding studio that packages design, strategy, writing and marketing into brand experiences, and it speaks to founders and marketing leads shopping for an agency partner by walking them through the team, the case studies, the journal and a contact path that ends in a scheduled call. The published site runs on Webflow, with its projects, journal posts and team profiles driven by CMS collections behind a single shared page shell.

The palette is close to monochrome: warm off-white and pale grey grounds, near-black ink for type and buttons, occasional deep charcoal bands for contrast, and no accent hue beyond that restraint. Typography pairs a large, tightly-set sans headline voice in sentence case with small uppercase eyebrows and meta labels carrying wide letter-spacing, over quiet grey body copy at a modest size. Composition works in full-width horizontal bands stacked down a long scroll, several of them white cards that overlap the band above, with generous whitespace, two-column splits that pin an intro beside a scrolling list, and even three-up card grids. Element shapes stay simple and geometric: square-cornered cards and tiles, hairline rules and thin bordered boxes, fully rounded pill buttons and outline links with underline rules, plus small circular avatars and icon wells.

## Scope at a glance

| What | Count | Reading |
| --- | --- | --- |
| Pages | 28 | 6 page-builder pages and 22 collection documents |
| Unique layout pages | 9 | 6 page-builder pages plus one document per collection template page — every distinct layout, once |
| Collections | 3 | Projects (10), Journal (9), Team (3) |
| Section types | 28 | 60 instances; 19 used only once |
| Shared globals | 2 | Site Header and Site Footer, on every page |
| Images | 84 | plus 6 duplicates already de-duplicated |
| Videos | 0 | — |
| Font families | 1 | Montserrat (Google Fonts), 9 weights |
| Forms | 1 | it is submitted to Webflow's endpoint |

## Complexity assessment

| Area | Rating |
| --- | --- |
| Content model | **Low** |
| Page composition | **Medium** |
| Design system & assets | **Low** |
| Forms & integrations | **Low** |
| Content volume | **Low** |

**Content model.** 3 collections, each with a single dynamic segment in its route. Collections like these map almost one-to-one onto document types in Sanity or collections in Payload, and the route patterns themselves tell us what the slug fields and templates need to be.

**Page composition.** 28 distinct section types across 60 instances is a wide surface, and it is wide rather than deep — 19 of those types appear exactly once. A section used once still needs a schema, a component and a round of visual QA, so a long tail costs nearly as much as a reused set of the same size while giving back none of the leverage. 8 types appear both as free-standing page-builder blocks and inside collection template pages, so those components have to accept content from two different sources — worth deciding deliberately at the start rather than retrofitting later.

**Design system & assets.** One typeface, Montserrat, pulled from Google Fonts in 9 weights and 2 styles — nothing licensed, nothing self-hosted, nothing to re-purchase, and `next/font` handles it with no layout shift. The media library is 84 unique images, with no video anywhere on the site. The only real task here is re-hosting: the assets are served from cdn.prod.website-files.com and d3e54v103j8qbb.cloudfront.net, and those URLs stop working when the site is unpublished.

**Forms & integrations.** One form collects input, and it does not post to an endpoint of its own — Webflow's built-in submission handler takes it. That means there is nothing to point the new site at, and the new site has to bring its own handler, spam protection and notification routing, plus an export of the submissions already collected.

**Content volume.** 22 published documents across 3 collections. That fits into a single automated migration pass with room to review every record by hand afterwards, and it keeps the content freeze short.

## Content model

3 collections make up the CMS side of this site. Each is rendered through a single collection template page that every document in it reuses, so the documents below differ in content, not in layout.

| Collection | Route pattern | Documents |
| --- | --- | --- |
| Projects | `/projects/:slug` | 10 |
| Journal | `/journal/:slug` | 9 |
| Team | `/team/:slug` | 3 |

## Page-builder pages

6 page-builder pages stand on their own rather than being generated from a collection. Each is assembled section by section, so its sections are configured by hand as page-builder blocks — added, reordered and edited per page rather than driven by a template.

| Page | Route |
| --- | --- |
| Home | `/home` |
| About | `/about` |
| Contact | `/contact` |
| Journal | `/journal` |
| Projects | `/projects` |
| Services | `/services` |

## Section library

The 9 unique layout pages are built from 28 distinct section types used 60 times in total: 9 types appear more than once, 19 appear exactly once, 8 are used both as page-builder blocks and inside collection template pages, and 10 exist only inside a collection template page.

| Section | Instances | Where it appears | Used as |
| --- | --- | --- | --- |
| Full-Bleed Photo Hero | 6 | `/home`, `/about`, `/contact`, `/journal`, `/services`, Team template page | Block, Collection section |
| Featured Project Hero Slider | 1 | `/projects` | Block |
| Dark Photo Testimonial Slider | 4 | `/home`, `/about`, `/services`, Team template page | Block, Collection section |
| Project Card Grid | 6 | `/home`, `/about`, `/projects`, `/services`, Team template page, Projects template page | Block, Collection section |
| Photo CTA Banner | 8 | `/home`, `/about`, `/journal`, `/projects`, `/services`, Journal template page, Projects template page, Team template page | Block, Collection section |
| Instagram Feed Strip | 9 | `/home`, `/about`, `/contact`, `/journal`, `/projects`, `/services`, Journal template page, Projects template page, Team template page | Block, Collection section |
| Journal Highlight List | 2 | `/home`, Team template page | Block, Collection section |
| Journal Index With Sidebar | 1 | `/journal` | Block |
| Continue Reading Posts | 1 | Journal template page | Collection section |
| Service Columns Card | 1 | `/home` | Block |
| About With Team Photo | 1 | `/home` | Block |
| Stats Row | 1 | `/home` | Block |
| Statement Intro Band | 2 | `/about`, Projects template page | Block, Collection section |
| Lightbox Photo Gallery | 2 | `/about`, Projects template page | Block, Collection section |
| Team Member Cards | 1 | `/about` | Block |
| Contact Quick Links | 1 | `/contact` | Block |
| Contact Form Band | 1 | `/contact` | Block |
| Numbered Process Steps | 1 | `/services` | Block |
| Expandable Services List | 1 | `/services` | Block |
| Centered Page Title | 2 | Journal template page, Projects template page | Collection section |
| Post Cover Image | 1 | Journal template page | Collection section |
| Article Body With Author Card | 1 | Journal template page | Collection section |
| Project Cover With Meta Strip | 1 | Projects template page | Collection section |
| Full-Width Image Break | 1 | Projects template page | Collection section |
| Centered Quote | 1 | Projects template page | Collection section |
| Our Approach Deliverables | 1 | Projects template page | Collection section |
| Member Bio | 1 | Team template page | Collection section |
| Contact And Follow | 1 | Team template page | Collection section |

## Global sections

2 sections are shared rather than placed per page. They wrap every page-builder page and all three collection template pages, so each is authored once and reused everywhere.

| Global | Instances | Appears on |
| --- | --- | --- |
| Site Header | 9 | 6 page-builder pages · 3 collection template pages |
| Site Footer | 9 | 6 page-builder pages · 3 collection template pages |

## Forms

One distinct form collects input on this site, listed below with the fields it submits.

| Form | Fields |
| --- | --- |
| Contact enquiry | 5 (First name, Last name, Email address, Phone number, Message) |

## Media & typography

Everything the pages load: the images and video behind the layouts, and the font families the type is set in.

| Media | Count |
| --- | --- |
| Unique images | 84 |
| Duplicates collapsed | 6 |
| Videos | 0 |
| Images without alt text | 84 |

| Font family | Weights | Styles | Source |
| --- | --- | --- | --- |
| Montserrat | 100, 200, 300, 400, 500, 600, 700, 800, 900 | normal, italic | Google Fonts |

## Risks & watch-outs

1. **Form submissions have nowhere to go after cutover.**
   The one form on this site posts to Webflow's built-in handler — there is no external endpoint to point the new site at. *Plan for:* a form handler, spam protection, notification routing, and an export of existing submissions before the Webflow subscription lapses.

2. **Every image lives on the platform's CDN.**
   All 84 images are served from cdn.prod.website-files.com, d3e54v103j8qbb.cloudfront.net. Those URLs stop working when the site is unpublished. *Plan for:* re-hosting assets into the new CMS as part of the content migration, not after it — this is automated by our migration tooling, but it has to happen before the old site is switched off.

3. **84 of 84 images have no alt text.**
   That accessibility and SEO debt will be copied into the new site verbatim unless it is addressed. *Plan for:* the migration is the cheapest moment to fix it, but writing alt text is manual content work and should be scheduled as such.

4. **8 sections are used in two different ways.**
   They appear both as page-builder blocks and inside collection template pages. *Plan for:* components designed to take either author-picked content or CMS-referenced content, decided before they are built rather than retrofitted.

5. **Interactive behaviour is not visible to static analysis.**
   Accordions, marquees and carousels are Webflow interactions; this report sees their markup, not their motion. *Plan for:* a short pass to spec and rebuild animations, sized after a walkthrough of the live site.

6. **The CMS field model is inferred from rendered pages.**
   With 22 published documents, fields that exist in Webflow but are not rendered by any template are invisible to this analysis. *Plan for:* a short review of the source field list against the proposed schema before content migration starts.

7. **28 URLs need a redirect map.**
   Route patterns are stable and map one-to-one, so this is bookkeeping rather than a problem — but it is a launch blocker if it is skipped.

## How the migration runs

1. **Page discovery.** All 28 published pages are split into 6 page-builder pages and 3 collection template pages — 9 unique layout pages in all.
2. **Asset extraction.** The 84 unique images are pulled off the source CDN with their metadata, along with the one font family the site is set in.
3. **Schema and content extraction.** The content model is derived from the 3 collection template pages and the page structures first, then the 22 collection documents and the content of all 28 pages are extracted against it.
4. **Section generation.** A component is generated for each of the 28 section types, the 2 shared globals and the one form.
5. **Project generation and seeding.** The target project is generated from those schemas and components, and seeded with the extracted content and assets.

## Migrate this site yourself

The analysis above was produced by our open pipeline, and the migration itself has open tooling too. If you want to see the shape of the output before talking to anyone:

| Target | Tool |
| --- | --- |
| Sanity | [webflow-to-sanity-migration](https://github.com/focusreactive/webflow-to-sanity-migration) |
| Payload | [webflow-to-payload-migration](https://github.com/focusreactive/webflow-to-payload-migration) |

## About FocusReactive

[FocusReactive](https://focusreactive.com) is a Next.js and headless-CMS migration agency. We move enterprise sites off legacy monoliths and visual builders — Webflow, Framer, WordPress, AEM — onto Sanity, Payload CMS, Storyblok and MedusaJS, and we do it without losing traffic, rankings or a publishing day.

- **Verified partners** of Sanity, Payload and Storyblok — we build on the platforms' own recommended patterns, not around them.
- **Our own [CMS Kit](https://github.com/focusreactive/cms-kit)** — the block and schema toolkit behind roughly 40% faster delivery on projects shaped like this one.
- **SEO and performance held as a requirement,** not a phase: redirect parity, metadata parity, 100/100 Lighthouse, zero-downtime cutover.
- **Open tooling.** The assessment you are reading was generated by a pipeline we publish, from the public version of your site alone.

👉 **[Get a free migration consultation](https://focusreactive.com/services/headless-cms-expert-agency/)** or write to contact@focusreactive.com — send this report along and we can go through the risks above line by line.
