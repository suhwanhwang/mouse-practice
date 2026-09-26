import { setVolume, sfx } from '../core/audio';
import { el } from '../core/dom';
import type { Lifetime } from '../core/lifetime';
import { go } from '../core/router';
import { setVoiceEnabled, speak } from '../core/speech';
import { data, resetProgress, save } from '../core/storage';

function row(label: string, control: HTMLElement, help = ''): HTMLElement {
  const r = el('label', 'setting-row');
  const text = el('div', 'setting-label', label);
  if (help) text.append(el('small', '', help));
  r.append(text, control);
  return r;
}

function select(options: [number, string][], value: number, onChange: (v: number) => void): HTMLSelectElement {
  const s = el('select');
  for (const [v, label] of options) {
    const o = el('option', '', label);
    o.value = String(v);
    o.selected = v === value;
    s.append(o);
  }
  s.addEventListener('change', () => onChange(Number(s.value)));
  return s;
}

export function parentScreen(app: HTMLElement, lt: Lifetime): void {
  const s = data.settings;
  const page = el('main', 'parent bg-paper');
  const panel = el('div', 'parent-panel');
  const back = el('button', 'btn secondary', '← 지도로');
  back.addEventListener('click', () => go('map'));
  panel.append(el('h2', '', '👪 부모 설정'), el('p', 'parent-help', '설정은 이 브라우저에 저장됩니다.'));

  const voice = el('input');
  voice.type = 'checkbox';
  voice.checked = s.voice;
  voice.addEventListener('change', () => {
    s.voice = voice.checked;
    setVoiceEnabled(s.voice);
    save();
    speak('음성 안내를 켰어요.');
  });

  const volume = el('input');
  volume.type = 'range';
  volume.min = '0';
  volume.max = '1';
  volume.step = '0.1';
  volume.value = String(s.volume);
  volume.addEventListener('change', () => {
    s.volume = Number(volume.value);
    setVolume(s.volume);
    save();
    sfx.ding();
  });

  const dbl = select(
    [
      [1000, '아주 느리게 (1초)'],
      [700, '느리게 (0.7초)'],
      [500, '보통 (0.5초)'],
    ],
    s.dblClickMs,
    (v) => {
      s.dblClickMs = v;
      save();
    },
  );

  const rounds = select(
    [
      [1, '짧게 (1판)'],
      [3, '보통 (3판)'],
      [5, '길게 (5판)'],
    ],
    s.rounds,
    (v) => {
      s.rounds = v;
      save();
    },
  );

  const rest = select(
    [
      [0, '끄기'],
      [15, '15분마다'],
      [20, '20분마다'],
      [30, '30분마다'],
    ],
    s.breakMinutes,
    (v) => {
      s.breakMinutes = v;
      save();
    },
  );

  const unlock = el('input');
  unlock.type = 'checkbox';
  unlock.checked = s.unlockAll;
  unlock.addEventListener('change', () => {
    s.unlockAll = unlock.checked;
    save();
  });

  // 실수로 누르지 않도록 두 번 눌러야 초기화된다(브라우저 확인창은 쓰지 않는다).
  const reset = el('button', 'btn ghost', '진행 기록 지우기');
  let armed = false;
  reset.addEventListener('click', () => {
    if (!armed) {
      armed = true;
      reset.textContent = '정말 지울까요? 한 번 더 누르세요';
      lt.timeout(() => {
        armed = false;
        reset.textContent = '진행 기록 지우기';
      }, 4000);
      return;
    }
    resetProgress(data);
    save();
    reset.textContent = '지웠어요 ✓';
    reset.disabled = true;
  });

  panel.append(
    row('음성 안내', voice),
    row('효과음 크기', volume),
    row('한 단계 길이', rounds, '클릭·더블클릭·끌기 섬은 2판을 더 해요'),
    row('더블클릭 인식 간격', dbl, '아이가 두 번 클릭을 어려워하면 느리게'),
    row('휴식 알림', rest, '알림이 뜨면 잠시 쉬었다가 계속할 수 있어요'),
    row('모든 섬 열기', unlock, '순서 없이 원하는 연습을 할 수 있어요'),
    row('진행 기록', reset),
    back,
  );
  page.append(panel);
  app.append(page);
}
