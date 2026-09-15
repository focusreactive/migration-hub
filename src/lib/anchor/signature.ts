import {
  ANCHOR_MAX_SIGNATURE_CLASSES,
  ANCHOR_SIGNATURE_SEPARATOR,
  ANCHOR_SIGNATURE_TEXT_LENGTH,
} from "./constants.ts";
import type { ResolvedNode } from "./page-scripts.ts";

export interface SignatureParts {
  tag: string;
  classes: string[];
  height: number;
  textSnippet: string;
}

export function anchorNodeSignature(parts: SignatureParts): string {
  const classes = parts.classes.slice(0, ANCHOR_MAX_SIGNATURE_CLASSES);
  const head = classes.length === 0 ? parts.tag : `${parts.tag}.${classes.join(".")}`;

  return `${head}|${Math.round(parts.height)}|${parts.textSnippet.slice(0, ANCHOR_SIGNATURE_TEXT_LENGTH)}`;
}

export function anchorSignature(nodes: readonly Pick<ResolvedNode, "signature">[]): string {
  return nodes.map((node) => node.signature).join(ANCHOR_SIGNATURE_SEPARATOR);
}
