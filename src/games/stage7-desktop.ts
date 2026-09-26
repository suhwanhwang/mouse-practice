import { sfx } from '../core/audio';
import { centerOf, el, pointIn, replayClass } from '../core/dom';
import { burst, confetti, floatText } from '../core/fx';
import { DoubleClickDetector, makeDraggable } from '../core/input';
import type { Lifetime } from '../core/lifetime';
import { openMenu } from '../core/menu';
import { shuffle } from '../core/random';
import type { Game, GameContext } from '../core/scene';

const FILLER_FILES = [
  '📄 받아쓰기.txt', '🖼️ 우리가족.png', '🎵 동요.mp3', '📄 일기.txt', '🖼️ 강아지.png', '📄 숙제.txt',
  '🎵 생일축하.mp3', '🖼️ 바다.png', '📄 줄넘기기록.txt', '🖼️ 무지개.png', '🎵 자장가.mp3', '📄 준비물.txt',
  '🖼️ 공룡.png', '📄 알림장.txt', '🎵 피아노.mp3', '🖼️ 소풍.png',
];

/** 바탕화면 아이콘. 클릭하면 선택되고, 더블클릭하면 onOpen. */
function icon(desk: HTMLElement, lt: Lifetime, ms: number, emoji: string, name: string, x: number, y: number, onOpen?: () => void) {
  const node = el('div', 'desk-icon');
  node.append(el('div', 'desk-icon-emoji', emoji), el('div', 'desk-icon-name', name));
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  desk.append(node);
  const detector = new DoubleClickDetector(ms);
  lt.on<PointerEvent>(node, 'pointerdown', (e) => {
    if (e.button !== 0) return;
    desk.querySelectorAll('.selected').forEach((n) => n.classList.remove('selected'));
    node.classList.add('selected');
    if (detector.feed(e.timeStamp, e.clientX, e.clientY) === 'double') onOpen?.();
  });
  return node;
}

/** 창 하나. 몸통은 스크롤되는 파일 목록. */
function openWindow(desk: HTMLElement, title: string, onClose?: () => void) {
  desk.querySelector('.win')?.remove();
  const win = el('div', 'win pop-in');
  const bar = el('div', 'win-bar');
  const close = el('button', 'win-close', '✕');
  bar.append(el('span', '', title), close);
  const body = el('div', 'win-body');
  win.append(bar, body);
  desk.append(win);
  close.addEventListener('click', () => {
    win.remove();
    onClose?.();
  });
  sfx.whoosh();
  return { win, body };
}

function fileRow(body: HTMLElement, label: string): HTMLElement {
  const row = el('div', 'file-row', label);
  body.append(row);
  return row;
}

/** 오른쪽 위 체크리스트 */
function checklist(root: HTMLElement, steps: string[]) {
  const box = el('div', 'checklist');
  const items = steps.map((s) => {
    const li = el('div', 'check-item', `⬜ ${s}`);
    box.append(li);
    return li;
  });
  root.append(box);
  let current = 0;
  items[0]?.classList.add('now');
  return {
    check(i: number) {
      items[i].textContent = `✅ ${steps[i]}`;
      items[i].classList.remove('now');
      items[i].classList.add('ok');
      current = i + 1;
      items[current]?.classList.add('now');
      sfx.ding();
    },
    get current() {
      return current;
    },
  };
}

function desktopBase(root: HTMLElement) {
  const desk = el('div', 'desk');
  const taskbar = el('div', 'taskbar');
  const clock = el('span', 'clock');
  const now = new Date();
  clock.textContent = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  taskbar.append(el('span', 'start-btn', '🪟'), clock);
  root.append(desk, taskbar);
  return desk;
}

/** 스테이지 7: 가짜 컴퓨터에서 지금까지 배운 것을 모두 쓴다. */
export const desktop: Game = (ctx) => {
  if (ctx.level === 0) return findTreasure(ctx);
  if (ctx.level === 1) return cleanUp(ctx);
  return mission(ctx);
};

function findTreasure({ root, lt, settings, say, progress, win }: GameContext) {
  const desk = desktopBase(root);
  const ms = settings.dblClickMs;
  const steps = checklist(root, ['📁 폴더 열기', '⬇️ 보물 찾기', '💎 보물 열기']);
  progress(0, 3);
  icon(desk, lt, ms, '🗑️', '휴지통', 24, 24);
  icon(desk, lt, ms, '📄', '메모.txt', 24, 150);
  const folder = icon(desk, lt, ms, '📁', '보물 폴더', 24, 276, () => {
    if (steps.current === 0) {
      steps.check(0);
      progress(1, 3);
      say('창이 열렸어요! 바퀴를 굴려서 보물을 찾아요.');
    }
    const { body } = openWindow(desk, '📁 보물 폴더');
    const files = shuffle(FILLER_FILES).slice(0, 14);
    files.forEach((f) => fileRow(body, f));
    const treasure = fileRow(body, '💎 보물.txt');
    fileRow(body, '📄 비밀.txt');
    lt.on(body, 'scroll', () => {
      if (steps.current === 1 && body.scrollTop > body.scrollHeight - body.clientHeight - 80) {
        steps.check(1);
        progress(2, 3);
        say('보물을 찾았어요! 톡톡 두 번 눌러서 열어요.');
        treasure.classList.add('hint-ring');
      }
    });
    const detector = new DoubleClickDetector(ms);
    treasure.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (detector.feed(e.timeStamp, e.clientX, e.clientY) !== 'double') return;
      if (steps.current === 1) steps.check(1);
      steps.check(2);
      progress(3, 3);
      const c = centerOf(treasure);
      burst(c.x, c.y, ['💎', '✨', '⭐'], 18);
      confetti();
      win();
    });
  });
  return { hint: () => folder.classList.add('hint-ring') };
}

function cleanUp({ root, lt, settings, say, progress, miss, win }: GameContext) {
  const desk = desktopBase(root);
  const ms = settings.dblClickMs;
  const trash = icon(desk, lt, ms, '🗑️', '휴지통', 24, 24);
  const junk = [
    ['🍌', '바나나 껍질'],
    ['🥫', '빈 깡통'],
    ['📰', '헌 신문'],
    ['🧦', '냄새 양말'],
  ];
  const w = root.clientWidth;
  const h = root.clientHeight;
  let thrown = 0;
  const total = junk.length + 1;
  progress(0, total);
  const steps = checklist(root, ['🗑️ 쓰레기 버리기', '🧹 휴지통 비우기']);
  const nodes = junk.map(([emoji, name], i) => {
    const x = w * 0.35 + (i % 2) * w * 0.25;
    const y = h * 0.2 + Math.floor(i / 2) * h * 0.32;
    const node = icon(desk, lt, ms, emoji, name, x, y);
    makeDraggable(node, lt, {
      onTap: () => say('꾹 누른 채로 휴지통까지 끌어요!'),
      onDrop: (px, py) => {
        if (!pointIn(trash, px, py, 20)) {
          miss(true);
          return false;
        }
        node.remove();
        thrown++;
        replayClass(trash, 'hop');
        floatText(px, py - 30, '쏙!');
        sfx.note(thrown + 2);
        progress(thrown, total);
        if (thrown === junk.length) {
          steps.check(0);
          trash.querySelector('.desk-icon-emoji')!.textContent = '🗑️';
          trash.classList.add('full', 'hint-ring');
          say('휴지통이 꽉 찼어요! 휴지통에서 오른쪽 버튼을 눌러 비워요.');
        }
        return true;
      },
    });
    return node;
  });
  lt.on<MouseEvent>(trash, 'contextmenu', (e) => {
    e.preventDefault();
    openMenu(root, lt, e.clientX, e.clientY, [
      { icon: '📂', label: '열기', onSelect: () => say(thrown ? '쓰레기가 들어 있어요.' : '휴지통이 비어 있어요.') },
      {
        icon: '🧹',
        label: '휴지통 비우기',
        onSelect: () => {
          if (thrown < junk.length) {
            say('쓰레기를 먼저 모두 버려요!');
            miss();
            return;
          }
          trash.classList.remove('full', 'hint-ring');
          const c = centerOf(trash);
          burst(c.x, c.y, ['✨', '🧹', '💨'], 14);
          steps.check(1);
          progress(total, total);
          win();
        },
      },
    ]);
  });
  return {
    hint: () => (thrown < junk.length ? nodes.find((n) => n.isConnected) : trash)?.classList.add('hint-ring'),
  };
}

function mission({ root, lt, settings, say, progress, miss, win }: GameContext) {
  const desk = desktopBase(root);
  const ms = settings.dblClickMs;
  const w = root.clientWidth;
  const total = 4;
  const steps = checklist(root, ['📁 지도 폴더 열기', '🗝️ 열쇠 찾기', '🧰 열쇠를 상자로 끌기', '🖱️ 상자 오른쪽 클릭 → 열기']);
  progress(0, total);
  icon(desk, lt, ms, '🗑️', '휴지통', 24, 24);
  const chest = icon(desk, lt, ms, '🧰', '보물 상자', w - 170, root.clientHeight - 230);
  let unlocked = false;

  const folder = icon(desk, lt, ms, '📁', '보물 지도', 24, 150, () => {
    if (steps.current === 0) {
      steps.check(0);
      progress(1, total);
      say('열쇠가 어딘가에 있어요. 바퀴를 굴려 찾아요!');
    }
    const { win: winEl, body } = openWindow(desk, '📁 보물 지도');
    winEl.classList.add('left');
    shuffle(FILLER_FILES).slice(0, 10).forEach((f) => fileRow(body, f));
    const key = fileRow(body, '🗝️ 황금 열쇠');
    shuffle(FILLER_FILES).slice(0, 5).forEach((f) => fileRow(body, f));
    lt.on(body, 'scroll', () => {
      const r = key.getBoundingClientRect();
      const b = body.getBoundingClientRect();
      if (steps.current === 1 && r.top >= b.top && r.bottom <= b.bottom) {
        steps.check(1);
        progress(2, total);
        key.classList.add('hint-ring');
        say('열쇠를 찾았어요! 꾹 잡고 보물 상자까지 끌어요.');
      }
    });
    makeDraggable(key, lt, {
      keepOriginal: true,
      onTap: () => say('꾹 누른 채로 보물 상자까지 끌어요!'),
      onDrop: (x, y) => {
        if (!pointIn(chest, x, y, 24)) {
          miss(true);
          return false;
        }
        key.remove();
        unlocked = true;
        if (steps.current === 1) steps.check(1);
        steps.check(2);
        progress(3, total);
        chest.classList.add('hint-ring');
        replayClass(chest, 'hop');
        say('딸깍! 이제 보물 상자에서 오른쪽 버튼을 눌러요.');
        return true;
      },
    });
  });

  lt.on<MouseEvent>(chest, 'contextmenu', (e) => {
    e.preventDefault();
    openMenu(root, lt, e.clientX, e.clientY, [
      { icon: '🔍', label: '살펴보기', onSelect: () => say(unlocked ? '열쇠로 열 수 있어요!' : '자물쇠로 잠겨 있어요.') },
      {
        icon: '📦',
        label: '열기',
        onSelect: () => {
          if (!unlocked) {
            replayClass(chest, 'shake');
            say('잠겨 있어요. 먼저 열쇠를 찾아요!');
            miss();
            return;
          }
          chest.querySelector('.desk-icon-emoji')!.textContent = '👑';
          chest.classList.remove('hint-ring');
          const c = centerOf(chest);
          burst(c.x, c.y, ['💰', '💎', '👑', '✨'], 24, 160);
          confetti(100);
          steps.check(3);
          progress(total, total);
          win();
        },
      },
    ]);
  });
  return { hint: () => (steps.current === 0 ? folder : chest).classList.add('hint-ring') };
}
