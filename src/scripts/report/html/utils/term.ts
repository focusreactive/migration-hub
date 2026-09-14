import { GLOSSARY_TERMS, TERM_LABELS, type GlossaryTerm } from "../constants/terms.ts";

import { escapeHtml } from "./escape.ts";

export function term(key: GlossaryTerm, label?: string): string {
  const text = escapeHtml(label ?? TERM_LABELS[key]);
  return `<span class="term" tabindex="0" data-def="${GLOSSARY_TERMS[key]}">${text}</span>`;
}
