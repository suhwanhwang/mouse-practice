import { sfx } from '../core/audio';
import { byLevel } from '../core/difficulty';
import { centerOf, el, obj, place, replayClass } from '../core/dom';
import { burst, floatText } from '../core/fx';
import { DoubleClickDetector } from '../core/input';
import { scatter } from '../core/random';
import type { Game } from '../core/scene';

const HATCHLINGS = ['🐥', '🐤', '🐣', '🦆', '🐧', '🦖'];

/** 스테이지 3: 알을 더블클릭하면 병아리가 나온다. */
export const eggs: Game = ({ root, lt, level, round, settings, say, progress, miss, win }) => {
  const n = byLevel(level, [4, 6, 8]);
  // 판이 올라갈수록 알이 조금씩 작아진다(최대 30%).
  const size = byLevel(level, [150, 120, 95]) * Math.max(0.7, 1 - round * 0.08);
  const w = root.clientWidth;
  const h = root.clientHeight;
  const pts = scatter(n, size * 1.3, { left: 30, top: 50, right: w - 30, bottom: h - 30 }, 30);
  let hatched = 0;
  progress(0, n);

  const items = pts.map((p, i) => {
    const nest = el('div', 'nest');
    nest.style.width = `${size * 1.3}px`;
    place(nest, p.x, p.y + size * 0.35);
    root.append(nest);
    const egg = obj(root, '🥚', p.x, p.y, size, 'egg');
    const ring = el('div', 'dbl-ring');
    ring.style.setProperty('--ms', `${settings.dblClickMs}ms`);
    egg.append(ring);
    const detector = new DoubleClickDetector(settings.dblClickMs);
    let pending = 0;
    let done = false;

    egg.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || done) return;
      const kind = detector.feed(e.timeStamp, e.clientX, e.clientY);
      clearTimeout(pending);
      if (kind === 'single') {
        sfx.crack();
        replayClass(egg, 'wiggle');
        replayClass(ring, 'run');
        floatText(e.clientX, e.clientY - 30, '톡!', '#b07b3a');
        pending = window.setTimeout(() => {
          ring.classList.remove('run');
          // 한 번만 누르고 기다리면 알려 준다.
          if (!done) {
            say('한 번 더 빨리! 톡톡!');
            miss(true);
          }
        }, settings.dblClickMs + 30);
        return;
      }
      done = true;
      ring.classList.remove('run');
      egg.textContent = '🐣';
      replayClass(egg, 'hatch');
      const c = centerOf(egg);
      burst(c.x, c.y, ['✨', '💛', '🌟'], 12);
      floatText(c.x, c.y - size / 2, '톡톡!', '#ff8a3d');
      sfx.note(hatched + 2);
      hatched++;
      progress(hatched, n);
      lt.timeout(() => {
        egg.textContent = HATCHLINGS[i % HATCHLINGS.length];
        replayClass(egg, 'hop');
        sfx.ding();
      }, 600);
      if (hatched === n) win();
    });
    lt.add(() => clearTimeout(pending));
    return { egg, isDone: () => done };
  });

  return {
    hint: () => {
      const target = items.find((it) => !it.isDone());
      if (!target) return;
      const finger = el('div', 'tap-finger', '👆');
      target.egg.append(finger);
      lt.timeout(() => finger.remove(), 2400);
    },
  };
};
