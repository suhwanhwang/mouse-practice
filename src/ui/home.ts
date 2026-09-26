import { unlockAudio, sfx } from '../core/audio';
import { el } from '../core/dom';
import type { Lifetime } from '../core/lifetime';
import { mouseSvg } from '../core/mouse-svg';
import { go } from '../core/router';

export function homeScreen(app: HTMLElement, lt: Lifetime): void {
  const page = el('main', 'home bg-sky');
  const title = el('h1', 'home-title', '마우스 섬 모험');
  const hero = el('div', 'home-hero');
  hero.innerHTML = `<span class="home-mascot">🐭</span>${mouseSvg('left', 150)}`;
  const tip = el('p', 'home-tip', '화살표를 버튼 위에 올리고, 왼쪽 버튼을 딸깍!');
  const start = el('button', 'btn big pulse', '시작하기 ▶');
  lt.on(start, 'pointerenter', () => sfx.click());
  lt.on(start, 'click', () => {
    unlockAudio();
    go('map');
  });
  page.append(title, hero, tip, start);
  app.append(page);
}
