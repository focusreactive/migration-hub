import { MAX_SIGNATURE_CLASSES, SIGNATURE_TEXT_LENGTH } from "../constants/capture.ts";

export interface SignatureParts {
  tag: string;
  classes: string[];
  height: number;
  textSnippet: string;
}

export function candidateSignature(parts: SignatureParts): string {
  const classes = parts.classes.slice(0, MAX_SIGNATURE_CLASSES);
  const head = classes.length === 0 ? parts.tag : `${parts.tag}.${classes.join(".")}`;

  return `${head}|${Math.round(parts.height)}|${parts.textSnippet.slice(0, SIGNATURE_TEXT_LENGTH)}`;
}
