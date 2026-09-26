import { sfx } from '../core/audio';
import { byLevel } from '../core/difficulty';
import { el, localPoint, place } from '../core/dom';
import { burst } from '../core/fx';
import { pick, rand } from '../core/random';
import type { Game } from '../core/scene';

interface Bubble {
  node: HTMLElement;
  x: number;
  y: number;
  baseX: number;
  size: number;
  speed: number;
  phase: number;
}

const TINTS = ['#bde0fe', '#ffc8dd', '#caffbf', '#fdffb6', '#e4c1f9'];
const INSIDE = ['', '', '⭐', '🐟', '🍬', '🌸'];

/** 스테이지 1: 떠오르는 비눗방울에 화살표를 올리면 터진다(가리키기). */
export const bubbles: Game = ({ root, lt, level, progress, miss, win }) => {
  const total = byLevel(level, [8, 12, 16]);
  const size = byLevel(level, [140, 105, 80]);
  const speed = byLevel(level, [45, 70, 100]);
  const maxLive = byLevel(level, [3, 4, 5]);
  const w = root.clientWidth;
  const h = root.clientHeight;
  const live: Bubble[] = [];
  let pointer: { x: number; y: number } | null = null;
  let popped = 0;
  let spawnWait = 0;
  progress(0, total);

  lt.on<PointerEvent>(root, 'pointermove', (e) => (pointer = localPoint(root, e.clientX, e.clientY)));
  lt.on(root, 'pointerleave', () => (pointer = null));

  const spawn = () => {
    const s = size * rand(0.9, 1.1);
    const node = el('div', 'soap');
    node.style.width = node.style.height = `${s}px`;
    node.style.setProperty('--tint', pick(TINTS));
    node.textContent = pick(INSIDE);
    node.style.fontSize = `${s * 0.35}px`;
    root.append(node);
    const baseX = rand(s, w - s);
    live.push({ node, x: baseX, y: h + s / 2, baseX, size: s, speed: speed * rand(0.85, 1.15), phase: rand(0, 6) });
  };

  const pop = (b: Bubble) => {
    const r = b.node.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, ['💧', '✨', '🫧'], 8, 80);
    b.node.remove();
    sfx.pop();
    popped++;
    progress(popped, total);
    if (popped === total) win();
  };

  lt.loop((dt, now) => {
    if (popped >= total) return;
    spawnWait -= dt;
    if (live.length < Math.min(maxLive, total - popped) && spawnWait <= 0) {
      spawn();
      spawnWait = byLevel(level, [1.4, 1.0, 0.8]);
    }
    for (let i = live.length - 1; i >= 0; i--) {
      const b = live[i];
      b.y -= b.speed * dt;
      b.x = b.baseX + Math.sin(now / 700 + b.phase) * 30;
      place(b.node, b.x, b.y);
      if (pointer && Math.hypot(pointer.x - b.x, pointer.y - b.y) < b.size / 2) {
        live.splice(i, 1);
        pop(b);
      } else if (b.y < -b.size / 2) {
        // 놓친 비눗방울은 벌점 없이 다시 나온다.
        live.splice(i, 1);
        b.node.remove();
        miss(true);
      }
    }
  });

  return {
    hint: () => live.forEach((b) => b.node.classList.add('hint-ring')),
  };
};
