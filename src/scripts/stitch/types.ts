export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CaptureViewport {
  width: number;
  height: number;
}

export type StickyPosition = "fixed" | "sticky";

export interface StickyMeasurement {
  migId: string;
  position: StickyPosition;
  rect: Rect;
}

export interface BrowserDriver {
  render(url: string): Promise<Buffer>;
  close(): Promise<void>;
}
