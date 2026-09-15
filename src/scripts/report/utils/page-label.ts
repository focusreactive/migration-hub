function titleCase(segment: string): string {
  return segment
    .split("-")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export function pageLabel(route: string): { name: string; slug: string } {
  if (route === "/") return { name: "Home", slug: "/" };

  const segments = route.split("/").filter(Boolean);
  const slug = segments.at(-1) ?? "";
  return { name: titleCase(slug), slug };
}

export function displayRoute(route: string): string {
  return route === "/" ? "/home" : route;
}
