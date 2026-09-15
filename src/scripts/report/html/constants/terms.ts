export type GlossaryTerm =
  | "page"
  | "pageBuilderPage"
  | "collection"
  | "collectionDocument"
  | "collectionTemplatePage"
  | "uniqueLayoutPage"
  | "section"
  | "sectionType"
  | "sectionInstance"
  | "global";

export const GLOSSARY_TERMS: Record<GlossaryTerm, string> = {
  page: "One published URL on the source site.",
  pageBuilderPage:
    "A page composed by hand, section by section, rather than generated from a collection. "
    + "Its sections are added, reordered and edited per page.",
  collection: "One CMS content type. Its documents share a route pattern and a single collection template page.",
  collectionDocument: "One record in a collection. Each one is a page.",
  collectionTemplatePage: "The single layout every document of a collection is rendered through. One per collection.",
  uniqueLayoutPage:
    "Every page-builder page, plus one document per collection template page. Each distinct layout on the "
    + "site, exactly once — and the honest measure of how much there is to build.",
  section: "One horizontal band of a page, as a reader perceives it.",
  sectionType:
    "One distinct section design, after folding every instance of it across the site into one. "
    + "Never includes globals.",
  sectionInstance: "One occurrence of a section type on one unique layout page.",
  global:
    "A section shared site-wide rather than placed per page — header, footer, cookie banner, "
    + "announcement bar, floating button. Never counted among section types.",
};

// Default labels, each spelled as the design uses that term. Capitalized entries
// ("Pages", "Collections", "Section types", "Globals") appear only as scope-card
// labels within text-transform: uppercase CSS, so their casing is invisible.
// Lowercase entries appear mid-sentence in prose. Call sites using a term in a
// different position must pass an explicit label to term() rather than using the
// default — these defaults are not sentence-cased on demand.
export const TERM_LABELS: Record<GlossaryTerm, string> = {
  page: "Pages",
  pageBuilderPage: "page-builder pages",
  collection: "Collections",
  collectionDocument: "collection documents",
  collectionTemplatePage: "collection template page",
  uniqueLayoutPage: "unique layout pages",
  section: "sections",
  sectionType: "Section types",
  sectionInstance: "instances",
  global: "Globals",
};
