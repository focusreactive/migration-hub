function titleCase(segment: string): string {
  return segment
    .split("-")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export function collectionNameFromRoutePattern(pattern: string): string {
  const staticSegments = pattern.split("/").filter((segment) => segment !== "" && !segment.startsWith(":"));
  const last = staticSegments.at(-1);
  return last === undefined ? pattern : titleCase(last);
}

// The one label three independent HTML-report call sites (section-index.ts's
// pageTitle, section-library.ts's collectionMemberLabel, and render-html-report.ts's
// templateLinks) must agree on: the modal's "Appears on" links only resolve because
// the label built where a collection-template page is named matches the key
// registered where its template link is built.
export function collectionTemplateLabel(collectionName: string): string {
  return `${collectionName} template page`;
}
