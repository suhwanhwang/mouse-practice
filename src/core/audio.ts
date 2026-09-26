/** 효과음은 파일 없이 Web Audio로 합성한다. */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let volume = 0.7;

function audio(): { ac: AudioContext; out: GainNode } | null {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return { ac: ctx, out: master! };
}

export function setVolume(v: number): void {
  volume = v;
  if (master) master.gain.value = v;
}

/** 첫 사용자 입력 때 호출해서 오디오를 깨운다. */
export function unlockAudio(): void {
  audio();
}

interface ToneOpts {
  type?: OscillatorType;
  delay?: number;
  gain?: number;
  slideTo?: number;
}

function tone(freq: number, dur: number, { type = 'sine', delay = 0, gain = 0.3, slideTo }: ToneOpts = {}): void {
  if (volume <= 0) return;
  const a = audio();
  if (!a) return;
  const t = a.ac.currentTime + delay;
  const osc = a.ac.createOscillator();
  const g = a.ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.out);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

const NOTES = [523, 587, 659, 698, 784, 880, 988, 1047, 1175, 1319];

export const sfx = {
  pop: () => tone(900, 0.12, { type: 'triangle', slideTo: 300, gain: 0.35 }),
  click: () => tone(1400, 0.04, { type: 'square', gain: 0.1 }),
  /** 연속 성공할수록 음이 올라간다 */
  note: (i: number) => tone(NOTES[i % NOTES.length], 0.22, { type: 'triangle', gain: 0.3 }),
  ding: () => {
    tone(1047, 0.25, { gain: 0.25 });
    tone(1568, 0.35, { gain: 0.18, delay: 0.06 });
  },
  boop: () => tone(220, 0.18, { type: 'sine', slideTo: 160, gain: 0.25 }),
  whoosh: () => tone(300, 0.3, { type: 'sawtooth', slideTo: 900, gain: 0.06 }),
  crack: () => {
    tone(1800, 0.05, { type: 'square', gain: 0.08 });
    tone(1200, 0.05, { type: 'square', gain: 0.06, delay: 0.05 });
  },
  menu: () => tone(700, 0.08, { type: 'triangle', gain: 0.18 }),
  star: (i: number) => tone([784, 988, 1175][i] ?? 1175, 0.3, { type: 'triangle', gain: 0.3 }),
  fanfare: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, { type: 'triangle', delay: i * 0.12, gain: 0.3 }));
    tone(1047, 0.6, { type: 'triangle', delay: 0.5, gain: 0.3 });
  },
};
