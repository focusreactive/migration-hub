import type { Risk } from "../analysis/risks.ts";
import { clampSentences } from "../utils/clamp.ts";

export const PLAN_FOR_MARKER = "*Plan for:*";

const DIAGNOSIS_SENTENCES = 2;
const PLAN_FOR_SENTENCES = 1;

export interface RiskBody {
  diagnosis: string;
  planFor: string | undefined;
}

export function riskBody(risk: Risk): RiskBody {
  const parts = risk.body.split(PLAN_FOR_MARKER);
  if (parts.length !== 2) return { diagnosis: clampSentences(risk.body, DIAGNOSIS_SENTENCES), planFor: undefined };

  const [before = "", after = ""] = parts;
  return {
    diagnosis: clampSentences(before, DIAGNOSIS_SENTENCES).trimEnd(),
    planFor: clampSentences(after, PLAN_FOR_SENTENCES),
  };
}

function indent(body: string): string {
  return body
    .split("\n")
    .map((line) => `   ${line}`)
    .join("\n");
}

function body(risk: Risk): string {
  const { diagnosis, planFor } = riskBody(risk);
  return planFor === undefined ? diagnosis : `${diagnosis} ${PLAN_FOR_MARKER}${planFor}`;
}

export function risksSection(risks: Risk[]): string {
  const items = risks.map((risk, index) => `${index + 1}. **${risk.title}**\n${indent(body(risk))}`);

  return ["## Risks & watch-outs", "", items.join("\n\n")].join("\n");
}
