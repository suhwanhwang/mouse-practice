import { sfx } from '../core/audio';
import { el, replayClass } from '../core/dom';
import type { Lifetime } from '../core/lifetime';
import { go } from '../core/router';
import { data, getStars, isLevelUnlocked, isStageComplete, isStageUnlocked, LEVELS_PER_STAGE, stageStars } from '../core/storage';
import { STAGES } from '../data/stages';
import { createTopbar } from './topbar';

const PARENT_HOLD_MS = 3000;

export function mapScreen(app: HTMLElement, lt: Lifetime): void {
  const bar = createTopbar(null);
  const logo = el('button', 'logo', '🏝️ 마우스 섬');
  logo.title = '마우스 섬 모험';
  bar.el.prepend(logo);
  holdToOpenParent(logo, lt);

  const page = el('main', 'map bg-sea');
  const grid = el('div', 'islands');
  const current = STAGES.findIndex((_, i) => isStageUnlocked(data, i) && !isStageComplete(data, i));

  STAGES.forEach((stage, i) => {
    const unlocked = isStageUnlocked(data, i);
    const card = el('button', 'island');
    if (!unlocked) card.classList.add('locked');
    if (i === current) card.classList.add('current');
    if (isStageComplete(data, i)) card.classList.add('done');
    card.append(
      el('div', 'island-num', `${i + 1}`),
      el('div', 'island-emoji', unlocked ? stage.emoji : '🔒'),
      el('div', 'island-title', stage.title),
      el('div', 'island-skill', stage.skill),
      el('div', 'island-stars', `⭐ ${stageStars(data, i)} / ${LEVELS_PER_STAGE * 3}`),
    );
    card.addEventListener('click', () => {
      if (!unlocked) {
        sfx.boop();
        replayClass(card, 'shake');
        bar.mascot.say('앞의 섬을 먼저 끝내면 열려요!');
        return;
      }
      sfx.click();
      openLevelPicker(i, lt);
    });
    grid.append(card);
  });

  const extras = el('div', 'map-extras');
  const stickers = el('button', 'btn secondary', '📒 스티커 도감');
  stickers.addEventListener('click', () => go('stickers'));
  const draw = el('button', 'btn ghost', '🎨 그림판');
  draw.addEventListener('click', () => go('draw'));
  extras.append(stickers, draw);

  page.append(grid, extras);
  app.append(bar.el, page);

  if (current >= 0) bar.mascot.say(`${STAGES[current].title}에 가 볼까요? 섬을 눌러요!`);
  else bar.mascot.say('모든 섬을 끝냈어요! 정말 대단해요!');
}

function openLevelPicker(stage: number, lt: Lifetime): void {
  const def = STAGES[stage];
  const overlay = el('div', 'overlay');
  const panel = el('div', 'panel');
  const close = el('button', 'panel-close', '✕');
  panel.append(close, el('div', 'picker-emoji', def.emoji), el('h2', '', def.title));
  const row = el('div', 'level-row');
  for (let l = 0; l < LEVELS_PER_STAGE; l++) {
    const unlocked = isLevelUnlocked(data, stage, l);
    const stars = getStars(data, stage, l);
    const btn = el('button', 'level-btn');
    btn.disabled = !unlocked;
    btn.append(
      el('div', 'level-btn-num', unlocked ? `${l + 1}단계` : '🔒'),
      el('div', 'level-btn-stars', '⭐'.repeat(stars) + '☆'.repeat(3 - stars)),
    );
    btn.addEventListener('click', () => go(`play/${stage}/${l}`));
    row.append(btn);
  }
  panel.append(row);
  overlay.append(panel);
  document.body.append(overlay);
  const dismiss = () => overlay.remove();
  lt.add(dismiss);
  close.addEventListener('click', dismiss);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) dismiss();
  });
}

/** 아이가 실수로 들어가지 않게, 로고를 3초 동안 누르고 있어야 부모 설정이 열린다. */
function holdToOpenParent(target: HTMLElement, lt: Lifetime): void {
  let timer = 0;
  const cancel = () => {
    clearTimeout(timer);
    target.classList.remove('holding');
  };
  lt.on<PointerEvent>(target, 'pointerdown', () => {
    cancel();
    target.classList.add('holding');
    timer = window.setTimeout(() => go('parent'), PARENT_HOLD_MS);
  });
  lt.on(target, 'pointerup', cancel);
  lt.on(target, 'pointerleave', cancel);
  lt.add(cancel);
}
