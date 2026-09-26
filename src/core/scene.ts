import type { Lifetime } from './lifetime';
import type { Settings } from './storage';

/** 게임이 공통 화면(머리글, 마스코트, 결과창)과 주고받는 창구 */
export interface GameContext {
  /** 게임을 그리는 영역. position: relative, 화면을 꽉 채운다. */
  root: HTMLElement;
  level: number;
  /** 이번 판 번호(0부터). 판이 바뀔 때마다 게임을 새로 시작한다. */
  round: number;
  lt: Lifetime;
  settings: Settings;
  /** 마스코트 말풍선 + 음성 */
  say(text: string): void;
  /** 틀렸을 때. 연달아 틀리면 힌트를 보여 준다. quiet면 소리를 내지 않는다. */
  miss(quiet?: boolean): void;
  /** 진행 표시. 호출하면 연속 실패 횟수가 초기화된다. */
  progress(done: number, total: number): void;
  /** 레벨 성공 */
  win(): void;
}

export interface GameHandle {
  /** 연달아 틀렸을 때 보여 줄 시범/도움 */
  hint?: () => void;
}

export type Game = (ctx: GameContext) => GameHandle | void;
