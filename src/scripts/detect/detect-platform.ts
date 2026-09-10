import { extractPlatformHints } from "#detect/hints.ts";
import { buildProbeView } from "#detect/probe-view.ts";
import { CONFIDENCE_THRESHOLD, decideVerdict, MARGIN_THRESHOLD, scorePlatform } from "#detect/scoring.ts";
import { framerSignals } from "#detect/signals/framer.ts";
import { webflowSignals } from "#detect/signals/webflow.ts";
import type { DetectData } from "#ir/detect.ts";
import type { ProbeData } from "#probe/read-probe-data.ts";

export function detectPlatform(data: ProbeData): DetectData {
  const view = buildProbeView(data);

  const webflow = scorePlatform(webflowSignals, view);
  const framer = scorePlatform(framerSignals, view);
  const verdict = decideVerdict({ webflow, framer });
  const platformHints = extractPlatformHints(view);

  return {
    verdict,
    scores: { webflow, framer },
    thresholds: {
      confidence: CONFIDENCE_THRESHOLD,
      margin: MARGIN_THRESHOLD,
    },
    platformHints,
  };
}
