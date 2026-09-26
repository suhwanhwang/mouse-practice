import { sfx } from '../core/audio';
import { centerOf, el, obj, place, pointIn, replayClass } from '../core/dom';
import { burst, floatText } from '../core/fx';
import { makeDraggable } from '../core/input';
import { pick, shuffle } from '../core/random';
import type { Game, GameContext } from '../core/scene';

/** 스테이지 5: 끌어서 놓기 — 동물 집 찾기, 과일 바구니, 퍼즐 */
export const drag: Game = (ctx) => {
  if (ctx.level === 0) return animals(ctx);
  if (ctx.level === 1) return fruits(ctx);
  return puzzle(ctx);
};

const tapTip = (ctx: GameContext) => () => ctx.say('꾹 누른 채로 끌어야 해요!');

function success(node: HTMLElement, text: string, i: number) {
  const c = centerOf(node);
  burst(c.x, c.y, ['✨', '💚', '⭐'], 10);
  floatText(c.x, c.y - 40, text);
  sfx.note(i + 2);
}

function animals(ctx: GameContext) {
  const { root, lt, progress, miss, win } = ctx;
  const kinds = shuffle(['🐶', '🐱', '🐰', '🐷', '🐸', '🐵', '🐔']).slice(0, 4);
  const w = root.clientWidth;
  const h = root.clientHeight;
  const size = Math.min(110, h / 6.5);
  let done = 0;
  progress(0, kinds.length);

  const houses = shuffle(kinds).map((kind, i) => {
    const y = (h / (kinds.length + 1)) * (i + 1);
    const house = obj(root, '🏠', w * 0.75, y, size * 1.3, 'house');
    house.append(el('span', 'house-badge', kind));
    return { kind, house };
  });

  const pets = kinds.map((kind, i) => {
    const y = (h / (kinds.length + 1)) * (i + 1);
    const pet = obj(root, kind, w * 0.2, y, size, 'pet');
    makeDraggable(pet, lt, {
      onTap: tapTip(ctx),
      onDrop: (x, y2) => {
        const target = houses.find((hh) => pointIn(hh.house, x, y2, 20));
        if (!target) return false;
        if (target.kind !== kind) {
          replayClass(target.house, 'shake');
          miss();
          return false;
        }
        pet.remove();
        target.house.classList.add('home');
        target.house.querySelector('.house-badge')?.classList.add('inside');
        success(target.house, '쏙!', done);
        done++;
        progress(done, kinds.length);
        if (done === kinds.length) win();
        return true;
      },
    });
    return pet;
  });

  return { hint: () => pets.find((p) => p.isConnected)?.classList.add('hint-ring') };
}

function fruits(ctx: GameContext) {
  const { root, lt, progress, miss, win } = ctx;
  const kinds = shuffle(['🍎', '🍌', '🍇', '🍊', '🍓']).slice(0, 4);
  const list = shuffle([...kinds, ...kinds]);
  const w = root.clientWidth;
  const h = root.clientHeight;
  const size = Math.min(90, h / 6);
  let done = 0;
  progress(0, list.length);

  const baskets = kinds.map((kind, i) => {
    const x = (w / (kinds.length + 1)) * (i + 1);
    const basket = obj(root, '🧺', x, h - size * 1.1, size * 1.6, 'basket');
    const badge = el('span', 'basket-badge', kind);
    const count = el('span', 'basket-count', '');
    basket.append(badge, count);
    return { kind, basket, count, n: 0 };
  });

  const fruitsEls = list.map((kind, i) => {
    const x = (w / (list.length + 1)) * (i + 1);
    const y = h * 0.28 + (i % 2) * size * 1.2;
    const fruit = obj(root, kind, x, y, size, 'fruit');
    makeDraggable(fruit, lt, {
      onTap: tapTip(ctx),
      onDrop: (px, py) => {
        const target = baskets.find((b) => pointIn(b.basket, px, py, 24));
        if (!target) return false;
        if (target.kind !== kind) {
          replayClass(target.basket, 'shake');
          miss();
          return false;
        }
        fruit.remove();
        target.n++;
        target.count.textContent = '●'.repeat(target.n);
        replayClass(target.basket, 'hop');
        success(target.basket, '쏙!', done);
        done++;
        progress(done, list.length);
        if (done === list.length) win();
        return true;
      },
    });
    return fruit;
  });

  return { hint: () => fruitsEls.find((f) => f.isConnected)?.classList.add('hint-ring') };
}

function puzzle(ctx: GameContext) {
  const { root, lt, progress, miss, win } = ctx;
  const picture = pick(['🐼', '🦁', '🐸', '🐯', '🐨', '🐷', '🐵', '🐰']);
  const w = root.clientWidth;
  const h = root.clientHeight;
  const piece = Math.floor(Math.min(160, (h - 60) / 2.2, w / 5));
  const frameX = w * 0.68;
  const frameY = h / 2;
  const frame = el('div', 'puzzle-frame');
  frame.style.width = frame.style.height = `${piece * 2}px`;
  place(frame, frameX, frameY);
  const ghost = el('div', 'puzzle-ghost', picture);
  ghost.style.fontSize = `${piece * 1.7}px`;
  ghost.style.lineHeight = `${piece * 2}px`;
  frame.append(ghost);
  root.append(frame);

  const slots = [0, 1, 2, 3].map((i) => {
    const slot = el('div', 'puzzle-slot');
    slot.style.width = slot.style.height = `${piece}px`;
    slot.style.left = `${(i % 2) * piece}px`;
    slot.style.top = `${Math.floor(i / 2) * piece}px`;
    frame.append(slot);
    return slot;
  });

  /** 큰 이모지 한 장을 4조각으로 잘라 보여 준다. */
  const makePiece = (i: number) => {
    const p = el('div', 'obj puzzle-piece');
    p.style.width = p.style.height = `${piece}px`;
    const img = el('div', 'puzzle-img', picture);
    Object.assign(img.style, {
      width: `${piece * 2}px`,
      height: `${piece * 2}px`,
      left: `${-(i % 2) * piece}px`,
      top: `${-Math.floor(i / 2) * piece}px`,
      fontSize: `${piece * 1.7}px`,
      lineHeight: `${piece * 2}px`,
    });
    p.append(img);
    return p;
  };

  let done = 0;
  progress(0, 4);
  const spots = shuffle([0, 1, 2, 3]);
  const pieces = spots.map((i, k) => {
    const p = makePiece(i);
    place(p, w * 0.22 + (k % 2) * (piece + 24) - piece / 2, h / 2 + (Math.floor(k / 2) - 0.5) * (piece + 24));
    root.append(p);
    makeDraggable(p, lt, {
      onTap: tapTip(ctx),
      onDrop: (x, y) => {
        const target = slots.findIndex((s) => pointIn(s, x, y));
        if (target < 0) return false;
        if (target !== i) {
          replayClass(slots[target], 'shake');
          miss();
          return false;
        }
        p.remove();
        const fixed = makePiece(i);
        fixed.classList.remove('obj');
        fixed.classList.add('placed');
        slots[i].append(fixed);
        success(slots[i], '딱!', done);
        done++;
        progress(done, 4);
        if (done === 4) {
          frame.classList.add('complete');
          win();
        }
        return true;
      },
    });
    return p;
  });

  return { hint: () => pieces.find((p) => p.isConnected)?.classList.add('hint-ring') };
}
