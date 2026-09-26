import { sfx } from '../core/audio';
import { byLevel } from '../core/difficulty';
import { centerOf, el, obj, replayClass } from '../core/dom';
import { burst, floatText } from '../core/fx';
import { openMenu, type MenuItem } from '../core/menu';
import { mouseSvg } from '../core/mouse-svg';
import { pick, rand, scatter, shuffle } from '../core/random';
import type { Game } from '../core/scene';

type Action = 'open' | 'paint' | 'ribbon';

const ACTIONS: Record<Action, { icon: string; label: string }> = {
  open: { icon: '📦', label: '열기' },
  paint: { icon: '🎨', label: '색칠하기' },
  ribbon: { icon: '🎀', label: '리본 달기' },
};

const TOYS = ['🧸', '🚂', '🪀', '🎨', '🦖', '🚀', '🪁', '🎹', '⚽', '🍭'];

/** 스테이지 4: 선물 상자를 오른쪽 클릭 → 메뉴에서 고르기 */
export const gifts: Game = ({ root, lt, level, say, progress, miss, win }) => {
  const n = byLevel(level, [3, 4, 5]);
  const size = byLevel(level, [140, 120, 110]);
  const menuActions: Action[] = level === 0 ? ['open'] : ['open', 'paint', 'ribbon'];
  const w = root.clientWidth;
  const h = root.clientHeight;
  const pts = scatter(n, size * 1.4, { left: 30, top: 80, right: w - 30, bottom: h - 30 }, 40);
  let done = 0;
  progress(0, n);

  const items = pts.map((p) => {
    // 3단계에서는 선물마다 해야 할 일이 다르다.
    const task: Action = level === 2 ? pick<Action>(['open', 'paint', 'ribbon']) : 'open';
    const gift = obj(root, '', p.x, p.y, size, 'gift');
    // 색은 상자에만 입힌다(글씨표·리본은 원래 색).
    const box = el('span', 'gift-box', '🎁');
    box.style.filter = `hue-rotate(${rand(0, 360)}deg)`;
    gift.append(box);
    let label: HTMLElement | null = null;
    if (level === 2) {
      label = el('div', 'gift-task', `${ACTIONS[task].icon} ${ACTIONS[task].label}`);
      gift.append(label);
    }
    const state = { gift, task, finished: false };

    const perform = (action: Action) => {
      const c = centerOf(gift);
      if (action === 'paint') {
        box.style.filter = `hue-rotate(${rand(0, 360)}deg) saturate(1.6)`;
        burst(c.x, c.y, ['🎨', '🌈', '✨'], 8);
        sfx.whoosh();
      } else if (action === 'ribbon') {
        if (!gift.querySelector('.ribbon')) gift.append(el('span', 'ribbon', '🎀'));
        sfx.ding();
      }
      if (action !== task) {
        floatText(c.x, c.y - size / 2, '이게 아니에요!', '#999');
        say(`${ACTIONS[task].label}를 골라 볼까요?`);
        miss();
        return;
      }
      state.finished = true;
      label?.remove();
      if (action === 'open') {
        box.textContent = pick(TOYS);
        box.style.filter = '';
        replayClass(gift, 'hatch');
        burst(c.x, c.y, ['🎉', '✨', '⭐'], 14);
        floatText(c.x, c.y - size / 2, '짜잔!');
      }
      gift.classList.add('done');
      sfx.note(done + 3);
      done++;
      progress(done, n);
      if (done === n) win();
    };

    gift.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (state.finished) return;
      replayClass(gift, 'wiggle');
      const choices: MenuItem[] = shuffle(menuActions).map((a) => ({ ...ACTIONS[a], onSelect: () => perform(a) }));
      openMenu(root, lt, e.clientX, e.clientY, choices);
    });
    gift.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.ctrlKey || state.finished) return;
      replayClass(gift, 'shake');
      say('오른쪽 버튼으로 눌러요!');
      showRightButton(gift);
      miss();
    });
    return state;
  });

  function showRightButton(target: HTMLElement) {
    target.querySelector('.button-tip')?.remove();
    const tip = el('div', 'button-tip small');
    tip.innerHTML = mouseSvg('right', 90);
    target.append(tip);
    lt.timeout(() => tip.remove(), 2000);
  }

  return {
    hint: () => {
      const g = items.find((it) => !it.finished);
      if (g) showRightButton(g.gift);
    },
  };
};
