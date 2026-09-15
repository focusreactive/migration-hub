import type { SectionAnchor } from "#ir/discovery.ts";
import { anchorSignature } from "#lib/anchor/signature.ts";
import type { ResolveResult } from "#lib/anchor/page-scripts.ts";

import { isNoElement, type AnchorProposal } from "../../../schemas/sections-response.ts";
import type { AcceptError } from "../../../types.ts";

const MAX_PAGE_FRACTION = 0.6;

const MIN_SECTIONS_FOR_FRACTION = 4;

export interface AnchorInput {
  order: number;
  proposal: AnchorProposal;

  resolution: ResolveResult | undefined;
}

export interface AnchorValidation {
  errors: AcceptError[];

  anchors: Map<number, SectionAnchor | null>;
}

export function validateAnchors(inputs: AnchorInput[]): AnchorValidation {
  const errors: AcceptError[] = [];
  const anchors = new Map<number, SectionAnchor | null>();

  for (const input of inputs) {
    if (isNoElement(input.proposal)) {
      anchors.set(input.order, null);
      continue;
    }

    const resolution = input.resolution;
    if (resolution === undefined || resolution.status !== "ok" || resolution.union === null) {
      errors.push(resolveError(input.order, input.proposal.selector, resolution));
      continue;
    }

    if (resolution.nodes.length !== input.proposal.matchCount) {
      errors.push({
        code: "SELECTOR_COUNT_MISMATCH",
        where: `order ${input.order}`,
        got: `${resolution.nodes.length} visible node(s), matchCount says ${input.proposal.matchCount}`,
        detail:
          "The selector does not match the number of visible elements the response claims. " +
          "Hidden nodes do not count — a responsive template often ships a second, hidden copy of " +
          "the same band, and it is invisible in the screenshot even though the markup shows it.",
        fix: "Set matchCount to the number of visible matches, or narrow the selector to the visible one.",
      });
      continue;
    }

    const first = resolution.nodes[0];
    if (first === undefined) continue;

    anchors.set(input.order, {
      selector: input.proposal.selector,
      matchCount: resolution.nodes.length,
      y: resolution.union.y,
      height: resolution.union.height,
      tag: first.tag,
      classes: first.classes,
      isFixed: resolution.nodes.some((node) => node.isFixed),
      signature: anchorSignature(resolution.nodes),
    });
  }

  errors.push(...geometryErrors(inputs, anchors));

  return { errors, anchors };
}

function resolveError(order: number, selector: string, resolution: ResolveResult | undefined): AcceptError {
  const where = `order ${order}`;

  if (resolution === undefined || resolution.status === "INVALID") {
    return {
      code: "SELECTOR_INVALID",
      where,
      got: selector,
      detail: "The selector could not be queried against the page.",
      fix: "Give a valid CSS selector, checked against the live page before answering.",
    };
  }

  if (resolution.status === "NO_MATCH") {
    return {
      code: "SELECTOR_NO_MATCH",
      where,
      got: selector,
      detail: "The selector matches nothing on this route.",
      fix: "Find the element in the live page and use a selector that resolves there.",
    };
  }

  return {
    code: "SELECTOR_NOT_CONTIGUOUS",
    where,
    got: selector,
    detail: "The matched elements are not consecutive siblings, so they are not one band.",
    fix: "Match either one element or an unbroken run of neighbouring siblings.",
  };
}

function geometryErrors(inputs: AnchorInput[], anchors: Map<number, SectionAnchor | null>): AcceptError[] {
  const errors: AcceptError[] = [];

  const inFlow = [...anchors.entries()]
    .filter((entry): entry is [number, SectionAnchor] => entry[1] !== null && !entry[1].isFixed)
    .sort((a, b) => a[0] - b[0]);

  for (const [order, anchor] of inFlow) {
    for (const [otherOrder, other] of inFlow) {
      if (order === otherOrder) continue;
      const contains = anchor.y <= other.y && anchor.y + anchor.height >= other.y + other.height;
      if (!contains) continue;

      errors.push({
        code: "ANCHOR_SWALLOWS_SECTION",
        where: `order ${order}`,
        got: `${anchor.selector} covers order ${otherOrder}`,
        detail: "This anchor's box contains another section's box, so it is a wrapper, not a band.",
        fix: "Anchor the band itself — the run of siblings inside the wrapper — or declare noElement.",
      });
      break;
    }
  }

  for (let index = 1; index < inFlow.length; index += 1) {
    const previous = inFlow[index - 1];
    const current = inFlow[index];
    if (previous === undefined || current === undefined) continue;
    if (current[1].y >= previous[1].y) continue;

    errors.push({
      code: "ANCHOR_NOT_MONOTONIC",
      where: `order ${current[0]}`,
      got: `y ${current[1].y} sits above order ${previous[0]} at y ${previous[1].y}`,
      detail: "Sections run top to bottom, so a later section cannot anchor higher up the page.",
      fix: "Re-check which element belongs to which band.",
    });
  }

  const pageHeight = inputs.find((input) => input.resolution !== undefined)?.resolution?.pageHeight ?? 0;
  if (pageHeight > 0 && inputs.length >= MIN_SECTIONS_FOR_FRACTION) {
    for (const [order, anchor] of inFlow) {
      if (anchor.height < pageHeight * MAX_PAGE_FRACTION) continue;

      errors.push({
        code: "ANCHOR_COVERS_PAGE",
        where: `order ${order}`,
        got: `${anchor.height}px of a ${pageHeight}px page`,
        detail: "One band cannot be most of a page that was segmented into several.",
        fix: "Anchor the band inside this container, or declare noElement.",
      });
    }
  }

  return errors;
}
