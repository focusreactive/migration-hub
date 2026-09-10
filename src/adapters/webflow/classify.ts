import { loadHtml } from "#lib/html.ts";

export interface WebflowPageClass {
  isWebflow: boolean;
  kind: "static" | "item";
  collectionKey?: string;
  pageId?: string;
}

export function classifyWebflowPage(html: string): WebflowPageClass {
  const $ = loadHtml(html);
  const htmlEl = $("html");

  const pageId = htmlEl.attr("data-wf-page");
  const siteId = htmlEl.attr("data-wf-site");
  const collectionKey = htmlEl.attr("data-wf-collection");

  return {
    isWebflow: pageId !== undefined && siteId !== undefined,
    kind: collectionKey !== undefined ? "item" : "static",
    ...(collectionKey !== undefined && { collectionKey }),
    ...(pageId !== undefined && { pageId }),
  };
}
