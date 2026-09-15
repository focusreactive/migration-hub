import { escapeHtml } from "./escape.ts";

export function inlineMarkdown(value: string): string {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<span class="mono">$1</span>')
    .replace(/\*([^*\s][^*]*?)\*/g, "<em>$1</em>");
}
