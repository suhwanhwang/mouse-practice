import { el } from '../core/dom';
import type { Lifetime } from '../core/lifetime';
import { data, isStageComplete } from '../core/storage';
import { speak } from '../core/speech';
import { STAGES } from '../data/stages';
import { createTopbar } from './topbar';

export function stickersScreen(app: HTMLElement, lt: Lifetime): void {
  const bar = createTopbar({ route: 'map', label: '🗺️' });
  const page = el('main', 'stickers bg-paper');
  const earned = STAGES.filter((_, i) => isStageComplete(data, i)).length;
  page.append(el('h2', 'stickers-title', `📒 스티커 도감 ${earned} / ${STAGES.length}`));
  const grid = el('div', 'sticker-grid');
  STAGES.forEach((stage, i) => {
    const has = isStageComplete(data, i);
    const card = el('div', has ? 'sticker-card has' : 'sticker-card');
    card.append(
      el('div', 'sticker-emoji', has ? stage.sticker.emoji : '❔'),
      el('div', 'sticker-name', has ? stage.sticker.name : stage.title),
    );
    if (has) lt.on(card, 'click', () => speak(stage.sticker.name));
    grid.append(card);
  });
  page.append(grid);
  app.append(bar.el, page);
  bar.mascot.say(
    earned === STAGES.length
      ? '스티커를 모두 모았어요! 마우스 박사님이에요!'
      : '섬을 하나 끝낼 때마다 스티커를 받아요!',
  );
}
