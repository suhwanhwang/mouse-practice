import { el } from './dom';
import { pick, rand } from './random';

let layer: HTMLElement | null = null;

function fxLayer(): HTMLElement {
  if (!layer || !layer.isConnected) {
    layer = el('div', 'fx-layer');
    document.body.append(layer);
  }
  return layer;
}

/** client 좌표 (x, y)에서 이모지 조각이 터져 나간다. */
export function burst(x: number, y: number, emojis: string[] = ['✨', '⭐', '💛'], count = 10, spread = 110): void {
  const root = fxLayer();
  for (let i = 0; i < count; i++) {
    const p = el('span', 'particle', pick(emojis));
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.fontSize = `${rand(18, 34)}px`;
    root.append(p);
    const angle = rand(0, Math.PI * 2);
    const dist = rand(spread * 0.4, spread);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    p.animate(
      [
        { transform: 'translate(-50%, -50%) scale(.4)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(${rand(-90, 90)}deg)`, opacity: 0 },
      ],
      { duration: rand(500, 800), easing: 'cubic-bezier(.2,.8,.3,1)' },
    ).onfinish = () => p.remove();
  }
}

/** client 좌표에서 글자가 떠오르며 사라진다. */
export function floatText(x: number, y: number, text: string, color = '#ff6b2c'): void {
  const t = el('span', 'float-text', text);
  t.style.left = `${x}px`;
  t.style.top = `${y}px`;
  t.style.color = color;
  fxLayer().append(t);
  t.animate(
    [
      { transform: 'translate(-50%, -50%) scale(.6)', opacity: 0 },
      { transform: 'translate(-50%, -90%) scale(1.1)', opacity: 1, offset: 0.25 },
      { transform: 'translate(-50%, -180%) scale(1)', opacity: 0 },
    ],
    { duration: 1000, easing: 'ease-out' },
  ).onfinish = () => t.remove();
}

/** 화면 위에서 색종이가 쏟아진다. */
export function confetti(count = 60): void {
  const root = fxLayer();
  const colors = ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#c77dff', '#ff9f45'];
  for (let i = 0; i < count; i++) {
    const c = el('span', 'confetti');
    c.style.left = `${rand(0, window.innerWidth)}px`;
    c.style.background = pick(colors);
    root.append(c);
    const drift = rand(-120, 120);
    c.animate(
      [
        { transform: `translate(0, -20px) rotate(0deg)` },
        { transform: `translate(${drift}px, ${window.innerHeight + 40}px) rotate(${rand(360, 1080)}deg)` },
      ],
      { duration: rand(1600, 2800), delay: rand(0, 500), easing: 'cubic-bezier(.3,.1,.7,1)', fill: 'backwards' },
    ).onfinish = () => c.remove();
  }
}
