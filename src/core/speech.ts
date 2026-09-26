/** 한국어 음성 안내. 음성이 없거나 꺼져 있으면 조용히 넘어간다. */
let enabled = true;
let voice: SpeechSynthesisVoice | null = null;

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

function pickVoice(): void {
  if (!supported) return;
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('ko'));
  voice = voices.find((v) => /yuna|유나|sora|google/i.test(v.name)) ?? voices[0] ?? null;
}

if (supported) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export function setVoiceEnabled(on: boolean): void {
  enabled = on;
  if (!on) stopSpeaking();
}

/** 이모지와 따옴표는 읽지 않는다. */
export const speakable = (text: string): string =>
  text
    .replace(/\p{Extended_Pictographic}|\u{FE0F}|\u{200D}/gu, '')
    .replace(/['"‘’“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export function speak(text: string): void {
  if (!supported || !enabled) return;
  const line = speakable(text);
  if (!line) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(line);
  u.lang = 'ko-KR';
  if (voice) u.voice = voice;
  u.rate = 0.95;
  u.pitch = 1.15;
  speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
  if (supported) speechSynthesis.cancel();
}
