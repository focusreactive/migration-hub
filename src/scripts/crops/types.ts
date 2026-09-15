import type { CropMissReason } from "#ir/crops.ts";

export interface CropTarget {
  typeId: string;
  name: string;
  route: string;
  order: number;
  isGlobal: boolean;
}

export interface CaptureRequest {
  typeId: string;
  selector: string;
  signature: string;
  isFixed: boolean;
}

export type CaptureFailureReason = Extract<
  CropMissReason,
  "SELECTOR_UNRESOLVED" | "SIGNATURE_DRIFT" | "CAPTURE_FAILED"
>;

export type CaptureOutcome =
  | { ok: true; typeId: string; jpeg: Buffer; width: number; height: number }
  | { ok: false; typeId: string; reason: CaptureFailureReason };

export interface ViewportShot {
  jpeg: Buffer;
  width: number;
  height: number;
}

export interface CropDriver {
  capture(url: string, requests: CaptureRequest[]): Promise<CaptureOutcome[]>;
  viewport(url: string): Promise<ViewportShot | undefined>;
  close(): Promise<void>;
}
