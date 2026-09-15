interface MigElement {
  id: string;
  textContent: string;
  parentElement: MigElement | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  appendChild(child: MigElement): void;
  remove(): void;
}

declare const document: {
  head: MigElement;
  createElement(tagName: string): MigElement;
  getElementById(id: string): MigElement | null;
  querySelectorAll(selector: string): ArrayLike<MigElement>;
};

export interface IsolateArgs {
  markAttribute: string;
  ancestorAttribute: string;
  styleId: string;
  css: string;
}

export function isolateMarked(args: IsolateArgs): boolean {
  const marked = Array.prototype.slice.call(document.querySelectorAll(`[${args.markAttribute}]`)) as MigElement[];
  if (marked.length === 0) return false;

  for (const element of marked) {
    for (let node = element.parentElement; node !== null; node = node.parentElement) {
      node.setAttribute(args.ancestorAttribute, "1");
    }
  }

  if (document.getElementById(args.styleId) === null) {
    const style = document.createElement("style");
    style.id = args.styleId;
    style.textContent = args.css;
    document.head.appendChild(style);
  }

  return true;
}

export function releaseIsolation(args: { ancestorAttribute: string; styleId: string }): void {
  const style = document.getElementById(args.styleId);
  if (style !== null) style.remove();

  const ancestors = Array.prototype.slice.call(
    document.querySelectorAll(`[${args.ancestorAttribute}]`),
  ) as MigElement[];
  for (const node of ancestors) node.removeAttribute(args.ancestorAttribute);
}

export function unmarkCandidates(attribute: string): void {
  const nodes = Array.prototype.slice.call(document.querySelectorAll(`[${attribute}]`)) as MigElement[];
  for (const node of nodes) node.removeAttribute(attribute);
}
