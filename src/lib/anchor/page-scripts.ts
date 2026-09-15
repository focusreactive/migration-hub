interface AnchorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface AnchorStyle {
  display: string;
  visibility: string;
  position: string;
}

interface AnchorElement {
  tagName: string;
  className: unknown;
  textContent: string | null;
  children: ArrayLike<AnchorElement>;
  parentElement: AnchorElement | null;
  getBoundingClientRect(): AnchorRect;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
}

declare const document: {
  body: AnchorElement;
  documentElement: { scrollHeight: number };
  querySelectorAll(selector: string): ArrayLike<AnchorElement>;
};

declare const window: {
  scrollY: number;
  getComputedStyle(element: AnchorElement): AnchorStyle;
};

export interface ResolveArgs {
  selector: string;
  snippetLength: number;
  signatureTextLength: number;
  maxSignatureClasses: number;

  markAttribute?: string;
}

export interface ResolvedNode {
  y: number;
  height: number;
  tag: string;
  classes: string[];
  textSnippet: string;
  isFixed: boolean;
  signature: string;
}

export interface ResolvedBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ResolveStatus = "ok" | "INVALID" | "NO_MATCH" | "NOT_CONTIGUOUS";

export interface ResolveResult {
  status: ResolveStatus;
  nodes: ResolvedNode[];
  union: ResolvedBox | null;
  pageHeight: number;
}

export function resolveAnchor(args: ResolveArgs): ResolveResult {
  const toArray = (list: ArrayLike<AnchorElement>): AnchorElement[] =>
    Array.prototype.slice.call(list) as AnchorElement[];

  const isPinned = (element: AnchorElement): boolean => {
    const position = window.getComputedStyle(element).position;
    return position === "fixed" || position === "sticky";
  };

  const isVisible = (element: AnchorElement): boolean => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.height > 0 && rect.width > 0 && style.display !== "none" && style.visibility !== "hidden";
  };

  const pageHeight = document.documentElement.scrollHeight;
  const empty = (status: ResolveStatus): ResolveResult => ({ status, nodes: [], union: null, pageHeight });

  let found: AnchorElement[];
  try {
    found = toArray(document.querySelectorAll(args.selector));
  } catch {
    return empty("INVALID");
  }

  const matched = found.filter(isVisible);
  if (matched.length === 0) return empty("NO_MATCH");

  if (matched.length > 1) {
    const parent = matched[0]?.parentElement ?? null;
    if (parent === null || matched.some((node) => node.parentElement !== parent)) {
      return empty("NOT_CONTIGUOUS");
    }

    const siblings = toArray(parent.children).filter(isVisible);
    const positions = matched.map((node) => siblings.indexOf(node)).sort((a, b) => a - b);
    const consecutive = positions.every((position, index) => index === 0 || position === (positions[index - 1] ?? -1) + 1);
    if (!consecutive) return empty("NOT_CONTIGUOUS");
  }

  const pinned = matched.some(isPinned);

  const nodes: ResolvedNode[] = matched.map((element) => {
    const rect = element.getBoundingClientRect();
    const raw = typeof element.className === "string" ? element.className : "";
    const classes = raw.split(/\s+/).filter((token) => token.length > 0);
    const textSnippet = (element.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, args.snippetLength);
    const tag = element.tagName.toLowerCase();
    const signatureClasses = classes.slice(0, args.maxSignatureClasses);
    const head = signatureClasses.length === 0 ? tag : `${tag}.${signatureClasses.join(".")}`;

    if (args.markAttribute !== undefined) element.setAttribute(args.markAttribute, "1");

    return {
      y: Math.round(pinned ? rect.top : rect.top + window.scrollY),
      height: Math.round(rect.height),
      tag,
      classes,
      textSnippet,
      isFixed: isPinned(element),
      signature: `${head}|${Math.round(rect.height)}|${textSnippet.slice(0, args.signatureTextLength)}`,
    };
  });

  const rects = matched.map((element) => element.getBoundingClientRect());
  const offset = pinned ? 0 : window.scrollY;
  const top = Math.min(...rects.map((rect) => rect.top)) + offset;
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height)) + offset;
  const left = Math.min(...rects.map((rect) => rect.left));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));

  return {
    status: "ok",
    nodes,
    union: {
      x: Math.round(left),
      y: Math.round(top),
      width: Math.round(right - left),
      height: Math.round(bottom - top),
    },
    pageHeight,
  };
}

export function clearMarks(attribute: string): void {
  const nodes = Array.prototype.slice.call(
    document.querySelectorAll(`[${attribute}]`),
  ) as AnchorElement[];
  for (const node of nodes) node.removeAttribute(attribute);
}
