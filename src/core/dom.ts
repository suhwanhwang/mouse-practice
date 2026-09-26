export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  text = '',
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/** `.obj` 요소를 중심 좌표 (x, y)에 놓는다. */
export function place(node: HTMLElement, x: number, y: number): void {
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
}

/** `.obj` 요소를 만들어 중심 좌표에 놓는다. size는 글자(이모지) 크기. */
export function obj(parent: HTMLElement, text: string, x: number, y: number, size: number, className = ''): HTMLDivElement {
  const node = el('div', `obj ${className}`.trim(), text);
  node.style.fontSize = `${size}px`;
  place(node, x, y);
  parent.append(node);
  return node;
}

export function pointIn(node: Element, x: number, y: number, pad = 0): boolean {
  const r = node.getBoundingClientRect();
  return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
}

/** client 좌표를 요소 기준 좌표로 바꾼다. */
export function localPoint(node: Element, clientX: number, clientY: number): { x: number; y: number } {
  const r = node.getBoundingClientRect();
  return { x: clientX - r.left, y: clientY - r.top };
}

export function centerOf(node: Element): { x: number; y: number } {
  const r = node.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** 한 번 재생되는 CSS 애니메이션 클래스를 다시 건다. */
export function replayClass(node: HTMLElement, className: string): void {
  node.classList.remove(className);
  void node.offsetWidth;
  node.classList.add(className);
}
