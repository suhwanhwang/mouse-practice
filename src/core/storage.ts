export interface Settings {
  voice: boolean;
  /** 0 ~ 1 */
  volume: number;
  /** 더블클릭으로 인정하는 두 클릭 사이 최대 간격(ms) */
  dblClickMs: number;
  /** 휴식 알림 간격(분). 0이면 끔 */
  breakMinutes: number;
  unlockAll: boolean;
  /** 한 단계를 몇 판 이어서 할지 */
  rounds: number;
}

export interface SaveData {
  version: 1;
  /** "스테이지-레벨" → 최고 별 개수(1~3) */
  stars: Record<string, number>;
  settings: Settings;
}

export const LEVELS_PER_STAGE = 3;
const KEY = 'mouse-practice:v1';

export const defaultSettings = (): Settings => ({
  voice: true,
  volume: 0.7,
  dblClickMs: 700,
  breakMinutes: 20,
  unlockAll: false,
  rounds: 3,
});

export const defaultData = (): SaveData => ({ version: 1, stars: {}, settings: defaultSettings() });

/** 시크릿 창 등에서 localStorage가 막혀 있으면 메모리에만 저장한다. */
function safeStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  try {
    const test = '__mp_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return localStorage;
  } catch {
    const mem = new Map<string, string>();
    return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v) };
  }
}

export function parse(raw: string | null): SaveData {
  const base = defaultData();
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    if (parsed.version !== 1) return base;
    return {
      version: 1,
      stars: typeof parsed.stars === 'object' && parsed.stars ? parsed.stars : {},
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
    };
  } catch {
    return base;
  }
}

const storage = safeStorage();
export const data: SaveData = parse(storage.getItem(KEY));

export function save(): void {
  try {
    storage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* 저장 공간이 없어도 게임은 계속한다 */
  }
}

export const levelKey = (stage: number, level: number): string => `${stage}-${level}`;

export const getStars = (d: SaveData, stage: number, level: number): number => d.stars[levelKey(stage, level)] ?? 0;

/** 더 좋은 기록이면 저장하고 true를 돌려준다. */
export function recordStars(d: SaveData, stage: number, level: number, stars: number): boolean {
  if (stars <= getStars(d, stage, level)) return false;
  d.stars[levelKey(stage, level)] = stars;
  return true;
}

export function isStageComplete(d: SaveData, stage: number): boolean {
  for (let l = 0; l < LEVELS_PER_STAGE; l++) if (getStars(d, stage, l) === 0) return false;
  return true;
}

export function isStageUnlocked(d: SaveData, stage: number): boolean {
  return stage === 0 || d.settings.unlockAll || isStageComplete(d, stage - 1);
}

export function isLevelUnlocked(d: SaveData, stage: number, level: number): boolean {
  if (!isStageUnlocked(d, stage)) return false;
  return level === 0 || d.settings.unlockAll || getStars(d, stage, level - 1) > 0;
}

export function stageStars(d: SaveData, stage: number): number {
  let sum = 0;
  for (let l = 0; l < LEVELS_PER_STAGE; l++) sum += getStars(d, stage, l);
  return sum;
}

export function resetProgress(d: SaveData): void {
  d.stars = {};
}
