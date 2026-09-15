# Migration assessment — nova-x.webflow.io

**Source platform:** Webflow · **Pages analysed:** 22 · **Unique layout pages:** 12 · **Overall complexity: Medium**

Nova is the marketing site of a social media marketing agency, presenting its services, team, client work and editorial content to brand owners and marketing leads who are shopping for help with social channels, paid advertising and audience growth. Built on Webflow, it pairs static marketing pages with collection-driven case studies, blog posts and service detail pages.

The palette is deliberately narrow: near-white and light grey grounds, near-black type and buttons, and a single high-voltage lime accent reserved for eyebrow pills, newsletter and call-to-action panels, form cards and rating stars. Typography is a single Inter family throughout, with large tightly-tracked headlines, comfortable grey body copy and small uppercase-feeling labels inside the pills, so hierarchy comes from size and weight rather than contrasting faces. Composition works in generously spaced bands stacked down a centred container, alternating centred eyebrow-heading-subline introductions with two-column splits and three- or four-column card grids, several of them nested inside a wide grey panel that sets the band apart from the white page. Element shapes are consistently soft and rounded: pill navigation, pill buttons and tags, heavily rounded cards, panels and input fields, and thin hairline borders and dividers instead of heavy rules or shadows.

## Scope at a glance

| What | Count | Reading |
| --- | --- | --- |
| Pages | 22 | 9 page-builder pages and 13 collection documents |
| Unique layout pages | 12 | 9 page-builder pages plus one document per collection template page — every distinct layout, once |
| Collections | 3 | Case Studies (4), Services (3), Blog (6) |
| Section types | 30 | 57 instances; 15 used only once |
| Shared globals | 2 | Site Header and Site Footer, on 8 of 9 page-builder pages and all 3 collection template pages |
| Images | 51 | plus 2 duplicates already de-duplicated |
| Videos | 0 | — |
| Font families | 1 | Inter (Google Fonts), 5 weights |
| Forms | 2 | both submitted to Webflow's endpoint |

## Complexity assessment

| Area | Rating |
| --- | --- |
| Content model | **Low** |
| Page composition | **Medium** |
| Design system & assets | **Low** |
| Forms & integrations | **Medium** |
| Content volume | **Low** |

**Content model.** 3 collections, each with a single dynamic segment in its route. Collections like these map almost one-to-one onto document types in Sanity or collections in Payload, and the route patterns themselves tell us what the slug fields and templates need to be.

**Page composition.** 30 distinct section types across 57 instances is a wide surface, and it is wide rather than deep — 15 of those types appear exactly once. A section used once still needs a schema, a component and a round of visual QA, so a long tail costs nearly as much as a reused set of the same size while giving back none of the leverage. 4 types appear both as free-standing page-builder blocks and inside collection template pages, so those components have to accept content from two different sources — worth deciding deliberately at the start rather than retrofitting later.

**Design system & assets.** One typeface, Inter, pulled from Google Fonts in 5 weights and one style — nothing licensed, nothing self-hosted, nothing to re-purchase, and `next/font` handles it with no layout shift. The media library is 51 unique images, with no video anywhere on the site. The only real task here is re-hosting: the assets are served from cdn.prod.website-files.com, and those URLs stop working when the site is unpublished.

**Forms & integrations.** 2 forms collect input, and none of them post to an endpoint of their own — Webflow's built-in submission handler takes them. That means there is nothing to point the new site at, and the new site has to bring its own handler, spam protection and notification routing, plus an export of the submissions already collected.

**Content volume.** 13 published documents across 3 collections. That fits into a single automated migration pass with room to review every record by hand afterwards, and it keeps the content freeze short.

## Content model

3 collections make up the CMS side of this site. Each is rendered through a single collection template page that every document in it reuses, so the documents below differ in content, not in layout.

| Collection | Route pattern | Documents |
| --- | --- | --- |
| Case Studies | `/case-studies/:slug` | 4 |
| Services | `/services/:slug` | 3 |
| Blog | `/blog/:slug` | 6 |

## Page-builder pages

9 page-builder pages stand on their own rather than being generated from a collection. Each is assembled section by section, so its sections are configured by hand as page-builder blocks — added, reordered and edited per page rather than driven by a template.

| Page | Route |
| --- | --- |
| Home | `/home` |
| About Us | `/about-us` |
| Blogs | `/blogs` |
| Case Studies | `/case-studies` |
| Contact | `/contact` |
| Services | `/services` |
| Changelog | `/utility-pages/changelog` |
| Licenses | `/utility-pages/licenses` |
| Style Guide | `/utility-pages/style-guide` |

## Section library

The 12 unique layout pages are built from 30 distinct section types used 57 times in total: 15 types appear more than once, 15 appear exactly once, 4 are used both as page-builder blocks and inside collection template pages, and 6 exist only inside a collection template page.

| Section | Instances | Where it appears | Used as |
| --- | --- | --- | --- |
| Hero With Image | 3 | `/about-us`, `/home`, `/services` | Block |
| Page Title Hero | 4 | `/case-studies`, `/blogs`, Services template page, `/utility-pages/changelog` | Block, Collection section |
| Legal Page Header | 1 | `/utility-pages/licenses` | Block |
| Client Logo Strip | 3 | `/home`, `/about-us`, `/services` | Block |
| Services Accordion | 2 | `/services`, `/home` | Block |
| Team Grid | 2 | `/about-us`, `/home` | Block |
| FAQ Accordion | 2 | `/home`, `/contact` | Block |
| Questions CTA Panel | 2 | `/home`, `/contact` | Block |
| Work Together CTA | 4 | `/about-us`, `/case-studies`, Case Studies template page, Services template page | Block, Collection section |
| Case Studies Preview | 4 | `/home`, `/services`, Services template page, Case Studies template page | Block, Collection section |
| Testimonial Cards | 2 | `/home`, Services template page | Block, Collection section |
| Company Stats Panel | 2 | `/about-us`, `/services` | Block |
| Values Card Grid | 1 | `/about-us` | Block |
| Blog Card Grid | 1 | `/blogs` | Block |
| Related Blogs | 1 | Blog template page | Collection section |
| Case Study Listing Grid | 1 | `/case-studies` | Block |
| Contact Form Band | 1 | `/contact` | Block |
| Changelog Entry | 1 | `/utility-pages/changelog` | Block |
| Asset Credits Grid | 1 | `/utility-pages/licenses` | Block |
| Credit Text Row | 2 | `/utility-pages/licenses` | Block |
| Rich Text Body Panel | 3 | Blog template page, Case Studies template page, Services template page | Collection section |
| Article Header | 1 | Blog template page | Collection section |
| Case Study Header | 1 | Case Studies template page | Collection section |
| Full Width Cover Image | 2 | Blog template page, Case Studies template page | Collection section |
| Client Quote | 1 | Case Studies template page | Collection section |
| Style Guide Title | 1 | `/utility-pages/style-guide` | Block |
| Typography Specimens | 1 | `/utility-pages/style-guide` | Block |
| Color Specimens | 1 | `/utility-pages/style-guide` | Block |
| UI Element Specimens | 1 | `/utility-pages/style-guide` | Block |
| Style Guide Class Specimens | 5 | `/utility-pages/style-guide` | Block |

## Global sections

2 sections are shared rather than placed per page, so each is authored once and reused everywhere instead of being rebuilt page by page.

| Global | Instances | Appears on |
| --- | --- | --- |
| Site Header | 11 | 8 page-builder pages · 3 collection template pages |
| Site Footer | 11 | 8 page-builder pages · 3 collection template pages |

## Forms

2 distinct forms collect input on this site, listed below with the fields each one submits.

| Form | Fields |
| --- | --- |
| Newsletter signup | 1 (Email address, required) |
| Contact enquiry | 5 (Full name, Email address, Phone number, Subject, Message — all required) |

## Media & typography

Everything the pages load: the images and video behind the layouts, and the font families the type is set in.

| Media | Count |
| --- | --- |
| Unique images | 51 |
| Duplicates collapsed | 2 |
| Videos | 0 |
| Images without alt text | 44 |

| Font family | Weights | Styles | Source |
| --- | --- | --- | --- |
| Inter | 300, 400, 500, 600, 700 | normal | Google Fonts |

## Risks & watch-outs

1. **Form submissions have nowhere to go after cutover.**
   2 of the 2 forms on this site post to Webflow's built-in handler — there is no external endpoint to point the new site at. *Plan for:* a form handler, spam protection, notification routing, and an export of existing submissions before the Webflow subscription lapses.

2. **Every image lives on the platform's CDN.**
   All 51 images are served from cdn.prod.website-files.com. Those URLs stop working when the site is unpublished. *Plan for:* re-hosting assets into the new CMS as part of the content migration, not after it — this is automated by our migration tooling, but it has to happen before the old site is switched off.

3. **44 of 51 images have no alt text.**
   That accessibility and SEO debt will be copied into the new site verbatim unless it is addressed. *Plan for:* the migration is the cheapest moment to fix it, but writing alt text is manual content work and should be scheduled as such.

4. **9 of the 30 section types exist only for the platform's own utility pages.**
   Style guides, licence pages and changelogs are scaffolding that came with the template, not product pages. *Plan for:* an early decision to drop them — it takes those section types out of scope outright.

5. **4 sections are used in two different ways.**
   They appear both as page-builder blocks and inside collection template pages. *Plan for:* components designed to take either author-picked content or CMS-referenced content, decided before they are built rather than retrofitted.

6. **Interactive behaviour is not visible to static analysis.**
   Accordions, marquees and carousels are Webflow interactions; this report sees their markup, not their motion. *Plan for:* a short pass to spec and rebuild animations, sized after a walkthrough of the live site.

7. **The CMS field model is inferred from rendered pages.**
   With 13 published documents, fields that exist in Webflow but are not rendered by any template are invisible to this analysis. *Plan for:* a short review of the source field list against the proposed schema before content migration starts.

8. **22 URLs need a redirect map.**
   Route patterns are stable and map one-to-one, so this is bookkeeping rather than a problem — but it is a launch blocker if it is skipped.

## How the migration runs

1. **Page discovery.** All 22 published pages are split into 9 page-builder pages and 3 collection template pages — 12 unique layout pages in all.
2. **Asset extraction.** The 51 unique images are pulled off the source CDN with their metadata, along with the one font family the site is set in.
3. **Schema and content extraction.** The content model is derived from the 3 collection template pages and the page structures first, then the 13 collection documents and the content of all 22 pages are extracted against it.
4. **Section generation.** A component is generated for each of the 30 section types, the 2 shared globals and the 2 forms.
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
