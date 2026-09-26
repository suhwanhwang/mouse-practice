import { sfx } from '../core/audio';
import { el } from '../core/dom';
import type { Lifetime } from '../core/lifetime';
import { createTopbar } from './topbar';

const COLORS = ['#222222', '#ff4d4d', '#ff9f1c', '#ffd60a', '#38b000', '#00b4d8', '#3a0ca3', '#ff70a6'];
const SIZES = [6, 14, 28];

/** 자유 그림판: 누른 채로 끌면 그려진다(드래그 연습). */
export function drawScreen(app: HTMLElement, lt: Lifetime): void {
  const bar = createTopbar({ route: 'map', label: '🗺️' });
  const page = el('main', 'draw');
  const tools = el('div', 'draw-tools');
  const canvas = el('canvas', 'draw-canvas');
  page.append(tools, canvas);
  app.append(bar.el, page);

  let color = COLORS[0];
  let size = SIZES[1];
  let erasing = false;

  const pickers: HTMLButtonElement[] = [];
  const select = (btn: HTMLButtonElement) => {
    pickers.forEach((b) => b.classList.toggle('selected', b === btn));
    sfx.click();
  };
  for (const c of COLORS) {
    const b = el('button', 'swatch');
    b.style.background = c;
    b.addEventListener('click', () => {
      color = c;
      erasing = false;
      select(b);
    });
    pickers.push(b);
    tools.append(b);
  }
  const eraser = el('button', 'swatch tool', '🧽');
  eraser.title = '지우개';
  eraser.addEventListener('click', () => {
    erasing = true;
    select(eraser);
  });
  pickers.push(eraser);
  tools.append(eraser);
  pickers[0].classList.add('selected');

  const sizeBtns = SIZES.map((sz) => {
    const b = el('button', 'swatch tool');
    const d = el('span', 'size-dot');
    d.style.width = d.style.height = `${sz}px`;
    b.append(d);
    b.addEventListener('click', () => {
      size = sz;
      sizeBtns.forEach((x) => x.classList.toggle('selected', x === b));
      sfx.click();
    });
    tools.append(b);
    return b;
  });
  sizeBtns[1].classList.add('selected');

  const clear = el('button', 'swatch tool', '🗑️');
  clear.title = '모두 지우기';
  tools.append(clear);

  const g = canvas.getContext('2d')!;
  const fit = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const snapshot = canvas.width > 0 ? g.getImageData(0, 0, canvas.width, canvas.height) : null;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    g.fillStyle = '#fff';
    g.fillRect(0, 0, canvas.width, canvas.height);
    if (snapshot) g.putImageData(snapshot, 0, 0);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.lineCap = 'round';
    g.lineJoin = 'round';
  };
  requestAnimationFrame(fit);
  lt.on(window, 'resize', fit);
  clear.addEventListener('click', () => {
    const r = canvas.getBoundingClientRect();
    g.fillStyle = '#fff';
    g.fillRect(0, 0, r.width, r.height);
    sfx.whoosh();
  });

  let last: { x: number; y: number } | null = null;
  const point = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  lt.on<PointerEvent>(canvas, 'pointerdown', (e) => {
    if (e.button !== 0) return;
    canvas.setPointerCapture(e.pointerId);
    last = point(e);
    g.beginPath();
    g.fillStyle = erasing ? '#fff' : color;
    g.arc(last.x, last.y, (erasing ? size * 2 : size) / 2, 0, Math.PI * 2);
    g.fill();
  });
  lt.on<PointerEvent>(canvas, 'pointermove', (e) => {
    if (!last) return;
    const p = point(e);
    g.strokeStyle = erasing ? '#fff' : color;
    g.lineWidth = erasing ? size * 2 : size;
    g.beginPath();
    g.moveTo(last.x, last.y);
    g.lineTo(p.x, p.y);
    g.stroke();
    last = p;
  });
  const end = () => (last = null);
  lt.on(canvas, 'pointerup', end);
  lt.on(canvas, 'pointercancel', end);

  bar.mascot.say('왼쪽 버튼을 꾹 누른 채로 움직이면 그림이 그려져요!');
}
