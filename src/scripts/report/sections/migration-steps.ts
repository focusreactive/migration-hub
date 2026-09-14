import type { ReportMetrics } from "../analysis/metrics.ts";
import { countLabel } from "../utils/count.ts";

function routesSubject(routes: number): string {
  return routes === 1 ? "The one published route is" : `All ${routes} published routes are`;
}

function routesPhrase(routes: number): string {
  return routes === 1 ? "the one route" : `all ${routes} routes`;
}

function discovery(metrics: ReportMetrics): string {
  const subject = routesSubject(metrics.routes);

  if (metrics.collections === 0) {
    return `${subject} ${metrics.routes === 1 ? "a page-builder page" : "page-builder pages"}.`;
  }

  const collectionsClause = countLabel(metrics.collections, "collection template", "collection templates");

  if (metrics.staticPages === 0) {
    return `${subject} split into ${collectionsClause}.`;
  }

  return (
    `${subject} split into `
    + `${countLabel(metrics.staticPages, "page-builder page", "page-builder pages")} and `
    + `${collectionsClause}.`
  );
}

function assets(metrics: ReportMetrics): string {
  const fonts = metrics.fonts === 0
    ? ""
    : `, along with the ${countLabel(metrics.fonts, "font family", "font families")} the site is set in`;

  if (metrics.images === 0 && metrics.videos === 0) {
    if (metrics.fonts === 0) return "No images or videos are hosted on the source CDN.";

    const pronoun = metrics.fonts === 1 ? "its" : "their";
    return (
      `No images or videos are hosted on the source CDN. The ${countLabel(metrics.fonts, "font family", "font families")} `
      + `the site is set in ${metrics.fonts === 1 ? "is" : "are"} pulled off it with ${pronoun} metadata.`
    );
  }

  if (metrics.images === 0) {
    const pronoun = metrics.videos === 1 ? "its" : "their";
    return (
      `The ${countLabel(metrics.videos, "video is", "videos are")} pulled off the source CDN `
      + `with ${pronoun} metadata${fonts}.`
    );
  }

  if (metrics.videos === 0) {
    const pronoun = metrics.images === 1 ? "its" : "their";
    return (
      `The ${countLabel(metrics.images, "unique image is", "unique images are")} pulled off the source CDN `
      + `with ${pronoun} metadata${fonts}.`
    );
  }

  const media = `The ${countLabel(metrics.images, "unique image", "unique images")} and `
    + `${countLabel(metrics.videos, "video", "videos")} are`;

  return `${media} pulled off the source CDN with their metadata${fonts}.`;
}

function extraction(metrics: ReportMetrics): string {
  if (metrics.collections === 0) {
    return (
      "The content model is derived from the page structures first, then the content of "
      + `${routesPhrase(metrics.routes)} is extracted against it.`
    );
  }

  const collectionsClause =
    `the ${countLabel(metrics.collections, "collection template", "collection templates")} and the page `
    + "structures first";

  if (metrics.entries === 0) {
    return (
      `The content model is derived from ${collectionsClause}, then the content of `
      + `${routesPhrase(metrics.routes)} is extracted against it.`
    );
  }

  return (
    `The content model is derived from ${collectionsClause}, then the `
    + `${countLabel(metrics.entries, "collection entry", "collection entries")} `
    + `and the content of ${routesPhrase(metrics.routes)} are extracted against it.`
  );
}

function generation(metrics: ReportMetrics): string {
  const parts: string[] = [];
  if (metrics.sectionTypes > 0) {
    parts.push(`the ${countLabel(metrics.sectionTypes, "section type", "section types")}`);
  }
  if (metrics.globals > 0) parts.push(`the ${countLabel(metrics.globals, "shared global", "shared globals")}`);
  if (metrics.forms > 0) parts.push(`the ${countLabel(metrics.forms, "form", "forms")}`);

  if (parts.length === 0) return "There are no sections, globals or forms to generate components for.";

  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} and ${parts.at(-1) ?? ""}`;
  return `A component is generated for each of ${list}.`;
}

export function migrationStepsSection(metrics: ReportMetrics): string {
  const steps = [
    ["Page discovery", discovery(metrics)],
    ["Asset extraction", assets(metrics)],
    ["Schema and content extraction", extraction(metrics)],
    ["Section generation", generation(metrics)],
    [
      "Project generation and seeding",
      "The target project is generated from those schemas and components, and seeded with the extracted content and assets.",
    ],
  ];

  return [
    "## How the migration runs",
    "",
    steps.map(([name, sentence], index) => `${index + 1}. **${name}.** ${sentence}`).join("\n"),
  ].join("\n");
}
