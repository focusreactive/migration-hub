import type { CropIndexData } from "#ir/crops.ts";

import { escapeAttr } from "./escape.ts";

const NO_SHOT_PLACEHOLDER =
  '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; '
  + 'background: repeating-linear-gradient(135deg, #0d0d0d 0 6px, #101010 6px 12px);">'
  + '<span style="font-size: 10px; color: #3d3d3d; letter-spacing: 0.08em;">NO SHOT</span></div>';

export interface ShotBoxOptions {
  style: string;
  badge?: string;
  className?: string;
}

export interface ShotStore {
  has(typeId: string): boolean;
  img(typeId: string, alt: string): string;
  box(typeId: string, alt: string, opts: ShotBoxOptions): string;
  aspectRatio(typeId: string): string | undefined;
  scriptMap(): string;
}

interface ShotStoreArgs {
  crops: CropIndexData;
  jpegs: Map<string, Buffer>;
}

export function createShotStore(args: ShotStoreArgs): ShotStore {
  const sizes = new Map(args.crops.shots.map((shot) => [shot.typeId, { width: shot.width, height: shot.height }]));
  const available = new Set([...sizes.keys()].filter((typeId) => args.jpegs.has(typeId)));

  const has = (typeId: string): boolean => available.has(typeId);

  return {
    has,

    img(typeId: string, alt: string): string {
      return `<img data-shot="${escapeAttr(typeId)}" alt="${escapeAttr(alt)}" />`;
    },

    box(typeId: string, alt: string, opts: ShotBoxOptions): string {
      const className = opts.className === undefined ? "shotbox" : `shotbox ${opts.className}`;
      const badge = opts.badge ?? "";
      const body = has(typeId) ? this.img(typeId, alt) : NO_SHOT_PLACEHOLDER;

      return `<div class="${className}" style="${opts.style}">${badge}${body}</div>`;
    },

    aspectRatio(typeId: string): string | undefined {
      const size = sizes.get(typeId);
      if (size === undefined || !has(typeId)) return undefined;
      return `${size.width} / ${size.height}`;
    },

    scriptMap(): string {
      const entries = [...available]
        .sort()
        .map((typeId) => {
          const jpeg = args.jpegs.get(typeId);
          if (jpeg === undefined) return "";
          return `${JSON.stringify(typeId)}:"data:image/jpeg;base64,${jpeg.toString("base64")}"`;
        })
        .filter((entry) => entry !== "");

      return `var SHOTS={${entries.join(",")}};`;
    },
  };
}
