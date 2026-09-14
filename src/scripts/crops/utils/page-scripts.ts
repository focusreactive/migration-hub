interface MigRect {
  top: number;
  width: number;
  height: number;
}

interface MigStyle {
  display: string;
  visibility: string;
  position: string;
}

interface MigElement {
  tagName: string;
  className: unknown;
  textContent: string | null;
  children: ArrayLike<MigElement>;
  getBoundingClientRect(): MigRect;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  contains(other: MigElement): boolean;
}

declare const document: {
  body: MigElement;
  querySelectorAll(selector: string): ArrayLike<MigElement>;
};

declare const window: {
  scrollY: number;
  getComputedStyle(element: MigElement): MigStyle;
};

export interface CollectArgs {
  maxDescentDepth: number;
  soleChildHeightRatio: number;
  minCandidateHeightPx: number;
  maxCandidates: number;
  snippetLength: number;
  signatureTextLength: number;
  maxSignatureClasses: number;
}

export interface CollectedCandidate {
  index: number;
  y: number;
  height: number;
  tag: string;
  classes: string[];
  textSnippet: string;
  isFixed: boolean;
  signature: string;
}

export interface CollectAndMarkResult {
  candidates: CollectedCandidate[];
  markedSignature: string | null;
}

// `collectAndMark` is the single page-evaluated function for both listing candidates and marking
// one of them for capture. It replaced two separate exported functions (`collectCandidates`,
// `markCandidate`) that each nested a byte-identical copy of the 54-line collection algorithm —
// nothing cross-checked that the two copies stayed in sync. Playwright's `page.evaluate(fn, arg)`
// serialises only `fn.toString()` and evaluates that source alone in the browser — it does not
// bundle other functions from the enclosing module — so `collectIn` and `describe` still have to
// live inside this one function's body rather than as module-level siblings.
export function collectAndMark(args: CollectArgs & { markIndex?: number; attribute?: string }): CollectAndMarkResult {
  function collectIn(args: CollectArgs): MigElement[] {
    const toArray = (list: ArrayLike<MigElement>): MigElement[] => Array.prototype.slice.call(list) as MigElement[];

    const styleOf = (element: MigElement): MigStyle => window.getComputedStyle(element);

    const isVisible = (element: MigElement): boolean => {
      const rect = element.getBoundingClientRect();
      const style = styleOf(element);
      return rect.height > 0 && rect.width > 0 && style.display !== "none" && style.visibility !== "hidden";
    };

    const isPinned = (element: MigElement): boolean => {
      const position = styleOf(element).position;
      return position === "fixed" || position === "sticky";
    };

    let container = document.body;
    for (let depth = 0; depth < args.maxDescentDepth; depth += 1) {
      // Pinned elements are gathered separately below, so they must not be counted
      // when deciding whether this level has a single full-height child. Webflow puts
      // its "Made in Webflow" badge next to the page wrapper and its sticky navbar
      // inside it; counting either one stops the descent and collapses the whole page
      // into a single candidate.
      const visible = toArray(container.children)
        .filter(isVisible)
        .filter((element) => !isPinned(element));
      const only = visible.length === 1 ? visible[0] : undefined;
      if (only === undefined) break;
      if (only.getBoundingClientRect().height < container.getBoundingClientRect().height * args.soleChildHeightRatio) {
        break;
      }
      container = only;
    }

    const tallEnough = (element: MigElement): boolean =>
      element.getBoundingClientRect().height >= args.minCandidateHeightPx;

    const flow = toArray(container.children).filter(
      (element) => isVisible(element) && tallEnough(element) && !isPinned(element),
    );

    const pinned: MigElement[] = [];
    for (const element of toArray(document.querySelectorAll("*"))) {
      if (!isPinned(element) || !isVisible(element) || !tallEnough(element)) continue;
      if (flow.some((other) => other === element || other.contains(element))) continue;
      if (pinned.some((other) => other.contains(element))) continue;
      pinned.push(element);
    }

    const all = flow.concat(pinned);
    all.sort((a, b) => {
      const aRect = a.getBoundingClientRect();
      const bRect = b.getBoundingClientRect();
      if (aRect.top !== bRect.top) return aRect.top - bRect.top;
      return bRect.height - aRect.height;
    });

    return all.slice(0, args.maxCandidates);
  }

  function describe(element: MigElement, args: CollectArgs, index: number): CollectedCandidate {
    const rect = element.getBoundingClientRect();
    const raw = typeof element.className === "string" ? element.className : "";
    const classes = raw.split(/\s+/).filter((token) => token.length > 0);
    const textSnippet = (element.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, args.snippetLength);
    const tag = element.tagName.toLowerCase();
    const signatureClasses = classes.slice(0, args.maxSignatureClasses);
    const head = signatureClasses.length === 0 ? tag : `${tag}.${signatureClasses.join(".")}`;
    const position = window.getComputedStyle(element).position;

    return {
      index,
      y: Math.round(rect.top + window.scrollY),
      height: Math.round(rect.height),
      tag,
      classes,
      textSnippet,
      isFixed: position === "fixed" || position === "sticky",
      signature: `${head}|${Math.round(rect.height)}|${textSnippet.slice(0, args.signatureTextLength)}`,
    };
  }

  const elements = collectIn(args);
  const candidates = elements.map((element, index) => describe(element, args, index));

  let markedSignature: string | null = null;
  if (args.markIndex !== undefined) {
    const element = elements[args.markIndex];
    if (element !== undefined) {
      if (args.attribute !== undefined) element.setAttribute(args.attribute, "1");
      markedSignature = describe(element, args, args.markIndex).signature;
    }
  }

  return { candidates, markedSignature };
}

export function unmarkCandidates(attribute: string): void {
  const nodes = Array.prototype.slice.call(document.querySelectorAll(`[${attribute}]`)) as MigElement[];
  for (const node of nodes) node.removeAttribute(attribute);
}
