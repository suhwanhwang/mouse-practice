import { sfx } from './audio';
import { el, localPoint } from './dom';
import type { Lifetime } from './lifetime';

export interface MenuItem {
  icon: string;
  label: string;
  onSelect: () => void;
}

let closeCurrent: (() => void) | null = null;

/** 오른쪽 클릭 메뉴 흉내. 큰 글씨로, 바깥을 누르면 닫힌다. */
export function openMenu(root: HTMLElement, lt: Lifetime, clientX: number, clientY: number, items: MenuItem[]): void {
  closeCurrent?.();
  const menu = el('div', 'ctx-menu');
  for (const item of items) {
    const row = el('button', 'ctx-item');
    row.append(el('span', 'ctx-icon', item.icon), el('span', '', item.label));
    row.addEventListener('pointerenter', () => sfx.click());
    row.addEventListener('pointerdown', (e) => e.stopPropagation());
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      close();
      item.onSelect();
    });
    menu.append(row);
  }
  root.append(menu);
  const p = localPoint(root, clientX, clientY);
  const x = Math.min(p.x, root.clientWidth - menu.offsetWidth - 8);
  const y = Math.min(p.y, root.clientHeight - menu.offsetHeight - 8);
  menu.style.left = `${Math.max(8, x)}px`;
  menu.style.top = `${Math.max(8, y)}px`;
  sfx.menu();

  const outside = (e: PointerEvent) => {
    if (!menu.contains(e.target as Node)) close();
  };
  // 메뉴를 연 오른쪽 클릭 자체가 바로 닫지 않도록 한 박자 늦게 건다.
  const arm = window.setTimeout(() => root.addEventListener('pointerdown', outside, true), 0);
  function close() {
    clearTimeout(arm);
    root.removeEventListener('pointerdown', outside, true);
    menu.remove();
    if (closeCurrent === close) closeCurrent = null;
  }
  closeCurrent = close;
  lt.add(close);
}
