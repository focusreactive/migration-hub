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
