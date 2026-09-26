import { sfx } from '../core/audio';
import { byLevel } from '../core/difficulty';
import { centerOf, el, obj, replayClass } from '../core/dom';
import { burst, floatText } from '../core/fx';
import { mouseSvg } from '../core/mouse-svg';
import { pick, rand, shuffle } from '../core/random';
import type { Game } from '../core/scene';

const DECOR_FISH = ['🐟', '🐟', '🐠', '🐡', '🦐', '🪼'];
const FRIENDS = ['🐢', '🦀', '🐙', '🐬', '🦑', '🐳', '🦞', '🐡'];

/** 스테이지 6: 휠을 굴려 바닷속을 오르내린다. */
export const ocean: Game = ({ root, lt, level, say, progress, win }) => {
  const screens = byLevel(level, [4, 5, 6]);
  const vh = root.clientHeight;
  const w = root.clientWidth;
  const depth = vh * screens;

  const scroller = el('div', 'ocean-scroll');
  const sea = el('div', 'ocean');
  sea.style.height = `${depth}px`;
  scroller.append(sea);
  root.append(scroller);

  // 수면과 배
  sea.append(el('div', 'waves'));
  const boat = obj(sea, '⛵', w / 2, 70, 90, 'boat');

  // 장식: 물고기, 거품, 해초
  for (let i = 0; i < screens * 5; i++) {
    const f = obj(sea, pick(DECOR_FISH), rand(40, w - 40), rand(vh * 0.4, depth - 120), rand(30, 56), 'swim');
    f.style.animationDuration = `${rand(5, 11)}s`;
    f.style.animationDelay = `${-rand(0, 10)}s`;
  }
  for (let x = 30; x < w; x += rand(60, 140)) obj(sea, pick(['🌿', '🪸', '🪨', '🐚']), x, depth - 40, rand(40, 70));

  // 깊이 표시 (스크롤 영역 밖에 고정)
  const gauge = el('div', 'depth-gauge');
  const diver = el('div', 'depth-diver', '🤿');
  gauge.append(diver);
  root.append(gauge);

  // 휠 안내
  const wheelTip = el('div', 'wheel-tip');
  wheelTip.innerHTML = `${mouseSvg('wheel', 90)}<div class="wheel-arrows">⬇️</div><div>바퀴를 굴려요</div>`;
  root.append(wheelTip);

  let carrying = false;
  let finished = false;
  lt.on(scroller, 'scroll', () => {
    const max = scroller.scrollHeight - scroller.clientHeight;
    const t = max > 0 ? scroller.scrollTop / max : 0;
    diver.style.top = `${t * 100}%`;
    if (scroller.scrollTop > 150) wheelTip.classList.add('hidden');
  });

  const treasureAtBottom = (onClick: (node: HTMLElement) => void) => {
    const chest = obj(sea, '💎', w / 2, depth - 130, 90, 'treasure');
    chest.addEventListener('click', () => onClick(chest));
    return chest;
  };

  if (level === 0) {
    progress(0, 1);
    treasureAtBottom((chest) => {
      if (finished) return;
      finished = true;
      const c = centerOf(chest);
      burst(c.x, c.y, ['💎', '✨', '⭐'], 16);
      floatText(c.x, c.y - 50, '보물이다!');
      sfx.ding();
      progress(1, 1);
      win();
    });
    lt.timeout(() => say('바닷속 맨 아래에 보물이 있대요!'), 5000);
    return { hint: () => wheelTip.classList.remove('hidden') };
  }

  if (level === 1) {
    const targets = shuffle(FRIENDS).slice(0, 5);
    const list = el('div', 'find-list');
    const marks = targets.map((t) => {
      const m = el('span', 'find-item', t);
      list.append(m);
      return m;
    });
    root.append(list);
    let found = 0;
    progress(0, targets.length);
    const nodes = targets.map((t, i) => {
      // 화면마다 골고루 숨긴다.
      const y = vh * 0.8 + ((depth - vh) / targets.length) * (i + rand(0.1, 0.9));
      const node = obj(sea, t, rand(70, w - 70), y, 72, 'hidden-friend');
      node.addEventListener('click', () => {
        if (node.classList.contains('found')) return;
        node.classList.add('found');
        marks[i].classList.add('found');
        const c = centerOf(node);
        burst(c.x, c.y, ['✨', '💙', '⭐'], 10);
        floatText(c.x, c.y - 40, '찾았다!');
        sfx.note(found + 2);
        found++;
        progress(found, targets.length);
        if (found === targets.length) win();
      });
      return node;
    });
    return {
      hint: () => {
        const n = nodes.find((x) => !x.classList.contains('found'));
        n?.classList.add('hint-ring');
        n?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
    };
  }

  // 3단계: 보물을 들고 배까지 올라간다.
  progress(0, 2);
  const upTip = el('div', 'wheel-tip up hidden');
  upTip.innerHTML = `${mouseSvg('wheel', 90)}<div class="wheel-arrows">⬆️</div><div>위로 올라가요</div>`;
  root.append(upTip);
  treasureAtBottom((chest) => {
    if (carrying) return;
    carrying = true;
    const c = centerOf(chest);
    burst(c.x, c.y, ['💎', '✨'], 12);
    chest.remove();
    diver.textContent = '🤿💎';
    sfx.ding();
    progress(1, 2);
    say('보물을 찾았어요! 이제 위로 올라가서 배를 눌러요.');
    upTip.classList.remove('hidden');
    boat.classList.add('hint-ring');
  });
  boat.addEventListener('click', () => {
    if (finished) return;
    if (!carrying) {
      replayClass(boat, 'wiggle');
      say('먼저 바닷속 맨 아래에서 보물을 찾아요!');
      return;
    }
    finished = true;
    upTip.classList.add('hidden');
    const c = centerOf(boat);
    burst(c.x, c.y, ['💎', '🎉', '⭐'], 18);
    floatText(c.x, c.y - 50, '도착!');
    progress(2, 2);
    win();
  });
  lt.on(scroller, 'scroll', () => {
    if (carrying && scroller.scrollTop < 100) upTip.classList.add('hidden');
  });
  return { hint: () => (carrying ? upTip : wheelTip).classList.remove('hidden') };
};
