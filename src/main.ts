import './styles.css';
import { setVolume, unlockAudio } from './core/audio';
import { el } from './core/dom';
import { Lifetime } from './core/lifetime';
import { parseRoute } from './core/router';
import { setVoiceEnabled, speak, stopSpeaking } from './core/speech';
import { data } from './core/storage';
import { drawScreen } from './ui/draw';
import { homeScreen } from './ui/home';
import { mapScreen } from './ui/map';
import { parentScreen } from './ui/parent';
import { playScreen } from './ui/play';
import { stickersScreen } from './ui/stickers';

const app = document.getElementById('app')!;
let screen: Lifetime | null = null;

setVolume(data.settings.volume);
setVoiceEnabled(data.settings.voice);

function render(): void {
  screen?.destroy();
  stopSpeaking();
  app.replaceChildren();
  const lt = new Lifetime();
  screen = lt;
  const route = parseRoute(location.hash);
  switch (route.name) {
    case 'home':
      return homeScreen(app, lt);
    case 'map':
      return mapScreen(app, lt);
    case 'play':
      return playScreen(app, lt, route.stage, route.level);
    case 'stickers':
      return stickersScreen(app, lt);
    case 'draw':
      return drawScreen(app, lt);
    case 'parent':
      return parentScreen(app, lt);
  }
}

window.addEventListener('hashchange', render);
render();

// 브라우저는 사용자 입력이 있어야 소리를 낼 수 있다.
window.addEventListener('pointerdown', unlockAudio, { once: true, capture: true });

// 터치로 누르면 마우스를 연결하라고 알려 준다(아이패드에 마우스를 연결하면 그대로 쓸 수 있다).
let touchWarned = false;
window.addEventListener(
  'pointerdown',
  (e) => {
    if (e.pointerType !== 'touch' || touchWarned) return;
    touchWarned = true;
    const overlay = el('div', 'overlay');
    const panel = el('div', 'panel');
    const ok = el('button', 'btn', '알겠어요');
    ok.addEventListener('click', () => overlay.remove());
    panel.append(el('div', 'picker-emoji', '🖱️'), el('h2', '', '마우스를 연결해 주세요'), el('p', '', '이 놀이는 손가락 대신 마우스로 해요.'), ok);
    overlay.append(panel);
    document.body.append(overlay);
  },
  { capture: true },
);

// 휴식 알림: 화면을 보고 있는 시간만 센다.
let activeSeconds = 0;
let resting = false;
setInterval(() => {
  const limit = data.settings.breakMinutes * 60;
  if (!limit || resting || document.hidden) return;
  activeSeconds += 10;
  if (activeSeconds >= limit) showBreak();
}, 10_000);

function showBreak(): void {
  resting = true;
  const overlay = el('div', 'overlay rest');
  const panel = el('div', 'panel');
  const count = el('div', 'rest-count', '30');
  const resume = el('button', 'btn', '다시 놀기');
  resume.disabled = true;
  panel.append(el('div', 'picker-emoji', '👀'), el('h2', '', '잠깐 쉬어요!'), el('p', '', '창밖 먼 곳을 보고, 기지개를 쭉 펴요.'), count, resume);
  overlay.append(panel);
  document.body.append(overlay);
  speak('잠깐 쉬어요! 창밖 먼 곳을 보고, 기지개를 쭉 펴요.');
  let left = 30;
  const timer = setInterval(() => {
    left--;
    count.textContent = String(left);
    if (left <= 0) {
      clearInterval(timer);
      count.textContent = '✨';
      resume.disabled = false;
    }
  }, 1000);
  resume.addEventListener('click', () => {
    overlay.remove();
    resting = false;
    activeSeconds = 0;
  });
}
