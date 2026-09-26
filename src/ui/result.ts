import { sfx } from '../core/audio';
import { el } from '../core/dom';
import { confetti } from '../core/fx';
import type { Lifetime } from '../core/lifetime';
import { go } from '../core/router';
import { speak } from '../core/speech';
import { LEVELS_PER_STAGE } from '../core/storage';
import { STAGES } from '../data/stages';

export interface ResultInfo {
  stage: number;
  level: number;
  stars: number;
  newSticker: boolean;
}

export function nextRoute(stage: number, level: number): string {
  if (level + 1 < LEVELS_PER_STAGE) return `play/${stage}/${level + 1}`;
  if (stage + 1 < STAGES.length) return `play/${stage + 1}/0`;
  return 'stickers';
}

export function showResult(lt: Lifetime, info: ResultInfo): void {
  const overlay = el('div', 'overlay');
  const panel = el('div', 'panel result');
  const title = el('h2', '', info.stars === 3 ? '최고예요! 🎉' : '잘했어요! 👏');
  const stars = el('div', 'result-stars');
  const starEls = [0, 1, 2].map(() => el('span', 'result-star off', '⭐'));
  stars.append(...starEls);
  panel.append(title, stars);

  const sticker = STAGES[info.stage].sticker;
  if (info.newSticker) {
    const box = el('div', 'new-sticker');
    box.append(el('div', 'sticker-big', sticker.emoji), el('div', '', `새 스티커! ${sticker.name}를 받았어요`));
    panel.append(box);
  }

  const buttons = el('div', 'button-row');
  const again = el('button', 'btn ghost', '🔁 다시');
  again.addEventListener('click', () => go(`play/${info.stage}/${info.level}`));
  const map = el('button', 'btn secondary', '🗺️ 지도');
  map.addEventListener('click', () => go('map'));
  const nextPath = nextRoute(info.stage, info.level);
  buttons.append(again, map);
  {
    const label = nextPath === 'stickers' ? '📒 스티커 보기' : info.level + 1 < LEVELS_PER_STAGE ? '▶ 다음 단계' : '▶ 다음 섬';
    const next = el('button', 'btn', label);
    next.addEventListener('click', () => go(nextPath));
    buttons.append(next);
  }
  panel.append(buttons);
  overlay.append(panel);
  document.body.append(overlay);
  lt.add(() => overlay.remove());

  sfx.fanfare();
  starEls.forEach((s, i) => {
    if (i >= info.stars) return;
    lt.timeout(() => {
      s.classList.remove('off');
      s.classList.add('pop-in');
      sfx.star(i);
    }, 500 + i * 350);
  });
  if (info.stars === 3 || info.newSticker) confetti();
  const line = info.newSticker
    ? `${sticker.name} 스티커를 받았어요!`
    : info.stars === 3
      ? '최고예요! 별 세 개!'
      : `잘했어요! 별 ${['한', '두', '세'][info.stars - 1]} 개!`;
  lt.timeout(() => speak(line), 300);
}
