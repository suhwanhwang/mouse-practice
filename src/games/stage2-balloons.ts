import { sfx } from '../core/audio';
import { lerp } from '../core/difficulty';
import { centerOf, el, obj, place, replayClass } from '../core/dom';
import { burst, floatText } from '../core/fx';
import { mouseSvg } from '../core/mouse-svg';
import { pick, rand, scatter } from '../core/random';
import type { Game, GameContext } from '../core/scene';

/** 스테이지 2: 왼쪽 클릭 — 풍선 터뜨리기, 올라가는 풍선, 두더지 잡기 */
export const balloons: Game = (ctx) => {
  watchWrongButton(ctx);
  if (ctx.level === 0) return still(ctx);
  if (ctx.level === 1) return rising(ctx);
  return moles(ctx);
};

/** 오른쪽 버튼이나 가운데 버튼을 누르면 왼쪽 버튼을 알려 준다. */
function watchWrongButton({ root, lt, say }: GameContext) {
  let tip: HTMLElement | null = null;
  lt.on<PointerEvent>(root, 'pointerdown', (e) => {
    if (e.button === 0) return;
    say('왼쪽 버튼으로 눌러요!');
    tip?.remove();
    tip = el('div', 'button-tip');
    tip.innerHTML = mouseSvg('left', 110);
    root.append(tip);
    const t = tip;
    lt.timeout(() => t.remove(), 1800);
  });
}

const HUES = [0, 40, 90, 180, 220, 280, 320];

/** 판이 올라갈수록 목표물이 조금씩 작아진다(최대 30%). */
const shrink = (size: number, round: number) => size * Math.max(0.7, 1 - round * 0.08);

function balloon(root: HTMLElement, x: number, y: number, size: number): HTMLElement {
  const b = obj(root, '🎈', x, y, size, 'balloon');
  b.style.filter = `hue-rotate(${pick(HUES)}deg)`;
  b.style.animationDelay = `${rand(0, 2)}s`;
  return b;
}

function popAt(node: HTMLElement) {
  const c = centerOf(node);
  burst(c.x, c.y, ['🎉', '✨', '💥'], 10);
  floatText(c.x, c.y, '팡!');
  sfx.pop();
}

/** 클릭한 곳이 목표물이 아니면 실수로 센다. */
function missOnBackground(ctx: GameContext, isDone: () => boolean) {
  ctx.lt.on<PointerEvent>(ctx.root, 'pointerdown', (e) => {
    if (e.button !== 0 || isDone() || e.target !== ctx.root) return;
    ctx.miss();
  });
}

function still(ctx: GameContext) {
  const { root, progress, win } = ctx;
  const n = 8;
  const size = shrink(120, ctx.round);
  const w = root.clientWidth;
  const h = root.clientHeight;
  let done = 0;
  const nodes = scatter(n, size * 1.1, { left: 30, top: 60, right: w - 30, bottom: h - 30 }, 30).map((p) => {
    const b = balloon(root, p.x, p.y, size);
    b.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || b.classList.contains('gone')) return;
      b.classList.add('gone');
      popAt(b);
      b.remove();
      done++;
      progress(done, n);
      if (done === n) win();
    });
    return b;
  });
  progress(0, n);
  missOnBackground(ctx, () => done === n);
  return { hint: () => nodes.find((b) => b.isConnected)?.classList.add('hint-ring') };
}

function rising(ctx: GameContext) {
  const { root, lt, progress, miss, win } = ctx;
  const total = 12;
  const size = shrink(105, ctx.round);
  const w = root.clientWidth;
  const h = root.clientHeight;
  const live: { node: HTMLElement; x: number; y: number; speed: number }[] = [];
  let done = 0;
  let wait = 0;
  progress(0, total);
  missOnBackground(ctx, () => done === total);

  lt.loop((dt) => {
    if (done >= total) return;
    wait -= dt;
    if (live.length < Math.min(3, total - done) && wait <= 0) {
      wait = 1.3;
      const x = rand(size, w - size);
      const node = balloon(root, x, h + size, size);
      const item = { node, x, y: h + size, speed: rand(45, 70) * (1 + ctx.round * 0.1) };
      node.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || !node.isConnected) return;
        popAt(node);
        node.remove();
        live.splice(live.indexOf(item), 1);
        done++;
        progress(done, total);
        if (done === total) win();
      });
      live.push(item);
    }
    for (let i = live.length - 1; i >= 0; i--) {
      const b = live[i];
      b.y -= b.speed * dt;
      place(b.node, b.x, b.y);
      if (b.y < -size) {
        b.node.remove();
        live.splice(i, 1);
        miss(true);
      }
    }
  });
  return { hint: () => live.forEach((b) => b.node.classList.add('hint-ring')) };
}

function moles(ctx: GameContext) {
  const { root, lt, progress, miss, win } = ctx;
  const total = 12;
  const cols = 3;
  const rows = 2;
  const w = root.clientWidth;
  const h = root.clientHeight;
  const cell = Math.min(w / cols, (h - 40) / rows);
  const holeSize = Math.min(170, cell * 0.8);
  const holes: { hole: HTMLElement; mole: HTMLElement; up: boolean; timer: number }[] = [];
  let hits = 0;
  let finished = false;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = w / 2 + (c - (cols - 1) / 2) * cell;
      const y = h / 2 + (r - (rows - 1) / 2) * cell;
      const hole = el('div', 'hole');
      hole.style.width = `${holeSize}px`;
      hole.style.height = `${holeSize}px`;
      place(hole, x, y);
      const mole = el('div', 'mole', '🐹');
      mole.style.fontSize = `${holeSize * 0.6}px`;
      hole.append(mole);
      root.append(hole);
      const item = { hole, mole, up: false, timer: 0 };
      hole.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || finished) return;
        e.stopPropagation();
        if (!item.up) {
          miss();
          replayClass(hole, 'shake');
          return;
        }
        clearTimeout(item.timer);
        item.up = false;
        mole.textContent = '😵';
        hole.classList.add('hit');
        popAt(mole);
        hits++;
        progress(hits, total);
        lt.timeout(() => {
          hole.classList.remove('up', 'hit');
          mole.textContent = '🐹';
        }, 350);
        if (hits === total) {
          finished = true;
          win();
        } else lt.timeout(next, 500);
      });
      holes.push(item);
    }
  }
  lt.add(() => holes.forEach((m) => clearTimeout(m.timer)));

  function next() {
    if (finished) return;
    const free = holes.filter((m) => !m.up && !m.hole.classList.contains('hit'));
    const m = pick(free);
    m.up = true;
    m.hole.classList.add('up');
    sfx.click();
    const stay = lerp(2800, 1500, hits / total) * Math.max(0.75, 1 - ctx.round * 0.06);
    m.timer = window.setTimeout(() => {
      if (!m.up || finished) return;
      m.up = false;
      m.hole.classList.remove('up');
      miss(true);
      lt.timeout(next, 400);
    }, stay);
  }

  progress(0, total);
  lt.timeout(next, 800);
  return { hint: () => holes.find((m) => m.up)?.hole.classList.add('hint-ring') };
}
