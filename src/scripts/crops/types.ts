import type { CropCandidate } from "#ir/crops.ts";

export interface CropTarget {
  typeId: string;
  name: string;
  route: string;
  order: number;
  isGlobal: boolean;
}

export interface CaptureRequest {
  typeId: string;
  candidateIndex: number;
  signature: string;
  isFixed: boolean;
}

export type CaptureOutcome =
  | { ok: true; typeId: string; jpeg: Buffer; width: number; height: number }
  | { ok: false; typeId: string; reason: "SIGNATURE_DRIFT" | "CANDIDATE_OUT_OF_RANGE" | "CAPTURE_FAILED" };

export interface ViewportShot {
  jpeg: Buffer;
  width: number;
  height: number;
}

export interface CropDriver {
  candidates(url: string): Promise<CropCandidate[]>;
  capture(url: string, requests: CaptureRequest[]): Promise<CaptureOutcome[]>;
  viewport(url: string): Promise<ViewportShot | undefined>;
  close(): Promise<void>;
}
