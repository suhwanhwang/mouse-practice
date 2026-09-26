import { sfx } from '../core/audio';
import { el, localPoint, obj, place } from '../core/dom';
import { burst } from '../core/fx';
import { mouseSvg } from '../core/mouse-svg';
import { rand, scatter } from '../core/random';
import type { Game, GameContext } from '../core/scene';

/** 스테이지 0: 마우스 잡는 법 → 움직이기 → 별 모으기 → 나비 따라가기 */
export const meet: Game = (ctx) => {
  if (ctx.level === 0) return grip(ctx);
  if (ctx.level === 1) return fireflies(ctx);
  return butterfly(ctx);
};

/** 마지막 포인터 위치(root 기준)를 추적한다. 포인터가 없으면 null. */
function trackPointer(ctx: GameContext): { current: { x: number; y: number } | null } {
  const ref: { current: { x: number; y: number } | null } = { current: null };
  ctx.lt.on<PointerEvent>(ctx.root, 'pointermove', (e) => (ref.current = localPoint(ctx.root, e.clientX, e.clientY)));
  ctx.lt.on(ctx.root, 'pointerleave', () => (ref.current = null));
  return ref;
}

function grip(ctx: GameContext) {
  const { root, lt } = ctx;
  if (ctx.round > 0) {
    startTrail();
    return;
  }
  const card = el('div', 'grip-card');
  card.innerHTML = `
    <div class="grip-pic">${mouseSvg('left', 170)}<span class="grip-hand">✋</span></div>
    <ol class="grip-steps">
      <li>손바닥으로 마우스를 살짝 감싸요</li>
      <li>둘째 손가락은 <b class="hl">왼쪽 버튼</b> 위에</li>
      <li>셋째 손가락은 오른쪽 버튼 위에</li>
      <li>책상 위에서 쓱쓱 밀어요</li>
    </ol>`;
  const go = el('button', 'btn big', '해 볼래요! ▶');
  card.append(go);
  root.append(card);
  go.addEventListener('click', () => {
    card.remove();
    startTrail();
  });

  function startTrail() {
    ctx.say('마우스를 쓱쓱 움직여 보세요. 별이 따라와요!');
    const goal = 5000;
    let moved = 0;
    let sinceStar = 0;
    let last: { x: number; y: number } | null = null;
    const total = 10;
    ctx.progress(0, total);
    lt.on<PointerEvent>(root, 'pointermove', (e) => {
      const p = localPoint(root, e.clientX, e.clientY);
      if (last) {
        const d = Math.hypot(p.x - last.x, p.y - last.y);
        const before = Math.floor((moved / goal) * total);
        moved += Math.min(d, 80);
        sinceStar += d;
        const after = Math.min(total, Math.floor((moved / goal) * total));
        if (after > before) {
          ctx.progress(after, total);
          sfx.note(after);
        }
        if (sinceStar > 35) {
          sinceStar = 0;
          const s = obj(root, ['✨', '⭐', '🌟', '💫'][Math.floor(rand(0, 4))], p.x, p.y, rand(22, 40), 'trail');
          lt.timeout(() => s.remove(), 900);
        }
        if (moved >= goal) {
          moved = -Infinity;
          burst(e.clientX, e.clientY, ['⭐', '🌟', '✨'], 18);
          ctx.win();
        }
      }
      last = p;
    });
    lt.on(root, 'pointerleave', () => (last = null));
  }
}

function fireflies(ctx: GameContext) {
  const { root, lt } = ctx;
  const n = 6;
  const size = 110;
  const w = root.clientWidth;
  const h = root.clientHeight;
  const pts = scatter(n, size, { left: 40, top: 40, right: w - 40, bottom: h - 40 }, 40);
  const stars = pts.map((p) => ({ ...p, node: obj(root, '🌟', p.x, p.y, size * 0.8, 'glow twinkle'), got: false }));
  const pointer = trackPointer(ctx);
  let done = 0;
  ctx.progress(0, n);

  lt.loop(() => {
    const p = pointer.current;
    if (!p) return;
    for (const s of stars) {
      if (s.got || Math.hypot(p.x - s.x, p.y - s.y) > size / 2) continue;
      s.got = true;
      const r = s.node.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2);
      s.node.remove();
      sfx.note(done);
      done++;
      ctx.progress(done, n);
      if (done === n) ctx.win();
    }
  });

  return {
    hint: () => stars.find((s) => !s.got)?.node.classList.add('hint-ring'),
  };
}

function butterfly(ctx: GameContext) {
  const { root, lt } = ctx;
  const w = root.clientWidth;
  const h = root.clientHeight;
  const node = obj(root, '🦋', w / 2, h / 2, 80, 'flutter');
  const ring = obj(root, '', w / 2, h / 2, 16, 'follow-ring');
  const pointer = trackPointer(ctx);
  const radius = 90;
  const needed = 8; // 초
  const total = 10;
  let held = 0;
  let t = 0;
  let shown = 0;
  let flowerGap = 0;
  let finished = false;
  ctx.progress(0, total);

  lt.loop((dt) => {
    if (finished) return;
    const x = w / 2 + (w / 2 - 110) * Math.sin(t * 0.45);
    const y = h / 2 + (h / 2 - 90) * Math.sin(t * 0.7 + 0.6);
    place(node, x, y);
    place(ring, x, y);
    const p = pointer.current;
    const near = !!p && Math.hypot(p.x - x, p.y - y) < radius;
    ring.classList.toggle('on', near);
    // 따라오고 있을 때만 날아간다. 놓치면 천천히 기다려 준다.
    t += dt * (near ? 1 : 0.25);
    if (!near) return;
    held += dt;
    flowerGap += dt;
    if (flowerGap > 0.25) {
      flowerGap = 0;
      const f = obj(root, ['🌸', '🌼', '🌷'][Math.floor(rand(0, 3))], x + rand(-30, 30), y + rand(20, 50), 28, 'trail');
      lt.timeout(() => f.remove(), 900);
    }
    const now = Math.min(total, Math.floor((held / needed) * total));
    if (now > shown) {
      shown = now;
      ctx.progress(shown, total);
      sfx.note(shown);
    }
    if (held >= needed) {
      finished = true;
      const r = node.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, ['🌸', '🦋', '✨'], 16);
      ctx.win();
    }
  });
}
