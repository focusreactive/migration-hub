import type { Risk } from "../analysis/risks.ts";

function indent(body: string): string {
  return body
    .split("\n")
    .map((line) => `   ${line}`)
    .join("\n");
}

export function risksSection(risks: Risk[]): string {
  const items = risks.map((risk, index) => `${index + 1}. **${risk.title}**\n${indent(risk.body)}`);

  return ["## Risks & watch-outs", "", items.join("\n\n")].join("\n");
}
