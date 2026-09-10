interface MigElement {
  getAttribute(name: string): string | null;
}

declare const document: {
  documentElement: { scrollHeight: number };
  fonts: { ready: Promise<unknown> };
  getAnimations(): {
    finished: Promise<unknown>;
    effect: { getTiming(): { iterations: number } } | null;
  }[];
  querySelectorAll(selector: string): ArrayLike<MigElement>;
};

declare function scrollTo(x: number, y: number): void;
declare function requestAnimationFrame(callback: () => void): number;

export function scrollPageTo(y: number): void {
  scrollTo(0, y);
}

export async function settlePage(args: { maxWaitMs: number; stableFrames: number }): Promise<void> {
  const deadline = Date.now() + args.maxWaitMs;
  const timeLeft = (): number => Math.max(0, deadline - Date.now());

  await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, timeLeft()))]);

  const finiteAnimations = document.getAnimations().filter((animation) => {
    const timing = animation.effect?.getTiming();
    return timing !== undefined && timing.iterations !== Infinity;
  });
  await Promise.race([
    Promise.all(finiteAnimations.map((animation) => animation.finished.catch(() => undefined))),
    new Promise((resolve) => setTimeout(resolve, timeLeft())),
  ]);

  const signature = (): string => {
    const parts: string[] = [String(document.documentElement.scrollHeight)];
    for (const element of Array.from(document.querySelectorAll("[style]"))) {
      parts.push(element.getAttribute("style") ?? "");
    }
    return parts.join("|");
  };

  let last = "";
  let stable = 0;
  while (stable < args.stableFrames && Date.now() < deadline) {
    const current = signature();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    stable = current === last ? stable + 1 : 0;
    last = current;
  }
}
