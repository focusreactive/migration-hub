export interface CaptureViewport {
  width: number;
  height: number;
}

export interface BrowserDriver {
  render(url: string): Promise<Buffer>;
  close(): Promise<void>;
}
