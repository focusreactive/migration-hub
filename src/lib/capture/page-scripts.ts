declare const document: {
  documentElement: { scrollHeight: number };
};

declare function scrollTo(x: number, y: number): void;

export async function preScrollPage(args: { stepPx: number; stepDelayMs: number; maxSteps: number }): Promise<void> {
  let y = 0;
  let steps = 0;
  while (y < document.documentElement.scrollHeight && steps < args.maxSteps) {
    scrollTo(0, y);
    await new Promise<void>((resolve) => setTimeout(resolve, args.stepDelayMs));
    y += args.stepPx;
    steps += 1;
  }
  scrollTo(0, document.documentElement.scrollHeight);
  await new Promise<void>((resolve) => setTimeout(resolve, args.stepDelayMs));
}
