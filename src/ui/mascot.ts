import { el, replayClass } from '../core/dom';
import { speak } from '../core/speech';

export interface Mascot {
  el: HTMLElement;
  say(text: string): void;
  repeat(): void;
}

/** 생쥐 "마루"와 말풍선. 말할 때마다 음성으로도 읽어 준다. */
export function createMascot(): Mascot {
  const wrap = el('div', 'mascot');
  const face = el('button', 'face', '🐭');
  face.title = '다시 듣기';
  const bubble = el('div', 'bubble');
  wrap.append(face, bubble);
  let last = '';

  const say = (text: string) => {
    last = text;
    bubble.textContent = text;
    replayClass(bubble, 'pop-in');
    replayClass(face, 'hop');
    speak(text);
  };
  const repeat = () => {
    if (!last) return;
    replayClass(face, 'hop');
    speak(last);
  };
  face.addEventListener('click', repeat);
  return { el: wrap, say, repeat };
}
