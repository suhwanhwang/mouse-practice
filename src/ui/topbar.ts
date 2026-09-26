import { el } from '../core/dom';
import { go } from '../core/router';
import { createMascot, type Mascot } from './mascot';

export interface Topbar {
  el: HTMLElement;
  mascot: Mascot;
  /** 오른쪽 끝(진행 표시 등)을 넣는 자리 */
  right: HTMLElement;
}

export function createTopbar(back: { route: string; label: string } | null): Topbar {
  const bar = el('header', 'topbar');
  if (back) {
    const btn = el('button', 'icon-btn', back.label);
    btn.title = '돌아가기';
    btn.addEventListener('click', () => go(back.route));
    bar.append(btn);
  }
  const mascot = createMascot();
  const sound = el('button', 'icon-btn', '🔊');
  sound.title = '다시 듣기';
  sound.addEventListener('click', mascot.repeat);
  const right = el('div', 'topbar-right');
  bar.append(mascot.el, sound, right);
  return { el: bar, mascot, right };
}
